import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { readTask, type MinimalKvNamespace } from "@/lib/divineTask";

export const dynamic = "force-dynamic";

interface DivineStatusEnv extends CloudflareEnv {
  TASKS_KV?: MinimalKvNamespace;
  IMAGE_WORKER?: {
    fetch(input: string | Request, init?: RequestInit): Promise<Response>;
  };
  IMAGE_WORKER_URL?: string;
  IMAGE_WORKER_TOKEN?: string;
}

function jsonError(status: number, message: string) {
  return Response.json({ ok: false, error: message }, { status });
}

async function getEnv(): Promise<DivineStatusEnv> {
  try {
    return (await getCloudflareContext({ async: true })).env as DivineStatusEnv;
  } catch {
    return {
      NEWCLI_API_KEY: process.env.NEWCLI_API_KEY ?? "",
      NEWCLI_BASE_URL: process.env.NEWCLI_BASE_URL ?? "",
      LLM_API_KEY: process.env.LLM_API_KEY ?? "",
      LLM_BASE_URL: process.env.LLM_BASE_URL ?? "",
      IMAGE_WORKER_URL: process.env.IMAGE_WORKER_URL ?? "",
      IMAGE_WORKER_TOKEN: process.env.IMAGE_WORKER_TOKEN ?? "",
    } as DivineStatusEnv;
  }
}

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId")?.trim();
  if (!taskId) {
    return jsonError(400, "缺少 taskId");
  }

  const env = await getEnv();
  const workerUrl = env.IMAGE_WORKER_URL?.trim();
  const workerToken = env.IMAGE_WORKER_TOKEN?.trim();
  if ((env.IMAGE_WORKER || workerUrl) && workerToken) {
    try {
      const upstream = env.IMAGE_WORKER
        ? await env.IMAGE_WORKER.fetch(
            `https://image-worker/status?taskId=${encodeURIComponent(taskId)}`,
            { headers: { Authorization: `Bearer ${workerToken}` } },
          )
        : await fetch(
            `${workerUrl!.replace(/\/+$/, "")}/status?taskId=${encodeURIComponent(taskId)}`,
            { headers: { Authorization: `Bearer ${workerToken}` } },
          );
      const text = await upstream.text();
      try {
        const payload = JSON.parse(text) as unknown;
        if (!upstream.ok) {
          const localTask = await readTask(env.TASKS_KV, taskId);
          if (localTask) return Response.json({ ok: true, ...localTask });
        }
        return Response.json(payload, { status: upstream.status });
      } catch {
        return jsonError(
          502,
          `任务状态服务返回非 JSON（HTTP ${upstream.status}）`,
        );
      }
    } catch (e) {
      const localTask = await readTask(env.TASKS_KV, taskId);
      if (localTask) return Response.json({ ok: true, ...localTask });
      return jsonError(502, `任务状态服务连接失败：${(e as Error).message}`);
    }
  }

  const task = await readTask(env.TASKS_KV, taskId);
  if (!task) {
    return jsonError(404, "任务不存在或已过期");
  }

  return Response.json({ ok: true, ...task });
}
