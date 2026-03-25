-- 店铺日概况数据表
-- 用于记录店铺每日经营概况数据

CREATE TABLE IF NOT EXISTS shop_daily_reports (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES shops(id) ON DELETE CASCADE,
  
  -- 基础信息
  report_time TEXT,              -- A 列：时间
  stat_date DATE,                -- B 列：统计日期
  shop_name TEXT,                -- C 列：店铺名称
  
  -- 流量指标
  visitors BIGINT DEFAULT 0,     -- D 列：访客数
  cart_users BIGINT DEFAULT 0,   -- E 列：加购人数
  
  -- 支付指标
  paying_amount NUMERIC(12,2) DEFAULT 0, -- F 列：支付金额
  paying_buyers BIGINT DEFAULT 0, -- G 列：支付买家数
  paying_sub_orders BIGINT DEFAULT 0, -- H 列：支付子订单数
  paying_items BIGINT DEFAULT 0, -- I 列：支付件数
  
  -- 推广指标
  ad_cost_total NUMERIC(12,2) DEFAULT 0, -- J 列：全站推广花费
  ad_keyword_cost NUMERIC(12,2) DEFAULT 0, -- K 列：关键词推广花费
  ad_audience_cost NUMERIC(12,2) DEFAULT 0, -- L 列：精准人群推广花费
  ad_smart_cost NUMERIC(12,2) DEFAULT 0, -- M 列：智能场景花费
  
  -- 退款指标
  refund_amount NUMERIC(12,2) DEFAULT 0, -- N 列：成功退款金额
  
  -- 评价指标
  review_count BIGINT DEFAULT 0, -- O 列：评价数
  review_with_image BIGINT DEFAULT 0, -- P 列：有图评价数
  desc_score NUMERIC(3,1) DEFAULT 0, -- Q 列：描述相符评分
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(shop_id, stat_date)
);

-- 索引
CREATE INDEX idx_shop_daily_shop_id ON shop_daily_reports(shop_id);
CREATE INDEX idx_shop_daily_date ON shop_daily_reports(stat_date);

-- 允许公开读取
DROP POLICY IF EXISTS "Allow public read access" ON shop_daily_reports;
CREATE POLICY "Allow public read access" ON shop_daily_reports
  FOR SELECT
  USING (true);

-- 允许认证用户操作
DROP POLICY IF EXISTS "Users can insert shop_daily_reports" ON shop_daily_reports;
CREATE POLICY "Users can insert shop_daily_reports" ON shop_daily_reports
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update shop_daily_reports" ON shop_daily_reports;
CREATE POLICY "Users can update shop_daily_reports" ON shop_daily_reports
  FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete shop_daily_reports" ON shop_daily_reports;
CREATE POLICY "Users can delete shop_daily_reports" ON shop_daily_reports
  FOR DELETE
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE shop_daily_reports IS '店铺日概况报表（店铺每日经营概况）';
