import express from "express";
import {
  createMessage,
  getMessagesByChannel,
  getMessageById,
  deleteMessage,
  updateMessage,
  uploadFile,
} from "../controllers/messageController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import multer from "multer";

// Configuration améliorée pour multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // Accepter tous les types de fichiers
    cb(null, true);
  },
});

const router = express.Router();

// Routes existantes
router.post("/", verifyToken, createMessage);
router.get("/canal/:channelId", verifyToken, getMessagesByChannel);
router.get("/:id", verifyToken, getMessageById);
router.put("/:id", verifyToken, updateMessage);
router.delete("/:id", verifyToken, deleteMessage);

// Route pour l'upload de fichiers
router.post("/upload", verifyToken, upload.single("file"), uploadFile);

export default router;
