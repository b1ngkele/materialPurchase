const { getDb } = require('../database/db');

class Admin {
  static findByUsername(username) {
    const db = getDb();
    return db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  }
}

module.exports = Admin;
