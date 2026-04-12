import { getDb } from "../database/connection.js";

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
    return db.run("DELETE FROM categories WHERE id = ?", [id]);
  }
};
