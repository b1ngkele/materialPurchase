const Category = require('../models/Category');
const { success, error } = require('../utils/response');

const categoryController = {
  // 获取所有品类
  getAll(req, res) {
    try {
      const categories = Category.findAll();
      return success(res, categories);
    } catch (err) {
      console.error('Get categories error:', err);
      return error(res, '获取品类列表失败');
    }
  },
};

module.exports = categoryController;
