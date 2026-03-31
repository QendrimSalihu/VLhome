import { getDb } from "../database/connection.js";
import { badRequest } from "../utils/httpError.js";

function parseGalleryPaths(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function normalizeProductRow(row) {
  if (!row) return row;
  return {
    ...row,
    gallery_paths: parseGalleryPaths(row.gallery_paths)
  };
}

export const productRepository = {
  async getAll() {
    const db = await getDb();
    const rows = await db.all(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ORDER BY p.id DESC
    `);
    return rows.map(normalizeProductRow);
  },
  async listPaginated({
    page = 1,
    limit = 20,
    q = "",
    category = "",
    sort = "newest",
    is_new_arrival,
    is_best_seller,
    min_price,
    max_price,
    min_sold,
    has_discount,
    include_inactive
  } = {}) {
    const db = await getDb();
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;

    const where = [];
    const params = [];
    const showInactive = Number(include_inactive || 0) === 1;
    if (!showInactive) {
      where.push("COALESCE(p.is_active, 1) = 1");
    }
    if (q) {
      where.push("(p.title LIKE ? OR c.name LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like);
    }
    if (category) {
      where.push("c.name = ?");
      params.push(category);
    }
    if (is_new_arrival !== undefined && String(is_new_arrival) !== "") {
      where.push("COALESCE(p.is_new_arrival, 0) = ?");
      params.push(Number(is_new_arrival) ? 1 : 0);
    }
    if (is_best_seller !== undefined && String(is_best_seller) !== "") {
      where.push("COALESCE(p.is_best_seller, 0) = ?");
      params.push(Number(is_best_seller) ? 1 : 0);
    }
    if (min_price !== undefined && String(min_price) !== "") {
      where.push("COALESCE(NULLIF(p.discount_price, 0), p.price) >= ?");
      params.push(Number(min_price));
    }
    if (max_price !== undefined && String(max_price) !== "") {
      where.push("COALESCE(NULLIF(p.discount_price, 0), p.price) <= ?");
      params.push(Number(max_price));
    }
    if (min_sold !== undefined && String(min_sold) !== "") {
      where.push("COALESCE(p.sold_count, 0) >= ?");
      params.push(Number(min_sold));
    }
    if (has_discount !== undefined && String(has_discount) !== "" && Number(has_discount) === 1) {
      where.push("COALESCE(p.discount_price, 0) > 0 AND p.discount_price < p.price");
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    let orderSql = "ORDER BY p.id DESC";
    if (sort === "price_asc") orderSql = "ORDER BY COALESCE(NULLIF(p.discount_price, 0), p.price) ASC, p.id DESC";
    if (sort === "price_desc") orderSql = "ORDER BY COALESCE(NULLIF(p.discount_price, 0), p.price) DESC, p.id DESC";
    if (sort === "sold_desc") orderSql = "ORDER BY COALESCE(p.sold_count, 0) DESC, p.id DESC";

    const totalRow = await db.get(
      `SELECT COUNT(*) as total
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ${whereSql}`,
      params
    );

    const rows = await db.all(
      `SELECT p.*, c.name as category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ${orderSql}
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    const total = Number(totalRow?.total || 0);
    return {
      items: rows.map(normalizeProductRow),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit))
      }
    };
  },
  async getById(id) {
    const db = await getDb();
    const row = await db.get(
      `SELECT p.*, c.name as category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
      [id]
    );
    return normalizeProductRow(row);
  },
  async create(payload) {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO products (category_id, title, price, discount_price, description, image_path, gallery_paths, is_new_arrival, is_best_seller, sold_count, stock_qty, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        payload.category_id,
        payload.title,
        payload.price,
        payload.discount_price,
        payload.description,
        payload.image_path,
        JSON.stringify(payload.gallery_paths || []),
        payload.is_new_arrival,
        payload.is_best_seller,
        payload.sold_count,
        payload.stock_qty,
        payload.is_active
      ]
    );
    return this.getById(result.lastID);
  },
  async update(id, payload) {
    const db = await getDb();
    await db.run(
      `UPDATE products
       SET category_id = ?, title = ?, price = ?, discount_price = ?, description = ?, image_path = ?, gallery_paths = ?, is_new_arrival = ?, is_best_seller = ?, sold_count = ?, stock_qty = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        payload.category_id,
        payload.title,
        payload.price,
        payload.discount_price,
        payload.description,
        payload.image_path,
        JSON.stringify(payload.gallery_paths || []),
        payload.is_new_arrival,
        payload.is_best_seller,
        payload.sold_count,
        payload.stock_qty,
        payload.is_active,
        id
      ]
    );
    return this.getById(id);
  },
  async remove(id) {
    const db = await getDb();
    return db.run("DELETE FROM products WHERE id = ?", [id]);
  },
  async removeAll() {
    const db = await getDb();
    const linked = await db.get("SELECT COUNT(*) as total FROM order_items");
    if (Number(linked?.total || 0) > 0) {
      throw badRequest("Nuk mund te fshihen produktet derisa ekzistojne porosi. Fshi porosite fillimisht.");
    }
    const totalRow = await db.get("SELECT COUNT(*) as total FROM products");
    const total = Number(totalRow?.total || 0);
    await db.run("DELETE FROM products");
    return { deleted_products: total };
  },
  async like(id) {
    const db = await getDb();
    await db.run(
      `UPDATE products
       SET likes_count = COALESCE(likes_count, 0) + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );
    return this.getById(id);
  },
  async unlike(id) {
    const db = await getDb();
    await db.run(
      `UPDATE products
       SET likes_count = CASE WHEN COALESCE(likes_count, 0) > 0 THEN likes_count - 1 ELSE 0 END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );
    return this.getById(id);
  }
};
