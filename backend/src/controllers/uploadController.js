import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { created } from "../utils/apiResponse.js";

const MAX_DIMENSION = 1400;
const QUALITY_STEPS = [82, 76, 70, 64];
const TARGET_MAX_BYTES = 500 * 1024; // ~500KB target

async function optimizeUploadedImage(inputPath) {
  const parsed = path.parse(inputPath);
  const outputPath = path.join(parsed.dir, `${parsed.name}-opt.webp`);

  for (const quality of QUALITY_STEPS) {
    await sharp(inputPath)
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality, effort: 5 })
      .toFile(outputPath);

    const stat = await fs.stat(outputPath);
    if (stat.size <= TARGET_MAX_BYTES || quality === QUALITY_STEPS[QUALITY_STEPS.length - 1]) {
      break;
    }
  }

  if (outputPath !== inputPath) {
    await fs.unlink(inputPath).catch(() => {});
  }

  return outputPath;
}

export async function uploadImageController(req, res) {
  if (!req.file) {
    throw new Error("No file uploaded");
  }

  const optimizedPath = await optimizeUploadedImage(req.file.path);
  const relativePath = `/uploads/${path.basename(optimizedPath)}`;
  return created(res, { path: relativePath }, "Uploaded");
}
