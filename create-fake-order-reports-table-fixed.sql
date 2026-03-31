-- 刷单明细数据表 - 匹配 Excel 导入格式
-- 在 Supabase SQL Editor 中运行此脚本

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS fake_order_reports CASCADE;

CREATE TABLE fake_order_reports (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES shops(id) ON DELETE CASCADE,
  
  -- 基础信息（A-D 列）
  month TEXT,                    -- A 列：月份
  report_time TEXT,              -- B 列：时间
  shop_order_count BIGINT DEFAULT 0, -- C 列：店铺（订单）
  product_order_count BIGINT DEFAULT 0, -- D 列：商品（件数）
  
  -- 订单信息（E-P 列）
  order_id TEXT,                 -- E 列：子订单编号
  sub_order_no TEXT,             -- F 列：子订单编号
  main_order_no TEXT UNIQUE,     -- G 列：主订单编号（唯一约束）
  product_title TEXT,            -- H 列：商品标题
  product_price NUMERIC(10,2) DEFAULT 0, -- I 列：商品价格
  quantity BIGINT DEFAULT 0,     -- J 列：购买数量
  external_id TEXT,              -- K 列：外部系统编号
  product_attrs TEXT,            -- L 列：商品属性
  package_info TEXT,             -- M 列：包裹信息
  contact_remark TEXT,           -- N 列：联系方式备注
  order_status TEXT,             -- O 列：订单状态
  merchant_code TEXT,            -- P 列：商家编码
  
  -- 支付信息（Q-S 列）
  payment_no TEXT,               -- Q 列：支付单号
  payable_amount NUMERIC(12,2) DEFAULT 0, -- R 列：买家应付货款
  paid_amount NUMERIC(12,2) DEFAULT 0, -- S 列：买家实付金额（刷单金额）
  
  -- 退款信息（T-U 列）
  refund_status TEXT,            -- T 列：退款状态
  refund_amount NUMERIC(12,2) DEFAULT 0, -- U 列：退款金额
  
  -- 时间信息（V 列等）
  order_created_at TIMESTAMPTZ,  -- V 列：订单创建时间（格式：2026-03-21 14:22:前）
  order_paid_at TIMESTAMPTZ,     -- 订单付款时间
  ship_time TIMESTAMPTZ,         -- 发货时间
  should_ship_at TIMESTAMPTZ,    -- 应发货时间
  
  -- 渠道信息（X-AK 列）
  taoxianda_channel TEXT,        -- X 列：淘鲜达
  fliggy_order_info TEXT,        -- AK 列：飞猪购订单信息
  free_order_qualification TEXT, -- AL 列：免单资格
  free_order_amount NUMERIC(12,2) DEFAULT 0, -- AM 列：免单金额
  "百亿补贴_info" TEXT,          -- AN 列：百亿补贴超链订单
  chain_half_managed_info TEXT,  -- AO 列：超链半托管订单
  
  -- 商品信息（Y 列）
  product_id_external TEXT,      -- Y 列：商品 ID
  
  -- 备注信息（AA-AC 列）
  remark_tag TEXT,               -- AA 列：备注标签
  merchant_remark TEXT,          -- AB 列：商家备注
  buyer_message TEXT,            -- AC 列：买家留言
  
  -- 物流信息（AE-AF 列）
  tracking_no TEXT,              -- AE 列：物流单号
  logistics_company TEXT,        -- AF 列：物流公司
  
  -- 赔付信息（AG-AI 列）
  is_compensation BOOLEAN DEFAULT false, -- AG 列：是否主动赔付
  compensation_amount NUMERIC(12,2) DEFAULT 0, -- AH 列：主动赔付金额
  compensation_paid_at TIMESTAMPTZ, -- AI 列：主动赔付出账时
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_fake_order_shop_id ON fake_order_reports(shop_id);
CREATE INDEX idx_fake_order_main_order_no ON fake_order_reports(main_order_no);
CREATE INDEX idx_fake_order_product ON fake_order_reports(product_id_external);
CREATE INDEX idx_fake_order_created_at ON fake_order_reports(order_created_at);

-- 允许公开读取
DROP POLICY IF EXISTS "Allow public read access" ON fake_order_reports;
CREATE POLICY "Allow public read access" ON fake_order_reports
  FOR SELECT
  USING (true);

-- 允许认证用户操作
DROP POLICY IF EXISTS "Users can insert fake_order_reports" ON fake_order_reports;
CREATE POLICY "Users can insert fake_order_reports" ON fake_order_reports
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update fake_order_reports" ON fake_order_reports;
CREATE POLICY "Users can update fake_order_reports" ON fake_order_reports
  FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete fake_order_reports" ON fake_order_reports;
CREATE POLICY "Users can delete fake_order_reports" ON fake_order_reports
  FOR DELETE
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE fake_order_reports IS '刷单明细报表（淘宝/天猫刷单管理）';
