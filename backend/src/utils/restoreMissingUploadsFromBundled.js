import fs from "node:fs";
import path from "node:path";
import { getDb } from "../database/connection.js";
import { getResolvedUploadsPath } from "../storage/uploadsPath.js";

function extractUploadFileName(rawPath) {
  const input = String(rawPath || "").trim();
  if (!input) return "";
  let candidate = input;
  if (/^https?:\/\//i.test(candidate)) {
    try {
      candidate = new URL(candidate).pathname || "";
    } catch {
      // keep original
    }
  }
  const idx = candidate.toLowerCase().indexOf("/uploads/");
  if (idx >= 0) {
    candidate = candidate.slice(idx + "/uploads/".length);
  } else {
    candidate = candidate.replace(/^\.?\//, "");
  }
  const fileName = path.basename(candidate);
  return fileName && fileName !== "." ? fileName : "";
}

function parseGalleryPaths(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function restoreMissingUploadsFromBundled() {
  const persistentRoot = getResolvedUploadsPath();
  const bundledRoot = path.resolve(process.cwd(), "./uploads");

  if (path.resolve(persistentRoot) === path.resolve(bundledRoot)) {
    return { skipped: true, reason: "same_root" };
  }
  if (!fs.existsSync(bundledRoot)) {
    return { skipped: true, reason: "bundled_uploads_missing" };
  }

  const db = await getDb();
  const categories = await db.all("SELECT image_path FROM categories");
  const products = await db.all("SELECT image_path, gallery_paths FROM products");
  const sliders = await db.all("SELECT image_path FROM slider_images");

  const requiredFiles = new Set();
  for (const row of categories) {
    const name = extractUploadFileName(row?.image_path);
    if (name) requiredFiles.add(name);
  }
  for (const row of sliders) {
    const name = extractUploadFileName(row?.image_path);
    if (name) requiredFiles.add(name);
  }
  for (const row of products) {
    const main = extractUploadFileName(row?.image_path);
    if (main) requiredFiles.add(main);
    for (const g of parseGalleryPaths(row?.gallery_paths)) {
      const gName = extractUploadFileName(g);
      if (gName) requiredFiles.add(gName);
    }
  }

  let restored = 0;
  for (const fileName of requiredFiles) {
    const target = path.join(persistentRoot, fileName);
    if (fs.existsSync(target)) continue;
    const source = path.join(bundledRoot, fileName);
    if (!fs.existsSync(source)) continue;
    fs.copyFileSync(source, target);
    restored += 1;
  }

  return {
    skipped: false,
    checked: requiredFiles.size,
    restored
  };
}

