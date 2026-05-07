module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'material-purchase-secret-key-2026',
  jwtExpiresIn: '7d',
};
