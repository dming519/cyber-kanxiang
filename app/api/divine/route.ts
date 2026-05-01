import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PROMPTS, KIND_TO_SIZE, isDivineType } from "@/lib/prompts";

export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;
const HEARTBEAT_MS = 10_000;

interface UpstreamResponse {
  data?: { b64_json?: string }[];
  error?: { message?: string };
}

function jsonError(status: number, message: string) {
  return Response.json({ ok: false, error: message }, { status });
}

function guessExt(mime: string): string {
  if (!mime) return ".jpg";
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("gif")) return ".gif";
  return ".jpg";
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // 关键：阻止 Cloudflare / 反向代理缓冲，立刻把每个 chunk 转给客户端
    "X-Accel-Buffering": "no",
  };
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  // ─── 1. 取环境变量 ──────────────────────────────────────────
  let env: CloudflareEnv;
  try {
    env = (await getCloudflareContext({ async: true })).env;
  } catch {
    env = {
      NEWCLI_API_KEY: process.env.NEWCLI_API_KEY ?? "",
      NEWCLI_BASE_URL:
        process.env.NEWCLI_BASE_URL ?? "https://code.newcli.com/codex/v1",
    } as CloudflareEnv;
  }

  const apiKey = env.NEWCLI_API_KEY?.trim();
  const baseUrl =
    env.NEWCLI_BASE_URL?.trim() || "https://code.newcli.com/codex/v1";

  if (!apiKey) {
    return jsonError(
      500,
      "服务器尚未配置 NEWCLI_API_KEY，请检查 .dev.vars / wrangler secret",
    );
  }

  // ─── 2. 解析与校验请求 ─────────────────────────────────────
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError(400, "请求体不是合法的 multipart 表单");
  }

  const fileField = form.get("image");
  const typeField = String(form.get("type") ?? "");

  if (!(fileField instanceof File)) {
    return jsonError(400, "缺少 image 字段（必须是文件）");
  }
  if (!fileField.type.startsWith("image/")) {
    return jsonError(415, "仅支持图片格式");
  }
  if (fileField.size <= 0) {
    return jsonError(400, "上传文件为空");
  }
  if (fileField.size > MAX_BYTES) {
    return jsonError(413, `图片过大（>${MAX_BYTES / 1024 / 1024}MB）`);
  }
  if (!isDivineType(typeField)) {
    return jsonError(400, "type 必须为 palm / face / mole 之一");
  }

  // ─── 3. 准备上游请求体（在进入 stream 前完成，避免 ReadableStream
  //      内 await arrayBuffer 时拖长 idle）─────────────────
  const buf = await fileField.arrayBuffer();
  const safeBlob = new Blob([buf], { type: fileField.type || "image/jpeg" });
  const safeName = `input${guessExt(fileField.type)}`;

  const upstream = new FormData();
  upstream.append("model", "gpt-image-2");
  upstream.append("image", safeBlob, safeName);
  upstream.append("prompt", PROMPTS[typeField]);
  upstream.append("size", KIND_TO_SIZE[typeField]);

  // ─── 4. 构造 SSE 流：立即返回头 + 心跳 + 最终数据帧 ────────
  // 立刻返回响应头让 Cloudflare 边缘记录 first-byte，
  // 之后只要持续有 chunk 流出（哪怕是注释心跳）就不会被切断。
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const safeEnqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      // 立即发首帧 SSE 注释，触发 first-byte 让客户端 / 边缘开始接收
      safeEnqueue(": connected\n\n");

      // 心跳协程：每 10s 一个注释保活
      const heartbeat = (async () => {
        while (!closed) {
          await sleep(HEARTBEAT_MS);
          if (closed) break;
          safeEnqueue(`: keep-alive ${Date.now()}\n\n`);
        }
      })();

      // 同步去调上游
      try {
        let res: Response;
        try {
          res = await fetch(`${baseUrl}/images/edits`, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: upstream,
          });
        } catch (e) {
          const err = e as Error & { cause?: unknown };
          const detail =
            err.cause instanceof Error
              ? err.cause.message
              : String(err.cause ?? "");
          console.error("[divine] upstream fetch failed", err);
          safeEnqueue(
            `event: result\ndata: ${JSON.stringify({
              ok: false,
              error: `上游连接失败：${err.message}${detail ? ` (${detail})` : ""}`,
            })}\n\n`,
          );
          return;
        }

        const text = await res.text();
        if (!res.ok) {
          let msg = text.slice(0, 500);
          try {
            const j = JSON.parse(text) as UpstreamResponse;
            if (j.error?.message) msg = j.error.message;
          } catch {
            /* keep raw */
          }
          safeEnqueue(
            `event: result\ndata: ${JSON.stringify({
              ok: false,
              error: `上游 ${res.status}：${msg}`,
            })}\n\n`,
          );
          return;
        }

        let json: UpstreamResponse;
        try {
          json = JSON.parse(text) as UpstreamResponse;
        } catch {
          safeEnqueue(
            `event: result\ndata: ${JSON.stringify({
              ok: false,
              error: "上游返回非 JSON",
            })}\n\n`,
          );
          return;
        }

        const b64 = json.data?.[0]?.b64_json;
        if (!b64) {
          safeEnqueue(
            `event: result\ndata: ${JSON.stringify({
              ok: false,
              error: "上游响应未包含图片数据",
            })}\n\n`,
          );
          return;
        }

        // 大 base64 一次塞 SSE 单事件没问题，浏览器可处理 MB 级 data 行。
        // 这里不带 data:image/png;base64, 前缀，由前端拼接。
        safeEnqueue(
          `event: result\ndata: ${JSON.stringify({
            ok: true,
            b64,
            size: b64.length,
          })}\n\n`,
        );
      } catch (e) {
        safeEnqueue(
          `event: result\ndata: ${JSON.stringify({
            ok: false,
            error: `服务端异常：${(e as Error).message}`,
          })}\n\n`,
        );
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
