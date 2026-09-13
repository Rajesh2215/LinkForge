import { Router } from "express";
import { urlController } from "../controller/url.controller";
import { rateLimiter } from "../lib/rateLimiter";

const createUrlLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 20,
  keyPrefix: "create-url",
  standardHeaders: true,
  legacyHeaders: false,
});

const getUrlLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 60,
  keyPrefix: "get-url",
  standardHeaders: true,
  legacyHeaders: false,
});

const analyticsLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 30,
  keyPrefix: "analytics-url",
  standardHeaders: true,
  legacyHeaders: false,
});

const qrLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 30,
  keyPrefix: "qr-url",
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post("/", createUrlLimiter, (req, res) => urlController.create(req, res));

router.get("/:shortCode", getUrlLimiter, (req, res) => urlController.getOriginal(req, res));

router.get("/:shortCode/analytics", analyticsLimiter, (req, res) => urlController.getAnalytics(req, res));

router.get("/:shortCode/qr", qrLimiter, (req, res) => urlController.getQrCode(req, res));

export default router;