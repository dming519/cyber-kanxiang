/**
 * LLM 流式 SSE 共用工具:
 * - 调用 OpenAI 兼容 chat/completions + stream=true
 * - 解析上游 SSE chunks
 * - 向下游转发自定义 SSE 事件: chart / ping / delta / done / error
 * - 1s 心跳保活,适配手机移动网络 NAT
 */

const HEARTBEAT_MS = 1_000;

export interface UpstreamConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface BuildPromptResult {
  system: string;
  user: string;
}

export interface StreamLLMOptions<TChart> {
  /** 立即推送给前端的初始 chart 数据(可选,例如八字本地排盘) */
  initialChart?: TChart;
  /** 上游模型 */
  upstream: UpstreamConfig;
  /** 提示词 */
  prompts: BuildPromptResult;
  /** 控制采样,默认 0.8 */
  temperature?: number;
}

export function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

interface UpstreamChunk {
  choices?: Array<{
    delta?: { content?: string | null };
    finish_reason?: string | null;
  }>;
  error?: { message?: string };
}

export function streamLLM<TChart>(opts: StreamLLMOptions<TChart>): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const enqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      // 立即首帧 + chart
      enqueue(": connected\n\n");
      enqueue(`event: ping\ndata: ${JSON.stringify({ t: Date.now() })}\n\n`);
      if (opts.initialChart !== undefined) {
        enqueue(
          `event: chart\ndata: ${JSON.stringify(opts.initialChart)}\n\n`,
        );
      }

      const heartbeat = (async () => {
        while (!closed) {
          await sleep(HEARTBEAT_MS);
          if (closed) break;
          enqueue(
            `event: ping\ndata: ${JSON.stringify({ t: Date.now() })}\n\n`,
          );
        }
      })();

      const sendError = (msg: string) => {
        enqueue(
          `event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`,
        );
      };

      try {
        const baseUrl = opts.upstream.baseUrl.replace(/\/+$/, "");
        const url = baseUrl.endsWith("/v1")
          ? `${baseUrl}/chat/completions`
          : `${baseUrl}/v1/chat/completions`;
        const body = JSON.stringify({
          model: opts.upstream.model,
          stream: true,
          temperature: opts.temperature ?? 0.8,
          messages: [
            { role: "system", content: opts.prompts.system },
            { role: "user", content: opts.prompts.user },
          ],
        });

        let upstream: Response;
        try {
          upstream = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${opts.upstream.apiKey}`,
              "Content-Type": "application/json",
              Accept: "text/event-stream",
            },
            body,
          });
        } catch (e) {
          const err = e as Error & { cause?: unknown };
          const cause =
            err.cause instanceof Error ? err.cause.message : String(err.cause ?? "");
          console.error("[llmStream] upstream fetch failed", err);
          sendError(`上游连接失败:${err.message}${cause ? ` (${cause})` : ""}`);
          return;
        }

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          let msg = text.slice(0, 500);
          try {
            const j = JSON.parse(text) as UpstreamChunk;
            if (j.error?.message) msg = j.error.message;
          } catch {
            /* keep raw */
          }
          sendError(`上游 ${upstream.status}:${msg}`);
          return;
        }

        // 解析上游 SSE,转发为 delta
        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!closed) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx = buffer.indexOf("\n\n");
          while (idx !== -1) {
            const eventBlock = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            handleUpstreamEvent(eventBlock, enqueue);
            idx = buffer.indexOf("\n\n");
          }
        }
        // flush trailing
        if (buffer) handleUpstreamEvent(buffer, enqueue);

        enqueue(`event: done\ndata: {}\n\n`);
      } catch (e) {
        sendError(`服务端异常:${(e as Error).message}`);
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
        await heartbeat.catch(() => undefined);
      }
    },
  });

  return new Response(stream, { status: 200, headers: sseHeaders() });
}

function handleUpstreamEvent(
  block: string,
  enqueue: (s: string) => void,
): void {
  // 上游 OpenAI SSE 一行 data: {...}, 多行也可能,但 chat/completions 通常单行
  for (const line of block.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload) continue;
    if (payload === "[DONE]") return;
    try {
      const j = JSON.parse(payload) as UpstreamChunk;
      const delta = j.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta.length > 0) {
        enqueue(
          `event: delta\ndata: ${JSON.stringify({ text: delta })}\n\n`,
        );
      }
      if (j.error?.message) {
        enqueue(
          `event: error\ndata: ${JSON.stringify({ error: j.error.message })}\n\n`,
        );
      }
    } catch {
      // ignore malformed line
    }
  }
}
