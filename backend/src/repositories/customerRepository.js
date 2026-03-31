import { getDb } from "../database/connection.js";

export const customerRepository = {
  async create(payload) {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO customers (full_name, phone, city, address, social_name, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [payload.full_name, payload.phone, payload.city, payload.address, payload.social_name, payload.note]
    );
    return db.get("SELECT * FROM customers WHERE id = ?", [result.lastID]);
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
      where.push("(c.full_name LIKE ? OR c.phone LIKE ? OR c.city LIKE ?)");
      params.push(like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const totalRow = await db.get(
      `SELECT COUNT(*) as total
       FROM customers c
       ${whereSql}`,
      params
    );

    const items = await db.all(`
      SELECT c.*, COUNT(o.id) as total_orders
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      ${whereSql}
      GROUP BY c.id
      ORDER BY c.id DESC
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
    const used = await db.get("SELECT COUNT(*) as cnt FROM orders WHERE customer_id = ?", [id]);
    if (Number(used?.cnt || 0) > 0) {
      throw new Error("Ky klient ka porosi. Fshi porosite e tij fillimisht.");
    }
    await db.run("DELETE FROM customers WHERE id = ?", [id]);
    return { id, deleted: true };
  }
};
