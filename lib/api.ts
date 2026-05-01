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

export async function callDivine(file: File, type: DivineType): Promise<DivineResult> {
  const form = new FormData();
  form.append("image", file, file.name);
  form.append("type", type);

  let res: Response;
  try {
    res = await fetch("/api/divine", { method: "POST", body: form });
  } catch (e) {
    return { ok: false, error: `网络异常：${(e as Error).message}` };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: `服务端返回非 JSON（HTTP ${res.status}）` };
  }

  if (!res.ok || !isOkPayload(data)) {
    const msg =
      (data as DivineFail | undefined)?.error ?? `请求失败（HTTP ${res.status}）`;
    return { ok: false, error: msg };
  }

  // Android Chrome 对 <img src="data:..."> 的 data URL 大小有约 2MB 上限,
  // 但我们的结果常 3-4MB。把 base64 立即转成 Blob URL,绕开此限制。
  try {
    const blobUrl = await dataUrlToBlobUrl(data.image);
    return { ok: true, image: blobUrl, size: data.size };
  } catch (e) {
    return { ok: false, error: `图片解码失败:${(e as Error).message}` };
  }
}

async function dataUrlToBlobUrl(dataUrl: string): Promise<string> {
  // 浏览器原生 fetch 能直接解析 data URL 成 Blob,比手写 atob 解码省事且更快
  const resp = await fetch(dataUrl);
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}

function isOkPayload(v: unknown): v is DivineSuccess {
  return !!v && typeof v === "object" && (v as DivineSuccess).ok === true;
}
