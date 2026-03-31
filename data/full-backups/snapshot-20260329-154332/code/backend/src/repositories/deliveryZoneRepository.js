import { getDb } from "../database/connection.js";

export const deliveryZoneRepository = {
  async listActive() {
    const db = await getDb();
    return db.all(
      `SELECT id, name, slug, fee, currency_symbol, is_active, sort_order
       FROM delivery_zones
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`
    );
  },
  async getById(id) {
    const db = await getDb();
    return db.get("SELECT * FROM delivery_zones WHERE id = ?", [id]);
  }
};
