import { Router } from "express";
import { urlController } from "../controller/url.controller";

const router = Router();

router.post("/", (req, res) => urlController.create(req, res));

router.get("/:shortCode", (req, res) => urlController.getOriginal(req, res));

export default router;