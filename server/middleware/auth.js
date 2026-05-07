const jwt = require('jsonwebtoken');
const config = require('../config');
const { unauthorized } = require('../utils/response');

function authMiddleware(req, res, next) {
  let token = null;

  // 优先从 Authorization header 获取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 其次从 query 参数获取（用于文件下载等场景）
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return unauthorized(res, '未提供有效的认证令牌');
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.adminUser = decoded;
    next();
  } catch (err) {
    return unauthorized(res, '认证令牌无效或已过期');
  }
}

module.exports = authMiddleware;
