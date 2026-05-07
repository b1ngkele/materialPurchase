const PurchaseRequest = require('../models/PurchaseRequest');
const Period = require('../models/Period');
const { success, error, badRequest } = require('../utils/response');

const purchaseController = {
  // 员工提交采购需求（公开）
  submit(req, res) {
    try {
      const { periodId, employeeName, department, items } = req.body;

      // 参数校验
      if (!periodId) return badRequest(res, '缺少采购周期');
      if (!employeeName || !employeeName.trim()) return badRequest(res, '请输入姓名');
      if (!department || !department.trim()) return badRequest(res, '请输入部门');
      if (!items || !Array.isArray(items) || items.length === 0) {
        return badRequest(res, '请至少选择一个物品');
      }

      // 校验每个物品的数量和用途
      for (const item of items) {
        if (!item.productId) return badRequest(res, '物品信息不完整');
        if (!item.quantity || item.quantity < 1) return badRequest(res, '请输入正确的数量');
        if (!item.purpose || !item.purpose.trim()) return badRequest(res, '请输入用途');
      }

      // 校验周期是否存在且活跃
      const period = Period.findById(periodId);
      if (!period || period.status !== 'active') {
        return badRequest(res, '当前采购周期已关闭或不存在');
      }

      const requestId = PurchaseRequest.create(
        periodId,
        employeeName.trim(),
        department.trim(),
        items
      );

      return success(res, { requestId }, '提交成功');
    } catch (err) {
      console.error('Submit purchase request error:', err);
      return error(res, '提交失败，请稍后重试');
    }
  },

  // 后台查询采购需求列表
  getList(req, res) {
    try {
      const { periodId, department, page = 1, pageSize = 20 } = req.query;
      if (!periodId) return badRequest(res, '请选择采购周期');

      const result = PurchaseRequest.findByPeriod(Number(periodId), {
        department,
        page: Number(page),
        pageSize: Number(pageSize),
      });

      return success(res, result);
    } catch (err) {
      console.error('Get purchase requests error:', err);
      return error(res, '获取采购需求列表失败');
    }
  },

  // 后台查询单条采购需求详情
  getDetail(req, res) {
    try {
      const { id } = req.params;
      const request = PurchaseRequest.findById(id);
      if (!request) return badRequest(res, '采购需求不存在');
      return success(res, request);
    } catch (err) {
      console.error('Get purchase request detail error:', err);
      return error(res, '获取采购需求详情失败');
    }
  },

  // 后台编辑采购需求
  update(req, res) {
    try {
      const { id } = req.params;
      const { employeeName, department, items } = req.body;

      const existing = PurchaseRequest.findById(id);
      if (!existing) return badRequest(res, '采购需求不存在');

      if (!employeeName || !employeeName.trim()) return badRequest(res, '请输入姓名');
      if (!department || !department.trim()) return badRequest(res, '请输入部门');
      if (!items || !Array.isArray(items) || items.length === 0) {
        return badRequest(res, '请至少选择一个物品');
      }

      const updated = PurchaseRequest.update(id, employeeName.trim(), department.trim(), items);
      return success(res, updated, '更新成功');
    } catch (err) {
      console.error('Update purchase request error:', err);
      return error(res, '更新失败');
    }
  },

  // 后台删除采购需求
  delete(req, res) {
    try {
      const { id } = req.params;
      const existing = PurchaseRequest.findById(id);
      if (!existing) return badRequest(res, '采购需求不存在');

      PurchaseRequest.delete(id);
      return success(res, null, '删除成功');
    } catch (err) {
      console.error('Delete purchase request error:', err);
      return error(res, '删除失败');
    }
  },

  // 后台统计数据
  getStatistics(req, res) {
    try {
      const { periodId } = req.query;
      if (!periodId) return badRequest(res, '请选择采购周期');

      const stats = PurchaseRequest.getStatistics(Number(periodId));
      return success(res, stats);
    } catch (err) {
      console.error('Get statistics error:', err);
      return error(res, '获取统计数据失败');
    }
  },
};

module.exports = purchaseController;
