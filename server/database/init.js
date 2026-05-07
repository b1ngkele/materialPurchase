const { getDb } = require('./db');

function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      unit TEXT,
      spec TEXT,
      price REAL,
      sku_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS purchase_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER NOT NULL,
      employee_name TEXT NOT NULL,
      department TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (period_id) REFERENCES periods(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_request_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      purpose TEXT NOT NULL,
      FOREIGN KEY (request_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 添加 SKU 唯一索引（支持导入覆盖逻辑）
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku_code);
  `);

  console.log('Database tables initialized successfully.');
}

function resetDatabase() {
  const db = getDb();

  // 按外键依赖顺序清空（保留 admin_users）
  db.exec(`
    DELETE FROM purchase_request_items;
    DELETE FROM purchase_requests;
    DELETE FROM products;
    DELETE FROM periods;
    DELETE FROM categories;
  `);

  // 重置自增序列
  db.exec(`
    DELETE FROM sqlite_sequence WHERE name IN ('purchase_request_items', 'purchase_requests', 'products', 'periods', 'categories');
  `);

  console.log('Database reset successfully (admin_users preserved).');
}

module.exports = { initDatabase, resetDatabase };
