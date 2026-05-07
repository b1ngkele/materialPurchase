import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'umi';
import { Layout, Menu, Button, Typography, theme } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = theme.useToken();

  // 检查登录状态
  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login', { replace: true });
  };

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: '采购周期管理',
    },
    {
      key: '/admin/requests',
      icon: <FileTextOutlined />,
      label: '需求明细',
    },
    {
      key: '/admin/products',
      icon: <AppstoreOutlined />,
      label: '物品管理',
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        }}
      >
        <div
          style={{
            padding: '20px 16px',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Title
            level={4}
            style={{
              color: 'white',
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            📦 采购管理系统
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            marginTop: 8,
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: 'white',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            danger
          >
            退出登录
          </Button>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#f0f2f5',
            borderRadius: 8,
            minHeight: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
