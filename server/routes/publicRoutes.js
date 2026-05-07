const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const periodController = require('../controllers/periodController');
const purchaseController = require('../controllers/purchaseController');

// 获取当前活跃的采购周期
router.get('/active-period', periodController.getActivePeriod);

// 获取所有品类
router.get('/categories', categoryController.getAll);

// 获取物品列表（支持品类筛选+搜索）
router.get('/products', productController.getProducts);

// 员工提交采购需求
router.post('/purchase-request', purchaseController.submit);

module.exports = router;
