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
  async listPaginated({ page = 1, limit = 20, q = "" } = {}) {
    const db = await getDb();
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;
    const where = [];
    const params = [];

    if (q) {
      const like = `%${q}%`;
      where.push("(full_name LIKE ? OR phone LIKE ? OR message LIKE ? OR source_page LIKE ?)");
      params.push(like, like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const totalRow = await db.get(
      `SELECT COUNT(*) as total
       FROM whatsapp_messages
       ${whereSql}`,
      params
    );

    const items = await db.all(
      `SELECT *
       FROM whatsapp_messages
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    const total = Number(totalRow?.total || 0);
    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit))
      }
    };
  },
  async remove(id) {
    const db = await getDb();
    return db.run("DELETE FROM whatsapp_messages WHERE id = ?", [id]);
  }
};
