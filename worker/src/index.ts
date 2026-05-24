import { DurableObject } from "cloudflare:workers";
import {
  divineTaskKey,
  readTask,
  runDivineTask,
  writeTask,
  type DivineTaskRequest,
  type MinimalKvNamespace,
} from "../../lib/divineTask";
import { isDivineType } from "../../lib/prompts";

interface DurableObjectStub {
  fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}

interface DurableObjectNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): DurableObjectStub;
}

interface Env {
  IMAGE_TASKS: DurableObjectNamespace;
  TASKS_KV: MinimalKvNamespace;
  IMAGE_WORKER_TOKEN?: string;
  NEWCLI_API_KEY?: string;
  NEWCLI_BASE_URL?: string;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

function jsonError(status: number, message: string) {
  return json({ ok: false, error: message }, { status });
}

function authorize(request: Request, env: Env) {
  const token = env.IMAGE_WORKER_TOKEN?.trim();
  const auth = request.headers.get("Authorization")?.trim();
  return Boolean(token && auth === `Bearer ${token}`);
}

const TASK_REQUEST_KEY = "task-request";

export class ImageTasksDO extends DurableObject<Env> {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/status") {
      const taskId = url.searchParams.get("taskId")?.trim();
      if (!taskId) return jsonError(400, "缺少 taskId");

      const task = await readTask(this.env.TASKS_KV, taskId);
      if (!task) return jsonError(404, "任务不存在或已过期");

      return json({ ok: true, ...task });
    }

    if (request.method !== "POST" || url.pathname !== "/task") {
      return jsonError(404, "Not Found");
    }

    let body: DivineTaskRequest;
    try {
      body = (await request.json()) as DivineTaskRequest;
    } catch {
      return jsonError(400, "请求体不是合法 JSON");
    }

    const taskId = body.taskId?.trim();
    if (!taskId) return jsonError(400, "缺少 taskId");
    if (!isDivineType(body.type)) {
      return jsonError(400, "type 必须为 palm / face / mole 之一");
    }
    if (!body.imageDataUrl?.startsWith("data:image/")) {
      return jsonError(400, "缺少合法 imageDataUrl");
    }

    await this.env.TASKS_KV.put(taskRequestKey(taskId), JSON.stringify(body), {
      expirationTtl: 60 * 60,
    });
    await this.ctx.storage.put(TASK_REQUEST_KEY, taskId);
    await this.ctx.storage.setAlarm(Date.now() + 100);

    return json({ ok: true, taskId, status: "pending" }, { status: 202 });
  }

  async alarm() {
    const taskId = (await this.ctx.storage.get(TASK_REQUEST_KEY)) as
      | string
      | undefined;
    if (!taskId) return;

    const requestText = await this.env.TASKS_KV.get(taskRequestKey(taskId));
    const body = requestText
      ? (JSON.parse(requestText) as DivineTaskRequest)
      : undefined;
    if (!body?.taskId || !isDivineType(body.type)) return;

    const now = Date.now();
    const apiKey = this.env.NEWCLI_API_KEY?.trim();
    const baseUrl = this.env.NEWCLI_BASE_URL?.trim();

    if (!apiKey || !baseUrl) {
      await writeTask(this.env.TASKS_KV, body.taskId, {
        status: "failed",
        createdAt: now,
        updatedAt: Date.now(),
        error: "图片任务 Worker 缺少 NEWCLI_API_KEY / NEWCLI_BASE_URL 配置",
      });
      return;
    }

    await runDivineTask(this.env.TASKS_KV, {
      taskId: body.taskId,
      type: body.type,
      imageDataUrl: body.imageDataUrl,
      apiKey,
      baseUrl,
    });
    await this.env.TASKS_KV.delete?.(taskRequestKey(body.taskId));
    await this.ctx.storage.delete(TASK_REQUEST_KEY);
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx?: { waitUntil?: (promise: Promise<unknown>) => void },
  ) {
    if (!authorize(request, env)) {
      return jsonError(401, "Unauthorized");
    }

    const url = new URL(request.url);
    const taskId =
      request.method === "POST"
        ? ((await request.clone().json().catch(() => null)) as DivineTaskRequest | null)?.taskId
        : url.searchParams.get("taskId");

    if (!taskId?.trim()) {
      return jsonError(400, "缺少 taskId");
    }

    const id = env.IMAGE_TASKS.idFromName(taskId);
    const stub = env.IMAGE_TASKS.get(id);

    if (request.method === "POST" && url.pathname === "/task") {
      return stub.fetch("https://image-task-do/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: await request.text(),
      });
    }

    if (request.method === "GET" && url.pathname === "/status") {
      return stub.fetch(
        `https://image-task-do/status?taskId=${encodeURIComponent(taskId)}`,
      );
    }

    return jsonError(404, "Not Found");
  },
};

function taskRequestKey(taskId: string) {
  return `${divineTaskKey(taskId)}:request`;
}
