# 🚀 部署指南 - 让其他人访问网站

## 方案 1：Vercel 部署（推荐，5 分钟搞定）

### 步骤 1：推送到 GitHub

```bash
# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 在 GitHub 创建新仓库，然后关联
git remote add origin https://github.com/你的用户名/ecom-dashboard.git

# 推送
git push -u origin main
```

### 步骤 2：部署到 Vercel

1. 访问 https://vercel.com
2. 点击"Add New Project"
3. 选择"Import Git Repository"
4. 选择你的 GitHub 仓库
5. 点击"Deploy"

### 步骤 3：配置环境变量

在 Vercel 项目设置中添加：

```
NEXT_PUBLIC_SUPABASE_URL=https://ergesvxuiajxrewfpydk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 步骤 4：设置自定义域名（可选）

1. 在 Vercel 项目设置 → Domains
2. 添加你的域名
3. 按提示配置 DNS

---

## 方案 2：本地网络访问（临时测试）

### 方法 A：局域网访问

1. 查看本机 IP：
```bash
ipconfig
# 找到 IPv4 地址，如 192.168.1.100
```

2. 修改 `package.json`：
```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0"
  }
}
```

3. 重启开发服务器：
```bash
npm run dev
```

4. 同事访问：
```
http://192.168.1.100:3000
```

### 方法 B：使用 ngrok 外网穿透

1. 下载 ngrok：https://ngrok.com

2. 运行：
```bash
ngrok http 3000
```

3. 分享生成的链接给同事：
```
https://xxxx-xxxx.ngrok.io
```

---

## 方案 3：云服务器部署（生产环境）

### 腾讯云/阿里云服务器

#### 1. 购买服务器
- 配置：2 核 4G 起步
- 系统：Ubuntu 20.04 或 CentOS 7

#### 2. 安装 Node.js
```bash
# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node -v
npm -v
```

#### 3. 上传代码
```bash
# 使用 git
git clone https://github.com/你的用户名/ecom-dashboard.git

# 或使用 scp
scp -r ecom-dashboard root@服务器 IP:/var/www/
```

#### 4. 安装依赖并构建
```bash
cd /var/www/ecom-dashboard
npm install
npm run build
```

#### 5. 使用 PM2 运行
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "ecom-dashboard" -- start

# 设置开机自启
pm2 startup
pm2 save
```

#### 6. 配置 Nginx 反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 7. 配置环境变量
创建 `/var/www/ecom-dashboard/.env.production`：
```
NEXT_PUBLIC_SUPABASE_URL=https://ergesvxuiajxrewfpydk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的密钥
```

---

## 🔐 Supabase 配置

### 添加生产环境 URL

1. 访问 Supabase Dashboard
2. 进入 Project Settings → API
3. 在 "Allowed Redirect URLs" 中添加：
   - `https://你的域名.com`
   - `https://你的域名.com/auth/callback`

4. 在 "Allowed Web Origins" 中添加：
   - `https://你的域名.com`

---

## 📊 性能优化建议

### 1. 启用缓存

在 `next.config.ts` 中添加：
```typescript
const nextConfig = {
  caching: {
    maxAge: 3600,
    staleWhileRevalidate: 86400,
  }
}
```

### 2. 图片优化

使用 Next.js Image 组件：
```tsx
import Image from 'next/image'

<Image 
  src="/logo.png" 
  alt="Logo"
  width={200}
  height={100}
  priority
/>
```

### 3. 数据库优化

为常用查询添加索引：
```sql
CREATE INDEX idx_sales_data_shop_date ON sales_data(shop_id, date);
CREATE INDEX idx_sales_data_date ON sales_data(date);
```

---

## 🎯 推荐方案

| 场景 | 推荐方案 | 成本 |
|------|---------|------|
| 内部测试 | 局域网访问 | 免费 |
| 给客户演示 | Vercel | 免费 |
| 生产环境 | 云服务器 + 域名 | ¥100-300/月 |
| 临时分享 | ngrok | 免费 |

---

## 📞 需要帮助？

遇到问题可以：
1. 查看 Vercel 文档：https://vercel.com/docs
2. 查看 Next.js 部署指南：https://nextjs.org/docs/deployment
3. 联系技术支持

---

**最后更新：** 2026-03-25
