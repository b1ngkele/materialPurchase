/**
 * 统一响应格式
 */
function success(res, data = null, message = 'success') {
  return res.json({ code: 0, message, data });
}

function error(res, message = 'Internal Server Error', code = 1, statusCode = 500) {
  return res.status(statusCode).json({ code, message, data: null });
}

function badRequest(res, message = 'Bad Request') {
  return error(res, message, 1, 400);
}

function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401, 401);
}

module.exports = { success, error, badRequest, unauthorized };
