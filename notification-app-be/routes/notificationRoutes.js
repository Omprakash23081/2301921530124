import express from "express";
import { getNotifications } from "../services/notificationService.js";
import { verifyJwt } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyJwt, getNotifications);

export default router;
