const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const config = require('../config');
const { success, badRequest, unauthorized } = require('../utils/response');

const adminController = {
  login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return badRequest(res, '请输入用户名和密码');
      }

      const admin = Admin.findByUsername(username);
      if (!admin) {
        return unauthorized(res, '用户名或密码错误');
      }

      const isValid = bcrypt.compareSync(password, admin.password);
      if (!isValid) {
        return unauthorized(res, '用户名或密码错误');
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return success(res, { token, username: admin.username }, '登录成功');
    } catch (err) {
      console.error('Login error:', err);
      return require('../utils/response').error(res, '登录失败');
    }
  },

  // 重置数据（清空除 admin_users 外的所有表）
  resetData(req, res) {
    try {
      const { resetDatabase } = require('../database/init');
      resetDatabase();
      return success(res, null, '数据已重置');
    } catch (err) {
      console.error('Reset data error:', err);
      return require('../utils/response').error(res, '重置失败');
    }
  },
};

module.exports = adminController;
