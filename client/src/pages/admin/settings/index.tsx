import React, { useState } from 'react';
import { Card, Button, Typography, Modal, message, Alert, Space } from 'antd';
import {
  ExclamationCircleFilled,
  DeleteOutlined,
} from '@ant-design/icons';
import { resetData } from '@/services/api';

const { Title, Text, Paragraph } = Typography;

const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    Modal.confirm({
      title: '确认重置所有数据？',
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          <Paragraph type="danger" style={{ marginBottom: 8 }}>
            此操作将清空以下所有数据，且不可恢复：
          </Paragraph>
          <ul style={{ paddingLeft: 20, color: '#666' }}>
            <li>所有品类数据</li>
            <li>所有物品数据</li>
            <li>所有采购周期</li>
            <li>所有员工采购需求记录</li>
          </ul>
          <Text type="secondary">管理员账号不受影响。</Text>
        </div>
      ),
      okText: '确认重置',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          setLoading(true);
          const res: any = await resetData();
          if (res.code === 0) {
            message.success('数据已重置');
          } else {
            message.error(res.message || '重置失败');
          }
        } catch (err: any) {
          message.error(err.message || '重置失败');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div>
      <Card
        title={<Title level={5} style={{ margin: 0 }}>系统设置</Title>}
        style={{ borderRadius: 12 }}
      >
        <Card
          type="inner"
          title="数据管理"
          style={{ borderRadius: 8 }}
        >
          <Alert
            message="危险操作"
            description="重置数据将清空所有品类、物品、采购周期和采购需求数据。管理员账号不受影响。此操作不可恢复，请谨慎操作。"
            type="warning"
            showIcon
            style={{ marginBottom: 20 }}
          />
          <Button
            danger
            type="primary"
            icon={<DeleteOutlined />}
            loading={loading}
            onClick={handleReset}
            size="large"
          >
            重置所有数据
          </Button>
        </Card>
      </Card>
    </div>
  );
};

export default SettingsPage;
