import { getDb } from "../database/connection.js";

export const sliderRepository = {
  async getAll() {
    const db = await getDb();
    return db.all("SELECT * FROM slider_images ORDER BY id DESC");
  },
  async create(payload) {
    const db = await getDb();
    const result = await db.run(
      "INSERT INTO slider_images (image_path, caption) VALUES (?, ?)",
      [payload.image_path, payload.caption || ""]
    );
    return db.get("SELECT * FROM slider_images WHERE id = ?", [result.lastID]);
  },
  async remove(id) {
    const db = await getDb();
    return db.run("DELETE FROM slider_images WHERE id = ?", [id]);
  }
};
