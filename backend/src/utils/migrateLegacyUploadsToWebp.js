import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getDb } from "../database/connection.js";

const LEGACY_EXT = new Set([".jpg", ".jpeg", ".png"]);
const MARKER_FILE = ".migrated-webp-v1";
const MAX_DIMENSION = 1600;

function isLegacyUploadPath(value) {
  if (typeof value !== "string") return false;
  if (!value.startsWith("/uploads/")) return false;
  const ext = path.extname(value).toLowerCase();
  return LEGACY_EXT.has(ext);
}

function toWebpUploadPath(value) {
  if (!isLegacyUploadPath(value)) return value;
  return value.replace(/\.(jpe?g|png)$/i, ".webp");
}

async function ensureWebpFile(root, oldRelPath) {
  const oldName = oldRelPath.replace(/^\/uploads\//i, "");
  const oldAbs = path.join(root, oldName);
  const webpRel = toWebpUploadPath(oldRelPath);
  const webpName = webpRel.replace(/^\/uploads\//i, "");
  const webpAbs = path.join(root, webpName);

  try {
    await fs.access(webpAbs);
    return { created: false, oldAbs, webpAbs };
  } catch {
    // continue and create
  }

  await sharp(oldAbs)
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: 80, effort: 5 })
    .toFile(webpAbs);

  return { created: true, oldAbs, webpAbs };
}

function replaceGalleryPaths(jsonText) {
  let changed = false;
  let parsed;
  try {
    parsed = JSON.parse(jsonText || "[]");
  } catch {
    return { changed: false, value: jsonText || "[]" };
  }
  if (!Array.isArray(parsed)) return { changed: false, value: jsonText || "[]" };

  const mapped = parsed.map((item) => {
    const next = toWebpUploadPath(String(item || ""));
    if (next !== item) changed = true;
    return next;
  });

  return {
    changed,
    value: JSON.stringify(mapped)
  };
}

export async function migrateLegacyUploadsToWebp({ uploadsPath }) {
  const root = path.resolve(process.cwd(), uploadsPath || "./uploads");
  await fs.mkdir(root, { recursive: true });

  const markerPath = path.join(root, MARKER_FILE);
  // Run as incremental migration on every boot:
  // if new legacy jpg/png paths appear later (restores/imports), we still convert them to webp.

  const db = await getDb();
  const categories = await db.all("SELECT id, image_path FROM categories");
  const sliders = await db.all("SELECT id, image_path FROM slider_images");
  const products = await db.all("SELECT id, image_path, gallery_paths FROM products");

  let filesCreated = 0;
  let categoriesUpdated = 0;
  let slidersUpdated = 0;
  let productsUpdated = 0;
  let galleriesUpdated = 0;

  await db.exec("BEGIN");
  try {
    for (const row of categories) {
      if (!isLegacyUploadPath(row.image_path)) continue;
      const nextPath = toWebpUploadPath(row.image_path);
      const { created } = await ensureWebpFile(root, row.image_path);
      if (created) filesCreated += 1;
      await db.run("UPDATE categories SET image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [nextPath, row.id]);
      categoriesUpdated += 1;
    }

    for (const row of sliders) {
      if (!isLegacyUploadPath(row.image_path)) continue;
      const nextPath = toWebpUploadPath(row.image_path);
      const { created } = await ensureWebpFile(root, row.image_path);
      if (created) filesCreated += 1;
      await db.run("UPDATE slider_images SET image_path = ? WHERE id = ?", [nextPath, row.id]);
      slidersUpdated += 1;
    }

    for (const row of products) {
      let shouldUpdate = false;
      let nextImagePath = row.image_path;
      let nextGallery = row.gallery_paths || "[]";

      if (isLegacyUploadPath(row.image_path)) {
        nextImagePath = toWebpUploadPath(row.image_path);
        const { created } = await ensureWebpFile(root, row.image_path);
        if (created) filesCreated += 1;
        shouldUpdate = true;
      }

      const galleryResult = replaceGalleryPaths(row.gallery_paths);
      if (galleryResult.changed) {
        nextGallery = galleryResult.value;
        shouldUpdate = true;
      }

      if (galleryResult.changed) {
        let arr = [];
        try {
          arr = JSON.parse(row.gallery_paths || "[]");
        } catch {
          arr = [];
        }
        for (const item of arr) {
          if (!isLegacyUploadPath(String(item || ""))) continue;
          const { created } = await ensureWebpFile(root, String(item));
          if (created) filesCreated += 1;
        }
        galleriesUpdated += 1;
      }

      if (shouldUpdate) {
        await db.run(
          "UPDATE products SET image_path = ?, gallery_paths = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [nextImagePath, nextGallery, row.id]
        );
        productsUpdated += 1;
      }
    }

    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }

  const markerBody = JSON.stringify(
    {
      version: 1,
      migrated_at: new Date().toISOString(),
      mode: "incremental",
      files_created: filesCreated,
      categories_updated: categoriesUpdated,
      sliders_updated: slidersUpdated,
      products_updated: productsUpdated,
      galleries_updated: galleriesUpdated
    },
    null,
    2
  );
  await fs.writeFile(markerPath, markerBody, "utf8");

  return {
    skipped: false,
    root,
    filesCreated,
    categoriesUpdated,
    slidersUpdated,
    productsUpdated,
    galleriesUpdated
  };
}
