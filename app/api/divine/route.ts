import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PROMPTS, KIND_TO_SIZE, isDivineType } from "@/lib/prompts";

export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;

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

export async function POST(req: NextRequest) {
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

  const upstream = new FormData();
  upstream.append("model", "gpt-image-2");

  // 关键：把 Web File 重新包成 Blob，并使用纯 ASCII 文件名，
  // 避免 Node.js undici 在 Windows 下序列化 multipart 时
  // 因中文 Content-Disposition filename 而 fetch failed
  const buf = await fileField.arrayBuffer();
  const safeBlob = new Blob([buf], { type: fileField.type || "image/jpeg" });
  const safeName = `input${guessExt(fileField.type)}`;
  upstream.append("image", safeBlob, safeName);

  upstream.append("prompt", PROMPTS[typeField]);
  upstream.append("size", KIND_TO_SIZE[typeField]);

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
      err.cause instanceof Error ? err.cause.message : String(err.cause ?? "");
    console.error("[divine] fetch failed", err, "cause=", err.cause);
    return jsonError(
      502,
      `上游连接失败：${err.message}${detail ? ` (${detail})` : ""}`,
    );
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
    return jsonError(502, `上游 ${res.status}：${msg}`);
  }

  let json: UpstreamResponse;
  try {
    json = JSON.parse(text) as UpstreamResponse;
  } catch {
    return jsonError(502, "上游返回非 JSON");
  }

  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    return jsonError(502, "上游响应未包含图片数据");
  }

  return Response.json({
    ok: true,
    image: `data:image/png;base64,${b64}`,
    size: b64.length,
  });
}
