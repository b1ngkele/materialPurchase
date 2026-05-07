import request from '@/utils/request';

// ===== 公开 API（员工端）=====

/** 获取当前活跃的采购周期 */
export async function getActivePeriod() {
  return request.get('/public/active-period');
}

/** 获取所有品类 */
export async function getCategories() {
  return request.get('/public/categories');
}

/** 获取物品列表 */
export async function getProducts(params: { categoryIds?: string; keyword?: string }) {
  return request.get('/public/products', { params });
}

/** 提交采购需求 */
export async function submitPurchaseRequest(data: {
  periodId: number;
  employeeName: string;
  department: string;
  items: { productId: number; quantity: number; purpose: string }[];
}) {
  return request.post('/public/purchase-request', data);
}

// ===== 后台 API（管理员）=====

/** 管理员登录 */
export async function adminLogin(data: { username: string; password: string }) {
  return request.post('/admin/login', data);
}

/** 获取所有采购周期 */
export async function getPeriods() {
  return request.get('/admin/periods');
}

/** 创建采购周期 */
export async function createPeriod(data: { title: string }) {
  return request.post('/admin/periods', data);
}

/** 关闭采购周期 */
export async function closePeriod(id: number) {
  return request.put(`/admin/periods/${id}/close`);
}

/** 激活采购周期 */
export async function activatePeriod(id: number) {
  return request.put(`/admin/periods/${id}/activate`);
}

/** 获取采购需求列表 */
export async function getRequests(params: {
  periodId: number;
  department?: string;
  page?: number;
  pageSize?: number;
}) {
  return request.get('/admin/requests', { params });
}

/** 获取采购需求详情 */
export async function getRequestDetail(id: number) {
  return request.get(`/admin/requests/${id}`);
}

/** 编辑采购需求 */
export async function updateRequest(id: number, data: any) {
  return request.put(`/admin/requests/${id}`, data);
}

/** 删除采购需求 */
export async function deleteRequest(id: number) {
  return request.delete(`/admin/requests/${id}`);
}

/** 获取统计数据 */
export async function getStatistics(periodId: number) {
  return request.get('/admin/statistics', { params: { periodId } });
}

/** 导出 Excel（返回下载链接） */
export function getExportUrl(periodId: number) {
  const token = localStorage.getItem('admin_token');
  return `/api/admin/export?periodId=${periodId}&token=${token}`;
}

// ===== 物品管理 API =====

/** 获取物品列表（后台分页） */
export async function getAdminProducts(params: {
  keyword?: string;
  categoryId?: number;
  page?: number;
  pageSize?: number;
}) {
  return request.get('/admin/products', { params });
}

/** 新增物品 */
export async function createAdminProduct(data: {
  categoryName: string;
  name: string;
  unit: string;
  spec: string;
  price: number;
  skuCode: string;
}) {
  return request.post('/admin/products', data);
}

/** 编辑物品 */
export async function updateAdminProduct(id: number, data: {
  categoryName: string;
  name: string;
  unit: string;
  spec: string;
  price: number;
  skuCode: string;
}) {
  return request.put(`/admin/products/${id}`, data);
}

/** 删除物品 */
export async function deleteAdminProduct(id: number) {
  return request.delete(`/admin/products/${id}`);
}

/** 导入物品（Excel 上传） */
export async function importAdminProducts(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/admin/products/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// ===== 系统设置 API =====

/** 重置数据（清空除管理员外的所有表） */
export async function resetData() {
  return request.post('/admin/reset');
}
