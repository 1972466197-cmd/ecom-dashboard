-- 商品推广报表数据表
-- 用于存储淘宝/天猫商品推广数据（直通车、引力魔方等）

CREATE TABLE IF NOT EXISTS product_reports (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES shops(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  
  -- 基础信息
  time_period TEXT,              -- A列：时间周期
  report_date DATE,              -- B列：日期
  entity_id TEXT,                -- C列：主体ID
  entity_type TEXT,              -- D列：主体类型
  entity_name TEXT,              -- E列：主体名称
  
  -- 流量指标
  impressions BIGINT DEFAULT 0,  -- F列：展现量
  clicks BIGINT DEFAULT 0,       -- G列：点击量
  cost NUMERIC(12,2) DEFAULT 0,  -- H列：花费
  ctr NUMERIC(5,2) DEFAULT 0,    -- I列：点击率
  avg_cpc NUMERIC(10,2) DEFAULT 0, -- J列：平均点击花费
  cpm NUMERIC(10,2) DEFAULT 0,   -- K列：千次展现花费
  
  -- 成交指标
  total_presale_amount NUMERIC(12,2) DEFAULT 0,  -- L列：总预售成交金额
  total_presale_orders BIGINT DEFAULT 0,         -- M列：总预售成交笔数
  direct_presale_amount NUMERIC(12,2) DEFAULT 0, -- N列：直接预售成交金额
  direct_presale_orders BIGINT DEFAULT 0,        -- O列：直接预售成交笔数
  indirect_presale_amount NUMERIC(12,2) DEFAULT 0, -- P列：间接预售成交金额
  indirect_presale_orders BIGINT DEFAULT 0,      -- Q列：间接预售成交笔数
  direct_sales_amount NUMERIC(12,2) DEFAULT 0,   -- R列：直接成交金额
  indirect_sales_amount NUMERIC(12,2) DEFAULT 0, -- S列：间接成交金额
  total_sales_amount NUMERIC(12,2) DEFAULT 0,    -- T列：总成交金额
  total_sales_orders BIGINT DEFAULT 0,           -- U列：总成交笔数
  direct_sales_orders BIGINT DEFAULT 0,          -- V列：直接成交笔数
  indirect_sales_orders BIGINT DEFAULT 0,        -- W列：间接成交笔数
  
  -- 转化指标
  cvr NUMERIC(5,2) DEFAULT 0,    -- X列：点击转化率
  roi NUMERIC(8,2) DEFAULT 0,    -- Y列：投入产出比
  presale_roi NUMERIC(8,2) DEFAULT 0, -- Z列：含预售投产比
  total_sales_cost NUMERIC(12,2) DEFAULT 0, -- AA列：总成交成本
  
  -- 收藏加购
  total_cart BIGINT DEFAULT 0,   -- AB列：总购物车数
  direct_cart BIGINT DEFAULT 0,  -- AC列：直接购物车数
  indirect_cart BIGINT DEFAULT 0, -- AD列：间接购物车数
  cart_rate NUMERIC(5,2) DEFAULT 0, -- AE列：加购率
  fav_product BIGINT DEFAULT 0,  -- AF列：收藏宝贝数
  fav_shop BIGINT DEFAULT 0,     -- AG列：收藏店铺数
  fav_shop_cost NUMERIC(10,2) DEFAULT 0, -- AH列：店铺收藏成本
  total_fav_cart BIGINT DEFAULT 0, -- AI列：总收藏加购数
  total_fav_cart_cost NUMERIC(10,2) DEFAULT 0, -- AJ列：总收藏加购成本
  product_fav_cart BIGINT DEFAULT 0, -- AK列：宝贝收藏加购数
  product_fav_cart_cost NUMERIC(10,2) DEFAULT 0, -- AL列：宝贝收藏加购成本
  total_fav BIGINT DEFAULT 0,    -- AM列：总收藏数
  product_fav_cost NUMERIC(10,2) DEFAULT 0, -- AN列：宝贝收藏成本
  product_fav_rate NUMERIC(5,2) DEFAULT 0, -- AO列：宝贝收藏率
  cart_cost NUMERIC(10,2) DEFAULT 0, -- AP列：加购成本
  
  -- 订单指标
  order_count BIGINT DEFAULT 0,  -- AQ列：拍下订单笔数
  order_amount NUMERIC(12,2) DEFAULT 0, -- AR列：拍下订单金额
  direct_fav_product BIGINT DEFAULT 0, -- AS列：直接收藏宝贝数
  indirect_fav_product BIGINT DEFAULT 0, -- AT列：间接收藏宝贝数
  
  -- 营销指标
  coupon_count BIGINT DEFAULT 0, -- AU列：优惠券领取量
  deposit_orders BIGINT DEFAULT 0, -- AV列：购物金充值笔数
  deposit_amount NUMERIC(12,2) DEFAULT 0, -- AW列：购物金充值金额
  wangwang_count BIGINT DEFAULT 0, -- AX列：旺旺咨询量
  guide_visits BIGINT DEFAULT 0, -- AY列：引导访问量
  guide_visitors BIGINT DEFAULT 0, -- AZ列：引导访问人数
  guide_potential_visitors BIGINT DEFAULT 0, -- BA列：引导访问潜客数
  guide_potential_ratio NUMERIC(5,2) DEFAULT 0, -- BB列：引导访问潜客占比
  member_join_rate NUMERIC(5,2) DEFAULT 0, -- BC列：入会率
  member_join_count BIGINT DEFAULT 0, -- BD列：入会量
  guide_visit_rate NUMERIC(5,2) DEFAULT 0, -- BE列：引导访问率
  deep_visits BIGINT DEFAULT 0,  -- BF列：深度访问量
  avg_pages NUMERIC(5,2) DEFAULT 0, -- BG列：平均访问页面数
  new_customers BIGINT DEFAULT 0, -- BH列：成交新客数
  new_customer_ratio NUMERIC(5,2) DEFAULT 0, -- BI列：成交新客占比
  member_first_order BIGINT DEFAULT 0, -- BJ列：会员首购人数
  member_sales_amount NUMERIC(12,2) DEFAULT 0, -- BK列：会员成交金额
  member_sales_orders BIGINT DEFAULT 0, -- BL列：会员成交笔数
  paying_customers BIGINT DEFAULT 0, -- BM列：成交人数
  avg_orders_per_customer NUMERIC(5,2) DEFAULT 0, -- BN列：人均成交笔数
  avg_amount_per_customer NUMERIC(10,2) DEFAULT 0, -- BO列：人均成交金额
  organic_conversion_amount NUMERIC(12,2) DEFAULT 0, -- BP列：自然流量转化金额
  organic_impressions BIGINT DEFAULT 0, -- BQ列：自然流量曝光量
  platform_boost_total_amount NUMERIC(12,2) DEFAULT 0, -- BR列：平台助推总成交
  platform_boost_direct_amount NUMERIC(12,2) DEFAULT 0, -- BS列：平台助推直接成交
  platform_boost_clicks BIGINT DEFAULT 0, -- BT列：平台助推点击
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entity_id, report_date)
);

-- 索引
CREATE INDEX idx_product_reports_shop_id ON product_reports(shop_id);
CREATE INDEX idx_product_reports_product_id ON product_reports(product_id);
CREATE INDEX idx_product_reports_date ON product_reports(report_date);
CREATE INDEX idx_product_reports_entity ON product_reports(entity_id, entity_type);

-- 允许公开读取
DROP POLICY IF EXISTS "Allow public read access" ON product_reports;
CREATE POLICY "Allow public read access" ON product_reports
  FOR SELECT
  USING (true);

-- 允许认证用户操作
DROP POLICY IF EXISTS "Users can insert product_reports" ON product_reports;
CREATE POLICY "Users can insert product_reports" ON product_reports
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update product_reports" ON product_reports;
CREATE POLICY "Users can update product_reports" ON product_reports
  FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete product_reports" ON product_reports;
CREATE POLICY "Users can delete product_reports" ON product_reports
  FOR DELETE
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE product_reports IS '商品推广报表（淘宝/天猫直通车、引力魔方等）';
