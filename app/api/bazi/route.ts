import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { calculateBazi, validateBaziInput } from "@/lib/bazi";
import { buildBaziPrompt } from "@/lib/baziPrompt";
import { streamLLM } from "@/lib/llmStream";

export const dynamic = "force-dynamic";

function jsonError(status: number, message: string) {
  return Response.json({ ok: false, error: message }, { status });
}

interface ResolvedEnv {
  apiKey: string;
  baseUrl: string;
  model: string;
}

async function resolveEnv(): Promise<ResolvedEnv | { error: string }> {
  let env: CloudflareEnv;
  try {
    env = (await getCloudflareContext({ async: true })).env;
  } catch {
    env = {
      LLM_API_KEY: process.env.LLM_API_KEY ?? "",
      LLM_BASE_URL:
        process.env.LLM_BASE_URL ??
        "https://api.aicodemirror.com/api/codex/backend-api/codex",
      LLM_MODEL: process.env.LLM_MODEL ?? "gpt-5.4",
    } as CloudflareEnv;
  }
  const apiKey = env.LLM_API_KEY?.trim();
  const baseUrl = env.LLM_BASE_URL?.trim();
  const model = env.LLM_MODEL?.trim();
  if (!apiKey) return { error: "服务器尚未配置 LLM_API_KEY" };
  if (!baseUrl) return { error: "服务器尚未配置 LLM_BASE_URL" };
  if (!model) return { error: "服务器尚未配置 LLM_MODEL" };
  return { apiKey, baseUrl, model };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "请求体必须是合法 JSON");
  }

  let input;
  try {
    input = validateBaziInput(body);
  } catch (e) {
    return jsonError(400, (e as Error).message);
  }

  let chart;
  try {
    chart = calculateBazi(input);
  } catch (e) {
    return jsonError(400, `排盘失败:${(e as Error).message}`);
  }

  const envResult = await resolveEnv();
  if ("error" in envResult) return jsonError(500, envResult.error);

  const prompts = buildBaziPrompt(chart);

  return streamLLM({
    initialChart: chart,
    upstream: envResult,
    prompts,
    temperature: 0.85,
    maxTokens: 3500,
  });
}
