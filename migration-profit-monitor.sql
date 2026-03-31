-- ============================================
-- 利润监控 - 数据库完整迁移脚本
-- 2026-03-30
-- ============================================

-- ============================================
-- 1. 检查并创建 shop_daily_manual 表
-- 用于存储手动编辑的成本、佣金数据
-- ============================================
DROP TABLE IF EXISTS shop_daily_manual CASCADE;

CREATE TABLE shop_daily_manual (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT NOT NULL DEFAULT 0,
  stat_date DATE NOT NULL,
  cost NUMERIC(12,2) DEFAULT 0,
  return_cost NUMERIC(12,2) DEFAULT 0,
  commission NUMERIC(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, stat_date)
);

CREATE INDEX idx_shop_daily_manual_shop_date ON shop_daily_manual(shop_id, stat_date);

COMMENT ON TABLE shop_daily_manual IS '店铺每日手动编辑数据表（成本、佣金等）';
COMMENT ON COLUMN shop_daily_manual.shop_id IS '店铺 ID（0 表示汇总数据）';
COMMENT ON COLUMN shop_daily_manual.stat_date IS '统计日期';
COMMENT ON COLUMN shop_daily_manual.cost IS '成本（手动编辑）';
COMMENT ON COLUMN shop_daily_manual.return_cost IS '退回成本（手动编辑）';
COMMENT ON COLUMN shop_daily_manual.commission IS '刷单佣金（手动编辑）';

-- ============================================
-- 2. 检查 shop_daily_reports 表并添加缺失字段
-- ============================================

-- 添加 commission 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'commission'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN commission NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- 添加 fake_orders_amount 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'fake_orders_amount'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN fake_orders_amount NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- 添加 fake_orders_count 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'fake_orders_count'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN fake_orders_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 添加 gross_profit 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'gross_profit'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN gross_profit NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- 添加 net_profit 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'net_profit'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN net_profit NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- 添加 logistics_fee 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'logistics_fee'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN logistics_fee NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- 添加 platform_fee 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'platform_fee'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN platform_fee NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- 添加 labor_cost 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'labor_cost'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN labor_cost NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- 添加 cost 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'cost'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN cost NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- 添加 return_cost 字段
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_daily_reports' AND column_name = 'return_cost'
  ) THEN
    ALTER TABLE shop_daily_reports ADD COLUMN return_cost NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 3. 验证字段
-- ============================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'shop_daily_reports'
  AND column_name IN ('commission', 'fake_orders_amount', 'fake_orders_count', 'gross_profit', 'net_profit', 'logistics_fee', 'platform_fee', 'labor_cost', 'cost', 'return_cost')
ORDER BY ordinal_position;

-- ============================================
-- 4. 插入示例数据（可选）
-- ============================================
-- INSERT INTO shop_daily_manual (shop_id, stat_date, cost, commission) VALUES
--   (0, '2026-03-29', 5000, 200);
