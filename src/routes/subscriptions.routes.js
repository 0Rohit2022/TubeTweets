import {Router} from "express";
const router = Router();
import { verfifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription } from "../controllers/subscriptions.controller.js";

router.use(verfifyJWT);

router.route("/c/:channelId").post(toggleSubscription);

export default router;