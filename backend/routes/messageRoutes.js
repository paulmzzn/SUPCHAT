import express from "express";
import multer from "multer";
import { uploadMessageFile } from "../controllers/messageController.js";

import {
  createMessage,
  getMessagesByChannel,
  deleteMessage,
  updateMessage,
} from "../controllers/messageController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Toutes les routes sont protégées par l'authentification
router.post("/", verifyToken, createMessage);
router.get("/canal/:channelId", verifyToken, getMessagesByChannel);
router.put("/:messageId", verifyToken, updateMessage);
router.delete("/:messageId", verifyToken, deleteMessage);
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 Mo max
  fileFilter: (req, file, cb) => {
    // Accepte PDF, MP4, images, etc.
    const allowed = [
      "application/pdf",
      "video/mp4",
      "image/png",
      "image/jpeg",
      "image/gif",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Type de fichier non supporté"));
  },
});

router.post(
  "/:canalId/upload",
  verifyToken,
  upload.single("file"),
  uploadMessageFile
);

export default router;
