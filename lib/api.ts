"use client";

import type { DivineType } from "./prompts";

export interface DivineSuccess {
  ok: true;
  image: string;
  size: number;
}

export interface DivineFail {
  ok: false;
  error: string;
}

export type DivineResult = DivineSuccess | DivineFail;

interface ResultPayload {
  ok: boolean;
  taskId?: string;
  status?: "pending" | "running" | "done" | "error";
  pollIntervalMs?: number;
  b64?: string;
  size?: number;
  error?: string;
}

const POLL_TIMEOUT_MS = 3 * 60 * 1_000;
const DEFAULT_POLL_INTERVAL_MS = 2_000;

export async function callDivine(
  file: File,
  type: DivineType,
): Promise<DivineResult> {
  const form = new FormData();
  form.append("image", file, file.name);
  form.append("type", type);

  let res: Response;
  try {
    res = await fetch("/api/divine", { method: "POST", body: form });
  } catch (e) {
    return { ok: false, error: `网络异常：${(e as Error).message}` };
  }

  let submitted: ResultPayload;
  try {
    submitted = (await res.json()) as ResultPayload;
  } catch (e) {
    return { ok: false, error: `服务端返回非 JSON（HTTP ${res.status}）` };
  }

  if (!res.ok || !submitted.ok) {
    return {
      ok: false,
      error: submitted.error ?? `请求失败（HTTP ${res.status}）`,
    };
  }

  if (!submitted.taskId) {
    return { ok: false, error: "服务端未返回任务编号" };
  }

  const payload = await pollDivineTask(
    submitted.taskId,
    submitted.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
  );

  if (!payload.ok) {
    return { ok: false, error: payload.error ?? "未知错误" };
  }
  if (!payload.b64) {
    return { ok: false, error: "任务完成但缺少图片数据" };
  }

  // base64 → Blob URL，绕开 Android Chrome 对 data URL 的渲染上限
  let blobUrl: string;
  try {
    blobUrl = await base64ToBlobUrl(payload.b64);
  } catch (e) {
    return { ok: false, error: `图片解码失败：${(e as Error).message}` };
  }

  return { ok: true, image: blobUrl, size: payload.size ?? payload.b64.length };
}

async function pollDivineTask(
  taskId: string,
  intervalMs: number,
): Promise<ResultPayload> {
  const startedAt = Date.now();

  while (true) {
    if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
      return { ok: false, error: "任务超时，请稍后重试" };
    }

    await sleep(intervalMs);

    let res: Response;
    try {
      res = await fetch(`/api/divine?taskId=${encodeURIComponent(taskId)}`, {
        method: "GET",
        cache: "no-store",
      });
    } catch (e) {
      return { ok: false, error: `查询任务失败：${(e as Error).message}` };
    }

    let payload: ResultPayload;
    try {
      payload = (await res.json()) as ResultPayload;
    } catch {
      return { ok: false, error: `任务查询返回非 JSON（HTTP ${res.status}）` };
    }

    if (!res.ok || !payload.ok) {
      return {
        ok: false,
        error: payload.error ?? `任务查询失败（HTTP ${res.status}）`,
      };
    }

    if (payload.status === "error") {
      return { ok: false, error: payload.error ?? "任务执行失败" };
    }

    if (payload.status === "done") {
      return payload;
    }
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function base64ToBlobUrl(b64: string): Promise<string> {
  // 用 fetch 解码 data URL，比手写 atob 省事且自动选择最快路径
  const resp = await fetch(`data:image/png;base64,${b64}`);
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}
