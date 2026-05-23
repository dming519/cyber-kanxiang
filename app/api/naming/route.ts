import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { calculateBazi, type BaziChart } from "@/lib/bazi";
import { buildNamingPrompt, validateNamingInput } from "@/lib/baziPrompt";
import { streamLLM } from "@/lib/llmStream";

export const dynamic = "force-dynamic";
const CHAT_MODEL = "gpt-5.4";

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
      LLM_BASE_URL: process.env.LLM_BASE_URL ?? "",
    } as CloudflareEnv;
  }
  const apiKey = env.LLM_API_KEY?.trim();
  const baseUrl = env.LLM_BASE_URL?.trim();
  if (!apiKey) return { error: "服务器尚未配置 LLM_API_KEY" };
  if (!baseUrl) return { error: "服务器尚未配置 LLM_BASE_URL" };
  return { apiKey, baseUrl, model: CHAT_MODEL };
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
    input = validateNamingInput(body);
  } catch (e) {
    return jsonError(400, (e as Error).message);
  }

  // 优先使用前端传来的 baziContext;否则若提供了出生日期,则本地排盘
  let chart: BaziChart | undefined = input.baziContext;
  if (!chart && input.birthDate && input.birthTime && input.calendar) {
    try {
      chart = calculateBazi({
        gender: input.gender,
        calendar: input.calendar,
        birthDate: input.birthDate,
        birthTime: input.birthTime,
        leapMonth: input.leapMonth,
      });
    } catch (e) {
      return jsonError(400, `排盘失败:${(e as Error).message}`);
    }
  }

  const envResult = await resolveEnv();
  if ("error" in envResult) return jsonError(500, envResult.error);

  const prompts = buildNamingPrompt({
    surname: input.surname,
    preferences: input.preferences,
    baziContext: chart,
  });

  return streamLLM({
    initialChart: chart,
    upstream: envResult,
    prompts,
    temperature: 0.92,
    maxTokens: 3500,
  });
}
