# Supabase 数据保存配置指南

## 📋 功能特性

### ✅ 已实现

1. **Upsert 去重保存**
   - 同一天 + 同一个店铺的数据自动覆盖更新
   - 不会创建重复记录

2. **绿色提示框**
   - 保存成功后显示绿色提示框
   - 3 秒后自动消失

3. **自动刷新图表**
   - 保存成功后自动刷新数据
   - 无需手动刷新页面

4. **持久化存储**
   - 数据保存在 Supabase
   - 刷新页面数据不丢失

---

## 🗄️ 数据库表结构

### 1. sales_data（销售数据表）

```sql
CREATE TABLE sales_data (
  id BIGSERIAL PRIMARY KEY,
  shop_name VARCHAR(100) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  sku_code VARCHAR(50),
  sales_amount DECIMAL(12,2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  refund_amount DECIMAL(12,2) DEFAULT 0,
  refund_order_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_name, date, sku_code)
);
```

**去重约束：** `UNIQUE(shop_name, date, sku_code)`

### 2. daily_marketing（推广消耗表）

```sql
CREATE TABLE daily_marketing (
  id BIGSERIAL PRIMARY KEY,
  shop_name VARCHAR(100) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  taobao_ztc_spend DECIMAL(12,2) DEFAULT 0,
  douyin_qc_spend DECIMAL(12,2) DEFAULT 0,
  other_spend DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_name, date)
);
```

**去重约束：** `UNIQUE(shop_name, date)`

---

## 💻 使用方法

### 1. 导入工具函数

```typescript
import { 
  saveSalesData, 
  saveMarketingData,
  loadSalesData,
  loadMarketingData 
} from '@/lib/supabase-data'
```

### 2. 保存销售数据

```typescript
// 保存单条记录
await saveSalesData('淘宝楠箐', '2026-03-23', {
  sales_amount: 15000,
  order_count: 150,
  refund_amount: 500,
  platform: 'taobao'
})
```

**Upsert 逻辑：**
- 如果 `shop_name='淘宝楠箐'` + `date='2026-03-23'` 的记录已存在 → **覆盖更新**
- 如果不存在 → **创建新记录**

### 3. 保存推广数据

```typescript
await saveMarketingData('淘宝楠箐', '2026-03-23', {
  taobao_ztc_spend: 5000,
  douyin_qc_spend: 0,
  other_spend: 500,
  platform: 'taobao'
})
```

### 4. 加载数据

```typescript
// 加载销售数据
const salesData = await loadSalesData('淘宝楠箐', '2026-03-01', '2026-03-23')

// 加载推广数据
const marketingData = await loadMarketingData('淘宝楠箐')
```

---

## 🟢 绿色提示框实现

### 组件代码

```typescript
const [toast, setToast] = useState<{ 
  message: string
  type: 'success' | 'error' 
} | null>(null)

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  setToast({ message, type })
  setTimeout(() => setToast(null), 3000) // 3 秒后自动消失
}

// 使用
{toast && (
  <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
    toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } text-white animate-pulse`}>
    {toast.message}
  </div>
)}
```

### 样式说明

| 类型 | 颜色 | 说明 |
|------|------|------|
| success | bg-green-500 | 成功提示（绿色） |
| error | bg-red-500 | 错误提示（红色） |

---

## 🔄 自动刷新图表

### 实现方式

```typescript
const [refreshKey, setRefreshKey] = useState(0)

// 刷新函数
const refreshCharts = () => {
  setRefreshKey(prev => prev + 1)
  loadData() // 重新加载数据
  showToast('数据已更新', 'success')
}

// 监听 refreshKey 变化
useEffect(() => {
  loadData()
}, [refreshKey])
```

### 保存后自动刷新

```typescript
const handleSave = async () => {
  try {
    await saveSalesData(shopName, date, data)
    
    // 保存成功后
    showToast('数据已保存到 Supabase！✅', 'success')
    refreshCharts() // 自动刷新图表
  } catch (error) {
    showToast('保存失败', 'error')
  }
}
```

---

## 📁 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 数据工具 | `src/lib/supabase-data.ts` | Supabase CRUD 操作 |
| 示例页面 | `src/app/sales-supabase/page.tsx` | 完整示例 |
| 利润监控 | `src/app/profit/page.tsx` | 已集成 Supabase |

---

## 🎯 完整示例

### 销售数据录入页面

访问：http://localhost:3000/sales-supabase

**功能：**
1. 选择店铺
2. 填写日期、销售金额、订单数等
3. 点击"保存到 Supabase"
4. ✅ 显示绿色提示框
5. 🔄 自动刷新下方数据表格

**代码示例：**

```typescript
const handleSave = async () => {
  setIsSaving(true)
  try {
    // 1. 保存销售数据（upsert 去重）
    await saveSalesData(shopName, date, {
      sales_amount,
      order_count,
      refund_amount
    })
    
    // 2. 保存推广数据（upsert 去重）
    await saveMarketingData(shopName, date, {
      taobao_ztc_spend: adCost
    })
    
    // 3. 显示成功提示
    showToast('数据已保存到 Supabase！✅', 'success')
    
    // 4. 自动刷新图表
    setRefreshKey(prev => prev + 1)
  } catch (error) {
    showToast('保存失败', 'error')
  } finally {
    setIsSaving(false)
  }
}
```

---

## ⚠️ 注意事项

### 1. 环境变量配置

确保 `.env.local` 中有：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. 数据库权限

确保已创建 RLS 策略：

```sql
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON sales_data 
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Allow authenticated write" ON sales_data 
  FOR ALL TO authenticated USING (TRUE);
```

### 3. Upsert 冲突字段

确保 UNIQUE 约束正确：

```sql
-- 销售数据
UNIQUE(shop_name, date, sku_code)

-- 推广数据
UNIQUE(shop_name, date)
```

---

## 🔧 常见问题

### Q1: 保存失败，提示权限错误？

**解决：** 检查 RLS 策略是否已配置

### Q2: 数据重复保存？

**解决：** 检查 UNIQUE 约束和 upsert 的 onConflict 字段

### Q3: 提示框不显示？

**解决：** 检查 toast 状态是否正确更新

### Q4: 图表不刷新？

**解决：** 检查 refreshKey 是否正确递增

---

## 📞 技术支持

- Supabase 文档：https://supabase.com/docs
- Next.js 文档：https://nextjs.org/docs

**祝使用愉快！** 🎉
