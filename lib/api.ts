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

  // 服务端早期校验失败时仍以 JSON 返回（4xx / 5xx 且不是 SSE）
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("text/event-stream")) {
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return { ok: false, error: `服务端返回非 JSON（HTTP ${res.status}）` };
    }
    const fail = data as DivineFail | undefined;
    return {
      ok: false,
      error: fail?.error ?? `请求失败（HTTP ${res.status}）`,
    };
  }

  if (!res.body) {
    return { ok: false, error: "响应没有可读流" };
  }

  // 解析 SSE，找出 event: result 的那条 data
  let payload: ResultPayload | null = null;
  try {
    payload = await readSseUntilResult(res.body);
  } catch (e) {
    return { ok: false, error: `读取响应流失败：${(e as Error).message}` };
  }

  if (!payload) {
    return { ok: false, error: "服务端流中断，未收到结果帧" };
  }
  if (!payload.ok || !payload.b64) {
    return { ok: false, error: payload.error ?? "未知错误" };
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

async function readSseUntilResult(
  body: ReadableStream<Uint8Array>,
): Promise<ResultPayload | null> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: ResultPayload | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE 事件以 \n\n 分隔
    let sep = buffer.indexOf("\n\n");
    while (sep !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const evt = parseSseEvent(raw);
      if (evt && evt.event === "result" && evt.data) {
        try {
          result = JSON.parse(evt.data) as ResultPayload;
        } catch {
          // ignore malformed
        }
      }
      sep = buffer.indexOf("\n\n");
    }
  }

  // 处理流结束时残留 buffer 中的最后一个事件
  if (buffer) {
    const evt = parseSseEvent(buffer);
    if (evt && evt.event === "result" && evt.data && !result) {
      try {
        result = JSON.parse(evt.data) as ResultPayload;
      } catch {
        // ignore
      }
    }
  }

  return result;
}

function parseSseEvent(
  raw: string,
): { event: string; data: string } | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (!line || line.startsWith(":")) continue; // comment / heartbeat
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).replace(/^ /, ""));
    }
  }
  if (!dataLines.length) return null;
  return { event, data: dataLines.join("\n") };
}

async function base64ToBlobUrl(b64: string): Promise<string> {
  // 用 fetch 解码 data URL，比手写 atob 省事且自动选择最快路径
  const resp = await fetch(`data:image/png;base64,${b64}`);
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}
