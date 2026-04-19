import fs from "node:fs";
import path from "node:path";
import { getDb } from "../database/connection.js";
import { getResolvedUploadsPath } from "../storage/uploadsPath.js";

const KNOWN_EXTS = [".webp", ".jpeg", ".jpg", ".png"];

function toUploadsWebPath(fileName) {
  return `/uploads/${fileName}`;
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

function resolveUploadPath(rawPath, availableFiles) {
  const input = String(rawPath || "").trim();
  if (!input.startsWith("/uploads/")) return "";
  const fileName = input.split("/").pop() || "";
  if (!fileName) return "";
  if (availableFiles.has(fileName)) return toUploadsWebPath(fileName);

  const ext = path.extname(fileName).toLowerCase();
  const base = ext ? fileName.slice(0, -ext.length) : fileName;
  for (const candidateExt of KNOWN_EXTS) {
    const candidate = `${base}${candidateExt}`;
    if (availableFiles.has(candidate)) return toUploadsWebPath(candidate);
  }
  return "";
}

function firstValidPath(paths, availableFiles) {
  for (const p of paths) {
    const resolved = resolveUploadPath(p, availableFiles);
    if (resolved) return resolved;
  }
  return "";
}

export async function repairMissingImagePaths() {
  const uploadsRoot = getResolvedUploadsPath();
  let entries = [];
  try {
    entries = fs.readdirSync(uploadsRoot, { withFileTypes: true });
  } catch {
    return { skipped: true, reason: "uploads_unavailable" };
  }

  const availableFiles = new Set(
    entries.filter((e) => e.isFile()).map((e) => e.name)
  );

  const db = await getDb();

  const categories = await db.all("SELECT id, image_path FROM categories");
  const products = await db.all("SELECT id, category_id, image_path, gallery_paths FROM products");
  const sliders = await db.all("SELECT id, image_path FROM slider_images");

  const productByCategory = new Map();
  for (const p of products) {
    const list = productByCategory.get(Number(p.category_id)) || [];
    list.push(p);
    productByCategory.set(Number(p.category_id), list);
  }

  let categoriesUpdated = 0;
  let productsUpdated = 0;
  let galleriesUpdated = 0;
  let slidersUpdated = 0;

  await db.exec("BEGIN");
  try {
    for (const c of categories) {
      const direct = resolveUploadPath(c.image_path, availableFiles);
      if (direct) {
        if (direct !== String(c.image_path || "").trim()) {
          await db.run("UPDATE categories SET image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [direct, c.id]);
          categoriesUpdated += 1;
        }
        continue;
      }

      const categoryProducts = productByCategory.get(Number(c.id)) || [];
      const fallbackFromProducts = firstValidPath(
        categoryProducts.flatMap((p) => [p.image_path, ...parseGalleryPaths(p.gallery_paths)]),
        availableFiles
      );
      if (fallbackFromProducts) {
        await db.run("UPDATE categories SET image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [fallbackFromProducts, c.id]);
        categoriesUpdated += 1;
      }
    }

    for (const p of products) {
      const resolvedImage = resolveUploadPath(p.image_path, availableFiles);
      const currentGallery = parseGalleryPaths(p.gallery_paths);
      const nextGallery = currentGallery.map((g) => resolveUploadPath(g, availableFiles) || g);
      const galleryChanged = JSON.stringify(nextGallery) !== JSON.stringify(currentGallery);

      let nextImage = resolvedImage;
      if (!nextImage) {
        nextImage = firstValidPath(nextGallery, availableFiles);
      }

      const shouldUpdateImage = nextImage && nextImage !== String(p.image_path || "").trim();
      if (shouldUpdateImage || galleryChanged) {
        await db.run(
          `UPDATE products
           SET image_path = ?, gallery_paths = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [nextImage || String(p.image_path || ""), JSON.stringify(nextGallery), p.id]
        );
        productsUpdated += shouldUpdateImage ? 1 : 0;
        galleriesUpdated += galleryChanged ? 1 : 0;
      }
    }

    for (const s of sliders) {
      const next = resolveUploadPath(s.image_path, availableFiles);
      if (next && next !== String(s.image_path || "").trim()) {
        await db.run("UPDATE slider_images SET image_path = ? WHERE id = ?", [next, s.id]);
        slidersUpdated += 1;
      }
    }

    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }

  return {
    skipped: false,
    categoriesUpdated,
    productsUpdated,
    galleriesUpdated,
    slidersUpdated
  };
}

