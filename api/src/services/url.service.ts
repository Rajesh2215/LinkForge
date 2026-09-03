import { generateShortCode } from "../utils/base62";

export interface UrlRecord {
  url: string;
  shortCode: string;
  createdAt: Date;
}

export class UrlService {
  private urls = new Map<string, UrlRecord>();

  async shortenUrl(url: string): Promise<UrlRecord> {
    let code = generateShortCode();

    while (this.urls.has(code)) {
      code = generateShortCode();
    }

    const record: UrlRecord = {
      url,
      shortCode: code,
      createdAt: new Date(),
    };

    this.urls.set(code, record);
    return record;
  }

  async getOriginalUrl(shortCode: string): Promise<UrlRecord | null> {
    return this.urls.get(shortCode) || null;
  }
}

export const urlService = new UrlService();