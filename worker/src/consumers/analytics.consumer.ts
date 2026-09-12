import { Kafka } from "kafkajs";
import { UAParser } from "ua-parser-js";
import { prisma } from "../lib/prisma";

const kafka = new Kafka({
  clientId: "linkforge-worker",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

export const consumer = kafka.consumer({
  groupId: "linkforge-analytics-group",
});

export const startAnalyticsConsumer = async (): Promise<void> => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'url-clicks', fromBeginning: false })
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;

        const event = JSON.parse(message.value.toString());

        // 1. Enrich User-Agent
        const parser = new UAParser(event.userAgent);
        const uaResult = parser.getResult();

        const browser = uaResult.browser.name || "Unknown";
        const device = uaResult.device.type || "Desktop";

        // 2. Persist to PostgreSQL (Idempotent!)
        try {
          await prisma.clickEvent.create({
            data: {
              eventId: event.eventId,
              shortCode: event.shortCode,
              clickedAt: new Date(event.clickedAt),
              ipAddress: event.ipAddress,
              userAgent: event.userAgent,
              browser,
              device,
              referer: event.referer || "Direct",
              country: "Unknown", // Can add GeoIP lookup later
            },
          });

          console.log(`📊 Analytics recorded for /${event.shortCode} [${browser} on ${device}]`);
        } catch (err: any) {
          // If duplicate eventId, PostgreSQL unique constraint catches it safely
          if (err.code === "P2002") {
            console.warn(`Duplicate event ${event.eventId} skipped.`);
          } else {
            console.error("Failed to insert click event:", err);
          }
        }
      },
    });

    console.log("✅ Kafka Consumer connected to broker");
  } catch (error) {
    console.error("❌ Failed to connect Kafka Consumer:", error);
  }
}