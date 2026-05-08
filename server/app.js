const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { initDatabase } = require('./database/init');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 初始化数据库
initDatabase();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 路由
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 托管前端静态资源
const frontendPath = path.join(__dirname, 'public');
app.use(express.static(frontendPath));

// 兜底路由 (SPA 前端路由支持)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built. Please run "npm run build" in client directory.');
  }
});

// 启动服务
app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
});

module.exports = app;
