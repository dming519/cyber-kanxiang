import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  fileToDataUrl,
  runLocalDivineTask,
  writeTask,
  type MinimalKvNamespace,
} from "@/lib/divineTask";
import { isDivineType } from "@/lib/prompts";

export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;

interface DivineEnv extends CloudflareEnv {
  TASKS_KV?: MinimalKvNamespace;
  IMAGE_WORKER?: {
    fetch(input: string | Request, init?: RequestInit): Promise<Response>;
  };
  IMAGE_WORKER_URL?: string;
  IMAGE_WORKER_TOKEN?: string;
}

function jsonError(status: number, message: string) {
  return Response.json({ ok: false, error: message }, { status });
}

async function getEnv(): Promise<DivineEnv> {
  try {
    return (await getCloudflareContext({ async: true })).env as DivineEnv;
  } catch {
    return {
      NEWCLI_API_KEY: process.env.NEWCLI_API_KEY ?? "",
      NEWCLI_BASE_URL: process.env.NEWCLI_BASE_URL ?? "",
      LLM_API_KEY: process.env.LLM_API_KEY ?? "",
      LLM_BASE_URL: process.env.LLM_BASE_URL ?? "",
      IMAGE_WORKER_URL: process.env.IMAGE_WORKER_URL ?? "",
      IMAGE_WORKER_TOKEN: process.env.IMAGE_WORKER_TOKEN ?? "",
    } as DivineEnv;
  }
}

export async function POST(req: NextRequest) {
  const env = await getEnv();
  const apiKey = env.NEWCLI_API_KEY?.trim();
  const baseUrl = env.NEWCLI_BASE_URL?.trim();

  if (!apiKey) {
    return jsonError(
      500,
      "服务器尚未配置 NEWCLI_API_KEY，请检查 .dev.vars / wrangler secret",
    );
  }
  if (!baseUrl) {
    return jsonError(
      500,
      "服务器尚未配置 NEWCLI_BASE_URL，请检查 .dev.vars / wrangler.jsonc",
    );
  }

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
  const now = Date.now();
  await writeTask(env.TASKS_KV, taskId, {
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  const imageDataUrl = await fileToDataUrl(fileField);
  const workerUrl = env.IMAGE_WORKER_URL?.trim();
  const workerToken = env.IMAGE_WORKER_TOKEN?.trim();

  if ((env.IMAGE_WORKER || workerUrl) && !workerToken) {
    await writeTask(env.TASKS_KV, taskId, {
      status: "failed",
      createdAt: now,
      updatedAt: Date.now(),
      error: "服务器尚未配置 IMAGE_WORKER_TOKEN",
    });
    return Response.json({ ok: true, taskId, status: "pending" }, { status: 202 });
  }

  if ((env.IMAGE_WORKER || workerUrl) && workerToken) {
    try {
      const taskBody = JSON.stringify({ taskId, type: typeField, imageDataUrl });
      const dispatch = env.IMAGE_WORKER
        ? await env.IMAGE_WORKER.fetch("https://image-worker/task", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${workerToken}`,
            },
            body: taskBody,
          })
        : await fetch(`${workerUrl!.replace(/\/+$/, "")}/task`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${workerToken}`,
            },
            body: taskBody,
          });
      if (!dispatch.ok) {
        const text = await dispatch.text();
        await writeTask(env.TASKS_KV, taskId, {
          status: "failed",
          createdAt: now,
          updatedAt: Date.now(),
          error: `任务派发失败（HTTP ${dispatch.status}）：${text.slice(0, 300)}`,
        });
      }
    } catch (e) {
      await writeTask(env.TASKS_KV, taskId, {
        status: "failed",
        createdAt: now,
        updatedAt: Date.now(),
        error: `任务派发失败：${(e as Error).message}`,
      });
    }
  } else {
    runLocalDivineTask(env.TASKS_KV, {
      taskId,
      type: typeField,
      imageDataUrl,
      apiKey,
      baseUrl,
    });
  }

  return Response.json({ ok: true, taskId, status: "pending" }, { status: 202 });
}
