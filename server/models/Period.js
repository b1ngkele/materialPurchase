const { getDb } = require('../database/db');

class Period {
  static findAll() {
    const db = getDb();
    return db.prepare('SELECT * FROM periods ORDER BY created_at DESC').all();
  }

  static findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM periods WHERE id = ?').get(id);
  }

  static findActive() {
    const db = getDb();
    return db.prepare("SELECT * FROM periods WHERE status = 'active' LIMIT 1").get();
  }

  static create(title) {
    const db = getDb();
    // 先关闭所有已有的活跃周期
    db.prepare("UPDATE periods SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE status = 'active'").run();
    // 创建新周期
    const result = db.prepare('INSERT INTO periods (title) VALUES (?)').run(title);
    return this.findById(result.lastInsertRowid);
  }

  static close(id) {
    const db = getDb();
    db.prepare("UPDATE periods SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    return this.findById(id);
  }

  static activate(id) {
    const db = getDb();
    // 先关闭所有已有的活跃周期
    db.prepare("UPDATE periods SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE status = 'active'").run();
    // 激活指定周期
    db.prepare("UPDATE periods SET status = 'active', closed_at = NULL WHERE id = ?").run(id);
    return this.findById(id);
  }
}

module.exports = Period;
