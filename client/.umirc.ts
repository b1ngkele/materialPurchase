import { defineConfig } from "@umijs/max";

export default defineConfig({
  npmClient: "npm",
  routes: [
    // 移动端 - 员工填写页面（无需登录）
    { path: "/mobile/submit", component: "./mobile/submit" },

    // 后台 - 登录页
    { path: "/admin/login", component: "./admin/login" },

    // 后台 - 需要布局的页面
    {
      path: "/admin",
      component: "@/layouts/AdminLayout",
      routes: [
        { path: "/admin/dashboard", component: "./admin/dashboard" },
        { path: "/admin/requests", component: "./admin/requests" },
        { path: "/admin/products", component: "./admin/products" },
        { path: "/admin/settings", component: "./admin/settings" },
        { redirect: "/admin/dashboard" },
      ],
    },

    // 默认重定向
    { path: "/", redirect: "/mobile/submit" },
  ],
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      changeOrigin: true,
    },
  },
  title: "长龙数科办公用品需求收集",
  favicons: [],
  hash: true,
});
