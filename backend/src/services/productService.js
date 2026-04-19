import { productRepository } from "../repositories/productRepository.js";
import { createDatabaseBackup } from "../utils/autoBackup.js";
import { getDb } from "../database/connection.js";

const PRODUCT_BACKUP_EVERY = 30;
const PRODUCT_CREATE_COUNTER_KEY = "product_create_counter";

async function incrementProductCreateCounter() {
  const db = await getDb();
  const row = await db.get("SELECT value FROM app_settings WHERE key = ?", [PRODUCT_CREATE_COUNTER_KEY]);
  const current = Math.max(0, Number.parseInt(String(row?.value ?? "0"), 10) || 0);
  const next = current + 1;
  await db.run(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [PRODUCT_CREATE_COUNTER_KEY, String(next)]
  );
  return next;
}

export const productService = {
  list(params = {}) {
    return productRepository.listPaginated(params);
  },
  get(id) {
    return productRepository.getById(id);
  },
  create(data) {
    return productRepository.create(data).then(async (result) => {
      const createdCount = await incrementProductCreateCounter();
      if (createdCount % PRODUCT_BACKUP_EVERY === 0) {
        createDatabaseBackup(`produkt_batch_${createdCount}`);
      }
      return result;
    });
  },
  update(id, data) {
    return productRepository.update(id, data).then((result) => {
      createDatabaseBackup("produkt_perditesuar");
      return result;
    });
  },
  remove(id) {
    return productRepository.remove(id).then((result) => {
      createDatabaseBackup("produkt_fshire");
      return result;
    });
  },
  removeAll() {
    return productRepository.removeAll().then((result) => {
      createDatabaseBackup("te_gjitha_produktet_fshire");
      return result;
    });
  },
  like(id) {
    return productRepository.like(id).then((result) => {
      createDatabaseBackup("pelqim_produkti");
      return result;
    });
  },
  unlike(id) {
    return productRepository.unlike(id).then((result) => {
      createDatabaseBackup("heqje_pelqimi");
      return result;
    });
  }
};
