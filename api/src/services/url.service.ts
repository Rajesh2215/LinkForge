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
  private urls = new Map<string, UrlRecord>();

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

      if (this.urls.has(customAlias)) {
        throw new ConflictError(`Custom alias "${customAlias}" already exists. Please choose a different one.`);
      }

      code = customAlias;
    } else {

      code = generateShortCode();
      while (this.urls.has(code)) {
        code = generateShortCode();
      }
    }

    const record: UrlRecord = {
      url,
      shortCode: code,
      createdAt: new Date(),
      expiresAt: expiryDate,
    };

    this.urls.set(code, record);
    return record;
  }

  async getOriginalUrl(shortCode: string): Promise<{ record: UrlRecord | null; isExpired: boolean }> {
    const record = this.urls.get(shortCode);

    if (!record) {
      return { record: null, isExpired: false };
    }

    if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
      this.urls.delete(shortCode);
      return { record: null, isExpired: true };
    }

    return { record, isExpired: false };
  }
}

export const urlService = new UrlService();