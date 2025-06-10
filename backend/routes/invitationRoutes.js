import express from "express";
import { checkPendingInvitation } from "../controllers/userController.js";

const router = express.Router();

// GET /api/invitations/pending?email=xxx
router.get("/pending", checkPendingInvitation);

export default router;
