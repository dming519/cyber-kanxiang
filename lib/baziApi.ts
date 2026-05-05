"use client";

import type { BaziChart } from "./bazi";

export interface StreamHandlers<TChart> {
  onChart?: (chart: TChart) => void;
  onDelta?: (text: string) => void;
  onDone?: () => void;
  onError?: (msg: string) => void;
}

async function postStream<TChart>(
  url: string,
  body: unknown,
  handlers: StreamHandlers<TChart>,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    handlers.onError?.(`网络异常:${(e as Error).message}`);
    return;
  }

  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("text/event-stream")) {
    let detail = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) detail = j.error;
    } catch {
      /* keep default */
    }
    handlers.onError?.(detail);
    return;
  }

  if (!res.body) {
    handlers.onError?.("响应没有可读流");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let doneSeen = false;

  const flushEvent = (raw: string) => {
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
    if (!dataLines.length) return;
    const data = dataLines.join("\n");

    if (event === "chart") {
      try {
        handlers.onChart?.(JSON.parse(data) as TChart);
      } catch {
        /* ignore */
      }
    } else if (event === "delta") {
      try {
        const j = JSON.parse(data) as { text?: string };
        if (typeof j.text === "string") handlers.onDelta?.(j.text);
      } catch {
        /* ignore */
      }
    } else if (event === "done") {
      doneSeen = true;
      handlers.onDone?.();
    } else if (event === "error") {
      try {
        const j = JSON.parse(data) as { error?: string };
        handlers.onError?.(j.error ?? "未知错误");
      } catch {
        handlers.onError?.(data);
      }
    }
    // ping ignored
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx = buffer.indexOf("\n\n");
      while (idx !== -1) {
        flushEvent(buffer.slice(0, idx));
        buffer = buffer.slice(idx + 2);
        idx = buffer.indexOf("\n\n");
      }
    }
    if (buffer) flushEvent(buffer);
    if (!doneSeen) handlers.onDone?.();
  } catch (e) {
    handlers.onError?.(`读取响应流失败:${(e as Error).message}`);
  }
}

export interface StreamBaziInput {
  gender: "male" | "female" | "unknown";
  calendar: "solar" | "lunar";
  birthDate: string;
  birthTime: string;
  leapMonth?: boolean;
}

export function streamBazi(
  input: StreamBaziInput,
  handlers: StreamHandlers<BaziChart>,
  signal?: AbortSignal,
): Promise<void> {
  return postStream<BaziChart>("/api/bazi", input, handlers, signal);
}

export interface StreamNamingInput {
  gender: "male" | "female" | "unknown";
  surname: string;
  calendar?: "solar" | "lunar";
  birthDate?: string;
  birthTime?: string;
  leapMonth?: boolean;
  preferences?: string;
  baziContext?: BaziChart;
}

export function streamNaming(
  input: StreamNamingInput,
  handlers: StreamHandlers<BaziChart>,
  signal?: AbortSignal,
): Promise<void> {
  return postStream<BaziChart>("/api/naming", input, handlers, signal);
}
