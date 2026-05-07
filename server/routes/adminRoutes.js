const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const authMiddleware = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const periodController = require('../controllers/periodController');
const purchaseController = require('../controllers/purchaseController');
const productController = require('../controllers/productController');
const exportController = require('../controllers/exportController');

// 登录（不需要鉴权）
router.post('/login', adminController.login);

// 以下路由需要鉴权
router.use(authMiddleware);

// 采购周期管理
router.get('/periods', periodController.getAll);
router.post('/periods', periodController.create);
router.put('/periods/:id/close', periodController.close);
router.put('/periods/:id/activate', periodController.activate);

// 采购需求管理
router.get('/requests', purchaseController.getList);
router.get('/requests/:id', purchaseController.getDetail);
router.put('/requests/:id', purchaseController.update);
router.delete('/requests/:id', purchaseController.delete);

// 统计
router.get('/statistics', purchaseController.getStatistics);

// 导出
router.get('/export', exportController.exportExcel);

// 物品管理
router.get('/products', productController.getAllProducts);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.post('/products/import', upload.single('file'), productController.importProducts);

// 系统设置
router.post('/reset', adminController.resetData);

module.exports = router;
