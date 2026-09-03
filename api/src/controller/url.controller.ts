import { Request, Response } from "express";
import { urlService } from "../services/url.service";

export class UrlController {
  async create(req: Request, res: Response) {
    return urlService.create(req, res)
  }
}

export const urlController = new UrlController();