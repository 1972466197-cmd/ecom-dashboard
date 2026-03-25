# 山麓众创科技 - 电商经营数据中台

一个基于 Next.js 16 + Supabase 的电商多平台数据管理系统。

> **🎉 v2.0 新版发布**：支持数据库持久化存储、Excel 导入、实时编辑保存！

## 🎯 功能特性

### 📊 经营看板 (`/`)
- 多平台销售数据汇总（天猫、拼多多、抖音）
- 实时 GMV、利润、ROI 指标卡片
- 平台筛选联动（全部/天猫/拼多多/抖音）
- 日期范围筛选（今日/近 7 天/近 30 天/近 90 天）
- ECharts 数据可视化（柱状图 + 饼图）
- Excel 数据导出
- 自动刷新（1 分钟间隔）

### 🏪 店铺销售情况 (`/sales`)
- **分组查看**（海林组、培君组、淑贞组、敏贞组）
- **店铺展开**：查看每日详细数据
- **实时编辑**：双击单元格直接修改，自动保存到数据库
- **日期筛选**：自定义日期范围
- **核心指标**：支付金额、订单数、推广费、净利、ROI 等 30+ 字段

### 📥 数据导入 (`/import`)
- **Excel 导入**：上传 Excel 文件批量导入销售数据
- **店铺选择**：选择要导入的店铺
- **数据预览**：导入前预览前 5 行
- **智能覆盖**：相同店铺 + 日期的数据自动更新
- **模板支持**：提供标准 Excel 模板（见 `IMPORT_TEMPLATE.md`）

### 📦 商品管理 (`/products`)
- 商品列表展示（名称、SKU、价格、成本、库存、销量）
- 商品状态管理（售卖中、已下架、库存预警）
- 多平台上架状态显示
- 商品搜索（名称/SKU）
- 类目筛选
- 状态筛选
- 新增/编辑商品模态框

### 🔐 用户认证 (`/login`)
- Supabase Auth 邮箱登录
- 快速登录（开发模式）
- 角色权限（管理员、运营、查看者）

### 🔗 WPS 同步 (`/wps`)
- WPS 金山文档连接管理
- 自动同步任务配置
- 同步记录查看
- 可用文档列表
- 同步映射说明（商品/订单/库存）

### ⚙️ 系统设置 (`/settings`)
- 店铺管理（启用/禁用店铺）
- API 密钥配置（Supabase 等）
- 通知设置（邮件、库存预警、日报、系统告警）
- 系统配置（时区、数据保留期限）

## 🚀 快速开始

### 方式 A：完整配置（推荐）

**1. 创建 Supabase 项目**
```
访问 https://app.supabase.com 创建新项目
```

**2. 安装依赖**
```bash
cd ecom-dashboard
npm install
```

**3. 配置环境变量**
创建 `.env.local` 文件：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://你的项目 ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon 密钥
```

**4. 创建数据库表**
在 Supabase SQL Editor 中运行 `supabase-schema-full.sql`

**5. 启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:3000

---

### 方式 B：快速体验（本地测试）

**1. 安装依赖**
```bash
cd ecom-dashboard
npm install
```

**2. 启动开发服务器**
```bash
npm run dev
```

**3. 快速登录**
访问 http://localhost:3000/login，点击"快速登录（跳过认证）"

> ⚠️ 注意：此模式下数据存储在 localStorage，刷新页面会重置

---

### 📖 详细配置指南

查看 [`DATABASE_SETUP.md`](./DATABASE_SETUP.md) 获取完整的数据库配置说明。

## 📁 项目结构

```
ecom-dashboard/
├── .env.local                      # 环境变量
├── src/
│   ├── app/
│   │   ├── page.tsx                # 经营看板（首页）
│   │   ├── login/
│   │   │   └── page.tsx            # 用户登录/注册
│   │   ├── products/
│   │   │   └── page.tsx            # 商品管理
│   │   ├── sales/
│   │   │   └── page.tsx            # 店铺销售情况（数据库版）
│   │   ├── import/
│   │   │   └── page.tsx            # 数据导入（Excel）
│   │   ├── wps/
│   │   │   └── page.tsx            # WPS 同步
│   │   ├── shops/
│   │   │   └── page.tsx            # 店铺每日盈亏
│   │   ├── profit/
│   │   │   └── page.tsx            # 利润监控
│   │   └── settings/
│   │       └── page.tsx            # 系统设置
│   ├── components/
│   │   └── Dashboard.tsx           # 仪表盘组件
│   └── lib/
│       └── supabase.ts             # Supabase 客户端
├── supabase-schema.sql             # 数据库表结构（旧版）
├── supabase-schema-full.sql        # 完整数据库表结构（新版）
├── DATABASE_SETUP.md               # 数据库配置指南
├── IMPORT_TEMPLATE.md              # Excel 导入模板说明
└── README.md                       # 项目说明
```

## 🛠 技术栈

- **框架**: Next.js 16 (App Router)
- **数据库**: Supabase (PostgreSQL)
- **样式**: Tailwind CSS
- **图表**: ECharts
- **导出**: XLSX (Excel 导出)
- **语言**: TypeScript

## 📊 数据库表结构

### sales 表
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

## 🔐 安全提示

- `.env.local` 文件不要提交到 Git
- Supabase Anon Key 是公开密钥，可以安全用于前端
- Secret Key 绝对不能暴露在前端代码中
- 生产环境请启用 Supabase RLS（行级安全）

## 📝 开发进度

### ✅ 已完成
- [x] 用户登录/认证（Supabase Auth）
- [x] 完整数据库表结构（8 张表）
- [x] 店铺销售数据页面（数据库版）
- [x] Excel 数据导入功能
- [x] 实时编辑保存（双击单元格）
- [x] 店铺分组管理
- [x] 商品管理页面

### 🚧 进行中
- [ ] 商品管理数据库化（当前仍用 localStorage）
- [ ] 店铺管理页面
- [ ] 利润监控页面

### 📋 规划中
- [ ] 订单管理（导入、审核、发货）
- [ ] 采购管理
- [ ] 库存预警
- [ ] 多用户权限管理
- [ ] API 对接（淘宝、抖音开放平台）
- [ ] 部署到 Vercel
- [ ] 移动端适配优化

## 📄 License

MIT
