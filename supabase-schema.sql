-- Supabase 数据表创建脚本
-- 在 Supabase SQL Editor 中运行此脚本

-- 创建销售数据表
CREATE TABLE IF NOT EXISTS sales (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,           -- 店铺名称
  platform TEXT NOT NULL,        -- 平台：天猫/拼多多/抖音
  orders INTEGER DEFAULT 0,      -- 订单数
  gmv NUMERIC(12,2) DEFAULT 0,   -- 成交额
  ad_spend NUMERIC(12,2) DEFAULT 0,  -- 广告支出
  profit NUMERIC(12,2) DEFAULT 0,    -- 利润
  status TEXT DEFAULT 'healthy',     -- 状态：healthy/low-profit
  status_label TEXT DEFAULT '健康',  -- 状态标签
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_sales_platform ON sales(platform);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- 插入示例数据
INSERT INTO sales (name, platform, orders, gmv, ad_spend, profit, status, status_label) VALUES
  ('天猫旗舰店', '天猫', 452, 68000, 12000, 25000, 'healthy', '健康'),
  ('拼多多店', '拼多多', 891, 42450, 5800, 18000, 'healthy', '健康'),
  ('抖音小店', '抖音', 124, 18000, 9200, 3500, 'low-profit', '利润偏低')
ON CONFLICT DO NOTHING;

-- 创建 RLS 策略（如果需要行级安全）
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- 允许匿名读取（根据你的安全需求调整）
CREATE POLICY "Allow public read access" ON sales
  FOR SELECT USING (true);
