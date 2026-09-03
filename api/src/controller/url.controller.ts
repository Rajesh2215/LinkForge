import { Request, Response } from "express";
import { urlService } from "../services/url.service";

export class UrlController {
  async create(req: Request, res: Response) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: "URL is required",
        });
      }

      try {
        new URL(url);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid URL format. Must include protocol (e.g. https://)",
        });
      }

      const record = await urlService.shortenUrl(url);
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

      return res.status(201).json({
        success: true,
        message: "URL shortened successfully",
        data: {
          ...record,
          shortUrl: `${baseUrl}/${record.shortCode}`,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  }

  async getOriginal(req: Request, res: Response) {
    try {
      const record = await urlService.getOriginalUrl(req.params.shortCode);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: "URL not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "URL fetched successfully",
        data: record,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  }

  async redirect(req: Request, res: Response) {
    try {
      const record = await urlService.getOriginalUrl(req.params.shortCode);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: "Short URL not found",
        });
      }

      // 302 Found: Temporary Redirect
      return res.redirect(302, record.url);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  }
}

export const urlController = new UrlController();