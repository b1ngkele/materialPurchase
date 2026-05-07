import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  Input,
  Space,
  Modal,
  Form,
  Descriptions,
  Tag,
  Popconfirm,
  message,
  Typography,
  InputNumber,
} from 'antd';
import {
  SearchOutlined,
  ExportOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  getPeriods,
  getRequests,
  getRequestDetail,
  updateRequest,
  deleteRequest,
  getExportUrl,
} from '@/services/api';

const { Title, Text } = Typography;

const RequestsPage: React.FC = () => {
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>();
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  // 详情弹窗
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentDetail, setCurrentDetail] = useState<any>(null);

  // 编辑弹窗
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editForm] = Form.useForm();

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      loadRequests();
    }
  }, [selectedPeriodId, page, pageSize]);

  const loadPeriods = async () => {
    try {
      const res: any = await getPeriods();
      if (res.code === 0) {
        setPeriods(res.data);
        // 默认选中活跃的周期
        const active = res.data.find((p: any) => p.status === 'active');
        if (active) {
          setSelectedPeriodId(active.id);
        } else if (res.data.length > 0) {
          setSelectedPeriodId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadRequests = async () => {
    if (!selectedPeriodId) return;
    try {
      setLoading(true);
      const res: any = await getRequests({
        periodId: selectedPeriodId,
        department: departmentFilter,
        page,
        pageSize,
      });
      if (res.code === 0) {
        setRequests(res.data.list);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadRequests();
  };

  const handleViewDetail = async (id: number) => {
    try {
      const res: any = await getRequestDetail(id);
      if (res.code === 0) {
        setCurrentDetail(res.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      message.error('获取详情失败');
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const res: any = await getRequestDetail(id);
      if (res.code === 0) {
        setEditData(res.data);
        editForm.setFieldsValue({
          employeeName: res.data.employee_name,
          department: res.data.department,
          items: res.data.items.map((item: any) => ({
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            purpose: item.purpose,
          })),
        });
        setEditModalOpen(true);
      }
    } catch (err) {
      message.error('获取详情失败');
    }
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      const res: any = await updateRequest(editData.id, {
        employeeName: values.employeeName,
        department: values.department,
        items: values.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          purpose: item.purpose,
        })),
      });
      if (res.code === 0) {
        message.success('更新成功');
        setEditModalOpen(false);
        loadRequests();
      } else {
        message.error(res.message);
      }
    } catch (err) {
      // form validation error
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res: any = await deleteRequest(id);
      if (res.code === 0) {
        message.success('删除成功');
        loadRequests();
      } else {
        message.error(res.message);
      }
    } catch (err) {
      message.error('删除失败');
    }
  };

  const handleExport = () => {
    if (!selectedPeriodId) {
      message.warning('请先选择采购周期');
      return;
    }
    // 通过 window.open 下载
    const token = localStorage.getItem('admin_token');
    window.open(
      `/api/admin/export?periodId=${selectedPeriodId}&token=${token}`,
      '_blank',
    );
  };

  const columns = [
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '姓名',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 100,
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
    },
    {
      title: '物品数',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 80,
      render: (count: number) => <Tag color="blue">{count} 种</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除此条记录？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const detailItemColumns = [
    { title: '品类', dataIndex: 'category_name', key: 'category_name' },
    { title: '物品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '规格', dataIndex: 'spec', key: 'spec' },
    {
      title: '含税单价',
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => `¥${v?.toFixed(2)}`,
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 60 },
    { title: '用途', dataIndex: 'purpose', key: 'purpose' },
  ];

  return (
    <div>
      <Card
        title={<Title level={5} style={{ margin: 0 }}>采购需求明细</Title>}
        extra={
          <Button
            type="primary"
            icon={<ExportOutlined />}
            onClick={handleExport}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
            }}
          >
            导出 Excel
          </Button>
        }
        style={{ borderRadius: 12 }}
      >
        {/* 筛选栏 */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="选择采购周期"
            value={selectedPeriodId}
            onChange={(val) => {
              setSelectedPeriodId(val);
              setPage(1);
            }}
            style={{ width: 200 }}
            options={periods.map((p) => ({
              label: `${p.title}${p.status === 'active' ? '（进行中）' : ''}`,
              value: p.id,
            }))}
          />
          <Input
            placeholder="按部门筛选"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ width: 160 }}
            allowClear
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            搜索
          </Button>
        </Space>

        {/* 表格 */}
        <Table
          dataSource={requests}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="采购需求详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={800}
      >
        {currentDetail && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="姓名">
                {currentDetail.employee_name}
              </Descriptions.Item>
              <Descriptions.Item label="部门">
                {currentDetail.department}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间" span={2}>
                {currentDetail.created_at}
              </Descriptions.Item>
            </Descriptions>
            <Table
              dataSource={currentDetail.items}
              columns={detailItemColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </>
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑采购需求"
        open={editModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={700}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="employeeName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="department"
            label="部门"
            rules={[{ required: true, message: '请输入部门' }]}
          >
            <Input />
          </Form.Item>

          <Form.List name="items">
            {(fields) => (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  物品明细
                </Text>
                {fields.map((field) => {
                  const item = editForm.getFieldValue(['items', field.name]);
                  return (
                    <Card
                      key={field.key}
                      size="small"
                      style={{ marginBottom: 8 }}
                      title={item?.productName}
                    >
                      <Space>
                        <Form.Item
                          {...field}
                          name={[field.name, 'quantity']}
                          label="数量"
                          rules={[{ required: true, message: '请输入数量' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={1} />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, 'purpose']}
                          label="用途"
                          rules={[{ required: true, message: '请输入用途' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input style={{ width: 300 }} />
                        </Form.Item>
                      </Space>
                      <Form.Item
                        {...field}
                        name={[field.name, 'productId']}
                        hidden
                      >
                        <Input />
                      </Form.Item>
                    </Card>
                  );
                })}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default RequestsPage;
