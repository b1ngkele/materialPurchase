import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Statistic,
  Row,
  Col,
  message,
  Space,
  Popconfirm,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import {
  getPeriods,
  createPeriod,
  closePeriod,
  activatePeriod,
  getStatistics,
} from '@/services/api';

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [activePeriodId, setActivePeriodId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const res: any = await getPeriods();
      if (res.code === 0) {
        setPeriods(res.data);
        // 找到活跃的周期并加载统计
        const active = res.data.find((p: any) => p.status === 'active');
        if (active) {
          setActivePeriodId(active.id);
          loadStatistics(active.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async (periodId: number) => {
    try {
      const res: any = await getStatistics(periodId);
      if (res.code === 0) {
        setStatistics(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const res: any = await createPeriod({ title: values.title });
      if (res.code === 0) {
        message.success('创建成功');
        setCreateModalOpen(false);
        form.resetFields();
        loadPeriods();
      } else {
        message.error(res.message);
      }
    } catch (err) {
      // form validation error
    }
  };

  const handleClose = async (id: number) => {
    try {
      const res: any = await closePeriod(id);
      if (res.code === 0) {
        message.success('已关闭');
        loadPeriods();
      }
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleActivate = async (id: number) => {
    try {
      const res: any = await activatePeriod(id);
      if (res.code === 0) {
        message.success('已激活');
        loadPeriods();
      }
    } catch (err) {
      message.error('操作失败');
    }
  };

  const mobileUrl = `${window.location.origin}/mobile/submit`;

  const columns = [
    {
      title: '周期名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) =>
        status === 'active' ? (
          <Tag color="green">进行中</Tag>
        ) : (
          <Tag color="default">已关闭</Tag>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '关闭时间',
      dataIndex: 'closed_at',
      key: 'closed_at',
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'active' ? (
            <Popconfirm
              title="确认关闭此采购周期？"
              onConfirm={() => handleClose(record.id)}
            >
              <Button
                type="link"
                danger
                icon={<PauseCircleOutlined />}
              >
                关闭
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="确认激活此采购周期？（当前活跃的周期将被关闭）"
              onConfirm={() => handleActivate(record.id)}
            >
              <Button type="link" icon={<PlayCircleOutlined />}>
                激活
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      {statistics && activePeriodId && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card
              style={{ borderRadius: 12 }}
              bodyStyle={{ padding: '20px 24px' }}
            >
              <Statistic
                title="总提交次数"
                value={statistics.totalRequests}
                valueStyle={{ color: '#667eea' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card
              style={{ borderRadius: 12 }}
              bodyStyle={{ padding: '20px 24px' }}
            >
              <Statistic
                title="提交人数"
                value={statistics.totalEmployees}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card
              style={{ borderRadius: 12 }}
              bodyStyle={{ padding: '20px 24px' }}
            >
              <Statistic
                title="涉及品类数"
                value={statistics.categoryStats?.length || 0}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 周期管理 */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>采购周期管理</Title>}
        extra={
          <Space>
            <Button
              icon={<QrcodeOutlined />}
              onClick={() => setQrModalOpen(true)}
            >
              查看二维码
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              新建采购周期
            </Button>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Table
          dataSource={periods}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 创建周期弹窗 */}
      <Modal
        title="新建采购周期"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="周期名称"
            rules={[{ required: true, message: '请输入周期名称' }]}
          >
            <Input placeholder="例如：2026年5月采购" />
          </Form.Item>
        </Form>
        <Text type="secondary">
          注意：创建新周期后，当前活跃的周期将自动关闭
        </Text>
      </Modal>

      {/* 二维码弹窗 */}
      <Modal
        title="员工扫码入口"
        open={qrModalOpen}
        onCancel={() => setQrModalOpen(false)}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <QRCodeSVG value={mobileUrl} size={200} />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" copyable={{ text: mobileUrl }}>
              {mobileUrl}
            </Text>
          </div>
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">
              员工扫描此二维码即可填写采购需求
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
