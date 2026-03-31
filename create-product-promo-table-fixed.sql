-- 创建商品推广明细表（如果不存在）
CREATE TABLE IF NOT EXISTS product_promo_reports (
  id BIGSERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL,
  report_date DATE NOT NULL,
  
  -- 基础信息
  subject_id TEXT,
  subject_type TEXT,
  subject_name TEXT,
  
  -- 流量数据
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  cost NUMERIC(18,2) DEFAULT 0,
  ctr NUMERIC(10,6) DEFAULT 0,
  avg_click_cost NUMERIC(10,2) DEFAULT 0,
  cpm NUMERIC(10,2) DEFAULT 0,
  
  -- 预售数据
  presale_gmv NUMERIC(18,2) DEFAULT 0,
  presale_orders INTEGER DEFAULT 0,
  direct_presale_gmv NUMERIC(18,2) DEFAULT 0,
  direct_presale_orders INTEGER DEFAULT 0,
  indirect_presale_gmv NUMERIC(18,2) DEFAULT 0,
  indirect_presale_orders INTEGER DEFAULT 0,
  
  -- 成交数据
  direct_gmv NUMERIC(18,2) DEFAULT 0,
  indirect_gmv NUMERIC(18,2) DEFAULT 0,
  total_gmv NUMERIC(18,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  direct_orders INTEGER DEFAULT 0,
  indirect_orders INTEGER DEFAULT 0,
  
  -- 转化数据
  click_cv_rate NUMERIC(10,6) DEFAULT 0,
  roi NUMERIC(10,4) DEFAULT 0,
  presale_roi NUMERIC(10,4) DEFAULT 0,
  
  -- 成本数据
  total_cost NUMERIC(18,2) DEFAULT 0,
  
  -- 购物车数据
  total_cart INTEGER DEFAULT 0,
  direct_cart INTEGER DEFAULT 0,
  indirect_cart INTEGER DEFAULT 0,
  cart_rate NUMERIC(10,6) DEFAULT 0,
  
  -- 收藏数据
  fav_item_count INTEGER DEFAULT 0,
  fav_shop_count INTEGER DEFAULT 0,
  fav_shop_cost NUMERIC(18,2) DEFAULT 0,
  total_fav_cart INTEGER DEFAULT 0,
  total_fav_cart_cost NUMERIC(18,2) DEFAULT 0,
  item_fav_cart INTEGER DEFAULT 0,
  item_fav_cart_cost NUMERIC(18,2) DEFAULT 0,
  total_fav INTEGER DEFAULT 0,
  item_fav_cost NUMERIC(18,2) DEFAULT 0,
  item_fav_rate NUMERIC(10,6) DEFAULT 0,
  cart_cost NUMERIC(18,2) DEFAULT 0,
  
  -- 订单数据
  order_count INTEGER DEFAULT 0,
  order_amount NUMERIC(18,2) DEFAULT 0,
  direct_fav_item INTEGER DEFAULT 0,
  indirect_fav_item INTEGER DEFAULT 0,
  
  -- 优惠券数据
  coupon_count INTEGER DEFAULT 0,
  
  -- 购物金数据
  deposit_count INTEGER DEFAULT 0,
  deposit_amount NUMERIC(18,2) DEFAULT 0,
  
  -- 咨询数据
  wangwang_count INTEGER DEFAULT 0,
  
  -- 引导数据
  guide_visitors INTEGER DEFAULT 0,
  guide_visitor_count INTEGER DEFAULT 0,
  guide_potential_count INTEGER DEFAULT 0,
  guide_potential_rate NUMERIC(10,6) DEFAULT 0,
  
  -- 会员数据
  member_rate NUMERIC(10,6) DEFAULT 0,
  member_count INTEGER DEFAULT 0,
  guide_rate NUMERIC(10,6) DEFAULT 0,
  
  -- 深度访问
  deep_visit_count INTEGER DEFAULT 0,
  avg_page_count NUMERIC(10,2) DEFAULT 0,
  
  -- 新客数据
  new_customer_count INTEGER DEFAULT 0,
  new_customer_rate NUMERIC(10,6) DEFAULT 0,
  
  -- 会员成交
  member_first_count INTEGER DEFAULT 0,
  member_gmv NUMERIC(18,2) DEFAULT 0,
  member_orders INTEGER DEFAULT 0,
  
  -- 成交分析
  buyer_count INTEGER DEFAULT 0,
  avg_orders_per_buyer NUMERIC(10,2) DEFAULT 0,
  avg_amount_per_buyer NUMERIC(18,2) DEFAULT 0,
  
  -- 流量来源
  organic_gmv NUMERIC(18,2) DEFAULT 0,
  organic_impressions INTEGER DEFAULT 0,
  platform_boost_gmv NUMERIC(18,2) DEFAULT 0,
  platform_boost_direct_gmv NUMERIC(18,2) DEFAULT 0,
  platform_boost_clicks INTEGER DEFAULT 0,
  
  -- 优惠券
  coupon_discount NUMERIC(18,2) DEFAULT 0,
  coupon_boost_gmv NUMERIC(18,2) DEFAULT 0,
  coupon_boost_direct_gmv NUMERIC(18,2) DEFAULT 0,
  coupon_boost_clicks INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (shop_id, report_date, subject_id)
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_product_promo_shop_date ON product_promo_reports (shop_id, report_date);
CREATE INDEX IF NOT EXISTS idx_product_promo_subject ON product_promo_reports (subject_id);

-- 启用 RLS（如果未启用）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'product_promo_reports' AND rowsecurity = true
  ) THEN
    ALTER TABLE product_promo_reports ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 添加 RLS 策略（如果不存在）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_promo_reports' AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access" ON product_promo_reports FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_promo_reports' AND policyname = 'Allow public insert access'
  ) THEN
    CREATE POLICY "Allow public insert access" ON product_promo_reports FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_promo_reports' AND policyname = 'Allow public update access'
  ) THEN
    CREATE POLICY "Allow public update access" ON product_promo_reports FOR UPDATE USING (true);
  END IF;
END $$;
