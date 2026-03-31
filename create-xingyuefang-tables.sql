-- =============================================
-- 星悦芳店铺数据表创建脚本
-- 执行位置：Supabase SQL Editor
-- =============================================

-- 1. 创建店铺日概况数据表
CREATE TABLE IF NOT EXISTS shop_daily_reports (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES shops(id) ON DELETE CASCADE,
  report_time TEXT,
  stat_date DATE,
  shop_name TEXT,
  visitors BIGINT DEFAULT 0,
  cart_users BIGINT DEFAULT 0,
  paying_amount NUMERIC(12,2) DEFAULT 0,
  paying_buyers BIGINT DEFAULT 0,
  paying_sub_orders BIGINT DEFAULT 0,
  paying_items BIGINT DEFAULT 0,
  ad_cost_total NUMERIC(12,2) DEFAULT 0,
  ad_keyword_cost NUMERIC(12,2) DEFAULT 0,
  ad_audience_cost NUMERIC(12,2) DEFAULT 0,
  ad_smart_cost NUMERIC(12,2) DEFAULT 0,
  refund_amount NUMERIC(12,2) DEFAULT 0,
  review_count BIGINT DEFAULT 0,
  review_with_image BIGINT DEFAULT 0,
  desc_score NUMERIC(3,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, stat_date)
);

CREATE INDEX idx_shop_daily_shop_id ON shop_daily_reports(shop_id);
CREATE INDEX idx_shop_daily_date ON shop_daily_reports(stat_date);

-- 2. 创建商品日概况数据表
CREATE TABLE IF NOT EXISTS product_daily_reports (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES shops(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  time_period TEXT,
  report_date DATE,
  stat_date DATE,
  product_id_external TEXT,
  product_name TEXT,
  main_product_id TEXT,
  product_type TEXT,
  item_number TEXT,
  product_status TEXT,
  product_tags TEXT,
  visitors BIGINT DEFAULT 0,
  views BIGINT DEFAULT 0,
  avg_stay_time NUMERIC(8,2) DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0,
  fav_count BIGINT DEFAULT 0,
  cart_items BIGINT DEFAULT 0,
  cart_users BIGINT DEFAULT 0,
  order_buyers BIGINT DEFAULT 0,
  order_items BIGINT DEFAULT 0,
  order_amount NUMERIC(12,2) DEFAULT 0,
  order_cv_rate NUMERIC(5,2) DEFAULT 0,
  paying_buyers BIGINT DEFAULT 0,
  paying_items BIGINT DEFAULT 0,
  paying_amount NUMERIC(12,2) DEFAULT 0,
  paying_cv_rate NUMERIC(5,2) DEFAULT 0,
  new_paying_buyers BIGINT DEFAULT 0,
  returning_paying_buyers BIGINT DEFAULT 0,
  returning_paying_amount NUMERIC(12,2) DEFAULT 0,
  juhuasuan_amount NUMERIC(12,2) DEFAULT 0,
  avg_visitor_value NUMERIC(10,2) DEFAULT 0,
  refund_amount NUMERIC(12,2) DEFAULT 0,
  competitiveness_score NUMERIC(5,2) DEFAULT 0,
  yearly_paying_amount NUMERIC(14,2) DEFAULT 0,
  monthly_paying_amount NUMERIC(14,2) DEFAULT 0,
  monthly_paying_items BIGINT DEFAULT 0,
  search_cv_rate NUMERIC(5,2) DEFAULT 0,
  search_visitors BIGINT DEFAULT 0,
  search_paying_buyers BIGINT DEFAULT 0,
  structured_detail_cv_rate NUMERIC(5,2) DEFAULT 0,
  structured_detail_ratio NUMERIC(5,2) DEFAULT 0,
  UNIQUE(product_id_external, report_date)
);

CREATE INDEX idx_product_daily_shop_id ON product_daily_reports(shop_id);
CREATE INDEX idx_product_daily_product_id ON product_daily_reports(product_id);
CREATE INDEX idx_product_daily_date ON product_daily_reports(report_date);
CREATE INDEX idx_product_daily_product ON product_daily_reports(product_id_external);

-- 3. 创建刷单明细数据表
CREATE TABLE IF NOT EXISTS fake_order_reports (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES shops(id) ON DELETE CASCADE,
  month TEXT,
  report_time TEXT,
  shop_order_count BIGINT DEFAULT 0,
  product_order_count BIGINT DEFAULT 0,
  order_id TEXT,
  sub_order_no TEXT,
  main_order_no TEXT UNIQUE,
  product_title TEXT,
  product_price NUMERIC(10,2) DEFAULT 0,
  quantity BIGINT DEFAULT 0,
  external_id TEXT,
  product_attrs TEXT,
  package_info TEXT,
  contact_remark TEXT,
  order_status TEXT,
  merchant_code TEXT,
  payment_no TEXT,
  payable_amount NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  refund_status TEXT,
  refund_amount NUMERIC(12,2) DEFAULT 0,
  order_created_at TIMESTAMPTZ,
  order_paid_at TIMESTAMPTZ,
  ship_time TIMESTAMPTZ,
  should_ship_at TIMESTAMPTZ,
  taoxianda_channel TEXT,
  fliggy_order_info TEXT,
  free_order_qualification TEXT,
  free_order_amount NUMERIC(12,2) DEFAULT 0,
  chain_half_managed_info TEXT,
  product_id_external TEXT,
  remark_tag TEXT,
  merchant_remark TEXT,
  buyer_message TEXT,
  tracking_no TEXT,
  logistics_company TEXT,
  is_compensation BOOLEAN DEFAULT false,
  compensation_amount NUMERIC(12,2) DEFAULT 0,
  compensation_paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fake_order_shop_id ON fake_order_reports(shop_id);
CREATE INDEX idx_fake_order_main_order_no ON fake_order_reports(main_order_no);
CREATE INDEX idx_fake_order_product ON fake_order_reports(product_id_external);
CREATE INDEX idx_fake_order_created_at ON fake_order_reports(order_created_at);

-- 4. 创建退款明细数据表
CREATE TABLE IF NOT EXISTS refund_reports (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES shops(id) ON DELETE CASCADE,
  month TEXT,
  product_time TEXT,
  refund_finished_at TIMESTAMPTZ,
  refund_apply_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  refund_type1 TEXT,
  refund_type2 TEXT,
  order_count BIGINT DEFAULT 0,
  order_no TEXT,
  refund_no TEXT UNIQUE,
  payment_no TEXT,
  order_paid_at TIMESTAMPTZ,
  product_id_external TEXT,
  product_code TEXT,
  product_title TEXT,
  refund_finished_at_1 TIMESTAMPTZ,
  buyer_paid_amount NUMERIC(12,2) DEFAULT 0,
  buyer_refund_amount NUMERIC(12,2) DEFAULT 0,
  refund_method TEXT,
  after_sale_type TEXT,
  refund_apply_at_1 TIMESTAMPTZ,
  timeout_at TIMESTAMPTZ,
  finish_at TIMESTAMPTZ,
  refund_status TEXT,
  goods_status TEXT,
  return_logistics_info TEXT,
  ship_logistics_info TEXT,
  cs_intervention_status TEXT,
  seller_name TEXT,
  seller_name_new TEXT,
  seller_return_address TEXT,
  seller_zip TEXT,
  seller_phone TEXT,
  seller_mobile TEXT,
  return_tracking_no TEXT,
  return_logistics_company TEXT,
  buyer_refund_reason TEXT,
  buyer_refund_desc TEXT,
  buyer_return_at TIMESTAMPTZ,
  responsibility_party TEXT,
  sale_stage TEXT,
  remark_tag TEXT,
  merchant_remark TEXT,
  refund_scope TEXT,
  auditor_name TEXT,
  auditor_name_new TEXT,
  evidence_timeout_at TIMESTAMPTZ,
  is_zero_response BOOLEAN DEFAULT false,
  refund_auditor TEXT,
  refund_auditor_new TEXT,
  refund_reason_tag TEXT,
  business_type TEXT,
  is_help_refund BOOLEAN DEFAULT false,
  help_refund_account TEXT,
  small_amount_collection NUMERIC(12,2) DEFAULT 0,
  taote_order_info TEXT,
  smart_refund_strategy TEXT,
  execution_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refund_shop_id ON refund_reports(shop_id);
CREATE INDEX idx_refund_order_no ON refund_reports(order_no);
CREATE INDEX idx_refund_refund_no ON refund_reports(refund_no);
CREATE INDEX idx_refund_product ON refund_reports(product_id_external);
CREATE INDEX idx_refund_finished_at ON refund_reports(refund_finished_at);

-- 5. 创建 RLS 策略（允许公开读取，认证用户可写）
-- 店铺日概况
DROP POLICY IF EXISTS "Allow public read access" ON shop_daily_reports;
CREATE POLICY "Allow public read access" ON shop_daily_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert shop_daily_reports" ON shop_daily_reports;
CREATE POLICY "Users can insert shop_daily_reports" ON shop_daily_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update shop_daily_reports" ON shop_daily_reports;
CREATE POLICY "Users can update shop_daily_reports" ON shop_daily_reports FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can delete shop_daily_reports" ON shop_daily_reports;
CREATE POLICY "Users can delete shop_daily_reports" ON shop_daily_reports FOR DELETE USING (auth.role() = 'authenticated');

-- 商品日概况
DROP POLICY IF EXISTS "Allow public read access" ON product_daily_reports;
CREATE POLICY "Allow public read access" ON product_daily_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert product_daily_reports" ON product_daily_reports;
CREATE POLICY "Users can insert product_daily_reports" ON product_daily_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update product_daily_reports" ON product_daily_reports;
CREATE POLICY "Users can update product_daily_reports" ON product_daily_reports FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can delete product_daily_reports" ON product_daily_reports;
CREATE POLICY "Users can delete product_daily_reports" ON product_daily_reports FOR DELETE USING (auth.role() = 'authenticated');

-- 刷单明细
DROP POLICY IF EXISTS "Allow public read access" ON fake_order_reports;
CREATE POLICY "Allow public read access" ON fake_order_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert fake_order_reports" ON fake_order_reports;
CREATE POLICY "Users can insert fake_order_reports" ON fake_order_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update fake_order_reports" ON fake_order_reports;
CREATE POLICY "Users can update fake_order_reports" ON fake_order_reports FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can delete fake_order_reports" ON fake_order_reports;
CREATE POLICY "Users can delete fake_order_reports" ON fake_order_reports FOR DELETE USING (auth.role() = 'authenticated');

-- 退款明细
DROP POLICY IF EXISTS "Allow public read access" ON refund_reports;
CREATE POLICY "Allow public read access" ON refund_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert refund_reports" ON refund_reports;
CREATE POLICY "Users can insert refund_reports" ON refund_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update refund_reports" ON refund_reports;
CREATE POLICY "Users can update refund_reports" ON refund_reports FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can delete refund_reports" ON refund_reports;
CREATE POLICY "Users can delete refund_reports" ON refund_reports FOR DELETE USING (auth.role() = 'authenticated');

-- 添加表注释
COMMENT ON TABLE shop_daily_reports IS '店铺日概况报表（星悦芳）';
COMMENT ON TABLE product_daily_reports IS '商品日概况报表（星悦芳）';
COMMENT ON TABLE fake_order_reports IS '刷单明细报表（星悦芳）';
COMMENT ON TABLE refund_reports IS '退款明细报表（星悦芳）';
