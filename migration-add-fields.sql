-- ============================================
-- 数据库迁移脚本 - 添加缺失字段
-- 2026-03-29
-- ============================================

-- 1. 创建 shop_daily_manual 表（如果不存在）
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

-- 2. 检查 shop_daily_reports 表是否包含 commission 字段，如果没有则添加
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'commission'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN commission NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- 3. 检查 shop_daily_reports 表是否包含 fake_orders_amount 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'fake_orders_amount'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN fake_orders_amount NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- 4. 检查 shop_daily_reports 表是否包含 fake_orders_count 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'fake_orders_count'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN fake_orders_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 5. 检查 shop_daily_reports 表是否包含 logistics_fee 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'logistics_fee'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN logistics_fee NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- 6. 检查 shop_daily_reports 表是否包含 platform_fee 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'platform_fee'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN platform_fee NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- 7. 检查 shop_daily_reports 表是否包含 labor_cost 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'labor_cost'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN labor_cost NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- 8. 检查 shop_daily_reports 表是否包含 gross_profit 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'gross_profit'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN gross_profit NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- 9. 检查 shop_daily_reports 表是否包含 net_profit 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'net_profit'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN net_profit NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

COMMENT ON TABLE shop_daily_manual IS '店铺每日手动编辑数据表（成本、佣金等）';
