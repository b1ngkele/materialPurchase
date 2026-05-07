const ExcelJS = require('exceljs');
const PurchaseRequest = require('../models/PurchaseRequest');
const Period = require('../models/Period');
const { badRequest } = require('../utils/response');

const exportController = {
  async exportExcel(req, res) {
    try {
      const { periodId } = req.query;
      if (!periodId) return badRequest(res, '请选择采购周期');

      const period = Period.findById(periodId);
      if (!period) return badRequest(res, '采购周期不存在');

      const data = PurchaseRequest.getExportData(Number(periodId));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('采购需求汇总');

      // 设置表头
      worksheet.columns = [
        { header: '姓名', key: 'employee_name', width: 12 },
        { header: '部门', key: 'department', width: 15 },
        { header: '品类', key: 'category_name', width: 15 },
        { header: '物品名称', key: 'product_name', width: 30 },
        { header: '规格', key: 'spec', width: 15 },
        { header: '单位', key: 'unit', width: 8 },
        { header: '含税单价(元)', key: 'price', width: 14 },
        { header: '数量', key: 'quantity', width: 8 },
        { header: '用途', key: 'purpose', width: 25 },
        { header: '提交时间', key: 'created_at', width: 20 },
      ];

      // 设置表头样式
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // 添加数据
      data.forEach(row => {
        worksheet.addRow(row);
      });

      // 设置响应头
      const fileName = encodeURIComponent(`${period.title}-采购需求汇总.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${fileName}`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('Export error:', err);
      return require('../utils/response').error(res, '导出失败');
    }
  },
};

module.exports = exportController;
