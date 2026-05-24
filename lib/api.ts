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
  status?: string;
  b64?: string;
  size?: number;
  error?: string;
}

interface StatusPayload {
  ok: boolean;
  status?: "pending" | "running" | "succeeded" | "failed";
  b64?: string;
  size?: number;
  error?: string;
}

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

  let payload: ResultPayload;
  try {
    payload = (await res.json()) as ResultPayload;
  } catch (e) {
    return { ok: false, error: `服务端返回非 JSON（HTTP ${res.status}）` };
  }

  if (!res.ok || !payload.ok) {
    return {
      ok: false,
      error: payload.error ?? `请求失败（HTTP ${res.status}）`,
    };
  }

  let b64 = payload.b64;
  let size = payload.size;
  if (!b64) {
    if (!payload.taskId) {
      return { ok: false, error: "服务端响应缺少任务编号" };
    }

    const polled = await pollDivineTask(payload.taskId);
    if (!polled.ok) {
      return polled;
    }
    b64 = polled.b64;
    size = polled.size;
  }

  // base64 → Blob URL，绕开 Android Chrome 对 data URL 的渲染上限
  let blobUrl: string;
  try {
    blobUrl = await base64ToBlobUrl(b64);
  } catch (e) {
    return { ok: false, error: `图片解码失败：${(e as Error).message}` };
  }

  return { ok: true, image: blobUrl, size: size ?? b64.length };
}

async function pollDivineTask(
  taskId: string,
): Promise<{ ok: true; b64: string; size?: number } | DivineFail> {
  const deadline = Date.now() + 8 * 60 * 1000;

  while (Date.now() < deadline) {
    await sleep(2000);

    let res: Response;
    try {
      res = await fetch(
        `/api/divine/status?taskId=${encodeURIComponent(taskId)}`,
        { method: "GET" },
      );
    } catch (e) {
      return { ok: false, error: `查询任务失败：${(e as Error).message}` };
    }

    let payload: StatusPayload;
    try {
      payload = (await res.json()) as StatusPayload;
    } catch {
      return { ok: false, error: `任务状态返回非 JSON（HTTP ${res.status}）` };
    }

    if (!res.ok || !payload.ok) {
      if (res.status === 404) {
        continue;
      }
      return {
        ok: false,
        error: payload.error ?? `查询任务失败（HTTP ${res.status}）`,
      };
    }

    if (payload.status === "succeeded") {
      if (!payload.b64) {
        return { ok: false, error: "任务成功但未返回图片数据" };
      }
      return { ok: true, b64: payload.b64, size: payload.size };
    }

    if (payload.status === "failed") {
      return { ok: false, error: payload.error ?? "图片生成任务失败" };
    }
  }

  return { ok: false, error: "任务超时，请稍后重试" };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function base64ToBlobUrl(b64: string): Promise<string> {
  // 用 fetch 解码 data URL，比手写 atob 省事且自动选择最快路径
  const resp = await fetch(`data:image/png;base64,${b64}`);
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}
