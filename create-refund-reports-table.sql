-- 退款明细数据表
-- 用于记录退款订单明细（淘宝/天猫退款管理）

CREATE TABLE IF NOT EXISTS refund_reports (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES shops(id) ON DELETE CASCADE,
  
  -- 基础信息
  month TEXT,                    -- A 列：月份
  product_time TEXT,             -- B 列：单品情况用时间
  refund_finished_at TIMESTAMPTZ, -- C 列：退款完结时间
  refund_apply_at TIMESTAMPTZ,   -- D 列：退款的申请时间
  paid_at TIMESTAMPTZ,           -- E 列：付款时间
  
  -- 退款类型
  refund_type1 TEXT,             -- F 列：退款类型 1
  refund_type2 TEXT,             -- G 列：退款类型 2
  order_count BIGINT DEFAULT 0,  -- H 列：单量
  
  -- 订单信息
  order_no TEXT,                 -- I 列：订单编号
  refund_no TEXT,                -- J 列：退款编号
  payment_no TEXT,               -- K 列：支付单号
  order_paid_at TIMESTAMPTZ,     -- L 列：订单付款时间
  
  -- 商品信息
  product_id_external TEXT,      -- M 列：商品 id
  product_code TEXT,             -- N 列：商品编码
  product_title TEXT,            -- Q 列：宝贝标题
  
  -- 退款信息
  refund_finished_at_1 TIMESTAMPTZ, -- O 列：退款完结时间.1
  buyer_paid_amount NUMERIC(12,2) DEFAULT 0, -- P 列：买家实际支付金额
  buyer_refund_amount NUMERIC(12,2) DEFAULT 0, -- R 列：买家退款金额
  refund_method TEXT,            -- S 列：手工退款 / 系统退款
  after_sale_type TEXT,          -- T 列：售后类型
  refund_apply_at_1 TIMESTAMPTZ, -- U 列：退款的申请时间.1
  
  -- 时间信息
  timeout_at TIMESTAMPTZ,        -- V 列：超时时间
  finish_at TIMESTAMPTZ,         -- AQ 列：完结时间
  
  -- 状态信息
  refund_status TEXT,            -- W 列：退款状态
  goods_status TEXT,             -- X 列：货物状态
  return_logistics_info TEXT,    -- Y 列：退货物流信息
  ship_logistics_info TEXT,      -- Z 列：发货物流信息
  cs_intervention_status TEXT,   -- AA 列：客服介入状态
  
  -- 卖家信息
  seller_name TEXT,              -- AB 列：卖家真实姓名
  seller_name_new TEXT,          -- AC 列：卖家真实姓名 (新)
  seller_return_address TEXT,    -- AD 列：卖家退货地址
  seller_zip TEXT,               -- AE 列：卖家邮编
  seller_phone TEXT,             -- AF 列：卖家电话
  seller_mobile TEXT,            -- AG 列：卖家手机
  
  -- 物流信息
  return_tracking_no TEXT,       -- AH 列：退货物流单号
  return_logistics_company TEXT, -- AI 列：退货物流公司
  
  -- 买家信息
  buyer_refund_reason TEXT,      -- AJ 列：买家退款原因
  buyer_refund_desc TEXT,        -- AK 列：买家退款说明
  buyer_return_at TIMESTAMPTZ,   -- AL 列：买家退货时间
  
  -- 责任信息
  responsibility_party TEXT,     -- AM 列：责任方
  sale_stage TEXT,               -- AN 列：售中或售后
  
  -- 备注信息
  remark_tag TEXT,               -- AO 列：备注标签
  merchant_remark TEXT,          -- AP 列：商家备注
  
  -- 退款类型
  refund_scope TEXT,             -- AR 列：部分退款 / 全部退款
  
  -- 审核信息
  auditor_name TEXT,             -- AS 列：审核操作人
  auditor_name_new TEXT,         -- AT 列：审核操作人新会员名
  evidence_timeout_at TIMESTAMPTZ, -- AU 列：举证超时
  is_zero_response BOOLEAN DEFAULT false, -- AV 列：是否零秒响应
  
  -- 新增字段（AW-BG 列）
  refund_auditor TEXT,           -- AW 列：退款操作人
  refund_auditor_new TEXT,       -- AX 列：退款操作人新会员名
  refund_reason_tag TEXT,        -- AY 列：退款原因标签
  business_type TEXT,            -- AZ 列：业务类型
  is_help_refund BOOLEAN DEFAULT false, -- BA 列：是否帮他退款
  help_refund_account TEXT,      -- BB 列：帮他退款操作账号
  small_amount_collection NUMERIC(12,2) DEFAULT 0, -- BC 列：小额收款
  taote_order_info TEXT,         -- BD 列：淘特订单
 百亿补贴_refund_info TEXT,     -- BE 列：百亿补贴超链退款信息
  smart_refund_strategy TEXT,    -- BF 列：智能退款策略
  execution_plan TEXT,           -- BG 列：执行方案
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_refund_shop_id ON refund_reports(shop_id);
CREATE INDEX idx_refund_order_no ON refund_reports(order_no);
CREATE INDEX idx_refund_refund_no ON refund_reports(refund_no);
CREATE INDEX idx_refund_product ON refund_reports(product_id_external);
CREATE INDEX idx_refund_finished_at ON refund_reports(refund_finished_at);

-- 允许公开读取
DROP POLICY IF EXISTS "Allow public read access" ON refund_reports;
CREATE POLICY "Allow public read access" ON refund_reports
  FOR SELECT
  USING (true);

-- 允许认证用户操作
DROP POLICY IF EXISTS "Users can insert refund_reports" ON refund_reports;
CREATE POLICY "Users can insert refund_reports" ON refund_reports
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update refund_reports" ON refund_reports;
CREATE POLICY "Users can update refund_reports" ON refund_reports
  FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete refund_reports" ON refund_reports;
CREATE POLICY "Users can delete refund_reports" ON refund_reports
  FOR DELETE
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE refund_reports IS '退款明细报表（淘宝/天猫退款管理）';
