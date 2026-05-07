const Period = require('../models/Period');
const { success, error, badRequest } = require('../utils/response');

const periodController = {
  // 获取当前活跃的采购周期（公开）
  getActivePeriod(req, res) {
    try {
      const period = Period.findActive();
      return success(res, period || null);
    } catch (err) {
      console.error('Get active period error:', err);
      return error(res, '获取采购周期失败');
    }
  },

  // 获取所有采购周期（后台）
  getAll(req, res) {
    try {
      const periods = Period.findAll();
      return success(res, periods);
    } catch (err) {
      console.error('Get periods error:', err);
      return error(res, '获取采购周期列表失败');
    }
  },

  // 创建新采购周期
  create(req, res) {
    try {
      const { title } = req.body;
      if (!title || !title.trim()) {
        return badRequest(res, '请输入采购周期名称');
      }
      const period = Period.create(title.trim());
      return success(res, period, '采购周期创建成功');
    } catch (err) {
      console.error('Create period error:', err);
      return error(res, '创建采购周期失败');
    }
  },

  // 关闭采购周期
  close(req, res) {
    try {
      const { id } = req.params;
      const period = Period.findById(id);
      if (!period) {
        return badRequest(res, '采购周期不存在');
      }
      const updated = Period.close(id);
      return success(res, updated, '采购周期已关闭');
    } catch (err) {
      console.error('Close period error:', err);
      return error(res, '关闭采购周期失败');
    }
  },

  // 重新激活采购周期
  activate(req, res) {
    try {
      const { id } = req.params;
      const period = Period.findById(id);
      if (!period) {
        return badRequest(res, '采购周期不存在');
      }
      const updated = Period.activate(id);
      return success(res, updated, '采购周期已激活');
    } catch (err) {
      console.error('Activate period error:', err);
      return error(res, '激活采购周期失败');
    }
  },
};

module.exports = periodController;
