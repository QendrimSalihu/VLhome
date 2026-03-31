import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { uploadImageController } from "../controllers/uploadController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { env } from "../config/env.js";
import { badRequest } from "../utils/httpError.js";

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

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    const ext = String(path.extname(file.originalname || "")).toLowerCase();
    const mime = String(file.mimetype || "").toLowerCase();
    if (!ALLOWED_MIME.has(mime) || !ALLOWED_EXT.has(ext)) {
      return cb(badRequest("Lejohen vetem foto JPG, JPEG, PNG ose WEBP."));
    }
    return cb(null, true);
  }
});

const router = Router();
router.post("/image", requireAdminAuth, (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(badRequest("Foto eshte shume e madhe. Maksimumi i lejuar eshte 8MB."));
      }
      return next(badRequest("Ngarkimi i fotos deshtoi. Kontrollo formatin dhe madhesine."));
    }
    return next(error);
  });
}, asyncHandler(uploadImageController));

export default router;
