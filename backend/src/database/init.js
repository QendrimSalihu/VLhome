import { getDb } from "./connection.js";

export async function initDatabase() {
  const db = await getDb();
  await db.exec("PRAGMA foreign_keys = ON");
  await db.exec("PRAGMA journal_mode = WAL");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      image_path TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS delivery_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      fee REAL NOT NULL DEFAULT 0,
      currency_symbol TEXT NOT NULL DEFAULT 'EUR',
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      discount_price REAL DEFAULT 0,
      rating_value REAL DEFAULT NULL,
      description TEXT DEFAULT '',
      image_path TEXT DEFAULT '',
      gallery_paths TEXT DEFAULT '[]',
      is_new_arrival INTEGER DEFAULT 0,
      is_best_seller INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      sold_count INTEGER DEFAULT 0,
      set_persons INTEGER DEFAULT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      social_name TEXT DEFAULT '',
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      tracking_code TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Porosia e Pranuar',
      payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery / Payment on Post',
      delivery_zone_id INTEGER,
      delivery_zone TEXT DEFAULT '',
      delivery_fee REAL DEFAULT 0,
      total REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
      FOREIGN KEY (delivery_zone_id) REFERENCES delivery_zones(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS slider_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_path TEXT NOT NULL,
      caption TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      message TEXT NOT NULL,
      source_page TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const productCols = await db.all("PRAGMA table_info(products)");
  const hasProductCol = (name) => productCols.some((c) => c.name === name);
  if (!hasProductCol("is_new_arrival")) await db.exec("ALTER TABLE products ADD COLUMN is_new_arrival INTEGER DEFAULT 0");
  if (!hasProductCol("is_best_seller")) await db.exec("ALTER TABLE products ADD COLUMN is_best_seller INTEGER DEFAULT 0");
  if (!hasProductCol("likes_count")) await db.exec("ALTER TABLE products ADD COLUMN likes_count INTEGER DEFAULT 0");
  if (!hasProductCol("sold_count")) await db.exec("ALTER TABLE products ADD COLUMN sold_count INTEGER DEFAULT 0");
  if (!hasProductCol("stock_qty")) await db.exec("ALTER TABLE products ADD COLUMN stock_qty INTEGER NOT NULL DEFAULT 999");
  if (!hasProductCol("is_active")) await db.exec("ALTER TABLE products ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
  if (!hasProductCol("gallery_paths")) await db.exec("ALTER TABLE products ADD COLUMN gallery_paths TEXT DEFAULT '[]'");
  if (!hasProductCol("set_persons")) await db.exec("ALTER TABLE products ADD COLUMN set_persons INTEGER");
  if (!hasProductCol("rating_value")) await db.exec("ALTER TABLE products ADD COLUMN rating_value REAL");

  const categoryCols = await db.all("PRAGMA table_info(categories)");
  const hasCategoryCol = (name) => categoryCols.some((c) => c.name === name);
  if (!hasCategoryCol("slug")) await db.exec("ALTER TABLE categories ADD COLUMN slug TEXT DEFAULT ''");
  if (!hasCategoryCol("sort_order")) await db.exec("ALTER TABLE categories ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0");

  const orderCols = await db.all("PRAGMA table_info(orders)");
  const hasOrderCol = (name) => orderCols.some((c) => c.name === name);
  if (!hasOrderCol("tracking_code")) await db.exec("ALTER TABLE orders ADD COLUMN tracking_code TEXT");
  if (!hasOrderCol("delivery_zone")) await db.exec("ALTER TABLE orders ADD COLUMN delivery_zone TEXT DEFAULT ''");
  if (!hasOrderCol("delivery_fee")) await db.exec("ALTER TABLE orders ADD COLUMN delivery_fee REAL DEFAULT 0");
  if (!hasOrderCol("delivery_zone_id")) await db.exec("ALTER TABLE orders ADD COLUMN delivery_zone_id INTEGER");
  await db.run(`
    UPDATE orders
    SET tracking_code = 'TRK' || id || SUBSTR(UPPER(HEX(RANDOMBLOB(2))), 1, 4)
    WHERE tracking_code IS NULL OR TRIM(tracking_code) = ''
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_category_active_id ON products(category_id, is_active, id DESC);
    CREATE INDEX IF NOT EXISTS idx_products_best_active_id ON products(is_best_seller, is_active, id DESC);
    CREATE INDEX IF NOT EXISTS idx_products_new_active_id ON products(is_new_arrival, is_active, id DESC);
    CREATE INDEX IF NOT EXISTS idx_products_active_sold_id ON products(is_active, sold_count DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_products_active_price_id ON products(is_active, price, id DESC);
    CREATE INDEX IF NOT EXISTS idx_products_title_nocase ON products(title COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_products_stock_qty ON products(stock_qty);

    CREATE INDEX IF NOT EXISTS idx_categories_name_nocase ON categories(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order, id ASC);

    CREATE INDEX IF NOT EXISTS idx_orders_status_created_id ON orders(status, created_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_created_id ON orders(customer_id, created_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);

    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_customers_name_nocase ON customers(full_name COLLATE NOCASE);

    CREATE INDEX IF NOT EXISTS idx_contact_messages_created_id ON contact_messages(created_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_id ON whatsapp_messages(created_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_slider_images_created_id ON slider_images(created_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_delivery_zones_sort_order ON delivery_zones(sort_order, id ASC);
  `);

  await db.run("UPDATE orders SET status = 'Porosia e Pranuar' WHERE status IN ('Pending', 'Confirmed')");
  await db.run("UPDATE orders SET status = 'Ne Transport' WHERE status = 'Shipped'");
  await db.run("UPDATE orders SET status = 'E Dorezuar' WHERE status = 'Delivered'");
  await db.run("UPDATE orders SET status = 'E Anuluar' WHERE status = 'Cancelled'");

  const defaultCategories = ["Seta darke", "Gota", "Filxhana", "Gota caji", "Seta mengjesi", "Dekore", "Gricka", "Pjata"];
  for (const [idx, name] of defaultCategories.entries()) {
    const slug = name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    await db.run("INSERT OR IGNORE INTO categories (name, description, image_path) VALUES (?, '', '')", [name]);
    await db.run("UPDATE categories SET slug = COALESCE(NULLIF(slug, ''), ?), sort_order = CASE WHEN sort_order = 0 THEN ? ELSE sort_order END WHERE name = ?", [
      slug,
      idx + 1,
      name
    ]);
  }

  const defaultZones = [
    { name: "Maqedoni", slug: "macedonia", fee: 2.44, currency_symbol: "EUR", sort_order: 1 },
    { name: "Kosove", slug: "kosove", fee: 5, currency_symbol: "EUR", sort_order: 2 },
    { name: "Shqiperi", slug: "shqiperi", fee: 7, currency_symbol: "EUR", sort_order: 3 },
    { name: "Bujanoc", slug: "bujanovac", fee: 5, currency_symbol: "EUR", sort_order: 4 }
  ];
  for (const zone of defaultZones) {
    await db.run(
      `INSERT OR IGNORE INTO delivery_zones (name, slug, fee, currency_symbol, is_active, sort_order)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [zone.name, zone.slug, zone.fee, zone.currency_symbol, zone.sort_order]
    );
  }

  await db.run("DELETE FROM delivery_zones WHERE slug = 'maqedoni'");
  await db.run("DELETE FROM delivery_zones WHERE slug = 'bujanoc'");
  await db.run("UPDATE delivery_zones SET name = 'Maqedoni', currency_symbol = 'EUR' WHERE slug = 'macedonia'");
  await db.run("UPDATE delivery_zones SET name = 'Bujanoc', currency_symbol = 'EUR' WHERE slug = 'bujanovac'");
  await db.run("UPDATE delivery_zones SET fee = 5, currency_symbol = 'EUR' WHERE slug = 'kosove'");
  await db.run("UPDATE delivery_zones SET fee = 7, currency_symbol = 'EUR' WHERE slug = 'shqiperi'");
  await db.run("UPDATE delivery_zones SET currency_symbol = 'EUR' WHERE currency_symbol <> 'EUR'");

  const defaultSettings = [
    ["store_name", "VLERA Luxury Home"],
    ["phone", "075465888"],
    ["email", "vlerahomemk@gmail.com"],
    ["instagram_url", "https://www.instagram.com/vlerahomee?igsh=dDBudTY5dmwyM240"],
    ["free_shipping_threshold", "75"]
  ];
  for (const [key, value] of defaultSettings) {
    await db.run("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)", [key, value]);
  }
  await db.run(
    "UPDATE app_settings SET value = ? WHERE key = 'phone' AND REPLACE(REPLACE(REPLACE(value, ' ', ''), '+', ''), '-', '') IN ('38376288898','076288898','38376288887','076288887')",
    ["075465888"]
  );

  await db.exec(`
    DROP VIEW IF EXISTS vw_admin_categories;
    DROP VIEW IF EXISTS vw_admin_products;
    DROP VIEW IF EXISTS vw_admin_orders;
    DROP VIEW IF EXISTS vw_admin_order_items;
    DROP VIEW IF EXISTS vw_admin_customers;
    DROP VIEW IF EXISTS vw_admin_messages;

    DROP VIEW IF EXISTS vw_shqip_kategorite;
    CREATE VIEW vw_shqip_kategorite AS
    SELECT
      c.id AS kategori_id,
      c.name AS emri_kategorise,
      c.slug AS slug_kategorise,
      c.sort_order AS renditja,
      c.description AS pershkrimi,
      c.image_path AS foto,
      c.created_at AS krijuar_me,
      c.updated_at AS perditesuar_me
    FROM categories c
    ORDER BY c.sort_order ASC, c.id ASC;

    DROP VIEW IF EXISTS vw_shqip_produktet;
    CREATE VIEW vw_shqip_produktet AS
    SELECT
      p.id AS produkt_id,
      p.title AS emri_produktit,
      c.name AS kategoria,
      p.price AS cmimi,
      p.discount_price AS cmimi_me_zbritje,
      p.stock_qty AS stoku,
      p.set_persons AS seti_persona,
      p.rating_value AS vleresimi,
      p.is_active AS aktiv,
      p.is_new_arrival AS i_ri,
      p.is_best_seller AS me_i_shituri,
      p.likes_count AS pelqime,
      p.sold_count AS shitje,
      p.image_path AS foto_kryesore,
      p.gallery_paths AS galeria_fotove,
      p.created_at AS krijuar_me,
      p.updated_at AS perditesuar_me
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY p.id DESC;

    DROP VIEW IF EXISTS vw_shqip_porosite;
    CREATE VIEW vw_shqip_porosite AS
    SELECT
      o.id AS porosi_id,
      o.order_number AS nr_porosise,
      o.tracking_code AS kodi_gjurmimit,
      o.status AS statusi,
      o.payment_method AS pagesa,
      o.delivery_zone AS zona_dergeses,
      o.delivery_fee AS posta,
      o.total AS totali,
      c.id AS klient_id,
      c.full_name AS klienti,
      c.phone AS telefoni,
      c.city AS qyteti,
      c.address AS adresa,
      o.created_at AS krijuar_me
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    ORDER BY o.id DESC;

    DROP VIEW IF EXISTS vw_shqip_artikujt_porosise;
    CREATE VIEW vw_shqip_artikujt_porosise AS
    SELECT
      oi.id AS artikull_id,
      oi.order_id AS porosi_id,
      o.order_number AS nr_porosise,
      oi.product_id AS produkt_id,
      p.title AS produkti,
      p.image_path AS foto_produktit,
      c.name AS kategoria,
      oi.quantity AS sasia,
      oi.price AS cmimi,
      oi.total AS totali,
      oi.created_at AS krijuar_me
    FROM order_items oi
    LEFT JOIN orders o ON o.id = oi.order_id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY oi.id DESC;

    DROP VIEW IF EXISTS vw_shqip_klientet;
    CREATE VIEW vw_shqip_klientet AS
    SELECT
      c.id AS klient_id,
      c.full_name AS emri_mbiemri,
      c.phone AS telefoni,
      c.city AS qyteti,
      c.address AS adresa,
      c.social_name AS social,
      c.note AS shenim,
      COUNT(o.id) AS nr_porosive,
      c.created_at AS krijuar_me
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id
    ORDER BY c.id DESC;

    DROP VIEW IF EXISTS vw_shqip_mesazhet;
    CREATE VIEW vw_shqip_mesazhet AS
    SELECT
      m.id AS mesazh_id,
      m.full_name AS emri,
      m.phone AS telefoni,
      m.email AS email,
      m.message AS mesazhi,
      m.created_at AS krijuar_me
    FROM contact_messages m
    ORDER BY m.id DESC;

    DROP VIEW IF EXISTS vw_shqip_whatsapp_mesazhet;
    CREATE VIEW vw_shqip_whatsapp_mesazhet AS
    SELECT
      w.id AS mesazh_id,
      w.full_name AS emri,
      w.phone AS telefoni,
      w.message AS mesazhi,
      w.source_page AS faqja_burim,
      w.created_at AS krijuar_me
    FROM whatsapp_messages w
    ORDER BY w.id DESC;

    DROP VIEW IF EXISTS vw_shqip_zonat_dergeses;
    CREATE VIEW vw_shqip_zonat_dergeses AS
    SELECT
      z.id AS zona_id,
      z.name AS emri_zones,
      z.slug AS slug,
      z.fee AS tarifa,
      z.currency_symbol AS valuta,
      z.is_active AS aktive,
      z.sort_order AS renditja,
      z.created_at AS krijuar_me,
      z.updated_at AS perditesuar_me
    FROM delivery_zones z
    ORDER BY z.sort_order ASC, z.id ASC;

    DROP VIEW IF EXISTS vw_shqip_settings;
    CREATE VIEW vw_shqip_settings AS
    SELECT
      s.key AS celesi,
      s.value AS vlera
    FROM app_settings s
    ORDER BY s.key ASC;
  `);
}

if (process.argv[1] && process.argv[1].endsWith("init.js")) {
  initDatabase()
    .then(() => {
      console.log("Database initialized.");
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
