import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  createWorkspace,
  getWorkspaceById,
  getAllWorkspaces,
  updateWorkspace,
  deleteWorkspace,
  sendWorkspaceInvitation,
  checkWorkspaceMember,
  getWorkspaceMembers,
  joinWorkspace,
  removeMember,
  uploadWorkspaceImages
} from '../controllers/workspaceController.js';

const router = express.Router();

// Configure multer for memory storage (for S3 upload)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Existing routes
router.post('/', createWorkspace);
router.get('/:id', getWorkspaceById);
router.get('/', getAllWorkspaces);
router.put('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);
router.post('/:workspaceId/invite', sendWorkspaceInvitation);
router.get('/:workspaceId/members/:userId', checkWorkspaceMember);
router.get('/:workspaceId/members', getWorkspaceMembers);
router.post('/:workspaceId/join', joinWorkspace);
router.delete('/:workspaceId/members/:userId', removeMember);

// Route for image uploads, now using S3
router.post('/:workspaceId/images', upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'icon', maxCount: 1 }
]), uploadWorkspaceImages);

export default router;