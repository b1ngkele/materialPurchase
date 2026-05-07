const Product = require('../models/Product');
const Category = require('../models/Category');
const { success, error, badRequest } = require('../utils/response');

const productController = {
  // 获取物品列表（支持按品类筛选 + 关键字搜索）—— 公开接口
  getProducts(req, res) {
    try {
      const { categoryIds, keyword } = req.query;
      let ids = [];
      if (categoryIds) {
        ids = categoryIds.split(',').map(Number).filter(n => !isNaN(n));
      }
      const products = Product.findByCategoryIds(ids, keyword || '');
      return success(res, products);
    } catch (err) {
      console.error('Get products error:', err);
      return error(res, '获取物品列表失败');
    }
  },

  // ===== 后台方法 =====

  // 后台分页列表
  getAllProducts(req, res) {
    try {
      const { keyword, categoryId, page = 1, pageSize = 20 } = req.query;
      const result = Product.findAllPaginated({
        keyword: keyword || '',
        categoryId: categoryId || undefined,
        page: Number(page),
        pageSize: Number(pageSize),
      });
      return success(res, result);
    } catch (err) {
      console.error('Get all products error:', err);
      return error(res, '获取物品列表失败');
    }
  },

  // 手动新增物品
  createProduct(req, res) {
    try {
      const { categoryName, name, unit, spec, price, skuCode } = req.body;

      // 必填校验
      if (!categoryName || !categoryName.trim()) return badRequest(res, '请输入品类');
      if (!name || !name.trim()) return badRequest(res, '请输入物资名称');
      if (!unit || !unit.trim()) return badRequest(res, '请输入单位');
      if (!spec || !spec.trim()) return badRequest(res, '请输入规格');
      if (price === undefined || price === null || price === '') return badRequest(res, '请输入含税价');
      if (!skuCode || !skuCode.trim()) return badRequest(res, '请输入SKU编码');

      // 查找或创建品类
      const category = Category.findOrCreate(categoryName.trim());

      // 检查 SKU 是否已存在
      const { getDb } = require('../database/db');
      const db = getDb();
      const existing = db.prepare('SELECT id FROM products WHERE sku_code = ?').get(skuCode.trim());
      if (existing) {
        return badRequest(res, `SKU编码 ${skuCode.trim()} 已存在`);
      }

      const product = Product.create({
        categoryId: category.id,
        name: name.trim(),
        unit: unit.trim(),
        spec: spec.trim(),
        price: Number(price),
        skuCode: skuCode.trim(),
      });

      return success(res, product, '添加成功');
    } catch (err) {
      console.error('Create product error:', err);
      return error(res, '添加失败');
    }
  },

  // 编辑物品
  updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { categoryName, name, unit, spec, price, skuCode } = req.body;

      const existing = Product.findById(id);
      if (!existing) return badRequest(res, '物品不存在');

      if (!categoryName || !categoryName.trim()) return badRequest(res, '请输入品类');
      if (!name || !name.trim()) return badRequest(res, '请输入物资名称');
      if (!unit || !unit.trim()) return badRequest(res, '请输入单位');
      if (!spec || !spec.trim()) return badRequest(res, '请输入规格');
      if (price === undefined || price === null || price === '') return badRequest(res, '请输入含税价');
      if (!skuCode || !skuCode.trim()) return badRequest(res, '请输入SKU编码');

      // 检查 SKU 是否与其他物品冲突
      const { getDb } = require('../database/db');
      const db = getDb();
      const conflict = db.prepare('SELECT id FROM products WHERE sku_code = ? AND id != ?').get(skuCode.trim(), Number(id));
      if (conflict) {
        return badRequest(res, `SKU编码 ${skuCode.trim()} 已被其他物品使用`);
      }

      const category = Category.findOrCreate(categoryName.trim());

      const updated = Product.update(Number(id), {
        categoryId: category.id,
        name: name.trim(),
        unit: unit.trim(),
        spec: spec.trim(),
        price: Number(price),
        skuCode: skuCode.trim(),
      });

      return success(res, updated, '更新成功');
    } catch (err) {
      console.error('Update product error:', err);
      return error(res, '更新失败');
    }
  },

  // 删除物品
  deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const existing = Product.findById(id);
      if (!existing) return badRequest(res, '物品不存在');

      Product.deleteById(Number(id));
      return success(res, null, '删除成功');
    } catch (err) {
      console.error('Delete product error:', err);
      if (err.message && err.message.includes('关联')) {
        return badRequest(res, err.message);
      }
      return error(res, '删除失败');
    }
  },

  // Excel 导入物品
  async importProducts(req, res) {
    try {
      if (!req.file) {
        return badRequest(res, '请上传 Excel 文件');
      }

      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return badRequest(res, 'Excel 文件中没有找到工作表');
      }

      let currentCategory = '';
      let created = 0;
      let updated = 0;
      let skipped = 0;
      let total = 0;
      const errors = [];

      const { getDb } = require('../database/db');
      const db = getDb();

      const transaction = db.transaction(() => {
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
          }

          // 跳过没有名称或 SKU 的行
          if (!nameVal || !String(nameVal).trim() || !skuVal || !String(skuVal).trim()) {
            skipped++;
            return;
          }

          total++;

          const name = String(nameVal).trim();
          const unit = unitVal ? String(unitVal).trim() : '';
          const spec = specVal ? String(specVal).trim() : '';
          const price = typeof priceVal === 'number' ? priceVal : parseFloat(priceVal) || 0;
          const skuCode = String(skuVal).trim();

          try {
            const category = Category.findOrCreate(currentCategory || '未分类');
            const result = Product.upsertBySku({
              categoryId: category.id,
              name,
              unit,
              spec,
              price,
              skuCode,
            });

            if (result.action === 'created') {
              created++;
            } else {
              updated++;
            }
          } catch (e) {
            errors.push(`第${rowNumber}行: ${e.message}`);
            skipped++;
          }
        });
      });

      transaction();

      return success(res, {
        total,
        created,
        updated,
        skipped,
        errors: errors.slice(0, 10), // 最多返回前10条错误
      }, `导入完成：新增 ${created} 条，覆盖 ${updated} 条，跳过 ${skipped} 条`);
    } catch (err) {
      console.error('Import products error:', err);
      return error(res, '导入失败: ' + err.message);
    }
  },
};

module.exports = productController;
