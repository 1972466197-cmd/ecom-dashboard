-- 刷单明细订单表 - 完全匹配 Excel 表头
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 创建订单表（补充 shop_id 和百亿补贴字段）
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES shops(id) ON DELETE CASCADE,  -- 新增：店铺 ID（多店铺管理必需）
  
  -- 订单基础信息（完全匹配 Excel 列名）
  sub_order_no TEXT NOT NULL,           -- 子订单编号
  order_no TEXT NOT NULL,                -- 主订单编号
  product_title TEXT NOT NULL,           -- 商品标题
  product_price DECIMAL(10,2) NOT NULL,  -- 商品价格
  quantity INTEGER NOT NULL DEFAULT 1,   -- 购买数量
  external_system_no TEXT,               -- 外部系统编号
  product_attr TEXT,                     -- 商品属性
  package_info TEXT,                     -- 套餐信息
  contact_notes TEXT,                    -- 联系方式备注
  order_status TEXT NOT NULL,            -- 订单状态
  merchant_code TEXT,                    -- 商家编码
  payment_no TEXT,                       -- 支付单号
  buyer_paid_amount DECIMAL(10,2) NOT NULL,  -- 买家实付金额（刷单金额）
  
  -- 退款信息
  refund_status TEXT NOT NULL DEFAULT '没有申请退款',  -- 退款状态
  refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,   -- 退款金额
  
  -- 时间信息
  created_at TIMESTAMPTZ NOT NULL,       -- 订单创建时间
  paid_at TIMESTAMPTZ,                   -- 订单付款时间
  is_delivery TEXT,                      -- 是否发货
  shipped_at TIMESTAMPTZ,                -- 发货时间
  
  -- 商品和渠道信息
  product_id TEXT,                       -- 商品 ID
  distribution_info TEXT,                -- 超链半托管订单信息
  note_tags TEXT,                        -- 备注标签
  merchant_notes TEXT,                   -- 商家备注
  order_source TEXT,                     -- 订单来源/业务类型
  
  -- 物流信息
  tracking_no TEXT,                      -- 物流单号
  
  -- 退款标识
  is_refunded BOOLEAN NOT NULL DEFAULT FALSE,  -- 是否退款
  
  -- 金额汇总
  sub_order_total DECIMAL(10,2) NOT NULL,      -- 子订单总额
  main_order_issue TEXT,                       -- 主订单问题
  
  -- 百亿补贴字段（保留）
  "百亿补贴_info" TEXT,                -- 百亿补贴超链订单
  "百亿补贴_refund_info" TEXT,         -- 百亿补贴退款信息
  
  -- 元数据
  created_at_db TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 创建查询索引（加速搜索）
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_sub_order_no ON orders(sub_order_no);
CREATE INDEX IF NOT EXISTS idx_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_source ON orders(order_source);
CREATE INDEX IF NOT EXISTS idx_product_id ON orders(product_id);

-- 3. 自动更新 updated_at 时间
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_modtime
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- 4. 权限配置
DROP POLICY IF EXISTS "Allow public read access" ON orders;
CREATE POLICY "Allow public read access" ON orders
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert orders" ON orders;
CREATE POLICY "Users can insert orders" ON orders
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update orders" ON orders;
CREATE POLICY "Users can update orders" ON orders
  FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete orders" ON orders;
CREATE POLICY "Users can delete orders" ON orders
  FOR DELETE
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE orders IS '刷单明细订单表（淘宝/天猫刷单管理）';

-- 执行成功提示
SELECT '订单表创建完成 ✅ 可直接导入 Excel 数据' AS result;
