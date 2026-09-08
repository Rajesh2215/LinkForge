import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { redis } from "./redis";
import { RedisStore, RedisReply } from "rate-limit-redis";

interface RateLimitOptions {
  windowMs: number;
  limit: number;
  keyPrefix: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

export const rateLimiter = (options: RateLimitOptions) => {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,

    standardHeaders: options.standardHeaders ?? true,
    legacyHeaders: options.legacyHeaders ?? false,

    store: new RedisStore({
      sendCommand: (...args: string[]) =>
        redis.call(...(args as [string, ...string[]])) as Promise<RedisReply>,
    }),

    keyGenerator: (req) => {
      const ip = ipKeyGenerator(req.ip ?? "");

      return `${options.keyPrefix}:${ip}`;
    },

    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
  });
};