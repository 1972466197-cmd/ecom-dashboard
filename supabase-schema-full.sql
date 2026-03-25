-- ============================================
-- 山麓众创科技 - 电商 ERP 完整数据库 Schema
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- ============================================
-- 清理旧表（如果存在）
-- ============================================
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS import_logs CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS sales_data CASCADE;
DROP TABLE IF EXISTS product_shops CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS shop_groups CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- 1. 用户表（扩展 Supabase Auth）
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'operator',
  company_name TEXT DEFAULT '山麓众创科技',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- 2. 店铺分组表
-- ============================================
CREATE TABLE shop_groups (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  leader_name TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 店铺表
-- ============================================
CREATE TABLE shops (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  group_id BIGINT REFERENCES shop_groups(id),
  status TEXT DEFAULT 'active',
  api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shops_platform ON shops(platform);
CREATE INDEX idx_shops_group_id ON shops(group_id);

-- ============================================
-- 4. 商品表
-- ============================================
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  cost NUMERIC(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  status TEXT DEFAULT 'onsale',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);

-- ============================================
-- 5. 商品 - 店铺关联表
-- ============================================
CREATE TABLE product_shops (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  shop_id BIGINT REFERENCES shops(id) ON DELETE CASCADE,
  platform_stock INTEGER DEFAULT 0,
  platform_price NUMERIC(10,2),
  is_listed BOOLEAN DEFAULT true,
  UNIQUE(product_id, shop_id)
);

CREATE INDEX idx_product_shops_product ON product_shops(product_id);
CREATE INDEX idx_product_shops_shop ON product_shops(shop_id);

-- ============================================
-- 6. 销售数据表
-- ============================================
CREATE TABLE sales_data (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES shops(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  week_day TEXT,
  pay_amount NUMERIC(12,2) DEFAULT 0,
  pay_orders INTEGER DEFAULT 0,
  avg_order_value NUMERIC(10,2) DEFAULT 0,
  visitors INTEGER DEFAULT 0,
  cart_count INTEGER DEFAULT 0,
  cart_rate NUMERIC(5,2) DEFAULT 0,
  ctr NUMERIC(5,2) DEFAULT 0,
  cvr NUMERIC(5,2) DEFAULT 0,
  refund_amount NUMERIC(12,2) DEFAULT 0,
  return_refund_jqn NUMERIC(12,2) DEFAULT 0,
  return_refund_jst NUMERIC(12,2) DEFAULT 0,
  return_refund_orders INTEGER DEFAULT 0,
  only_refund_amount NUMERIC(12,2) DEFAULT 0,
  fake_orders_amount NUMERIC(12,2) DEFAULT 0,
  fake_orders_count INTEGER DEFAULT 0,
  commission NUMERIC(10,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  product_list_count INTEGER DEFAULT 0,
  after_sale_duration NUMERIC(5,1) DEFAULT 0,
  cs_score NUMERIC(3,1) DEFAULT 0,
  shop_score NUMERIC(3,1) DEFAULT 0,
  purchase_cost NUMERIC(12,2) DEFAULT 0,
  return_cost NUMERIC(12,2) DEFAULT 0,
  gross_profit NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) DEFAULT 0,
  total_sales NUMERIC(12,2) DEFAULT 0,
  ad_cost_total NUMERIC(12,2) DEFAULT 0,
  ad_keyword NUMERIC(12,2) DEFAULT 0,
  ad_audience NUMERIC(12,2) DEFAULT 0,
  shop_roi NUMERIC(8,2) DEFAULT 0,
  ad_coupon_return NUMERIC(10,2) DEFAULT 0,
  logistics_fee NUMERIC(10,2) DEFAULT 0,
  platform_fee NUMERIC(10,2) DEFAULT 0,
  labor_cost NUMERIC(10,2) DEFAULT 0,
  net_profit NUMERIC(12,2) DEFAULT 0,
  net_roi NUMERIC(8,2) DEFAULT 0,
  is_imported BOOLEAN DEFAULT false,
  imported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, date)
);

CREATE INDEX idx_sales_data_shop_date ON sales_data(shop_id, date);
CREATE INDEX idx_sales_data_date ON sales_data(date);

-- ============================================
-- 7. 订单表
-- ============================================
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  shop_id BIGINT REFERENCES shops(id),
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  pay_amount NUMERIC(12,2) DEFAULT 0,
  profit NUMERIC(10,2) DEFAULT 0,
  items JSONB,
  customer_info JSONB,
  shipping_info JSONB,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_shop_id ON orders(shop_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================
-- 8. 数据导入记录表
-- ============================================
CREATE TABLE import_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  import_type TEXT NOT NULL,
  file_name TEXT,
  rows_imported INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. 系统设置表
-- ============================================
CREATE TABLE settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 初始化数据
-- ============================================

-- 店铺分组
INSERT INTO shop_groups (name, leader_name, sort_order) VALUES
  ('海林组', '海林', 1),
  ('培君组', '培君', 2),
  ('淑贞组', '淑贞', 3),
  ('敏贞组', '敏贞', 4);

-- 店铺
INSERT INTO shops (name, platform, group_id, status) VALUES
  ('大福珠宝', '天猫', 1, 'active'),
  ('香港大福', '天猫', 1, 'active'),
  ('香港万达', '天猫', 1, 'active'),
  ('星悦芳', '天猫', 1, 'active'),
  ('抖音安然', '抖音', 1, 'active'),
  ('抖音后宫', '抖音', 1, 'active'),
  ('德国好物', '拼多多', 1, 'active'),
  ('德国冠营', '拼多多', 1, 'active'),
  ('德国黑森林', '拼多多', 1, 'active'),
  ('淘宝楠箐', '淘宝', 2, 'active'),
  ('宝怡城', '天猫', 2, 'active'),
  ('大福银饰', '天猫', 2, 'active'),
  ('德国 kymy 家居生活馆', '拼多多', 2, 'active'),
  ('山居香铺', '抖音', 2, 'active'),
  ('大福纯银', '天猫', 3, 'active'),
  ('淘宝轻奢', '淘宝', 3, 'active'),
  ('淘宝汀禾', '淘宝', 3, 'active'),
  ('大福太古', '天猫', 3, 'active'),
  ('抖音楠箐', '抖音', 3, 'active'),
  ('抖音心宿', '抖音', 3, 'active'),
  ('淘宝 VMVB 数码', '淘宝', 3, 'active'),
  ('德国精选', '拼多多', 3, 'active'),
  ('大福小饰逅', '天猫', 3, 'active'),
  ('天猫心宿', '天猫', 4, 'active'),
  ('大福万达', '天猫', 4, 'active'),
  ('淘宝百年', '淘宝', 4, 'active'),
  ('淘宝范琦', '淘宝', 4, 'active'),
  ('抖音轻奢', '抖音', 4, 'active');

-- 商品
INSERT INTO products (name, sku, category, price, cost, stock, sales, status) VALUES
  ('新款春夏 T 恤', 'TS-2026-001', '服装', 99, 35, 1250, 3420, 'onsale'),
  ('休闲牛仔裤', 'JN-2026-002', '服装', 199, 80, 580, 1890, 'onsale'),
  ('运动卫衣', 'WD-2026-003', '服装', 159, 55, 45, 2100, 'warning'),
  ('经典小白鞋', 'SX-2026-004', '鞋履', 299, 120, 0, 890, 'offline'),
  ('商务休闲裤', 'CK-2026-005', '服装', 179, 65, 320, 1560, 'onsale'),
  ('防晒外套', 'JK-2026-006', '服装', 229, 90, 180, 670, 'onsale');

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view shops" ON shops FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view products" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view sales" ON sales_data FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert shops" ON shops FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update shops" ON shops FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert products" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update products" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert sales" ON sales_data FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update sales" ON sales_data FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- 函数：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_data_updated_at BEFORE UPDATE ON sales_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 完成！
-- ============================================
