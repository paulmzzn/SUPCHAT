import express from "express";
import { getFileFromS3 } from "../controllers/fileController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route pour récupérer un fichier depuis S3
router.get("/:fileKey(*)", verifyToken, getFileFromS3);

export default router;
