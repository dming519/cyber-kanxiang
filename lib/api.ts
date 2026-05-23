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

interface SseEvent {
  event: string;
  data: string;
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

  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("text/event-stream")) {
    let payload: ResultPayload;
    try {
      payload = (await res.json()) as ResultPayload;
    } catch {
      return { ok: false, error: `服务端返回非 JSON（HTTP ${res.status}）` };
    }

    return {
      ok: false,
      error: payload.error ?? `请求失败（HTTP ${res.status}）`,
    };
  }

  if (!res.body) {
    return { ok: false, error: "响应没有可读流" };
  }

  let payload: ResultPayload;
  try {
    payload = await readChunkedSseResult(res.body);
  } catch (e) {
    return { ok: false, error: `读取响应流失败：${(e as Error).message}` };
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

async function readChunkedSseResult(
  body: ReadableStream<Uint8Array>,
): Promise<ResultPayload> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let expectedTotal: number | null = null;
  let size: number | undefined;
  const chunks: string[] = [];

  const handleEvent = (evt: SseEvent): ResultPayload | null => {
    if (evt.event === "error") {
      try {
        const payload = JSON.parse(evt.data) as { error?: string };
        return { ok: false, error: payload.error ?? "未知错误" };
      } catch {
        return { ok: false, error: evt.data || "未知错误" };
      }
    }

    if (evt.event === "result-start") {
      try {
        const payload = JSON.parse(evt.data) as {
          size?: number;
          total?: number;
        };
        size = payload.size;
        expectedTotal = payload.total ?? null;
      } catch {
        /* ignore malformed */
      }
    }

    if (evt.event === "result-chunk") {
      try {
        const payload = JSON.parse(evt.data) as {
          index?: number;
          chunk?: string;
        };
        if (typeof payload.index === "number" && payload.chunk) {
          chunks[payload.index] = payload.chunk;
        }
      } catch {
        /* ignore malformed */
      }
    }

    if (evt.event === "done") {
      if (expectedTotal !== null && chunks.length < expectedTotal) {
        return { ok: false, error: "服务端流中断，图片分片不完整" };
      }
      const b64 = chunks.join("");
      return b64
        ? { ok: true, b64, size: size ?? b64.length }
        : { ok: false, error: "服务端未返回图片分片" };
    }

    return null;
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep = buffer.indexOf("\n\n");
    while (sep !== -1) {
      const evt = parseSseEvent(buffer.slice(0, sep));
      buffer = buffer.slice(sep + 2);
      if (evt) {
        const result = handleEvent(evt);
        if (result) return result;
      }
      sep = buffer.indexOf("\n\n");
    }
  }

  return { ok: false, error: "服务端流中断，未收到完成帧" };
}

function parseSseEvent(raw: string): SseEvent | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (!line || line.startsWith(":")) continue;
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
