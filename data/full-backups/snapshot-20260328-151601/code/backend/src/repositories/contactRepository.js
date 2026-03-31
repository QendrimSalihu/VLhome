import { getDb } from "../database/connection.js";

export const contactRepository = {
  async create(payload) {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO contact_messages (full_name, email, phone, message)
       VALUES (?, ?, ?, ?)`,
      [payload.full_name, payload.email || "", payload.phone || "", payload.message]
    );
    return db.get("SELECT * FROM contact_messages WHERE id = ?", [result.lastID]);
  },
  async list() {
    const db = await getDb();
    return db.all("SELECT * FROM contact_messages ORDER BY id DESC");
  }
};

