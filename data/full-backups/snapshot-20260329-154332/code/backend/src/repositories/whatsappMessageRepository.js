import { getDb } from "../database/connection.js";

export const whatsappMessageRepository = {
  async create(payload) {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO whatsapp_messages (full_name, phone, message, source_page)
       VALUES (?, ?, ?, ?)`,
      [payload.full_name, payload.phone || "", payload.message, payload.source_page || ""]
    );
    return db.get("SELECT * FROM whatsapp_messages WHERE id = ?", [result.lastID]);
  },
  async list() {
    const db = await getDb();
    return db.all("SELECT * FROM whatsapp_messages ORDER BY id DESC");
  },
  async remove(id) {
    const db = await getDb();
    return db.run("DELETE FROM whatsapp_messages WHERE id = ?", [id]);
  }
};

