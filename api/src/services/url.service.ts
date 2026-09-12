import { prisma } from "../lib/prisma";
import { setCacheRecord, getCacheRecord, deleteCacheRecord } from "../lib/redis";
import { generateShortCode } from "../utils/base62";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export interface UrlRecord {
  url: string;
  shortCode: string;
  createdAt: Date;
  expiresAt?: Date;
}
export class UrlService {
  // private urls = new Map<string, UrlRecord>();

  // Allow alphanumeric characters, hyphens, and underscores for readable aliases
  private isAliasValid = (alias: string) => /^[a-zA-Z0-9_-]+$/.test(alias);

  private static readonly RESERVED_WORDS = new Set([
    "api", "docs", "v1", "v2", "health", "metrics", "login", "logout",
    "signup", "register", "dashboard", "admin", "support", "about",
    "contact", "help", "error", "404", "500", "page", "setting",
    "settings", "profile", "user", "users", "account", "accounts",
    "subscription", "subscriptions", "billing", "payment", "payments",
    "transaction", "transactions", "order", "orders", "product",
    "products", "service", "services", "feature", "features", "pricing",
    "plans", "team", "teams", "member", "members", "role", "roles",
    "permission", "permissions",
  ]);

  async shortenUrl(url: string, customAlias?: string, expiresAt?: string | Date): Promise<UrlRecord> {
    let code: string;
    let expiryDate: Date | undefined;

    if (expiresAt) {
      expiryDate = new Date(expiresAt);

      if (isNaN(expiryDate.getTime())) {
        throw new ValidationError("Invalid expiration date format. Please provide a valid ISO timestamp.");
      }

      if (expiryDate.getTime() <= Date.now()) {
        throw new ValidationError("Expires at must be a future date and time.");
      }
    }

    if (customAlias) {
      if (!this.isAliasValid(customAlias)) {
        throw new ValidationError("Custom alias can only contain alphanumeric characters, hyphens (-), and underscores (_).");
      }

      if (customAlias.length < 3 || customAlias.length > 20) {
        throw new ValidationError("Custom alias must be between 3 and 20 characters long.");
      }

      if (UrlService.RESERVED_WORDS.has(customAlias.toLowerCase())) {
        throw new ValidationError(`The alias "${customAlias}" is a reserved word and cannot be used.`);
      }

      const existing = await prisma.url.findUnique({
        where: { shortCode: customAlias },
      });
      if (existing) {
        throw new ConflictError(`Custom alias "${customAlias}" already exists. Please choose a different one.`);
      }

      code = customAlias;
    } else {

      code = generateShortCode();
      while (await prisma.url.findUnique({
        where: { shortCode: code },
      })) {
        code = generateShortCode();
      }
    }

    const record = await prisma.url.create({
      data: {
        url,
        shortCode: code,
        expiresAt: expiryDate,
      },
    });

    await setCacheRecord(record.shortCode, {
      url: record.url,
      shortCode: record.shortCode,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt ?? undefined,
    });

    return {
      url: record.url,
      shortCode: record.shortCode,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt ?? undefined,

    };
  }

  async getOriginalUrl(shortCode: string): Promise<{ record: UrlRecord | null; isExpired: boolean }> {

    const cachedRecord = await getCacheRecord(shortCode);
    if (cachedRecord) {
      return { record: JSON.parse(cachedRecord), isExpired: false };
    }

    const record = await prisma.url.findUnique({
      where: { shortCode },
    });

    if (!record) {
      return { record: null, isExpired: false };
    }

    if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
      await prisma.url.delete({ where: { shortCode } });
      await deleteCacheRecord(shortCode);
      return { record: null, isExpired: true };
    }
    const urlRecord: UrlRecord = {
      url: record.url,
      shortCode: record.shortCode,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt ?? undefined,
    };

    await setCacheRecord(shortCode, urlRecord);

    return { record: urlRecord, isExpired: false };
  }

  async getAnalytics(shortCode: string) {
    let urlRecord: { url: string; shortCode: string } | null = null;
    const cachedRecord = await getCacheRecord(shortCode);
    if (cachedRecord) {
      urlRecord = JSON.parse(cachedRecord);
    } else {
      urlRecord = await prisma.url.findUnique({
        where: { shortCode },
        select: { url: true, shortCode: true },
      });
    }

    if (!urlRecord) {
      return null;
    }
    const [totalClicks, browserCounts, deviceCounts, refererCounts, recentClicks] = await Promise.all([
      prisma.clickEvent.count({ where: { shortCode } }),
      prisma.clickEvent.groupBy({
        by: ["browser"],
        where: { shortCode },
        _count: { browser: true },
      }),
      prisma.clickEvent.groupBy({
        by: ["device"],
        where: { shortCode },
        _count: { device: true },
      }),
      prisma.clickEvent.groupBy({
        by: ["referer"],
        where: { shortCode },
        _count: { referer: true },
      }),
      prisma.clickEvent.findMany({
        where: { shortCode },
        take: 10,
        orderBy: { clickedAt: "desc" },
        select: {
          clickedAt: true,
          browser: true,
          device: true,
          referer: true,
        },
      }),
    ]);

    return {
      shortCode,
      originalUrl: urlRecord.url,
      totalClicks,
      breakdown: {
        browser: browserCounts.map((row) => ({ name: row.browser || "Unknown", count: row._count.browser })),
        device: deviceCounts.map((row) => ({ name: row.device || "Unknown", count: row._count.device })),
        referer: refererCounts.map((row) => ({ name: row.referer || "Unknown", count: row._count.referer })),
        recentClicks: recentClicks.map((click) => ({
          timestamp: click.clickedAt,
          browser: click.browser || "Unknown",
          device: click.device || "Unknown",
          referer: click.referer || "Direct",
        })),
      },
    };
  }

}

export const urlService = new UrlService();