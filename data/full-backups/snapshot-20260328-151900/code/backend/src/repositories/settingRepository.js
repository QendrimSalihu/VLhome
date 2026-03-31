import { getDb } from "../database/connection.js";

const ALLOWED_KEYS = ["store_name", "phone", "email", "instagram_url", "free_shipping_threshold"];

export const settingRepository = {
  async getAll() {
    const db = await getDb();
    const rows = await db.all("SELECT key, value FROM app_settings WHERE key IN (?, ?, ?, ?, ?)", ALLOWED_KEYS);
    return rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  },
  async upsertMany(payload) {
    const db = await getDb();
    const entries = Object.entries(payload).filter(([key]) => ALLOWED_KEYS.includes(key));
    for (const [key, value] of entries) {
      await db.run(
        `INSERT INTO app_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, String(value ?? "")]
      );
    }
    return this.getAll();
  }
};

