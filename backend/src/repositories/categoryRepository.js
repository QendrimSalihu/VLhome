import { getDb } from "../database/connection.js";
import { badRequest, HttpError } from "../utils/httpError.js";

export const categoryRepository = {
  async getAll() {
    const db = await getDb();
    return db.all("SELECT * FROM categories ORDER BY id ASC");
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

    const inUse = await db.get("SELECT COUNT(*) as cnt FROM products WHERE category_id = ?", [categoryId]);
    if (Number(inUse?.cnt || 0) > 0) {
      throw badRequest("Kjo kategori ka produkte. Kalo produktet ne kategori tjeter ose fshiji produktet, pastaj fshije kategorine.");
    }

    const result = await db.run("DELETE FROM categories WHERE id = ?", [categoryId]);
    if (!Number(result?.changes || 0)) {
      throw new HttpError(404, "Kategoria nuk u gjet.");
    }
    return { id: categoryId, deleted: true };
  }
};
