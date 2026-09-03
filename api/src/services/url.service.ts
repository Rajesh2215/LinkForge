import { Request, Response } from "express"
import { generateShortCode } from "../utils/base62";

export class UrlService {

  async create(req: Request, res: Response) {

    let code = generateShortCode()

    return res.status(200).json({
      success: true,
      message: 'URL created successfully',
      data: {
        ...req.body,
        code
      }
    })
  }
}

export const urlService = new UrlService();