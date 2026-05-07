const { getDb } = require('../database/db');

class Category {
  static findAll() {
    const db = getDb();
    return db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  }

  static findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  }

  static findOrCreate(name) {
    const db = getDb();
    let category = db.prepare('SELECT * FROM categories WHERE name = ?').get(name);
    if (!category) {
      const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM categories').get();
      const sortOrder = (maxOrder.max_order || 0) + 1;
      db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run(name, sortOrder);
      category = db.prepare('SELECT * FROM categories WHERE name = ?').get(name);
    }
    return category;
  }
}

module.exports = Category;
