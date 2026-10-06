import { Kafka } from "kafkajs";
import { UAParser } from "ua-parser-js";
import { prisma } from "../lib/prisma";
import geoip from 'geoip-lite'

const kafka = new Kafka({
  clientId: "linkforge-worker",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

export const consumer = kafka.consumer({
  groupId: "linkforge-analytics-group",
  maxWaitTimeInMs: 5000,    // will trigger eachbatch after 5 seconds if there are no messages
  maxBytes: 1024 * 512,     // will trigger eachbatch after 512 bytes of messages
  minBytes: 1024 * 16,
});

let totalBatchesProcessed = 0;
let totalClicksProcessed = 0;

export const startAnalyticsConsumer = async (): Promise<void> => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'url-clicks', fromBeginning: false })
    await consumer.run({
      eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
        totalBatchesProcessed++;
        const batchStartTime = Date.now();
        const recordsToInsert = [];

        // 1. Loop through batch ONLY to parse and enrich
        for (const message of batch.messages) {
          if (!isRunning() || isStale()) {
            break;
          }
          if (!message.value) continue;

          try {
            const event = JSON.parse(message.value.toString());

            const parser = new UAParser(event.userAgent);
            const uaResult = parser.getResult();
            const browser = uaResult.browser.name || "Unknown";
            const device = uaResult.device.type || "Desktop";
            const geo = geoip.lookup(event.ipAddress);
            recordsToInsert.push({
              eventId: event.eventId,
              shortCode: event.shortCode,
              clickedAt: new Date(event.clickedAt),
              ipAddress: event.ipAddress,
              userAgent: event.userAgent,
              browser,
              device,
              referer: event.referer || "Direct",
              country: geo?.country || "Unknown",
            });

            // Mark this message offset as resolved in memory
            resolveOffset(message.offset);
          } catch (error) {
            console.error("Failed to parse click event in batch:", error);
          }
        }

        // 2. Insert ALL records in ONE single database query (OUTSIDE the loop!)
        if (recordsToInsert.length > 0) {
          try {
            const result = await prisma.clickEvent.createMany({
              data: recordsToInsert,
              skipDuplicates: true, // Idempotent
            });

            totalClicksProcessed += result.count;
            const durationMs = Date.now() - batchStartTime;

            console.log(
              `⚡ [Batch #${totalBatchesProcessed}] Inserted ${result.count} clicks in ${durationMs}ms ` +
              `| Batch Msg Count: ${batch.messages.length} | Cumulative Clicks: ${totalClicksProcessed}`
            );
          } catch (error) {
            console.error("Failed to bulk insert click events:", error);
          }
        }

        // 3. Send heartbeat to Kafka broker
        await heartbeat();
      },
    });

    console.log("✅ Kafka Consumer connected to broker");
  } catch (error) {
    console.error("❌ Failed to connect Kafka Consumer:", error);
  }
}