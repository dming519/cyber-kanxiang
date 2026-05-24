import { KIND_TO_SIZE, PROMPTS, type DivineType } from "./prompts";

export type DivineTaskStatus = "pending" | "running" | "succeeded" | "failed";

export interface DivineTaskRecord {
  status: DivineTaskStatus;
  createdAt: number;
  updatedAt: number;
  b64?: string;
  size?: number;
  error?: string;
}

export interface DivineTaskRequest {
  taskId: string;
  type: DivineType;
  imageDataUrl: string;
}

export interface MinimalKvNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

interface RunDivineTaskOptions extends DivineTaskRequest {
  apiKey: string;
  baseUrl: string;
}

interface UpstreamResponse {
  data?: { b64_json?: string }[];
  error?: { message?: string };
}

const TASK_TTL_SECONDS = 60 * 60;
const memoryTasks = getMemoryTasks();

export function divineTaskKey(taskId: string) {
  return `divine-task:${taskId}`;
}

export async function writeTask(
  kv: MinimalKvNamespace | undefined,
  taskId: string,
  record: DivineTaskRecord,
) {
  const key = divineTaskKey(taskId);
  const value = JSON.stringify(record);
  memoryTasks.set(key, value);
  if (kv) {
    await kv.put(key, value, { expirationTtl: TASK_TTL_SECONDS });
  }
}

export async function readTask(
  kv: MinimalKvNamespace | undefined,
  taskId: string,
): Promise<DivineTaskRecord | null> {
  const raw = kv ? await kv.get(divineTaskKey(taskId)) : memoryTasks.get(divineTaskKey(taskId));
  if (!raw) return null;
  return JSON.parse(raw) as DivineTaskRecord;
}

export async function fileToDataUrl(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:${file.type || "image/jpeg"};base64,${btoa(binary)}`;
}

export function runLocalDivineTask(
  kv: MinimalKvNamespace | undefined,
  options: RunDivineTaskOptions,
) {
  void runDivineTask(kv, options);
}

export async function runDivineTask(
  kv: MinimalKvNamespace | undefined,
  options: RunDivineTaskOptions,
) {
  const now = Date.now();
  await writeTask(kv, options.taskId, {
    status: "running",
    createdAt: now,
    updatedAt: now,
  });

  try {
    const upstream = new FormData();
    const imageBlob = dataUrlToBlob(options.imageDataUrl);
    upstream.append("model", "gpt-image-2");
    upstream.append("image", imageBlob, `input${guessExt(imageBlob.type)}`);
    upstream.append("prompt", PROMPTS[options.type]);
    upstream.append("size", KIND_TO_SIZE[options.type]);
    upstream.append("response_format", "b64_json");

    const response = await fetch(
      `${options.baseUrl.replace(/\/+$/, "")}/images/edits`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${options.apiKey}` },
        body: upstream,
      },
    );

    const text = await response.text();
    if (!response.ok) {
      await writeTask(kv, options.taskId, {
        status: "failed",
        createdAt: now,
        updatedAt: Date.now(),
        error: `上游 ${response.status}：${extractUpstreamError(text)}`,
      });
      return;
    }

    let payload: UpstreamResponse;
    try {
      payload = JSON.parse(text) as UpstreamResponse;
    } catch {
      await writeTask(kv, options.taskId, {
        status: "failed",
        createdAt: now,
        updatedAt: Date.now(),
        error: "上游返回非 JSON",
      });
      return;
    }

    const b64 = payload.data?.[0]?.b64_json;
    if (!b64) {
      await writeTask(kv, options.taskId, {
        status: "failed",
        createdAt: now,
        updatedAt: Date.now(),
        error: "上游响应未包含图片数据",
      });
      return;
    }

    await writeTask(kv, options.taskId, {
      status: "succeeded",
      createdAt: now,
      updatedAt: Date.now(),
      b64,
      size: b64.length,
    });
  } catch (e) {
    const err = e as Error & { cause?: unknown };
    const detail =
      err.cause instanceof Error ? err.cause.message : String(err.cause ?? "");
    await writeTask(kv, options.taskId, {
      status: "failed",
      createdAt: now,
      updatedAt: Date.now(),
      error: `上游连接失败：${err.message}${detail ? ` (${detail})` : ""}`,
    });
  }
}

function dataUrlToBlob(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;base64)?,(.*)$/);
  if (!match) {
    throw new Error("图片数据格式无效，无法解析上传内容");
  }

  const mimeType = match[1] || "application/octet-stream";
  const payload = match[2] || "";
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

function extractUpstreamError(text: string) {
  let message = text.slice(0, 500);
  try {
    const json = JSON.parse(text) as UpstreamResponse;
    if (json.error?.message) message = json.error.message;
  } catch {
    /* keep raw text */
  }
  return message;
}

function guessExt(mime: string): string {
  if (!mime) return ".jpg";
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("gif")) return ".gif";
  return ".jpg";
}

function getMemoryTasks() {
  const globalKey = "__cyberKanxiangDivineTasks";
  const globalWithTasks = globalThis as typeof globalThis & {
    [globalKey]?: Map<string, string>;
  };
  if (!globalWithTasks[globalKey]) {
    globalWithTasks[globalKey] = new Map<string, string>();
  }
  return globalWithTasks[globalKey];
}
