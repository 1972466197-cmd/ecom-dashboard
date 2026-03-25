# 利润监控系统配置指南

## 📋 目录

1. [数据库配置](#数据库配置)
2. [前端配置](#前端配置)
3. [使用说明](#使用说明)
4. [预警规则](#预警规则)

---

## 数据库配置

### 1. 执行 SQL 脚本

在 Supabase SQL Editor 中运行：

```bash
# 打开 E:\山麓众创科技有限公司\ecom-dashboard\supabase-profit-schema.sql
# 复制全部内容到 Supabase SQL Editor
# 点击 Run 执行
```

**执行顺序：**
1. 创建表结构（daily_marketing、sku_costs、sales_data）
2. 创建视图（daily_profit_view、shop_daily_summary）
3. 创建预警表（profit_alerts）
4. 创建触发器函数（check_profit_alerts）
5. 插入示例数据

### 2. 验证表结构

```sql
-- 检查表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('daily_marketing', 'sku_costs', 'sales_data', 'profit_alerts');

-- 检查视图是否创建成功
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname IN ('daily_profit_view', 'shop_daily_summary');
```

### 3. 配置 RLS（可选）

如果需要行级安全：

```sql
-- 启用 RLS
ALTER TABLE daily_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_alerts ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Allow authenticated read" ON daily_marketing 
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Allow authenticated write" ON daily_marketing 
  FOR ALL TO authenticated USING (TRUE);
```

---

## 前端配置

### 1. 安装依赖

```bash
cd E:\山麓众创科技有限公司\ecom-dashboard
npm install chart.js react-chartjs-2
```

### 2. 配置环境变量

在 `.env.local` 中添加：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 添加路由

在侧边栏添加利润监控链接：

```tsx
<a href="/profit" className="block py-2 px-4 bg-slate-800 rounded">
  💰 利润监控
</a>
```

### 4. 启动项目

```bash
npm run dev
```

访问：http://localhost:3000/profit

---

## 使用说明

### 数据录入

#### 1. 录入 SKU 成本

```sql
INSERT INTO sku_costs (sku_code, product_name, shop_name, purchase_price, shipping_cost)
VALUES 
  ('TS-001', '春夏 T 恤', '淘宝楠箐', 35.00, 8.00),
  ('JN-002', '休闲牛仔裤', '淘宝楠箐', 80.00, 10.00);
```

#### 2. 录入推广消耗

```sql
INSERT INTO daily_marketing 
  (shop_name, platform, date, taobao_ztc_spend, douyin_qc_spend, other_spend)
VALUES 
  ('淘宝楠箐', 'taobao', '2026-03-23', 5000.00, 0, 500),
  ('抖音楠箐', 'douyin', '2026-03-23', 0, 8000.00, 1000);
```

#### 3. 录入销售数据

```sql
INSERT INTO sales_data 
  (shop_name, platform, date, sku_code, sales_amount, order_count, item_count)
VALUES 
  ('淘宝楠箐', 'taobao', '2026-03-23', 'TS-001', 15000.00, 150, 200);
```

### 查看利润数据

#### 查询每日利润

```sql
SELECT 
  date,
  shop_name,
  net_sales,
  product_cost,
  total_marketing,
  net_profit,
  gross_margin_rate,
  roi,
  is_below_break_even
FROM daily_profit_view
WHERE date >= CURRENT_DATE - 30
ORDER BY date DESC;
```

#### 查询预警店铺

```sql
SELECT 
  shop_name,
  date,
  alert_type,
  alert_level,
  message,
  created_at
FROM profit_alerts
WHERE is_resolved = FALSE
ORDER BY 
  CASE alert_level WHEN 'critical' THEN 1 ELSE 2 END,
  created_at DESC;
```

---

## 预警规则

### 1. ROI 预警

| 级别 | 条件 | 说明 |
|------|------|------|
| ⚠️ 警告 | ROI < 3.7 | 低于损益平衡点 |
| 🔴 严重 | ROI < 2.6 | 低于损益平衡点 70% |

**损益平衡点计算：**
```
break_even_roi = 1 / (毛利率 - 其他费用率)
               = 1 / (0.35 - 0.08)
               ≈ 3.7
```

### 2. 净利润预警

| 级别 | 条件 | 说明 |
|------|------|------|
| ⚠️ 警告 | 净利润 < 0 | 亏损 |
| 🔴 严重 | 净利润 < -10000 | 严重亏损 |

### 3. 毛利率预警

| 级别 | 条件 | 说明 |
|------|------|------|
| ⚠️ 警告 | 毛利率 < 20% | 毛利过低 |
| 🔴 严重 | 毛利率 < 10% | 严重偏低 |

---

## 利润计算公式

### 净利润

```
净利润 = 销售额 - 退款 
       - 产品成本 - 快递费 
       - 推广费（直通车 + 千川 + 其他）
       - 平台扣点 (5%) - 税费 (3%)
```

### 毛利率

```
毛利率 = (销售额 - 退款 - 产品成本 - 快递费) / (销售额 - 退款) × 100%
```

### 净利率

```
净利率 = 净利润 / (销售额 - 退款) × 100%
```

### ROI

```
ROI = (销售额 - 退款) / 推广总消耗
```

---

## 前端看板功能

### 1. 利润趋势图

- 📈 净利润趋势（绿色线）
- 💙 毛利率趋势（蓝色线）
- 🧡 ROI 趋势（橙色线）

### 2. 推广消耗对比

- 🟠 淘宝直通车（橙色柱）
- ⚫ 抖音千川（黑色柱）

### 3. 预警中心

- 🔴 严重预警（红色背景）
- 🟡 一般警告（黄色背景）
- ✅ 已解决（绿色按钮）

### 4. 详细数据表

- 红色高亮：ROI 低于损益平衡点
- 绿色标记：正常盈利
- 实时状态标识

---

## 常见问题

### Q1: 数据不更新？

**解决：**
```sql
-- 刷新视图
REFRESH MATERIALIZED VIEW daily_profit_view;

-- 检查触发器
SELECT * FROM pg_trigger WHERE tgname = 'trg_check_profit_alerts';
```

### Q2: 预警不触发？

**解决：**
```sql
-- 手动检查预警
SELECT * FROM profit_alerts 
WHERE is_resolved = FALSE 
ORDER BY created_at DESC;

-- 清理旧预警
UPDATE profit_alerts 
SET is_resolved = TRUE, resolved_at = NOW()
WHERE date < CURRENT_DATE - 30;
```

### Q3: 利润计算不准确？

**检查：**
1. SKU 成本是否已配置
2. 推广数据是否已录入
3. 销售数据是否完整
4. 视图计算逻辑是否正确

---

## 优化建议

### 1. 自动化数据同步

- 对接淘宝直通车 API
- 对接抖音千川 API
- 自动同步销售数据

### 2. 增强预警功能

- 邮件通知
- 短信通知
- 钉钉/企业微信机器人

### 3. 数据分析

- 店铺利润排名
- SKU 利润分析
- 推广效果对比
- 趋势预测

---

## 联系支持

如有问题，请查看：
- Supabase 文档：https://supabase.com/docs
- Chart.js 文档：https://www.chartjs.org/docs

**祝使用愉快！** 🎉
