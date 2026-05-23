import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PROMPTS, KIND_TO_SIZE, isDivineType } from "@/lib/prompts";

export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;
const TASK_TTL_SECONDS = 10 * 60;

interface UpstreamResponse {
  data?: { b64_json?: string }[];
  error?: { message?: string };
}

type TaskStatus = "pending" | "running" | "done" | "error";

type TaskState =
  | {
      taskId: string;
      status: Exclude<TaskStatus, "done" | "error">;
      createdAt: number;
      updatedAt: number;
    }
  | {
      taskId: string;
      status: "done";
      createdAt: number;
      updatedAt: number;
      b64: string;
      size: number;
    }
  | {
      taskId: string;
      status: "error";
      createdAt: number;
      updatedAt: number;
      error: string;
    };

type WorkerContext = {
  waitUntil?: (promise: Promise<unknown>) => void;
};

interface RuntimeContext {
  env: CloudflareEnv;
  ctx?: WorkerContext;
}

type CloudflareCacheStorage = CacheStorage & { default?: Cache };

const memoryTasks = new Map<string, TaskState>();

function jsonError(status: number, message: string) {
  return Response.json({ ok: false, error: message }, { status });
}

function guessExt(mime: string): string {
  if (!mime) return ".jpg";
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("gif")) return ".gif";
  return ".jpg";
}

function taskKey(taskId: string) {
  return new Request(`https://cyber-kanxiang.local/divine-task/${taskId}`);
}

async function getTask(taskId: string): Promise<TaskState | null> {
  const memory = memoryTasks.get(taskId);
  if (memory) return memory;

  const defaultCache = getDefaultCache();
  if (!defaultCache) return null;

  const cached = await defaultCache.match(taskKey(taskId));
  if (!cached) return null;

  try {
    return (await cached.json()) as TaskState;
  } catch {
    return null;
  }
}

async function setTask(state: TaskState) {
  memoryTasks.set(state.taskId, state);

  const defaultCache = getDefaultCache();
  if (!defaultCache) return;

  try {
    await defaultCache.put(
      taskKey(state.taskId),
      new Response(JSON.stringify(state), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": `public, max-age=${TASK_TTL_SECONDS}`,
        },
      }),
    );
  } catch (e) {
    console.error("[divine] task cache write failed", e);
  }
}

function getDefaultCache(): Cache | null {
  if (typeof caches === "undefined") return null;
  return (caches as CloudflareCacheStorage).default ?? null;
}

async function getRuntimeContext(): Promise<RuntimeContext> {
  try {
    const cf = await getCloudflareContext<
      Record<string, unknown>,
      WorkerContext
    >({ async: true });
    return { env: cf.env, ctx: cf.ctx };
  } catch {
    return {
      env: {
        NEWCLI_API_KEY: process.env.NEWCLI_API_KEY ?? "",
        NEWCLI_BASE_URL: process.env.NEWCLI_BASE_URL ?? "",
      } as CloudflareEnv,
    };
  }
}

function validateEnv(env: CloudflareEnv) {
  const apiKey = env.NEWCLI_API_KEY?.trim();
  const baseUrl = env.NEWCLI_BASE_URL?.trim();

  if (!apiKey) {
    return {
      ok: false as const,
      response: jsonError(
        500,
        "服务器尚未配置 NEWCLI_API_KEY，请检查 .dev.vars / wrangler secret",
      ),
    };
  }
  if (!baseUrl) {
    return {
      ok: false as const,
      response: jsonError(
        500,
        "服务器尚未配置 NEWCLI_BASE_URL，请检查 .dev.vars / wrangler.jsonc",
      ),
    };
  }

  return { ok: true as const, apiKey, baseUrl };
}

async function runDivineTask(opts: {
  taskId: string;
  createdAt: number;
  apiKey: string;
  baseUrl: string;
  type: "palm" | "face" | "mole";
  fileBuffer: ArrayBuffer;
  fileType: string;
}) {
  const { taskId, createdAt, apiKey, baseUrl, type, fileBuffer, fileType } =
    opts;

  const markError = async (error: string) => {
    await setTask({
      taskId,
      status: "error",
      createdAt,
      updatedAt: Date.now(),
      error,
    });
  };

  try {
    await setTask({
      taskId,
      status: "running",
      createdAt,
      updatedAt: Date.now(),
    });

    const upstream = new FormData();
    upstream.append("model", "gpt-image-2");
    upstream.append(
      "image",
      new Blob([fileBuffer], { type: fileType || "image/jpeg" }),
      `input${guessExt(fileType)}`,
    );
    upstream.append("prompt", PROMPTS[type]);
    upstream.append("size", KIND_TO_SIZE[type]);

    let res: Response;
    try {
      res = await fetch(`${baseUrl.replace(/\/+$/, "")}/images/edits`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: upstream,
      });
    } catch (e) {
      const err = e as Error & { cause?: unknown };
      const detail =
        err.cause instanceof Error
          ? err.cause.message
          : String(err.cause ?? "");
      console.error("[divine] upstream fetch failed", err);
      await markError(
        `上游连接失败：${err.message}${detail ? ` (${detail})` : ""}`,
      );
      return;
    }

    const text = await res.text();
    if (!res.ok) {
      let msg = text.slice(0, 500);
      try {
        const j = JSON.parse(text) as UpstreamResponse;
        if (j.error?.message) msg = j.error.message;
      } catch {
        /* keep raw */
      }
      await markError(`上游 ${res.status}：${msg}`);
      return;
    }

    let json: UpstreamResponse;
    try {
      json = JSON.parse(text) as UpstreamResponse;
    } catch {
      await markError("上游返回非 JSON");
      return;
    }

    const b64 = json.data?.[0]?.b64_json;
    if (!b64) {
      await markError("上游响应未包含图片数据");
      return;
    }

    await setTask({
      taskId,
      status: "done",
      createdAt,
      updatedAt: Date.now(),
      b64,
      size: b64.length,
    });
  } catch (e) {
    console.error("[divine] background task failed", e);
    await markError(`服务端异常：${(e as Error).message}`);
  }
}

export async function POST(req: NextRequest) {
  // ─── 1. 取环境变量 ──────────────────────────────────────────
  const runtime = await getRuntimeContext();
  const envResult = validateEnv(runtime.env);
  if (!envResult.ok) return envResult.response;

  // ─── 2. 解析与校验请求 ─────────────────────────────────────
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError(400, "请求体不是合法的 multipart 表单");
  }

  const fileField = form.get("image");
  const typeField = String(form.get("type") ?? "");

  if (!(fileField instanceof File)) {
    return jsonError(400, "缺少 image 字段（必须是文件）");
  }
  if (!fileField.type.startsWith("image/")) {
    return jsonError(415, "仅支持图片格式");
  }
  if (fileField.size <= 0) {
    return jsonError(400, "上传文件为空");
  }
  if (fileField.size > MAX_BYTES) {
    return jsonError(413, `图片过大（>${MAX_BYTES / 1024 / 1024}MB）`);
  }
  if (!isDivineType(typeField)) {
    return jsonError(400, "type 必须为 palm / face / mole 之一");
  }

  const taskId = crypto.randomUUID();
  const createdAt = Date.now();
  const fileBuffer = await fileField.arrayBuffer();

  await setTask({
    taskId,
    status: "pending",
    createdAt,
    updatedAt: createdAt,
  });

  const task = runDivineTask({
    taskId,
    createdAt,
    apiKey: envResult.apiKey,
    baseUrl: envResult.baseUrl,
    type: typeField,
    fileBuffer,
    fileType: fileField.type,
  });

  if (runtime.ctx?.waitUntil) {
    runtime.ctx.waitUntil(task);
  } else {
    task.catch((e) => console.error("[divine] background task failed", e));
  }

  return Response.json(
    { ok: true, taskId, status: "pending", pollIntervalMs: 2_000 },
    { status: 202 },
  );
}

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId")?.trim();
  if (!taskId) return jsonError(400, "缺少 taskId");

  const task = await getTask(taskId);
  if (!task) return jsonError(404, "任务不存在或已过期");

  return Response.json({ ok: true, ...task });
}
