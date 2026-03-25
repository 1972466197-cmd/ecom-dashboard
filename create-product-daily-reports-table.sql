-- 商品日概况数据表
-- 用于存储商品每日经营数据（淘宝/天猫商品分析）

CREATE TABLE IF NOT EXISTS product_daily_reports (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES shops(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  
  -- 基础信息
  time_period TEXT,              -- A 列：时间周期
  report_date DATE,              -- B 列：日期
  stat_date DATE,                -- C 列：统计日期
  product_id_external TEXT,      -- D 列：商品 ID
  product_name TEXT,             -- E 列：商品名称
  main_product_id TEXT,          -- F 列：主商品 ID
  product_type TEXT,             -- G 列：商品类型
  item_number TEXT,              -- H 列：货号
  product_status TEXT,           -- I 列：商品状态
  product_tags TEXT,             -- J 列：商品标签
  
  -- 流量指标
  visitors BIGINT DEFAULT 0,     -- K 列：商品访客数
  views BIGINT DEFAULT 0,        -- L 列：商品浏览量
  avg_stay_time NUMERIC(8,2) DEFAULT 0, -- M 列：平均停留时长 (秒)
  bounce_rate NUMERIC(5,2) DEFAULT 0, -- N 列：商品详情页跳出率
  
  -- 收藏加购
  fav_count BIGINT DEFAULT 0,    -- O 列：商品收藏人数
  cart_items BIGINT DEFAULT 0,   -- P 列：商品加购件数
  cart_users BIGINT DEFAULT 0,   -- Q 列：商品加购人数
  
  -- 下单指标
  order_buyers BIGINT DEFAULT 0, -- R 列：下单买家数
  order_items BIGINT DEFAULT 0,  -- S 列：下单件数
  order_amount NUMERIC(12,2) DEFAULT 0, -- T 列：下单金额
  order_cv_rate NUMERIC(5,2) DEFAULT 0, -- U 列：下单转化率
  
  -- 支付指标
  paying_buyers BIGINT DEFAULT 0, -- V 列：支付买家数
  paying_items BIGINT DEFAULT 0,  -- W 列：支付件数
  paying_amount NUMERIC(12,2) DEFAULT 0, -- X 列：支付金额
  paying_cv_rate NUMERIC(5,2) DEFAULT 0, -- Y 列：商品支付转化率
  new_paying_buyers BIGINT DEFAULT 0, -- Z 列：支付新买家数
  returning_paying_buyers BIGINT DEFAULT 0, -- AA 列：支付老买家数
  returning_paying_amount NUMERIC(12,2) DEFAULT 0, -- AB 列：老买家支付金额
  juhuasuan_amount NUMERIC(12,2) DEFAULT 0, -- AC 列：聚划算支付金额
  
  -- 价值指标
  avg_visitor_value NUMERIC(10,2) DEFAULT 0, -- AD 列：访客平均价值
  refund_amount NUMERIC(12,2) DEFAULT 0, -- AE 列：成功退款金额
  competitiveness_score NUMERIC(5,2) DEFAULT 0, -- AF 列：竞争力评分
  
  -- 累计指标
  yearly_paying_amount NUMERIC(14,2) DEFAULT 0, -- AG 列：年累计支付金额
  monthly_paying_amount NUMERIC(14,2) DEFAULT 0, -- AH 列：月累计支付金额
  monthly_paying_items BIGINT DEFAULT 0, -- AI 列：月累计支付件数
  
  -- 搜索指标
  search_cv_rate NUMERIC(5,2) DEFAULT 0, -- AJ 列：搜索引导支付转化率
  search_visitors BIGINT DEFAULT 0, -- AK 列：搜索引导访客数
  search_paying_buyers BIGINT DEFAULT 0, -- AL 列：搜索引导支付买家数
  
  -- 详情页指标
  structured_detail_cv_rate NUMERIC(5,2) DEFAULT 0, -- AM 列：结构化详情引导转化率
  structured_detail_ratio NUMERIC(5,2) DEFAULT 0 -- AN 列：结构化详情引导成交占比
);

-- 索引
CREATE INDEX idx_product_daily_shop_id ON product_daily_reports(shop_id);
CREATE INDEX idx_product_daily_product_id ON product_daily_reports(product_id);
CREATE INDEX idx_product_daily_date ON product_daily_reports(report_date);
CREATE INDEX idx_product_daily_product ON product_daily_reports(product_id_external);

-- 允许公开读取
DROP POLICY IF EXISTS "Allow public read access" ON product_daily_reports;
CREATE POLICY "Allow public read access" ON product_daily_reports
  FOR SELECT
  USING (true);

-- 允许认证用户操作
DROP POLICY IF EXISTS "Users can insert product_daily_reports" ON product_daily_reports;
CREATE POLICY "Users can insert product_daily_reports" ON product_daily_reports
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update product_daily_reports" ON product_daily_reports;
CREATE POLICY "Users can update product_daily_reports" ON product_daily_reports
  FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete product_daily_reports" ON product_daily_reports;
CREATE POLICY "Users can delete product_daily_reports" ON product_daily_reports
  FOR DELETE
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE product_daily_reports IS '商品日概况报表（淘宝/天猫商品分析）';
