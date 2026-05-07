const path = require('path');
const bcrypt = require('bcryptjs');
const { getDb } = require('./db');
const { initDatabase } = require('./init');

/**
 * 从 Excel 导入品类和物品数据到 SQLite
 * 使用 exceljs 解析 xlsx 文件
 */
async function seedData() {
  const ExcelJS = require('exceljs');

  // 初始化数据库表
  initDatabase();

  const db = getDb();
  const excelPath = path.join(__dirname, '../../1.2026年新签合同采购物品清单名录.xlsx');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);

  const worksheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];

  // 收集品类和物品数据
  let currentCategory = '';
  let categoryOrder = 0;
  const categoriesMap = new Map(); // name -> id
  let productCount = 0;

  // 准备插入语句
  const insertCategory = db.prepare(
    'INSERT OR IGNORE INTO categories (name, sort_order) VALUES (?, ?)'
  );
  const insertProduct = db.prepare(
    'INSERT INTO products (category_id, name, unit, spec, price, sku_code) VALUES (?, ?, ?, ?, ?, ?)'
  );

  // 清除已有数据（重新导入）
  db.exec('DELETE FROM purchase_request_items');
  db.exec('DELETE FROM purchase_requests');
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM categories');

  const insertAll = db.transaction(() => {
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头

      const categoryVal = row.getCell(1).value;
      const nameVal = row.getCell(3).value;
      const unitVal = row.getCell(4).value;
      const specVal = row.getCell(5).value;
      const priceVal = row.getCell(6).value;
      const skuVal = row.getCell(9).value;

      // 处理品类（合并单元格，只有第一行有值）
      if (categoryVal && String(categoryVal).trim()) {
        currentCategory = String(categoryVal).trim();
        if (!categoriesMap.has(currentCategory)) {
          categoryOrder++;
          const result = insertCategory.run(currentCategory, categoryOrder);
          // 获取插入后的 ID
          const cat = db.prepare('SELECT id FROM categories WHERE name = ?').get(currentCategory);
          categoriesMap.set(currentCategory, cat.id);
        }
      }

      // 处理物品
      if (nameVal && String(nameVal).trim() && currentCategory) {
        const categoryId = categoriesMap.get(currentCategory);
        const name = String(nameVal).trim();
        const unit = unitVal ? String(unitVal).trim() : '';
        const spec = specVal ? String(specVal).trim() : '';
        const price = typeof priceVal === 'number' ? priceVal : parseFloat(priceVal) || 0;
        const sku = skuVal ? String(skuVal).trim() : '';

        insertProduct.run(categoryId, name, unit, spec, price, sku);
        productCount++;
      }
    });
  });

  insertAll();

  console.log(`Imported ${categoriesMap.size} categories and ${productCount} products.`);

  // 创建默认管理员账号
  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admin_users (username, password) VALUES (?, ?)').run('admin', hashedPassword);
    console.log('Default admin account created: admin / admin123');
  } else {
    console.log('Admin account already exists, skipping.');
  }

  console.log('Seed completed successfully!');
}

seedData().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
