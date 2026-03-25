# 🚀 网站部署上线指南

## 快速部署（推荐 Vercel）

### 方法一：Vercel 一键部署（最简单）

#### 1. 准备工作

确保项目已提交到 Git 仓库：

```bash
cd E:\山麓众创科技有限公司\ecom-dashboard

# 初始化 Git（如果还没有）
git init
git add .
git commit -m "Initial commit"
```

#### 2. 推送到 GitHub

```bash
# 在 GitHub 创建新仓库
# 然后执行：
git remote add origin https://github.com/你的用户名/ecom-dashboard.git
git branch -M main
git push -u origin main
```

#### 3. Vercel 部署

1. 访问 https://vercel.com
2. 点击 "Sign Up" 注册/登录（可用 GitHub 账号）
3. 点击 "Add New Project"
4. 选择 "Import Git Repository"
5. 选择你的 `ecom-dashboard` 仓库
6. 点击 "Deploy"
7. 等待部署完成（约 2-5 分钟）
8. 获得上线地址：`https://your-project.vercel.app`

---

### 方法二：Vercel CLI 部署（更快速）

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录 Vercel

```bash
vercel login
```

#### 3. 部署项目

```bash
cd E:\山麓众创科技有限公司\ecom-dashboard
vercel
```

按提示操作：
- Set up and deploy? **Y**
- Which scope? 选择你的账号
- Link to existing project? **N**
- Project name? **ecom-dashboard**
- Directory? **./**
- Want to override settings? **N**

#### 4. 生产环境部署

```bash
vercel --prod
```

---

## 📋 环境变量配置

### Vercel 环境变量

在 Vercel 项目设置中添加：

1. 访问 Vercel 项目页面
2. 点击 "Settings" → "Environment Variables"
3. 添加以下变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. 点击 "Save"
5. 重新部署项目

---

## 🗄️ Supabase 配置

### 1. 数据库表结构

确保已在 Supabase 执行：

```bash
# 打开并执行
E:\山麓众创科技有限公司\ecom-dashboard\supabase-profit-schema.sql
```

### 2. RLS 权限配置

```sql
-- 启用 RLS
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_alerts ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Allow public read" ON sales_data 
  FOR SELECT TO authenticated, anon USING (TRUE);

CREATE POLICY "Allow public write" ON sales_data 
  FOR ALL TO authenticated, anon USING (TRUE);

CREATE POLICY "Allow public read" ON daily_marketing 
  FOR SELECT TO authenticated, anon USING (TRUE);

CREATE POLICY "Allow public write" ON daily_marketing 
  FOR ALL TO authenticated, anon USING (TRUE);
```

### 3. 获取 Supabase 密钥

1. 访问 https://app.supabase.com
2. 选择你的项目
3. 点击 "Settings" → "API"
4. 复制：
   - Project URL
   - anon public key

---

## 🌐 上线后的网址

部署成功后，你会获得：

- **生产环境**: `https://your-project.vercel.app`
- **预览环境**: `https://your-project-git-branch.vercel.app`

---

## 📱 手机访问

上线后，手机浏览器访问：
```
https://your-project.vercel.app
```

网站已适配移动端，可以正常使用。

---

## ⚡ 快速上线步骤总结

### 最快方式（5 分钟上线）

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 部署
cd E:\山麓众创科技有限公司\ecom-dashboard
vercel --prod

# 4. 配置环境变量（在 Vercel 控制台）
# 添加 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY

# 5. 完成！访问返回的网址
```

---

## 🔧 其他部署选项

### 1. Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### 2. Railway

1. 访问 https://railway.app
2. 创建新项目
3. 选择 "Deploy from GitHub repo"
4. 选择你的仓库

### 3. 自有服务器

```bash
# 构建项目
npm run build

# 启动服务
npm run start

# 使用 PM2 管理
npm install -g pm2
pm2 start npm --name "ecom-dashboard" -- start
pm2 save
```

---

## 📊 上线后优化建议

### 1. 性能优化

- [ ] 启用 Vercel Analytics
- [ ] 配置 CDN 缓存
- [ ] 优化图片加载
- [ ] 启用 Gzip 压缩

### 2. SEO 优化

- [ ] 添加 meta 标签
- [ ] 配置 sitemap.xml
- [ ] 添加 robots.txt
- [ ] 配置 Open Graph

### 3. 安全加固

- [ ] 配置 CORS
- [ ] 启用 HTTPS（Vercel 默认启用）
- [ ] 配置 CSP 策略
- [ ] 定期更新依赖

### 4. 监控告警

- [ ] 配置 Vercel Analytics
- [ ] 添加错误监控（Sentry）
- [ ] 配置性能监控
- [ ] 设置 uptime 监控

---

## 🎯 上线检查清单

部署前检查：

- [ ] 代码已提交到 Git
- [ ] `.env.local` 已添加到 `.gitignore`
- [ ] Supabase 数据库表已创建
- [ ] Supabase RLS 策略已配置
- [ ] 测试过本地构建 `npm run build`

部署后检查：

- [ ] 网站可以正常访问
- [ ] 所有页面可以打开
- [ ] 数据可以保存到 Supabase
- [ ] 数据可以从 Supabase 加载
- [ ] 移动端显示正常
- [ ] 环境变量已配置

---

## 📞 遇到问题？

### Vercel 部署失败

**错误：** Build failed

**解决：**
```bash
# 本地测试构建
npm run build

# 查看具体错误
# 根据错误修复后重新部署
```

### 环境变量不生效

**解决：**
1. 检查变量名是否正确（必须大写）
2. 检查是否以 `NEXT_PUBLIC_` 开头
3. 重新部署项目

### Supabase 连接失败

**解决：**
1. 检查 URL 是否正确
2. 检查 Anon Key 是否正确
3. 检查 RLS 策略是否配置

---

## 🎉 部署完成！

上线后访问你的网站：
```
https://your-project.vercel.app
```

**祝上线顺利！** 🚀
