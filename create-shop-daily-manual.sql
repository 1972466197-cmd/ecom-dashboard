-- ============================================
-- 店铺每日手动编辑数据表
-- 用于存储用户手动编辑的成本、佣金等数据
-- ============================================

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

CREATE INDEX idx_shop_daily_manual_shop_date ON shop_daily_manual(shop_id, stat_date);

-- 初始化一些示例数据（可选）
-- INSERT INTO shop_daily_manual (shop_id, stat_date, cost, commission) VALUES
--   (1, '2026-03-29', 5000, 200);

COMMENT ON TABLE shop_daily_manual IS '店铺每日手动编辑数据表';
COMMENT ON COLUMN shop_daily_manual.shop_id IS '店铺 ID（0 表示汇总数据）';
COMMENT ON COLUMN shop_daily_manual.stat_date IS '统计日期';
COMMENT ON COLUMN shop_daily_manual.cost IS '成本（手动编辑）';
COMMENT ON COLUMN shop_daily_manual.return_cost IS '退回成本（手动编辑）';
COMMENT ON COLUMN shop_daily_manual.commission IS '刷单佣金（手动编辑）';
