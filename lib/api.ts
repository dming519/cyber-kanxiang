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
  return data;
}

function isOkPayload(v: unknown): v is DivineSuccess {
  return !!v && typeof v === "object" && (v as DivineSuccess).ok === true;
}
