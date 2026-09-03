import { Router } from "express";
import urlRoutes from "./url.route";

const apiRouter = Router();

apiRouter.use("/urls", urlRoutes);

export default apiRouter;
