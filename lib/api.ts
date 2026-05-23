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

  if (!payload.b64) {
    return { ok: false, error: "服务端响应缺少图片数据" };
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

async function base64ToBlobUrl(b64: string): Promise<string> {
  // 用 fetch 解码 data URL，比手写 atob 省事且自动选择最快路径
  const resp = await fetch(`data:image/png;base64,${b64}`);
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}
