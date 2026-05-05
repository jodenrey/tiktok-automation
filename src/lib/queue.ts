// BullMQ + Redis with graceful fallback.
//
// In development without Redis, every "queue" call short-circuits and runs
// inline. That keeps the dev experience smooth. In production, set REDIS_URL
// and the worker (npm run worker) will pick up scheduled automation jobs.

import type { Queue, Worker } from "bullmq";

const REDIS_URL = process.env.REDIS_URL;

interface AutomationJobData {
  automationId: string;
}

let _automationsQueue: Queue<AutomationJobData> | null = null;

export async function getAutomationsQueue() {
  if (!REDIS_URL) return null;
  if (_automationsQueue) return _automationsQueue;

  const { Queue } = await import("bullmq");
  const IORedis = (await import("ioredis")).default;
  const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

  _automationsQueue = new Queue<AutomationJobData>("automations", { connection });
  return _automationsQueue;
}

export async function scheduleAutomation(
  automationId: string,
  cron: string,
): Promise<{ jobId: string | null; mode: "redis" | "inline" }> {
  const queue = await getAutomationsQueue();
  if (!queue) {
    console.log(
      `[queue:inline] no REDIS_URL — skipping cron registration for ${automationId} (${cron})`,
    );
    return { jobId: null, mode: "inline" };
  }

  // Use a stable job id so re-creating doesn't double-schedule.
  const jobId = `automation:${automationId}:${hashCron(cron)}`;
  await queue.upsertJobScheduler(
    jobId,
    { pattern: cron, tz: "America/Los_Angeles" },
    {
      name: "run-automation",
      data: { automationId },
      opts: { attempts: 3, backoff: { type: "exponential", delay: 5_000 } },
    },
  );

  return { jobId, mode: "redis" };
}

export async function unscheduleAutomation(
  automationId: string,
  cron: string,
) {
  const queue = await getAutomationsQueue();
  if (!queue) return;
  const jobId = `automation:${automationId}:${hashCron(cron)}`;
  await queue.removeJobScheduler(jobId);
}

export async function triggerAutomationNow(automationId: string) {
  const queue = await getAutomationsQueue();
  if (queue) {
    await queue.add("run-automation", { automationId });
    return { mode: "redis" as const };
  }
  // Inline fallback — run the automation in-process.
  const { runAutomation } = await import("@/lib/run-automation");
  await runAutomation(automationId);
  return { mode: "inline" as const };
}

function hashCron(cron: string): string {
  return [...cron].reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
    .toString(36)
    .replace("-", "n");
}

// Worker entry — only used by the long-running worker process.
export async function createAutomationWorker(): Promise<Worker | null> {
  if (!REDIS_URL) {
    console.log("[worker] REDIS_URL not set — worker disabled.");
    return null;
  }

  const { Worker } = await import("bullmq");
  const IORedis = (await import("ioredis")).default;
  const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

  const { runAutomation } = await import("@/lib/run-automation");

  const worker = new Worker<AutomationJobData>(
    "automations",
    async (job) => {
      console.log(`[worker] running automation ${job.data.automationId}`);
      await runAutomation(job.data.automationId);
    },
    { connection, concurrency: 2 },
  );

  worker.on("completed", (job) =>
    console.log(`[worker] completed ${job.id} (automation ${job.data.automationId})`),
  );
  worker.on("failed", (job, err) =>
    console.error(`[worker] failed ${job?.id} ${err?.message}`),
  );
  return worker;
}
