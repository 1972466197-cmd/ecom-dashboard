-- ============================================
-- 修复 shop_daily_reports 表缺失字段
-- 2026-03-30
-- ============================================

-- 1. 添加 net_profit 字段（如果不存在）
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'net_profit'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN net_profit NUMERIC(12,2) DEFAULT 0;
    COMMENT ON COLUMN shop_daily_reports.net_profit IS '净利润';
  END IF;
END $$;

-- 2. 添加 gross_profit 字段（如果不存在）
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'gross_profit'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN gross_profit NUMERIC(12,2) DEFAULT 0;
    COMMENT ON COLUMN shop_daily_reports.gross_profit IS '毛利润';
  END IF;
END $$;

-- 3. 添加 fake_orders_amount 字段（如果不存在）
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'fake_orders_amount'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN fake_orders_amount NUMERIC(12,2) DEFAULT 0;
    COMMENT ON COLUMN shop_daily_reports.fake_orders_amount IS '刷单金额';
  END IF;
END $$;

-- 4. 添加 fake_orders_count 字段（如果不存在）
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'fake_orders_count'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN fake_orders_count INTEGER DEFAULT 0;
    COMMENT ON COLUMN shop_daily_reports.fake_orders_count IS '刷单数量';
  END IF;
END $$;

-- 5. 添加 commission 字段（如果不存在）
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'commission'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN commission NUMERIC(10,2) DEFAULT 0;
    COMMENT ON COLUMN shop_daily_reports.commission IS '刷单佣金';
  END IF;
END $$;

-- 6. 添加 logistics_fee 字段（如果不存在）
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'logistics_fee'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN logistics_fee NUMERIC(10,2) DEFAULT 0;
    COMMENT ON COLUMN shop_daily_reports.logistics_fee IS '物流费用';
  END IF;
END $$;

-- 7. 添加 platform_fee 字段（如果不存在）
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'platform_fee'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN platform_fee NUMERIC(10,2) DEFAULT 0;
    COMMENT ON COLUMN shop_daily_reports.platform_fee IS '平台费用';
  END IF;
END $$;

-- 8. 添加 labor_cost 字段（如果不存在）
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'labor_cost'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN labor_cost NUMERIC(10,2) DEFAULT 0;
    COMMENT ON COLUMN shop_daily_reports.labor_cost IS '人工成本';
  END IF;
END $$;

-- 9. 创建 shop_daily_manual 表（用于手动编辑的数据）
CREATE TABLE IF NOT EXISTS shop_daily_manual (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES shops(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  cost NUMERIC(12,2) DEFAULT 0,
  return_cost NUMERIC(12,2) DEFAULT 0,
  commission NUMERIC(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_shop_daily_manual_shop_date ON shop_daily_manual(shop_id, stat_date);

COMMENT ON TABLE shop_daily_manual IS '店铺每日手动编辑数据表';
COMMENT ON COLUMN shop_daily_manual.shop_id IS '店铺 ID（0 表示汇总数据）';
COMMENT ON COLUMN shop_daily_manual.stat_date IS '统计日期';
COMMENT ON COLUMN shop_daily_manual.cost IS '成本（手动编辑）';
COMMENT ON COLUMN shop_daily_manual.return_cost IS '退回成本（手动编辑）';
COMMENT ON COLUMN shop_daily_manual.commission IS '刷单佣金（手动编辑）';

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'shop_daily_reports'
ORDER BY ordinal_position;
