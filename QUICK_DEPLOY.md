# 🚀 快速部署上线指南

## ✅ 构建成功

生产环境构建已完成，可以部署上线！

---

## 方法一：Vercel 部署（推荐，5 分钟上线）

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

选择登录方式（GitHub/GitLab/Email）

### 3. 部署项目

```bash
cd E:\山麓众创科技有限公司\ecom-dashboard
vercel --prod
```

### 4. 配置环境变量

在 Vercel 控制台添加：

```
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase Anon Key
```

### 5. 完成！

访问返回的网址，如：`https://your-project.vercel.app`

---

## 方法二：Netlify 部署

### 1. 安装 Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. 部署

```bash
netlify deploy --prod --dir=dist
```

---

## 方法三：手动部署到服务器

### 1. 上传构建文件

将以下文件上传到服务器：
- `.next/` 文件夹
- `package.json`
- `next.config.ts`
- `public/` 文件夹

### 2. 安装依赖

```bash
npm install --production
```

### 3. 设置环境变量

```bash
export NEXT_PUBLIC_SUPABASE_URL=你的 URL
export NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Key
```

### 4. 启动服务

```bash
npm run start
```

或使用 PM2：

```bash
npm install -g pm2
pm2 start npm --name "ecom-dashboard" -- start
pm2 save
```

---

## 📋 部署前检查清单

- [x] ✅ 生产构建成功
- [ ] 环境变量已配置
- [ ] Supabase 数据库已创建
- [ ] Supabase RLS 策略已配置
- [ ] 测试过所有页面

---

## 🔧 Supabase 配置

### 1. 执行数据库脚本

在 Supabase SQL Editor 中执行：
```
E:\山麓众创科技有限公司\ecom-dashboard\supabase-profit-schema.sql
```

### 2. 配置 RLS

```sql
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_marketing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON sales_data 
  FOR SELECT TO authenticated, anon USING (TRUE);

CREATE POLICY "Allow public write" ON sales_data 
  FOR ALL TO authenticated, anon USING (TRUE);

CREATE POLICY "Allow public read" ON daily_marketing 
  FOR SELECT TO authenticated, anon USING (TRUE);

CREATE POLICY "Allow public write" ON daily_marketing 
  FOR ALL TO authenticated, anon USING (TRUE);
```

### 3. 获取密钥

访问：https://app.supabase.com
- Settings → API
- 复制 Project URL 和 anon public key

---

## 🌐 上线后的网址

部署成功后访问：
- **生产环境**: `https://your-project.vercel.app`
- **手机访问**: 同上（已适配移动端）

---

## ⚡ 最快上线流程

```bash
# 1. 安装 Vercel
npm install -g vercel

# 2. 登录
vercel login

# 3. 部署
cd E:\山麓众创科技有限公司\ecom-dashboard
vercel --prod

# 4. 在 Vercel 控制台配置环境变量
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY

# 5. 完成！访问返回的网址
```

---

## 📊 项目页面

上线后可访问的页面：

| 页面 | 路由 | 说明 |
|------|------|------|
| 经营看板 | `/` | 数据汇总和图表 |
| 商品管理 | `/products` | 商品上下架管理 |
| 店铺销售 | `/sales` | 店铺销售数据表格 |
| 数据导入 | `/import` | Excel 导入和手动填写 |
| 店铺每日盈亏 | `/shops` | 店铺分组管理 |
| 利润监控 | `/profit` | 利润趋势和预警 |
| WPS 导入 | `/wps/import` | WPS 文档导入 |
| 系统设置 | `/settings` | 系统配置 |

---

## 🎯 上线后优化

上线后可以慢慢优化：

### 性能优化
- [ ] 启用 Vercel Analytics
- [ ] 配置 CDN 缓存
- [ ] 图片懒加载
- [ ] 代码分割

### 功能优化
- [ ] 添加用户登录
- [ ] 数据权限控制
- [ ] 操作日志记录
- [ ] 数据备份功能

### SEO 优化
- [ ] 添加 meta 标签
- [ ] 配置 sitemap.xml
- [ ] 添加 robots.txt

---

## 📞 遇到问题？

### 构建失败
```bash
# 本地测试构建
npm run build

# 查看具体错误并修复
```

### 环境变量不生效
- 检查变量名是否正确（大写）
- 检查是否以 `NEXT_PUBLIC_` 开头
- 重新部署项目

### Supabase 连接失败
- 检查 URL 是否正确
- 检查 Anon Key 是否正确
- 检查 RLS 策略是否配置

---

**祝部署顺利！** 🎉
