import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  InputNumber,
  Popconfirm,
  Upload,
  Tag,
  message,
  Typography,
  Result,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  importAdminProducts,
  getCategories,
} from '@/services/api';

const { Title, Text } = Typography;

const ProductsPage: React.FC = () => {
  // 列表状态
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [categories, setCategories] = useState<any[]>([]);

  // 新增/编辑弹窗
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();

  // 导入弹窗
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // 初始化
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, pageSize]);

  const loadCategories = async () => {
    try {
      const res: any = await getCategories();
      if (res.code === 0) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await getAdminProducts({
        keyword,
        categoryId: selectedCategoryId,
        page,
        pageSize,
      });
      if (res.code === 0) {
        setProducts(res.data.list);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedCategoryId, page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    loadProducts();
  };

  // 新增
  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setFormModalOpen(true);
  };

  // 编辑
  const handleEdit = (record: any) => {
    setEditingProduct(record);
    form.setFieldsValue({
      categoryName: record.category_name,
      name: record.name,
      unit: record.unit,
      spec: record.spec,
      price: record.price,
      skuCode: record.sku_code,
    });
    setFormModalOpen(true);
  };

  // 提交新增/编辑
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      setFormLoading(true);

      let res: any;
      if (editingProduct) {
        res = await updateAdminProduct(editingProduct.id, values);
      } else {
        res = await createAdminProduct(values);
      }

      if (res.code === 0) {
        message.success(editingProduct ? '更新成功' : '添加成功');
        setFormModalOpen(false);
        form.resetFields();
        loadProducts();
        loadCategories(); // 刷新品类列表（可能新建了品类）
      } else {
        message.error(res.message);
      }
    } catch (err: any) {
      if (err.message) message.error(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // 删除
  const handleDelete = async (id: number) => {
    try {
      const res: any = await deleteAdminProduct(id);
      if (res.code === 0) {
        message.success('删除成功');
        loadProducts();
      } else {
        message.error(res.message);
      }
    } catch (err: any) {
      message.error(err.message || '删除失败');
    }
  };

  // 导入
  const handleImport = async (file: File) => {
    try {
      setImportLoading(true);
      setImportResult(null);
      const res: any = await importAdminProducts(file);
      if (res.code === 0) {
        setImportResult(res.data);
        message.success(res.message);
        loadProducts();
        loadCategories();
      } else {
        message.error(res.message);
      }
    } catch (err: any) {
      message.error(err.message || '导入失败');
    } finally {
      setImportLoading(false);
    }
    return false; // 阻止 Upload 组件默认上传
  };

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: (file) => {
      handleImport(file);
      return false;
    },
  };

  const columns = [
    {
      title: '品类',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 130,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '物资名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 70,
    },
    {
      title: '规格',
      dataIndex: 'spec',
      key: 'spec',
      width: 140,
      ellipsis: true,
    },
    {
      title: '含税价(元)',
      dataIndex: 'price',
      key: 'price',
      width: 110,
      render: (val: number) => (
        <Text style={{ color: '#ff6b35', fontWeight: 500 }}>
          ¥{val?.toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'SKU编码',
      dataIndex: 'sku_code',
      key: 'sku_code',
      width: 130,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除此物品？"
            description="如果该物品已有关联的采购记录则无法删除"
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

  return (
    <div>
      <Card
        title={<Title level={5} style={{ margin: 0 }}>物品管理</Title>}
        extra={
          <Space>
            <Upload {...uploadProps}>
              <Button icon={<ImportOutlined />} loading={importLoading}>
                导入 Excel
              </Button>
            </Upload>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              手动添加
            </Button>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        {/* 筛选栏 */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="按品类筛选"
            allowClear
            value={selectedCategoryId}
            onChange={(val) => setSelectedCategoryId(val)}
            style={{ width: 160 }}
            options={categories.map((c: any) => ({
              label: c.name,
              value: c.id,
            }))}
          />
          <Input
            placeholder="搜索物品名称或SKU"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
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

        {/* 导入结果提示 */}
        {importResult && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 8,
            }}
          >
            <Text>
              导入完成 — 新增{' '}
              <Text strong style={{ color: '#52c41a' }}>
                {importResult.created}
              </Text>{' '}
              条，覆盖{' '}
              <Text strong style={{ color: '#faad14' }}>
                {importResult.updated}
              </Text>{' '}
              条，跳过{' '}
              <Text strong style={{ color: '#999' }}>
                {importResult.skipped}
              </Text>{' '}
              条
            </Text>
            <Button
              type="link"
              size="small"
              onClick={() => setImportResult(null)}
              style={{ float: 'right' }}
            >
              关闭
            </Button>
          </div>
        )}

        {/* 表格 */}
        <Table
          dataSource={products}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 个物品`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingProduct ? '编辑物品' : '手动添加物品'}
        open={formModalOpen}
        onOk={handleFormSubmit}
        onCancel={() => {
          setFormModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={formLoading}
        okText={editingProduct ? '保存' : '添加'}
        cancelText="取消"
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="categoryName"
            label="品类"
            rules={[{ required: true, message: '请选择或输入品类' }]}
          >
            <Select
              showSearch
              placeholder="选择品类或输入新品类"
              options={categories.map((c: any) => ({
                label: c.name,
                value: c.name,
              }))}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="物资名称"
            rules={[{ required: true, message: '请输入物资名称' }]}
          >
            <Input placeholder="请输入物资名称" />
          </Form.Item>
          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item
              name="unit"
              label="单位"
              rules={[{ required: true, message: '请输入单位' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="如：个、支、盒" />
            </Form.Item>
            <Form.Item
              name="price"
              label="含税价(元)"
              rules={[{ required: true, message: '请输入含税价' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                placeholder="0.00"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Space>
          <Form.Item
            name="spec"
            label="规格"
            rules={[{ required: true, message: '请输入规格' }]}
          >
            <Input placeholder="请输入规格" />
          </Form.Item>
          <Form.Item
            name="skuCode"
            label="SKU编码"
            rules={[{ required: true, message: '请输入SKU编码' }]}
          >
            <Input placeholder="请输入唯一的SKU编码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductsPage;
