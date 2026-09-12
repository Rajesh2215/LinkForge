import { Request, Response } from "express";
import validator from "validator";
import { urlService, ValidationError, ConflictError } from "../services/url.service";
import { emitClickEvent } from "../lib/kafka";
import { randomUUID } from "node:crypto";

export class UrlController {
  async create(req: Request, res: Response) {
    try {
      const { url, customAlias, expiresAt } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: "URL is required",
        });
      }

      const isValid = validator.isURL(url, {
        protocols: ["http", "https"],
        require_protocol: true,
        require_tld: true,
      });

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid URL. Must be a valid HTTP or HTTPS address with a domain (e.g. https://example.com)",
        });
      }

      const record = await urlService.shortenUrl(url, customAlias, expiresAt);
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

      return res.status(201).json({
        success: true,
        message: "URL shortened successfully",
        data: {
          url: record.url,
          shortCode: record.shortCode,
          shortUrl: `${baseUrl}/${record.shortCode}`,
          createdAt: record.createdAt,
          expiresAt: record.expiresAt ? record.expiresAt : undefined,
        },
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error instanceof ConflictError) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Unhandled error in create:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getOriginal(req: Request, res: Response) {
    try {
      const { record, isExpired } = await urlService.getOriginalUrl(req.params.shortCode);

      if (isExpired) {
        return res.status(410).json({
          success: false,
          message: "This short URL has expired",
        });
      }

      if (!record) {
        return res.status(404).json({
          success: false,
          message: "URL not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "URL fetched successfully",
        data: {
          url: record.url,
          shortCode: record.shortCode,
          createdAt: record.createdAt,
          expiresAt: record.expiresAt ? record.expiresAt : undefined,
        },
      });
    } catch (error: any) {
      console.error("Unhandled error in getOriginal:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async redirect(req: Request, res: Response) {
    try {
      const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";
      const referer = (req.headers["referer"] || req.headers["referrer"] || "direct") as string;

      const { record, isExpired } = await urlService.getOriginalUrl(req.params.shortCode);

      if (isExpired) {
        return res.status(410).json({
          success: false,
          message: "This short URL has expired",
        });
      }

      if (!record) {
        return res.status(404).json({
          success: false,
          message: "Short URL not found",
        });
      }

      // 🚀 Fire-and-forget: emit event in background (DO NOT await before redirecting!)
      emitClickEvent({
        eventId: randomUUID(),
        shortCode: req.params.shortCode,
        clickedAt: new Date().toISOString(),
        ipAddress,
        userAgent,
        referer,
      });

      // 302 Found: Temporary Redirect
      return res.redirect(302, record.url);
    } catch (error: any) {
      console.error("Unhandled error in redirect:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {

      const shortCode = req.params.shortCode
      const analytics = await urlService.getAnalytics(shortCode)

      if (!analytics) {
        return res.status(404).json({
          success: false,
          message: "URL not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Analytics fetched successfully",
        data: analytics,
      });
    } catch (error: any) {
      console.error("Unhandled error in getAnalytics:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

export const urlController = new UrlController();