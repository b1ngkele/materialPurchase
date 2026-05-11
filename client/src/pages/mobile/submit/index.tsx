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

  // Step 2: 品类选择
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  // Step 3: 物品选择
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Step 4: 数量和用途
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // 提交结果
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // 初始化
  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    try {
      setLoading(true);
      const [periodRes, categoryRes]: any = await Promise.all([
        getActivePeriod(),
        getCategories(),
      ]);
      if (periodRes.code === 0) {
        setActivePeriod(periodRes.data);
      }
      if (categoryRes.code === 0) {
        setCategories(categoryRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 加载物品数据
  const loadProducts = async (categoryIds: number[]) => {
    try {
      setProductsLoading(true);
      const res: any = await getProducts({
        categoryIds: categoryIds.join(','),
      });
      if (res.code === 0) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  // 根据搜索关键字过滤物品
  const filteredProducts = useMemo(() => {
    if (!searchKeyword.trim()) return products;
    const kw = searchKeyword.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        p.category_name.toLowerCase().includes(kw),
    );
  }, [products, searchKeyword]);

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
      if (selectedCategoryIds.length === 0) {
        Toast.show({ content: '请至少选择一个品类', icon: 'fail' });
        return;
      }
      // 加载物品
      loadProducts(selectedCategoryIds);
    }
    if (currentStep === 2) {
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

  // 提交
  const handleSubmit = async () => {
    // 校验
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
    setSelectedCategoryIds([]);
    setSelectedProductIds([]);
    setSelectedItems([]);
    setSearchKeyword('');
    setSubmitSuccess(false);
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
            color="primary"
            size="large"
            onClick={handleReset}
            className={styles.continueBtn}
          >
            继续提交
          </Button>
        </div>
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

      {/* 步骤条 */}
      <div className={styles.stepsWrapper}>
        <Steps current={currentStep}>
          <Step title="基本信息" />
          <Step title="选择品类" />
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

      {/* Step 2: 选择品类 */}
      {currentStep === 1 && (
        <div className={styles.stepContent}>
          <p className={styles.hint}>请选择您需要采购的物品品类（可多选）</p>
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`${styles.categoryCard} ${
                  selectedCategoryIds.includes(cat.id) ? styles.categoryCardActive : ''
                }`}
                onClick={() => {
                  setSelectedCategoryIds((prev) =>
                    prev.includes(cat.id)
                      ? prev.filter((id) => id !== cat.id)
                      : [...prev, cat.id],
                  );
                }}
              >
                <span className={styles.categoryIcon}>
                  {getCategoryIcon(cat.name)}
                </span>
                <span className={styles.categoryName}>{cat.name}</span>
                {selectedCategoryIds.includes(cat.id) && (
                  <span className={styles.checkMark}>✓</span>
                )}
              </div>
            ))}
          </div>
          <div className={styles.btnGroup}>
            <Button size="large" onClick={goBack} className={styles.backBtn}>
              上一步
            </Button>
            <Button
              color="primary"
              size="large"
              onClick={goNext}
              className={styles.nextBtnHalf}
            >
              下一步
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: 选择物品 */}
      {currentStep === 2 && (
        <div className={styles.stepContent}>
          <SearchBar
            placeholder="搜索物品名称"
            value={searchKeyword}
            onChange={setSearchKeyword}
            className={styles.searchBar}
          />

          {productsLoading ? (
            <div className={styles.centerLoading}>
              <DotLoading color="primary" />
              <span>加载中...</span>
            </div>
          ) : (
            <div className={styles.productList}>
              {Object.entries(groupedProducts).map(([catName, prods]) => (
                <div key={catName} className={styles.productGroup}>
                  <div className={styles.groupTitle}>{catName}</div>
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
                          {/* <span className={styles.productPrice}>
                            ¥{product.price?.toFixed(2)}
                          </span> */}
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
          )}

          <div className={styles.selectedCount}>
            已选择 <strong>{selectedProductIds.length}</strong> 个物品
          </div>

          <div className={styles.btnGroup}>
            <Button size="large" onClick={goBack} className={styles.backBtn}>
              上一步
            </Button>
            <Button
              color="primary"
              size="large"
              onClick={goNext}
              className={styles.nextBtnHalf}
            >
              下一步
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: 填写数量和用途 */}
      {currentStep === 3 && (
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
