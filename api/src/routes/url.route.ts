import { Router } from "express";
import { urlController } from "../controller/url.controller";

const router = Router()

router.post('/url', (req, res) => urlController.create(req, res))

export default router;