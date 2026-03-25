# Supabase 配置指南

## 1. 创建 Supabase 项目

1. 访问 https://app.supabase.com
2. 点击 "New Project"
3. 填写项目信息（名称、数据库密码等）
4. 等待项目创建完成

## 2. 获取 API 密钥

在项目设置中找到：
- **Project URL**: `Settings` → `API` → `Project URL`
- **Anon Public Key**: `Settings` → `API` → `anon public`

## 3. 配置环境变量

编辑 `.env.local` 文件：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. 创建数据表

1. 在 Supabase  dashboard 中进入 `SQL Editor`
2. 复制 `supabase-schema.sql` 中的 SQL 脚本
3. 点击 "Run" 执行

## 5. 验证连接

重启开发服务器：
```bash
npm run dev
```

如果配置正确，页面将显示真实数据。如果 Supabase 连接失败，会自动降级显示模拟数据。

## 6. 数据表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| name | TEXT | 店铺名称 |
| platform | TEXT | 平台 (天猫/拼多多/抖音) |
| orders | INTEGER | 订单数 |
| gmv | NUMERIC | 成交额 |
| ad_spend | NUMERIC | 广告支出 |
| profit | NUMERIC | 利润 |
| status | TEXT | 状态 |
| status_label | TEXT | 状态标签 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

## 7. 核心查询代码

```typescript
// 筛选特定平台
const { data } = await supabase
  .from('sales')
  .select('*')
  .eq('platform', '天猫')

// 获取全部数据
const { data } = await supabase
  .from('sales')
  .select('*')
```
