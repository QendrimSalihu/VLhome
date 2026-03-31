import { getDb } from "../database/connection.js";
import { badRequest } from "../utils/httpError.js";

async function getFreeShippingThreshold(db) {
  const row = await db.get("SELECT value FROM app_settings WHERE key = 'free_shipping_threshold'");
  const parsed = Number(row?.value);
  if (!Number.isFinite(parsed) || parsed < 0) return 75;
  return parsed;
}

function buildOrderNumber(id) {
  return `VL-${String(id).padStart(5, "0")}`;
}

export const orderRepository = {
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
        if (Number(product.stock_qty || 0) < Number(item.quantity || 0)) {
          throw badRequest(`Produkti ${product.title} nuk ka stok te mjaftueshem.`);
        }
        const unitPrice = Number(product.discount_price && product.discount_price > 0 ? product.discount_price : product.price);
        const lineTotal = unitPrice * Number(item.quantity);
        subtotal += lineTotal;
        normalizedItems.push({
          product_id: product.id,
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

      const orderResult = await db.run(
        `INSERT INTO orders (order_number, customer_id, status, payment_method, delivery_zone_id, delivery_zone, delivery_fee, total)
         VALUES (?, ?, 'Pending', 'Cash on Delivery / Payment on Post', ?, ?, ?, ?)`,
        ["PENDING", customerResult.lastID, zone.id, zone.name, deliveryFee, grandTotal]
      );

      const orderId = orderResult.lastID;
      await db.run("UPDATE orders SET order_number = ? WHERE id = ?", [buildOrderNumber(orderId), orderId]);

      for (const item of normalizedItems) {
        await db.run(
          `INSERT INTO order_items (order_id, product_id, quantity, price, total)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, item.price, item.total]
        );

        await db.run(
          `UPDATE products
           SET sold_count = COALESCE(sold_count, 0) + ?,
               stock_qty = CASE WHEN COALESCE(stock_qty, 0) >= ? THEN stock_qty - ? ELSE 0 END,
               is_best_seller = CASE WHEN (COALESCE(sold_count, 0) + ?) >= 3 THEN 1 ELSE is_best_seller END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [item.quantity, item.quantity, item.quantity, item.quantity, item.product_id]
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
        (SELECT COUNT(*) FROM orders WHERE status = 'Pending') as pending_orders,
        (SELECT COUNT(*) FROM customers) as total_customers
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
        total_customers: Number(stats?.total_customers || 0)
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
