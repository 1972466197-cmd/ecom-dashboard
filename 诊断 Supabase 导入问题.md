# 🔍 诊断 Supabase 导入问题

## 在浏览器控制台运行诊断

1. 打开 http://localhost:3000/import
2. 按 `F12` 打开开发者工具
3. 切换到 Console 标签
4. 粘贴以下代码并回车：

```javascript
// 诊断脚本
(async () => {
  console.log('=== 开始诊断 ===\n')
  
  // 1. 检查 Supabase 客户端
  const { supabase } = await import('@/lib/supabase')
  console.log('1. Supabase 客户端:', supabase ? '✅ 已初始化' : '❌ 未初始化')
  
  // 2. 检查表是否存在
  console.log('\n2. 检查表结构...')
  const { data: test1, error: err1 } = await supabase.from('shop_daily_reports').select('*').limit(1)
  console.log('shop_daily_reports:', err1 ? `❌ ${err1.message}` : '✅ 可访问')
  
  const { data: test2, error: err2 } = await supabase.from('sales_data').select('*').limit(1)
  console.log('sales_data:', err2 ? `❌ ${err2.message}` : '✅ 可访问')
  
  // 3. 测试插入
  console.log('\n3. 测试插入数据...')
  const testRow = {
    shop_id: 1,
    stat_date: '2026-03-27',
    paying_amount: 999,
    visitors: 999
  }
  
  const { data: insertData, error: insertError } = await supabase
    .from('shop_daily_reports')
    .insert([testRow])
    .select()
  
  if (insertError) {
    console.log('❌ 插入失败:', insertError)
  } else {
    console.log('✅ 插入成功:', insertData)
    
    // 清理测试数据
    const { error: delError } = await supabase
      .from('shop_daily_reports')
      .delete()
      .eq('shop_id', 1)
      .eq('stat_date', '2026-03-27')
    
    console.log('清理测试数据:', delError ? `❌ ${delError.message}` : '✅ 已清理')
  }
  
  console.log('\n=== 诊断完成 ===')
})()
```

## 常见问题和解决方案

### 问题 1: RLS 权限不足
**错误信息**: `new row violates row-level security policy`

**解决方案**:
1. 登录 Supabase Dashboard
2. 进入 Authentication → Policies
3. 找到对应的表（shop_daily_reports / sales_data）
4. 添加 INSERT 策略：
```sql
CREATE POLICY "允许插入" ON shop_daily_reports
FOR INSERT
WITH CHECK (true)
```

### 问题 2: 表结构不匹配
**错误信息**: `column "xxx" does not exist`

**解决方案**:
检查数据库表字段是否与代码匹配：
```sql
-- 查看表结构
\d shop_daily_reports
\d sales_data
```

### 问题 3: 冲突字段错误
**错误信息**: `there is no unique or exclusion constraint`

**解决方案**:
确保表有正确的唯一约束：
```sql
-- shop_daily_reports
ALTER TABLE shop_daily_reports 
ADD CONSTRAINT unique_shop_date 
UNIQUE (shop_id, stat_date);

-- sales_data
ALTER TABLE sales_data 
ADD CONSTRAINT unique_shop_date 
UNIQUE (shop_id, date);
```

### 问题 4: 数据类型不匹配
**错误信息**: `invalid input syntax for type ...`

**解决方案**:
检查导入的数据格式：
- 日期字段必须是 `YYYY-MM-DD` 格式
- 数值字段不能包含非数字字符
- 必填字段不能为空

## 检查数据库表结构

在 Supabase SQL Editor 中运行：

```sql
-- 检查 shop_daily_reports 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shop_daily_reports'
ORDER BY ordinal_position;

-- 检查 sales_data 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales_data'
ORDER BY ordinal_position;

-- 检查唯一约束
SELECT constraint_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'shop_daily_reports'
AND constraint_name LIKE '%unique%';

-- 检查 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('shop_daily_reports', 'sales_data');
```

## 临时解决方案：禁用 RLS

**仅用于测试，生产环境不要禁用！**

```sql
-- 临时禁用 RLS
ALTER TABLE shop_daily_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_data DISABLE ROW LEVEL SECURITY;

-- 测试导入后，记得重新启用
ALTER TABLE shop_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
```

## 查看导入日志

导入时查看浏览器控制台的详细日志：

```
开始导入数据：{ template: 'sales', shopId: 1, rowCount: 10 }
测试插入数据：{ shop_id: 1, stat_date: '2026-03-27', ... }
测试插入成功：[{ id: 123, shop_id: 1, ... }]
批量插入成功：9
```

如果看到 `测试插入失败`，说明是权限或表结构问题。
如果看到 `测试插入成功` 但 `批量插入失败`，说明是数据格式问题。
