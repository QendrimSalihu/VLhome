import { getDb } from "../database/connection.js";
import { HttpError, badRequest } from "../utils/httpError.js";
import crypto from "node:crypto";

async function getFreeShippingThreshold(db) {
  const row = await db.get("SELECT value FROM app_settings WHERE key = 'free_shipping_threshold'");
  const parsed = Number(row?.value);
  if (!Number.isFinite(parsed) || parsed < 0) return 75;
  return parsed;
}

function buildOrderNumber(id) {
  return `VL-${String(id).padStart(5, "0")}`;
}

function makeTrackingCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function generateUniqueTrackingCode(db) {
  for (let i = 0; i < 12; i += 1) {
    const code = makeTrackingCode();
    const existing = await db.get("SELECT id FROM orders WHERE tracking_code = ? LIMIT 1", [code]);
    if (!existing) return code;
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

export const orderRepository = {
  async trackByTrackingCode(trackingCode) {
    const db = await getDb();
    const rawInput = String(trackingCode || "").trim().toUpperCase();
    const normalizedTrackingCode = rawInput.replace(/[\s-]+/g, "");
    if (normalizedTrackingCode.length < 3) throw badRequest("Shkruaj kodin e porosise.");

    const order = await db.get(
      `SELECT o.id, o.order_number, o.tracking_code, o.status, o.created_at, o.total, o.delivery_zone, o.delivery_fee
       FROM orders o
       WHERE UPPER(REPLACE(REPLACE(TRIM(o.tracking_code), ' ', ''), '-', '')) = ?
          OR UPPER(REPLACE(REPLACE(TRIM(o.order_number), ' ', ''), '-', '')) = ?
       LIMIT 1`,
      [normalizedTrackingCode, normalizedTrackingCode]
    );

    if (!order) {
      throw new HttpError(404, "Porosia nuk u gjet. Kontrollo kodin e porosise.");
    }

    const items = await db.all(
      `SELECT oi.product_id, oi.quantity, oi.price, oi.total, p.title as product_title, p.image_path as product_image
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [order.id]
    );

    return {
      order_number: order.order_number,
      tracking_code: order.tracking_code,
      status: order.status,
      created_at: order.created_at,
      total: order.total,
      delivery_zone: order.delivery_zone,
      delivery_fee: order.delivery_fee,
      items
    };
  },

  async createOrder(payload) {
    const db = await getDb();
    await db.exec("BEGIN TRANSACTION");
    try {
      const zone = await db.get("SELECT id, name, fee FROM delivery_zones WHERE id = ? AND is_active = 1", [payload.delivery_zone_id]);
      if (!zone) {
        throw badRequest("Zona e dergeses nuk ekziston.");
      }

      const normalizedItems = [];
      let subtotal = 0;
      for (const item of payload.items) {
        const product = await db.get("SELECT id, title, price, discount_price, stock_qty, is_active FROM products WHERE id = ?", [item.product_id]);
        if (!product) {
          throw badRequest(`Produkti ${item.product_id} nuk ekziston.`);
        }
        if (Number(product.is_active || 0) !== 1) {
          throw badRequest(`Produkti ${product.title} nuk eshte aktiv.`);
        }
        const unitPrice = Number(product.discount_price && product.discount_price > 0 ? product.discount_price : product.price);
        const lineTotal = unitPrice * Number(item.quantity);
        subtotal += lineTotal;
        normalizedItems.push({
          product_id: product.id,
          product_title: product.title,
          quantity: Number(item.quantity),
          price: unitPrice,
          total: lineTotal
        });
      }

      const freeShippingThreshold = await getFreeShippingThreshold(db);
      const baseDeliveryFee = Number(zone.fee || 0);
      const deliveryFee = subtotal >= freeShippingThreshold ? 0 : baseDeliveryFee;
      const grandTotal = subtotal + deliveryFee;

      const customerResult = await db.run(
        `INSERT INTO customers (full_name, phone, city, address, social_name, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          payload.customer.full_name,
          payload.customer.phone,
          payload.customer.city,
          payload.customer.address,
          payload.customer.social_name,
          payload.customer.note
        ]
      );

      const trackingCode = await generateUniqueTrackingCode(db);
      const orderResult = await db.run(
        `INSERT INTO orders (order_number, tracking_code, customer_id, status, payment_method, delivery_zone_id, delivery_zone, delivery_fee, total)
         VALUES (?, ?, ?, 'Porosia e Pranuar', 'Cash on Delivery / Payment on Post', ?, ?, ?, ?)`,
        ["PENDING", trackingCode, customerResult.lastID, zone.id, zone.name, deliveryFee, grandTotal]
      );

      const orderId = orderResult.lastID;
      await db.run("UPDATE orders SET order_number = ? WHERE id = ?", [buildOrderNumber(orderId), orderId]);

      for (const item of normalizedItems) {
        const stockUpdate = await db.run(
          `UPDATE products
           SET sold_count = COALESCE(sold_count, 0) + ?,
               stock_qty = COALESCE(stock_qty, 0) - ?,
               is_best_seller = CASE WHEN (COALESCE(sold_count, 0) + ?) >= 3 THEN 1 ELSE is_best_seller END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?
             AND COALESCE(is_active, 1) = 1
             AND COALESCE(stock_qty, 0) >= ?`,
          [item.quantity, item.quantity, item.quantity, item.product_id, item.quantity]
        );
        if (Number(stockUpdate?.changes || 0) === 0) {
          throw badRequest(`Produkti ${item.product_title} nuk ka stok te mjaftueshem.`);
        }

        await db.run(
          `INSERT INTO order_items (order_id, product_id, quantity, price, total)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, item.price, item.total]
        );
      }

      await db.exec("COMMIT");
      return { ...(await this.getById(orderId)), subtotal, delivery_fee: deliveryFee, total: grandTotal };
    } catch (error) {
      await db.exec("ROLLBACK");
      throw error;
    }
  },

  async getById(id) {
    const db = await getDb();
    const order = await db.get(
      `SELECT o.*, c.full_name, c.phone, c.city, c.address, c.social_name, c.note
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE o.id = ?`,
      [id]
    );
    if (!order) return null;

    const items = await db.all(
      `SELECT oi.*, p.title as product_title, p.image_path as product_image
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [id]
    );
    return { ...order, items };
  },

  async listPaginated({ page = 1, limit = 20, status = "", q = "" } = {}) {
    const db = await getDb();
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;
    const where = [];
    const params = [];

    if (status) {
      where.push("o.status = ?");
      params.push(status);
    }
    if (q) {
      const like = `%${q}%`;
      where.push("(o.order_number LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)");
      params.push(like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const totalRow = await db.get(
      `SELECT COUNT(*) as total
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       ${whereSql}`,
      params
    );

    const orders = await db.all(
      `SELECT o.*, c.full_name, c.phone, c.city
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       ${whereSql}
       ORDER BY o.id DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    let itemsByOrder = new Map();
    if (orders.length) {
      const placeholders = orders.map(() => "?").join(", ");
      const items = await db.all(
        `SELECT oi.*, p.title as product_title, p.image_path as product_image
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id IN (${placeholders})
         ORDER BY oi.id ASC`,
        orders.map((x) => x.id)
      );
      itemsByOrder = items.reduce((acc, item) => {
        const list = acc.get(item.order_id) || [];
        list.push(item);
        acc.set(item.order_id, list);
        return acc;
      }, new Map());
    }

    const stats = await db.get(`
      SELECT
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE TRIM(COALESCE(status, '')) IN ('Porosia e Pranuar', 'Pending', 'Confirmed')) as pending_orders,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT ROUND(COALESCE(SUM(CASE WHEN TRIM(COALESCE(status, '')) NOT IN ('E Anuluar', 'Cancelled')
          THEN (COALESCE(total, 0) - COALESCE(delivery_fee, 0))
          ELSE 0 END), 0), 2) FROM orders) as turnover_total_net,
        (SELECT ROUND(COALESCE(SUM(CASE WHEN TRIM(COALESCE(status, '')) NOT IN ('E Anuluar', 'Cancelled')
          THEN (COALESCE(total, 0) - COALESCE(delivery_fee, 0))
          ELSE 0 END), 0), 2)
          FROM orders
          WHERE DATE(created_at, 'localtime') = DATE('now', 'localtime')) as turnover_today_net
    `);

    const withItems = orders.map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id) || []
    }));

    const total = Number(totalRow?.total || 0);
    return {
      items: withItems,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit))
      },
      stats: {
        total_orders: Number(stats?.total_orders || 0),
        pending_orders: Number(stats?.pending_orders || 0),
        total_customers: Number(stats?.total_customers || 0),
        turnover_total_net: Number(stats?.turnover_total_net || 0),
        turnover_today_net: Number(stats?.turnover_today_net || 0)
      }
    };
  },

  async updateStatus(id, status) {
    const db = await getDb();
    await db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    return this.getById(id);
  },

  async deleteOrder(id) {
    const db = await getDb();
    await db.exec("BEGIN TRANSACTION");
    try {
      const order = await db.get("SELECT id, customer_id FROM orders WHERE id = ?", [id]);
      if (!order) {
        await db.exec("ROLLBACK");
        return null;
      }

      const items = await db.all("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [id]);
      for (const item of items) {
        const qty = Number(item.quantity || 0);
        if (!qty) continue;
        await db.run(
          `UPDATE products
           SET stock_qty = COALESCE(stock_qty, 0) + ?,
               sold_count = CASE WHEN COALESCE(sold_count, 0) >= ? THEN sold_count - ? ELSE 0 END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [qty, qty, qty, item.product_id]
        );
      }

      await db.run("DELETE FROM orders WHERE id = ?", [id]);

      const leftForCustomer = await db.get("SELECT COUNT(*) as cnt FROM orders WHERE customer_id = ?", [order.customer_id]);
      if (Number(leftForCustomer?.cnt || 0) === 0) {
        await db.run("DELETE FROM customers WHERE id = ?", [order.customer_id]);
      }

      await db.exec("COMMIT");
      return { id, deleted: true, restored_items: items.length };
    } catch (error) {
      await db.exec("ROLLBACK");
      throw error;
    }
  },

  async deleteAllOrders() {
    const db = await getDb();
    await db.exec("BEGIN TRANSACTION");
    try {
      const items = await db.all("SELECT product_id, quantity FROM order_items");
      for (const item of items) {
        const qty = Number(item.quantity || 0);
        if (!qty) continue;
        await db.run(
          `UPDATE products
           SET stock_qty = COALESCE(stock_qty, 0) + ?,
               sold_count = CASE WHEN COALESCE(sold_count, 0) >= ? THEN sold_count - ? ELSE 0 END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [qty, qty, qty, item.product_id]
        );
      }

      const ordersCountRow = await db.get("SELECT COUNT(*) as total FROM orders");
      const ordersCount = Number(ordersCountRow?.total || 0);

      await db.run("DELETE FROM orders");
      await db.run("DELETE FROM customers WHERE id NOT IN (SELECT DISTINCT customer_id FROM orders)");

      await db.exec("COMMIT");
      return { deleted_orders: ordersCount, restored_items: items.length };
    } catch (error) {
      await db.exec("ROLLBACK");
      throw error;
    }
  }
};
