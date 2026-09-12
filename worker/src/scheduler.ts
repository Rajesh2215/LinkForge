import { cleanUpQueue } from "./queues/cleanup.queue";

async function startScheduler() {
  await cleanUpQueue.upsertJobScheduler(
    "expired-url-cleanup",
    {
      pattern: "*/5 * * * *",
    },
    {
      name: "cleanup-expired-urls",
    }
  );

  console.log("Cleanup scheduler started");
}

startScheduler();