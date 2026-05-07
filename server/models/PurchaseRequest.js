const { getDb } = require('../database/db');

class PurchaseRequest {
  static create(periodId, employeeName, department, items) {
    const db = getDb();

    const insertRequest = db.prepare(
      'INSERT INTO purchase_requests (period_id, employee_name, department) VALUES (?, ?, ?)'
    );
    const insertItem = db.prepare(
      'INSERT INTO purchase_request_items (request_id, product_id, quantity, purpose) VALUES (?, ?, ?, ?)'
    );

    const transaction = db.transaction(() => {
      const result = insertRequest.run(periodId, employeeName, department);
      const requestId = result.lastInsertRowid;

      for (const item of items) {
        insertItem.run(requestId, item.productId, item.quantity, item.purpose);
      }

      return requestId;
    });

    return transaction();
  }

  static findByPeriod(periodId, { department, page = 1, pageSize = 20 } = {}) {
    const db = getDb();
    let countSql = 'SELECT COUNT(*) as total FROM purchase_requests WHERE period_id = ?';
    let dataSql = 'SELECT * FROM purchase_requests WHERE period_id = ?';
    const params = [periodId];

    if (department && department.trim()) {
      const cond = ' AND department LIKE ?';
      countSql += cond;
      dataSql += cond;
      params.push(`%${department.trim()}%`);
    }

    const countParams = [...params];
    const total = db.prepare(countSql).get(...countParams).total;

    dataSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const list = db.prepare(dataSql).all(...params);

    // 获取每条记录的物品数量
    const itemCountStmt = db.prepare(
      'SELECT COUNT(*) as count FROM purchase_request_items WHERE request_id = ?'
    );
    for (const req of list) {
      req.itemCount = itemCountStmt.get(req.id).count;
    }

    return { list, total, page, pageSize };
  }

  static findById(id) {
    const db = getDb();
    const request = db.prepare('SELECT * FROM purchase_requests WHERE id = ?').get(id);
    if (!request) return null;

    request.items = db.prepare(`
      SELECT pri.*, p.name as product_name, p.unit, p.spec, p.price, c.name as category_name
      FROM purchase_request_items pri
      JOIN products p ON pri.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE pri.request_id = ?
      ORDER BY pri.id ASC
    `).all(id);

    return request;
  }

  static update(id, employeeName, department, items) {
    const db = getDb();

    const transaction = db.transaction(() => {
      // 更新主表
      db.prepare('UPDATE purchase_requests SET employee_name = ?, department = ? WHERE id = ?')
        .run(employeeName, department, id);

      // 删除旧的明细
      db.prepare('DELETE FROM purchase_request_items WHERE request_id = ?').run(id);

      // 插入新的明细
      const insertItem = db.prepare(
        'INSERT INTO purchase_request_items (request_id, product_id, quantity, purpose) VALUES (?, ?, ?, ?)'
      );
      for (const item of items) {
        insertItem.run(id, item.productId, item.quantity, item.purpose);
      }
    });

    transaction();
    return this.findById(id);
  }

  static delete(id) {
    const db = getDb();
    // ON DELETE CASCADE 会自动删除明细
    db.prepare('DELETE FROM purchase_requests WHERE id = ?').run(id);
  }

  static getStatistics(periodId) {
    const db = getDb();

    const totalRequests = db.prepare(
      'SELECT COUNT(*) as count FROM purchase_requests WHERE period_id = ?'
    ).get(periodId).count;

    const totalEmployees = db.prepare(
      'SELECT COUNT(DISTINCT employee_name || department) as count FROM purchase_requests WHERE period_id = ?'
    ).get(periodId).count;

    const categoryStats = db.prepare(`
      SELECT c.name as category_name, SUM(pri.quantity) as total_quantity, COUNT(DISTINCT pri.product_id) as product_count
      FROM purchase_request_items pri
      JOIN products p ON pri.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN purchase_requests pr ON pri.request_id = pr.id
      WHERE pr.period_id = ?
      GROUP BY c.id
      ORDER BY total_quantity DESC
    `).all(periodId);

    const topProducts = db.prepare(`
      SELECT p.name as product_name, p.unit, c.name as category_name, SUM(pri.quantity) as total_quantity
      FROM purchase_request_items pri
      JOIN products p ON pri.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN purchase_requests pr ON pri.request_id = pr.id
      WHERE pr.period_id = ?
      GROUP BY pri.product_id
      ORDER BY total_quantity DESC
      LIMIT 10
    `).all(periodId);

    return { totalRequests, totalEmployees, categoryStats, topProducts };
  }

  static getExportData(periodId) {
    const db = getDb();
    return db.prepare(`
      SELECT
        pr.employee_name, pr.department, pr.created_at,
        p.name as product_name, p.unit, p.spec, p.price,
        c.name as category_name,
        pri.quantity, pri.purpose
      FROM purchase_request_items pri
      JOIN purchase_requests pr ON pri.request_id = pr.id
      JOIN products p ON pri.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE pr.period_id = ?
      ORDER BY pr.created_at DESC, pr.id, pri.id
    `).all(periodId);
  }
}

module.exports = PurchaseRequest;
