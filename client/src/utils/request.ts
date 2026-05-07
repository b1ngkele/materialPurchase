import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截器：自动携带 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      // 如果在 admin 路由下，跳转到登录页
      if (window.location.pathname.startsWith('/admin') && 
          !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  },
);

export default request;
