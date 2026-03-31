import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { uploadImageController } from "../controllers/uploadController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { env } from "../config/env.js";

const uploadsRoot = path.resolve(process.cwd(), env.uploadsPath);
fs.mkdirSync(uploadsRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

const router = Router();
router.post("/image", requireAdminAuth, upload.single("image"), asyncHandler(uploadImageController));

export default router;
