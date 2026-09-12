import { Worker } from "bullmq";
import { cleanupExpiredUrls } from "../jobs/cleanupExpiredUrls";
import { redis } from "../lib/redis";
import { CLEANUP_QUEUE_NAME } from "../queues/cleanup.queue";

const worker = new Worker(
  CLEANUP_QUEUE_NAME,           // ← shared constant, no typo risk
  async (job) => {
    console.log(`Processing job: ${job.name}`);
    await cleanupExpiredUrls();
  },
  {
    connection: redis,
    concurrency: 1,             // cleanup is a singleton task — 1 at a time
  }
);

worker.on("completed", (job) => console.log(`✅ Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`❌ Job ${job?.id} failed:`, err));