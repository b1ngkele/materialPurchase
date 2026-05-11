import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  NavBar,
  Steps,
  Input,
  TextArea,
  CheckList,
  SearchBar,
  Stepper,
  Result,
  SpinLoading,
  Toast,
  Card,
  Tag,
  Empty,
  DotLoading,
  Popup,
} from 'antd-mobile';
import {
  getActivePeriod,
  getCategories,
  getProducts,
  submitPurchaseRequest,
} from '@/services/api';
import styles from './index.module.css';

const { Step } = Steps;

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  category_id: number;
  name: string;
  unit: string;
  spec: string;
  price: number;
  category_name: string;
}

interface SelectedItem {
  productId: number;
  productName: string;
  unit: string;
  price: number;
  categoryName: string;
  quantity: number;
  purpose: string;
}

const SubmitPage: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activePeriod, setActivePeriod] = useState<any>(null);

  // Step 1: 基本信息
  const [employeeName, setEmployeeName] = useState('');
  const [department, setDepartment] = useState('');

  // Step 2（合并）: 品类筛选 + 物品选择
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  // null 表示"全部"，number 表示激活的品类 id
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Step 3: 数量和用途
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // 提交结果
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showRecord, setShowRecord] = useState(false);
  const [submitTime, setSubmitTime] = useState<string>('');

  // 初始化：同时加载周期、品类、全量物品
  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    try {
      setLoading(true);
      const [periodRes, categoryRes, productRes]: any = await Promise.all([
        getActivePeriod(),
        getCategories(),
        getProducts({}), // 一次性加载全部物品
      ]);
      if (periodRes.code === 0) {
        setActivePeriod(periodRes.data);
      }
      if (categoryRes.code === 0) {
        setCategories(categoryRes.data);
      }
      if (productRes.code === 0) {
        setProducts(productRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 根据品类 Chip + 搜索关键字双重过滤物品
  const filteredProducts = useMemo(() => {
    let list = products;
    // 品类过滤
    if (activeCategoryFilter !== null) {
      list = list.filter((p) => p.category_id === activeCategoryFilter);
    }
    // 关键字过滤
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          p.category_name.toLowerCase().includes(kw),
      );
    }
    return list;
  }, [products, searchKeyword, activeCategoryFilter]);

  // 按品类分组物品
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach((p) => {
      if (!groups[p.category_name]) {
        groups[p.category_name] = [];
      }
      groups[p.category_name].push(p);
    });
    return groups;
  }, [filteredProducts]);

  // Step 导航
  const goNext = () => {
    if (currentStep === 0) {
      if (!employeeName.trim()) {
        Toast.show({ content: '请输入姓名', icon: 'fail' });
        return;
      }
      if (!department.trim()) {
        Toast.show({ content: '请输入部门', icon: 'fail' });
        return;
      }
    }
    if (currentStep === 1) {
      if (selectedProductIds.length === 0) {
        Toast.show({ content: '请至少选择一个物品', icon: 'fail' });
        return;
      }
      // 初始化已选物品的数量和用途
      const items: SelectedItem[] = selectedProductIds.map((pid) => {
        const product = products.find((p) => p.id === pid)!;
        const existing = selectedItems.find((si) => si.productId === pid);
        return {
          productId: pid,
          productName: product.name,
          unit: product.unit,
          price: product.price,
          categoryName: product.category_name,
          quantity: existing?.quantity || 1,
          purpose: existing?.purpose || '',
        };
      });
      setSelectedItems(items);
    }
    setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    setCurrentStep((s) => s - 1);
  };

  // Chip 点击：再次点击同一品类则还原为"全部"
  const handleChipClick = (catId: number) => {
    setActiveCategoryFilter((prev) => (prev === catId ? null : catId));
  };

  // 提交
  const handleSubmit = async () => {
    for (const item of selectedItems) {
      if (item.quantity < 1) {
        Toast.show({ content: `${item.productName} 数量不能小于1`, icon: 'fail' });
        return;
      }
      if (!item.purpose.trim()) {
        Toast.show({ content: `请填写 ${item.productName} 的用途`, icon: 'fail' });
        return;
      }
    }

    try {
      setSubmitting(true);
      const res: any = await submitPurchaseRequest({
        periodId: activePeriod.id,
        employeeName: employeeName.trim(),
        department: department.trim(),
        items: selectedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          purpose: item.purpose.trim(),
        })),
      });

      if (res.code === 0) {
        setSubmitTime(new Date().toLocaleString('zh-CN', { hour12: false }));
        setSubmitSuccess(true);
      } else {
        Toast.show({ content: res.message || '提交失败', icon: 'fail' });
      }
    } catch (err: any) {
      Toast.show({ content: err.message || '提交失败，请稍后重试', icon: 'fail' });
    } finally {
      setSubmitting(false);
    }
  };

  // 重置，继续提交
  const handleReset = () => {
    setCurrentStep(0);
    setEmployeeName('');
    setDepartment('');
    setActiveCategoryFilter(null);
    setSelectedProductIds([]);
    setSelectedItems([]);
    setSearchKeyword('');
    setSubmitSuccess(false);
    setShowRecord(false);
    setSubmitTime('');
  };

  // Loading 状态
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <SpinLoading color="white" style={{ '--size': '48px' }} />
        <p className={styles.loadingText}>加载中...</p>
      </div>
    );
  }

  // 无活跃周期
  if (!activePeriod) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyCard}>
          <Result
            status="info"
            title="暂无采购活动"
            description="当前没有进行中的采购活动，请等待行政部门通知"
          />
        </div>
      </div>
    );
  }

  // 提交成功
  if (submitSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <Result
            status="success"
            title="提交成功"
            description={`您的${activePeriod.title}采购需求已提交成功`}
          />
          <Button
            block
            color="default"
            size="large"
            onClick={() => setShowRecord(true)}
            className={styles.viewRecordBtn}
          >
            查看本次记录
          </Button>
          <Button
            block
            color="primary"
            size="large"
            onClick={handleReset}
            className={styles.continueBtn}
          >
            继续提交
          </Button>
        </div>

        {/* 本次提交记录弹窗 */}
        <Popup
          visible={showRecord}
          onMaskClick={() => setShowRecord(false)}
          position="bottom"
          bodyStyle={{
            borderRadius: '16px 16px 0 0',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          {/* 顶部标题栏 */}
          <div className={styles.popupHeader}>
            <span className={styles.popupTitle}>本次提交记录</span>
            <span className={styles.popupClose} onClick={() => setShowRecord(false)}>×</span>
          </div>

          {/* 提交信息 */}
          <div className={styles.recordMeta}>
            <div className={styles.recordMetaRow}>
              <span>提交人</span>
              <span>{employeeName} · {department}</span>
            </div>
            <div className={styles.recordMetaRow}>
              <span>采购周期</span>
              <span>{activePeriod.title}</span>
            </div>
            <div className={styles.recordMetaRow}>
              <span>提交时间</span>
              <span>{submitTime}</span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* 物品列表 */}
          {selectedItems.map((item) => (
            <div key={item.productId} className={styles.recordItem}>
              <div className={styles.recordItemHeader}>
                <span className={styles.recordItemName}>{item.productName}</span>
                <Tag color="primary" fill="outline">{item.categoryName}</Tag>
              </div>
              <div className={styles.recordItemDetail}>
                数量：<strong>{item.quantity}</strong> {item.unit}
              </div>
              <div className={styles.recordItemDetail}>
                单价：¥{item.price?.toFixed(2)} / {item.unit}
              </div>
              <div className={styles.recordItemDetail}>
                用途：{item.purpose}
              </div>
            </div>
          ))}

          <div className={styles.divider} />

          {/* 底部合计 */}
          <div className={styles.recordSummary}>
            <div className={styles.recordSummaryRow}>
              <span>物品种数</span>
              <span>{selectedItems.length} 种</span>
            </div>
            <div className={styles.recordSummaryRow}>
              <span>合计数量</span>
              <span>{selectedItems.reduce((sum, i) => sum + i.quantity, 0)} 件</span>
            </div>
          </div>
        </Popup>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 顶部标题 */}
      <div className={styles.header}>
        <h1 className={styles.title}>{activePeriod.title}</h1>
        <p className={styles.subtitle}>办公用品采购需求填报</p>
      </div>

      {/* 步骤条：3步 */}
      <div className={styles.stepsWrapper}>
        <Steps current={currentStep}>
          <Step title="基本信息" />
          <Step title="选择物品" />
          <Step title="确认提交" />
        </Steps>
      </div>

      {/* Step 1: 基本信息 */}
      {currentStep === 0 && (
        <div className={styles.stepContent}>
          <Card className={styles.formCard}>
            <div className={styles.formItem}>
              <label className={styles.label}>
                <span className={styles.required}>*</span> 姓名
              </label>
              <Input
                placeholder="请输入您的姓名"
                value={employeeName}
                onChange={setEmployeeName}
                clearable
                className={styles.input}
              />
            </div>
            <div className={styles.formItem}>
              <label className={styles.label}>
                <span className={styles.required}>*</span> 部门
              </label>
              <Input
                placeholder="请输入您的部门"
                value={department}
                onChange={setDepartment}
                clearable
                className={styles.input}
              />
            </div>
          </Card>
          <Button
            block
            color="primary"
            size="large"
            onClick={goNext}
            className={styles.nextBtn}
          >
            下一步
          </Button>
        </div>
      )}

      {/* Step 2: 品类筛选 + 物品选择（合并步骤） */}
      {currentStep === 1 && (
        <div className={styles.stepContent}>
          {/* 品类 Chip 横向滚动筛选条 */}
          <div className={styles.chipScrollContainer}>
            <div
              className={`${styles.chip} ${activeCategoryFilter === null ? styles.chipActive : ''}`}
              onClick={() => setActiveCategoryFilter(null)}
            >
              全部
            </div>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`${styles.chip} ${activeCategoryFilter === cat.id ? styles.chipActive : ''}`}
                onClick={() => handleChipClick(cat.id)}
              >
                {getCategoryIcon(cat.name)} {cat.name}
              </div>
            ))}
          </div>

          {/* 搜索栏 */}
          <SearchBar
            placeholder="搜索物品名称"
            value={searchKeyword}
            onChange={setSearchKeyword}
            className={styles.searchBar}
          />

          {/* 物品列表 */}
          <div className={styles.productList}>
            {Object.entries(groupedProducts).map(([catName, prods]) => (
              <div key={catName} className={styles.productGroup}>
                <div className={styles.groupTitle}>
                  {getCategoryIcon(catName)} {catName}
                </div>
                {prods.map((product) => (
                  <div
                    key={product.id}
                    className={`${styles.productItem} ${
                      selectedProductIds.includes(product.id)
                        ? styles.productItemActive
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedProductIds((prev) =>
                        prev.includes(product.id)
                          ? prev.filter((id) => id !== product.id)
                          : [...prev, product.id],
                      );
                    }}
                  >
                    <div className={styles.productCheckbox}>
                      <div
                        className={`${styles.checkbox} ${
                          selectedProductIds.includes(product.id)
                            ? styles.checkboxChecked
                            : ''
                        }`}
                      >
                        {selectedProductIds.includes(product.id) && '✓'}
                      </div>
                    </div>
                    <div className={styles.productInfo}>
                      <div className={styles.productName}>{product.name}</div>
                      <div className={styles.productMeta}>
                        <Tag color="default" fill="outline">
                          {product.unit}
                        </Tag>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {Object.keys(groupedProducts).length === 0 && (
              <Empty description="未找到相关物品" />
            )}
          </div>

          {/* 底部固定栏：已选数量 + 下一步 */}
          <div className={styles.stickyBottom}>
            <div className={styles.selectedInfo}>
              已选
              <strong className={styles.selectedNum}>{selectedProductIds.length}</strong>
              件物品
            </div>
            <div className={styles.bottomBtnGroup}>
              <Button size="large" onClick={goBack} className={styles.backBtnSmall}>
                上一步
              </Button>
              <Button
                color="primary"
                size="large"
                onClick={goNext}
                className={styles.nextBtnSticky}
              >
                下一步
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: 填写数量和用途 */}
      {currentStep === 2 && (
        <div className={styles.stepContent}>
          <p className={styles.hint}>请为每个物品填写需求数量和用途</p>
          <div className={styles.itemList}>
            {selectedItems.map((item, index) => (
              <Card key={item.productId} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemName}>{item.productName}</span>
                  <Tag color="primary" fill="outline">
                    {item.categoryName}
                  </Tag>
                </div>
                <div className={styles.itemPrice}>
                  单价: ¥{item.price?.toFixed(2)} / {item.unit}
                </div>
                <div className={styles.formItem}>
                  <label className={styles.label}>
                    <span className={styles.required}>*</span> 数量
                  </label>
                  <Stepper
                    min={1}
                    max={9999}
                    value={item.quantity}
                    onChange={(val) => {
                      const newItems = [...selectedItems];
                      newItems[index] = { ...item, quantity: val };
                      setSelectedItems(newItems);
                    }}
                  />
                </div>
                <div className={styles.formItem}>
                  <label className={styles.label}>
                    <span className={styles.required}>*</span> 用途
                  </label>
                  <TextArea
                    placeholder="请输入用途说明"
                    value={item.purpose}
                    onChange={(val) => {
                      const newItems = [...selectedItems];
                      newItems[index] = { ...item, purpose: val };
                      setSelectedItems(newItems);
                    }}
                    rows={2}
                    className={styles.textarea}
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>提交人</span>
              <span>{employeeName} - {department}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>物品总数</span>
              <span>{selectedItems.reduce((sum, i) => sum + i.quantity, 0)} 件</span>
            </div>
          </div>

          <div className={styles.btnGroup}>
            <Button size="large" onClick={goBack} className={styles.backBtn}>
              上一步
            </Button>
            <Button
              color="primary"
              size="large"
              loading={submitting}
              onClick={handleSubmit}
              className={styles.nextBtnHalf}
            >
              提交
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// 品类图标映射
function getCategoryIcon(name: string): string {
  const iconMap: Record<string, string> = {
    '桌面办公用品': '✂️',
    '办公耗材': '🖨️',
    '办公用笔': '🖊️',
    '本、簿、贴类': '📒',
    '文件整理用具': '📁',
    '日用劳保': '🧹',
    '办公设备': '🖥️',
    '电子数码': '🔋',
    '文化用品': '🏆',
  };
  return iconMap[name] || '📦';
}

export default SubmitPage;
