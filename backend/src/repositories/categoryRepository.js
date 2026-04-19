import { getDb } from "../database/connection.js";
import { badRequest, HttpError } from "../utils/httpError.js";
import fs from "node:fs";
import path from "node:path";
import { getResolvedUploadsPath } from "../storage/uploadsPath.js";

const ARCHIVE_CATEGORY_NAME = "Arkive (Auto)";

function isNonEmpty(value) {
  return String(value || "").trim().length > 0;
}

function categoryImageExists(imagePath) {
  const rel = String(imagePath || "").trim();
  if (!rel.startsWith("/uploads/")) return false;
  const fileName = rel.split("/").pop();
  if (!fileName) return false;
  const full = path.join(getResolvedUploadsPath(), fileName);
  return fs.existsSync(full);
}

async function pickLatestProductImage(db, categoryId) {
  const row = await db.get(
    `SELECT image_path
     FROM products
     WHERE category_id = ?
       AND TRIM(COALESCE(image_path, '')) <> ''
     ORDER BY id DESC
     LIMIT 1`,
    [categoryId]
  );
  return String(row?.image_path || "").trim();
}

async function resolveCategoryImagePath(db, row) {
  const current = String(row?.image_path || "").trim();
  if (isNonEmpty(current) && categoryImageExists(current)) return current;
  const fallback = await pickLatestProductImage(db, row.id);
  if (isNonEmpty(fallback) && categoryImageExists(fallback)) return fallback;
  return "";
}

export const categoryRepository = {
  async getAll() {
    const db = await getDb();
    const rows = await db.all(
      `SELECT c.*
       FROM categories c
       WHERE TRIM(COALESCE(c.name, '')) <> ?
       ORDER BY c.id ASC`,
      [ARCHIVE_CATEGORY_NAME]
    );
    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        image_path: await resolveCategoryImagePath(db, row)
      }))
    );
  },
  async getById(id) {
    const db = await getDb();
    const row = await db.get("SELECT * FROM categories WHERE id = ?", [id]);
    if (!row) return null;
    return {
      ...row,
      image_path: await resolveCategoryImagePath(db, row)
    };
  },
  async create(payload) {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO categories (name, description, image_path, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [payload.name, payload.description, payload.image_path]
    );
    return this.getById(result.lastID);
  },
  async update(id, payload) {
    const db = await getDb();
    await db.run(
      `UPDATE categories
       SET name = ?, description = ?, image_path = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [payload.name, payload.description, payload.image_path, id]
    );
    return this.getById(id);
  },
  async remove(id) {
    const db = await getDb();
    const categoryId = Number(id);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      throw badRequest("Kategori e pavlefshme.");
    }

    const category = await db.get("SELECT id, name FROM categories WHERE id = ?", [categoryId]);
    if (!category) {
      throw new HttpError(404, "Kategoria nuk u gjet.");
    }
    if (String(category.name || "").trim() === ARCHIVE_CATEGORY_NAME) {
      throw badRequest("Kategoria arkive nuk mund te fshihet.");
    }

    await db.exec("BEGIN");
    try {
      let archive = await db.get("SELECT id FROM categories WHERE name = ?", [ARCHIVE_CATEGORY_NAME]);
      if (!archive) {
        const inserted = await db.run(
          `INSERT INTO categories (name, description, image_path, updated_at)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          [ARCHIVE_CATEGORY_NAME, "Kategori teknike per produkte te arkivuara", ""]
        );
        archive = { id: inserted.lastID };
      }

      await db.run(
        `UPDATE products
         SET category_id = ?, is_active = 0, updated_at = CURRENT_TIMESTAMP
         WHERE category_id = ?`,
        [archive.id, categoryId]
      );

      const result = await db.run("DELETE FROM categories WHERE id = ?", [categoryId]);
      if (!Number(result?.changes || 0)) {
        throw new HttpError(404, "Kategoria nuk u gjet.");
      }

      await db.exec("COMMIT");
    } catch (error) {
      await db.exec("ROLLBACK");
      throw error;
    }
    return { id: categoryId, deleted: true };
  }
};
