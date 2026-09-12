import "dotenv/config";
import Redis from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, // required by BullMQ
});

redis.on("connect", () => console.log("✅ Worker connected to Redis"));
redis.on("error", (err) => console.error("❌ Worker Redis error:", err));
