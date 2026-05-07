const { getDb } = require('../database/db');

class Product {
  static findByCategoryIds(categoryIds, keyword = '') {
    const db = getDb();
    let sql = 'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id';
    const params = [];

    const conditions = [];

    if (categoryIds && categoryIds.length > 0) {
      const placeholders = categoryIds.map(() => '?').join(',');
      conditions.push(`p.category_id IN (${placeholders})`);
      params.push(...categoryIds);
    }

    if (keyword && keyword.trim()) {
      conditions.push('p.name LIKE ?');
      params.push(`%${keyword.trim()}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY c.sort_order ASC, p.id ASC';

    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    const db = getDb();
    return db.prepare(
      'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?'
    ).get(id);
  }

  static findAllPaginated({ keyword = '', categoryId, page = 1, pageSize = 20 } = {}) {
    const db = getDb();
    let countSql = 'SELECT COUNT(*) as total FROM products p WHERE 1=1';
    let dataSql = 'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE 1=1';
    const params = [];

    if (keyword && keyword.trim()) {
      const cond = ' AND (p.name LIKE ? OR p.sku_code LIKE ?)';
      countSql += cond;
      dataSql += cond;
      params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`);
    }

    if (categoryId) {
      const cond = ' AND p.category_id = ?';
      countSql += cond;
      dataSql += cond;
      params.push(Number(categoryId));
    }

    const countParams = [...params];
    const total = db.prepare(countSql).get(...countParams).total;

    dataSql += ' ORDER BY c.sort_order ASC, p.id ASC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const list = db.prepare(dataSql).all(...params);
    return { list, total, page, pageSize };
  }

  static create({ categoryId, name, unit, spec, price, skuCode }) {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO products (category_id, name, unit, spec, price, sku_code) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(categoryId, name, unit, spec, price, skuCode);
    return this.findById(result.lastInsertRowid);
  }

  static update(id, { categoryId, name, unit, spec, price, skuCode }) {
    const db = getDb();
    db.prepare(
      'UPDATE products SET category_id = ?, name = ?, unit = ?, spec = ?, price = ?, sku_code = ? WHERE id = ?'
    ).run(categoryId, name, unit, spec, price, skuCode, id);
    return this.findById(id);
  }

  static deleteById(id) {
    const db = getDb();
    // 检查是否有关联的采购明细
    const linked = db.prepare(
      'SELECT COUNT(*) as cnt FROM purchase_request_items WHERE product_id = ?'
    ).get(id);
    if (linked.cnt > 0) {
      throw new Error('该物品已有关联的采购记录，无法删除');
    }
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
  }

  static upsertBySku({ categoryId, name, unit, spec, price, skuCode }) {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM products WHERE sku_code = ?').get(skuCode);
    if (existing) {
      db.prepare(
        'UPDATE products SET category_id = ?, name = ?, unit = ?, spec = ?, price = ? WHERE sku_code = ?'
      ).run(categoryId, name, unit, spec, price, skuCode);
      return { action: 'updated', id: existing.id };
    } else {
      const result = db.prepare(
        'INSERT INTO products (category_id, name, unit, spec, price, sku_code) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(categoryId, name, unit, spec, price, skuCode);
      return { action: 'created', id: result.lastInsertRowid };
    }
  }
}

module.exports = Product;
