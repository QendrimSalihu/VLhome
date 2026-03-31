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
  async getAll() {
    const db = await getDb();
    return db.all(`
      SELECT c.*, COUNT(o.id) as total_orders
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
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
