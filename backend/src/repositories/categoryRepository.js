import { getDb } from "../database/connection.js";
import { badRequest, HttpError } from "../utils/httpError.js";

const ARCHIVE_CATEGORY_NAME = "Arkive (Auto)";

export const categoryRepository = {
  async getAll() {
    const db = await getDb();
    return db.all(
      "SELECT * FROM categories WHERE TRIM(COALESCE(name, '')) <> ? ORDER BY id ASC",
      [ARCHIVE_CATEGORY_NAME]
    );
  },
  async getById(id) {
    const db = await getDb();
    return db.get("SELECT * FROM categories WHERE id = ?", [id]);
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
