import { Router } from "express";
import { urlController } from "../controller/url.controller";
import { rateLimiter } from "../lib/rateLimiter";

const getUrlLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  keyPrefix: "get-url",
  standardHeaders: true,
  legacyHeaders: false,
});

const createUrlLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  keyPrefix: "create-url",
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post("/", createUrlLimiter, getUrlLimiter, (req, res) => urlController.create(req, res));

router.get("/:shortCode", getUrlLimiter, (req, res) => urlController.getOriginal(req, res));

export default router;