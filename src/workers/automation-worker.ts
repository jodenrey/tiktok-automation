// Long-running BullMQ worker that picks up scheduled automation jobs.
// Run with: npm run worker

import "dotenv/config";
import { createAutomationWorker } from "@/lib/queue";

async function main() {
  console.log("[worker] starting…");
  const worker = await createAutomationWorker();
  if (!worker) {
    console.log(
      "[worker] no REDIS_URL — exiting. Set REDIS_URL in .env to enable scheduled jobs.",
    );
    process.exit(0);
  }

  const shutdown = async (signal: string) => {
    console.log(`[worker] received ${signal}, shutting down…`);
    await worker.close();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  console.log("[worker] ready, waiting for jobs.");
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
