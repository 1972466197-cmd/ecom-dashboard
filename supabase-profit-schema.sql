-- =====================================================
-- 电商利润监控数据库结构优化
-- =====================================================

-- 1. 创建推广消耗表 (daily_marketing)
-- 区分淘宝直通车和抖音千川的消耗
CREATE TABLE IF NOT EXISTS daily_marketing (
  id BIGSERIAL PRIMARY KEY,
  shop_name VARCHAR(100) NOT NULL,          -- 店铺名称
  platform VARCHAR(20) NOT NULL,            -- 平台：taobao/douyin
  date DATE NOT NULL,                       -- 日期
  
  -- 淘宝直通车数据
  taobao_ztc_spend DECIMAL(12,2) DEFAULT 0, -- 直通车消耗
  taobao_ztc_clicks INTEGER DEFAULT 0,      -- 直通车点击数
  taobao_ztc_impressions INTEGER DEFAULT 0, -- 直通车曝光
  
  -- 抖音千川数据
  douyin_qc_spend DECIMAL(12,2) DEFAULT 0,  -- 千川消耗
  douyin_qc_clicks INTEGER DEFAULT 0,       -- 千川点击数
  douyin_qc_impressions INTEGER DEFAULT 0,  -- 千川曝光
  
  -- 其他推广
  other_spend DECIMAL(12,2) DEFAULT 0,      -- 其他推广费用
  
  -- 汇总
  total_spend DECIMAL(12,2) GENERATED ALWAYS AS (
    COALESCE(taobao_ztc_spend, 0) + 
    COALESCE(douyin_qc_spend, 0) + 
    COALESCE(other_spend, 0)
  ) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(shop_name, date)
);

-- 创建索引
CREATE INDEX idx_daily_marketing_shop_date ON daily_marketing(shop_name, date);
CREATE INDEX idx_daily_marketing_platform ON daily_marketing(platform);
CREATE INDEX idx_daily_marketing_date ON daily_marketing(date);

-- 2. 创建 SKU 成本表 (sku_costs)
-- 存储每个产品的采购价和快递费
CREATE TABLE IF NOT EXISTS sku_costs (
  id BIGSERIAL PRIMARY KEY,
  sku_code VARCHAR(50) NOT NULL,            -- SKU 编码
  product_name VARCHAR(200) NOT NULL,       -- 产品名称
  shop_name VARCHAR(100),                   -- 所属店铺
  
  -- 成本信息
  purchase_price DECIMAL(10,2) NOT NULL,    -- 采购价
  shipping_cost DECIMAL(10,2) DEFAULT 0,    -- 快递费
  packaging_cost DECIMAL(10,2) DEFAULT 0,   -- 包装费
  labor_cost DECIMAL(10,2) DEFAULT 0,       -- 人工成本
  
  -- 汇总成本
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (
    purchase_price + 
    COALESCE(shipping_cost, 0) + 
    COALESCE(packaging_cost, 0) + 
    COALESCE(labor_cost, 0)
  ) STORED,
  
  -- 有效期
  effective_date DATE DEFAULT CURRENT_DATE, -- 生效日期
  is_active BOOLEAN DEFAULT TRUE,           -- 是否启用
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(sku_code, effective_date)
);

-- 创建索引
CREATE INDEX idx_sku_costs_sku ON sku_costs(sku_code);
CREATE INDEX idx_sku_costs_shop ON sku_costs(shop_name);
CREATE INDEX idx_sku_costs_active ON sku_costs(is_active) WHERE is_active = TRUE;

-- 3. 创建销售数据表 (如果还没有)
CREATE TABLE IF NOT EXISTS sales_data (
  id BIGSERIAL PRIMARY KEY,
  shop_name VARCHAR(100) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  sku_code VARCHAR(50),
  
  -- 销售数据
  sales_amount DECIMAL(12,2) DEFAULT 0,     -- 销售金额
  order_count INTEGER DEFAULT 0,            -- 订单数
  item_count INTEGER DEFAULT 0,             -- 商品数量
  
  -- 退款数据
  refund_amount DECIMAL(12,2) DEFAULT 0,    -- 退款金额
  refund_order_count INTEGER DEFAULT 0,     -- 退款订单数
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(shop_name, date, sku_code)
);

CREATE INDEX idx_sales_data_shop_date ON sales_data(shop_name, date);
CREATE INDEX idx_sales_data_sku ON sales_data(sku_code);

-- =====================================================
-- 4. 创建利润计算视图 (daily_profit_view)
-- 自动关联 sales_data、daily_marketing 和 sku_costs
-- =====================================================

CREATE OR REPLACE VIEW daily_profit_view AS
WITH daily_sales AS (
  -- 每日销售汇总
  SELECT 
    s.shop_name,
    s.platform,
    s.date,
    SUM(s.sales_amount) AS total_sales,
    SUM(s.order_count) AS total_orders,
    SUM(s.item_count) AS total_items,
    SUM(s.refund_amount) AS total_refunds,
    SUM(s.refund_order_count) AS total_refund_orders
  FROM sales_data s
  GROUP BY s.shop_name, s.platform, s.date
),
daily_marketing_agg AS (
  -- 每日推广汇总
  SELECT 
    m.shop_name,
    m.date,
    SUM(COALESCE(m.taobao_ztc_spend, 0)) AS ztc_spend,
    SUM(COALESCE(m.douyin_qc_spend, 0)) AS qc_spend,
    SUM(COALESCE(m.other_spend, 0)) AS other_spend,
    SUM(m.total_spend) AS total_marketing
  FROM daily_marketing m
  GROUP BY m.shop_name, m.date
),
sku_cost_avg AS (
  -- SKU 平均成本（取最新生效的成本）
  SELECT DISTINCT ON (sc.sku_code)
    sc.sku_code,
    sc.purchase_price,
    sc.shipping_cost,
    sc.total_cost
  FROM sku_costs sc
  WHERE sc.is_active = TRUE
  ORDER BY sc.sku_code, sc.effective_date DESC
),
daily_sku_cost AS (
  -- 每日 SKU 成本汇总
  SELECT 
    s.shop_name,
    s.date,
    SUM(s.item_count * COALESCE(sca.total_cost, 0)) AS total_product_cost,
    SUM(s.item_count * COALESCE(sca.shipping_cost, 0)) AS total_shipping_cost
  FROM sales_data s
  LEFT JOIN sku_cost_avg sca ON s.sku_code = sca.sku_code
  GROUP BY s.shop_name, s.date
)
SELECT 
  ds.shop_name,
  ds.platform,
  ds.date,
  
  -- 销售数据
  ds.total_sales AS gross_sales,
  ds.total_refunds,
  (ds.total_sales - ds.total_refunds) AS net_sales,
  ds.total_orders,
  ds.total_items,
  
  -- 成本数据
  COALESCE(dsc.total_product_cost, 0) AS product_cost,
  COALESCE(dsc.total_shipping_cost, 0) AS shipping_cost,
  
  -- 推广数据
  COALESCE(dma.ztc_spend, 0) AS taobao_ztc_spend,
  COALESCE(dma.qc_spend, 0) AS douyin_qc_spend,
  COALESCE(dma.other_spend, 0) AS other_marketing,
  COALESCE(dma.total_marketing, 0) AS total_marketing,
  
  -- 其他费用（估算）
  (ds.total_sales - ds.total_refunds) * 0.05 AS platform_fee,  -- 平台扣点 5%
  (ds.total_sales - ds.total_refunds) * 0.03 AS tax_fee,       -- 税费 3%
  
  -- 总成本
  COALESCE(dsc.total_product_cost, 0) + 
  COALESCE(dsc.total_shipping_cost, 0) + 
  COALESCE(dma.total_marketing, 0) + 
  (ds.total_sales - ds.total_refunds) * 0.08 AS total_cost,
  
  -- 净利润
  (ds.total_sales - ds.total_refunds) - 
  COALESCE(dsc.total_product_cost, 0) - 
  COALESCE(dsc.total_shipping_cost, 0) - 
  COALESCE(dma.total_marketing, 0) - 
  (ds.total_sales - ds.total_refunds) * 0.08 AS net_profit,
  
  -- 毛利率
  CASE 
    WHEN ds.total_sales > 0 THEN 
      ((ds.total_sales - ds.total_refunds - COALESCE(dsc.total_product_cost, 0) - COALESCE(dsc.total_shipping_cost, 0)) 
      / (ds.total_sales - ds.total_refunds) * 100)
    ELSE 0 
  END AS gross_margin_rate,
  
  -- 净利率
  CASE 
    WHEN ds.total_sales > 0 THEN 
      (((ds.total_sales - ds.total_refunds) - COALESCE(dsc.total_product_cost, 0) - 
        COALESCE(dsc.total_shipping_cost, 0) - COALESCE(dma.total_marketing, 0) - 
        (ds.total_sales - ds.total_refunds) * 0.08) 
      / (ds.total_sales - ds.total_refunds) * 100)
    ELSE 0 
  END AS net_margin_rate,
  
  -- ROI
  CASE 
    WHEN COALESCE(dma.total_marketing, 0) > 0 THEN 
      (ds.total_sales - ds.total_refunds) / COALESCE(dma.total_marketing, 0)
    ELSE 0 
  END AS roi,
  
  -- 损益平衡点 ROI（假设毛利率 35%，其他费用 8%）
  1.0 / (0.35 - 0.08) AS break_even_roi,
  
  -- 是否低于损益平衡点
  CASE 
    WHEN COALESCE(dma.total_marketing, 0) > 0 AND 
         (ds.total_sales - ds.total_refunds) / COALESCE(dma.total_marketing, 0) < (1.0 / (0.35 - 0.08))
    THEN TRUE 
    ELSE FALSE 
  END AS is_below_break_even
  
FROM daily_sales ds
LEFT JOIN daily_marketing_agg dma ON ds.shop_name = dma.shop_name AND ds.date = dma.date
LEFT JOIN daily_sku_cost dsc ON ds.shop_name = dsc.shop_name AND ds.date = dsc.date
ORDER BY ds.date DESC, ds.shop_name;

-- =====================================================
-- 5. 创建店铺每日汇总视图 (shop_daily_summary)
-- =====================================================

CREATE OR REPLACE VIEW shop_daily_summary AS
SELECT 
  date,
  shop_name,
  platform,
  
  -- 销售汇总
  SUM(gross_sales) AS total_gross_sales,
  SUM(total_refunds) AS total_refunds,
  SUM(net_sales) AS total_net_sales,
  SUM(total_orders) AS total_orders,
  
  -- 成本汇总
  SUM(product_cost) AS total_product_cost,
  SUM(shipping_cost) AS total_shipping_cost,
  SUM(total_marketing) AS total_marketing,
  SUM(taobao_ztc_spend) AS total_ztc_spend,
  SUM(douyin_qc_spend) AS total_qc_spend,
  
  -- 利润汇总
  SUM(net_profit) AS total_net_profit,
  
  -- 平均利润率
  AVG(gross_margin_rate) AS avg_gross_margin_rate,
  AVG(net_margin_rate) AS avg_net_margin_rate,
  
  -- 平均 ROI
  CASE 
    WHEN SUM(total_marketing) > 0 THEN SUM(net_sales) / SUM(total_marketing)
    ELSE 0 
  END AS avg_roi,
  
  -- 预警状态
  COUNT(CASE WHEN is_below_break_even THEN 1 END) AS below_break_even_count,
  MAX(is_below_break_even) AS has_break_even_alert
  
FROM daily_profit_view
GROUP BY date, shop_name, platform
ORDER BY date DESC, shop_name;

-- =====================================================
-- 6. 创建预警表 (profit_alerts)
-- =====================================================

CREATE TABLE IF NOT EXISTS profit_alerts (
  id BIGSERIAL PRIMARY KEY,
  shop_name VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  alert_type VARCHAR(50) NOT NULL,         -- low_roi/negative_profit/low_margin
  alert_level VARCHAR(20) DEFAULT 'warning', -- warning/critical
  current_value DECIMAL(10,2),              -- 当前值
  threshold_value DECIMAL(10,2),            -- 阈值
  message TEXT,                             -- 预警消息
  is_resolved BOOLEAN DEFAULT FALSE,        -- 是否已解决
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  UNIQUE(shop_name, date, alert_type)
);

CREATE INDEX idx_profit_alerts_shop ON profit_alerts(shop_name);
CREATE INDEX idx_profit_alerts_date ON profit_alerts(date);
CREATE INDEX idx_profit_alerts_unresolved ON profit_alerts(is_resolved) WHERE is_resolved = FALSE;

-- =====================================================
-- 7. 创建自动预警函数和触发器
-- =====================================================

CREATE OR REPLACE FUNCTION check_profit_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查 ROI 是否低于损益平衡点
  IF NEW.roi < NEW.break_even_roi AND NEW.total_marketing > 0 THEN
    INSERT INTO profit_alerts (shop_name, date, alert_type, alert_level, current_value, threshold_value, message)
    VALUES (
      NEW.shop_name,
      NEW.date,
      'low_roi',
      CASE WHEN NEW.roi < NEW.break_even_roi * 0.7 THEN 'critical' ELSE 'warning' END,
      NEW.roi,
      NEW.break_even_roi,
      FORMAT('店铺 %s 的 ROI (%.2f) 低于损益平衡点 (%.2f)', NEW.shop_name, NEW.roi, NEW.break_even_roi)
    )
    ON CONFLICT (shop_name, date, alert_type) 
    DO UPDATE SET 
      current_value = EXCLUDED.current_value,
      alert_level = EXCLUDED.alert_level,
      message = EXCLUDED.message,
      is_resolved = FALSE,
      created_at = NOW();
  END IF;
  
  -- 检查净利润是否为负
  IF NEW.net_profit < 0 THEN
    INSERT INTO profit_alerts (shop_name, date, alert_type, alert_level, current_value, threshold_value, message)
    VALUES (
      NEW.shop_name,
      NEW.date,
      'negative_profit',
      CASE WHEN NEW.net_profit < -10000 THEN 'critical' ELSE 'warning' END,
      NEW.net_profit,
      0,
      FORMAT('店铺 %s 净利润为负：¥%.2f', NEW.shop_name, NEW.net_profit)
    )
    ON CONFLICT (shop_name, date, alert_type) 
    DO UPDATE SET 
      current_value = EXCLUDED.current_value,
      alert_level = EXCLUDED.alert_level,
      message = EXCLUDED.message,
      is_resolved = FALSE,
      created_at = NOW();
  END IF;
  
  -- 检查毛利率是否过低
  IF NEW.gross_margin_rate < 20 THEN
    INSERT INTO profit_alerts (shop_name, date, alert_type, alert_level, current_value, threshold_value, message)
    VALUES (
      NEW.shop_name,
      NEW.date,
      'low_margin',
      CASE WHEN NEW.gross_margin_rate < 10 THEN 'critical' ELSE 'warning' END,
      NEW.gross_margin_rate,
      20,
      FORMAT('店铺 %s 毛利率过低：%.1f%%', NEW.shop_name, NEW.gross_margin_rate)
    )
    ON CONFLICT (shop_name, date, alert_type) 
    DO UPDATE SET 
      current_value = EXCLUDED.current_value,
      alert_level = EXCLUDED.alert_level,
      message = EXCLUDED.message,
      is_resolved = FALSE,
      created_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trg_check_profit_alerts ON daily_profit_view;
-- 注意：视图不能直接创建触发器，需要在插入 sales_data 或 daily_marketing 时触发

-- =====================================================
-- 8. 插入示例数据
-- =====================================================

-- 插入店铺成本配置
INSERT INTO sku_costs (sku_code, product_name, shop_name, purchase_price, shipping_cost, packaging_cost, labor_cost)
VALUES 
  ('TS-001', '春夏 T 恤', '淘宝楠箐', 35.00, 8.00, 2.00, 5.00),
  ('JN-002', '休闲牛仔裤', '淘宝楠箐', 80.00, 10.00, 3.00, 8.00),
  ('WD-003', '运动卫衣', '淘宝轻奢', 55.00, 9.00, 2.50, 6.00),
  ('DK-004', '抖音同款外套', '抖音楠箐', 90.00, 12.00, 4.00, 10.00)
ON CONFLICT (sku_code, effective_date) DO NOTHING;

-- 插入推广数据示例
INSERT INTO daily_marketing (shop_name, platform, date, taobao_ztc_spend, taobao_ztc_clicks, douyin_qc_spend, douyin_qc_clicks, other_spend)
VALUES 
  ('淘宝楠箐', 'taobao', CURRENT_DATE - 1, 5000.00, 2500, 0, 0, 500),
  ('淘宝楠箐', 'taobao', CURRENT_DATE, 5500.00, 2800, 0, 0, 600),
  ('抖音楠箐', 'douyin', CURRENT_DATE - 1, 0, 0, 8000.00, 4000, 1000),
  ('抖音楠箐', 'douyin', CURRENT_DATE, 0, 0, 8500.00, 4200, 1200)
ON CONFLICT (shop_name, date) DO UPDATE SET
  taobao_ztc_spend = EXCLUDED.taobao_ztc_spend,
  douyin_qc_spend = EXCLUDED.douyin_qc_spend,
  updated_at = NOW();

-- =====================================================
-- 9. 常用查询示例
-- =====================================================

-- 查询每日利润趋势（最近 30 天）
-- SELECT date, shop_name, net_profit, gross_margin_rate, net_margin_rate, roi
-- FROM daily_profit_view
-- WHERE date >= CURRENT_DATE - 30
-- ORDER BY date DESC, shop_name;

-- 查询预警店铺
-- SELECT shop_name, date, alert_type, alert_level, message
-- FROM profit_alerts
-- WHERE is_resolved = FALSE
-- ORDER BY date DESC, 
--   CASE alert_level WHEN 'critical' THEN 1 ELSE 2 END;

-- 查询店铺盈亏平衡分析
-- SELECT 
--   shop_name,
--   AVG(net_profit) AS avg_daily_profit,
--   AVG(roi) AS avg_roi,
--   AVG(break_even_roi) AS break_even_roi,
--   COUNT(CASE WHEN is_below_break_even THEN 1 END) AS days_below_break_even
-- FROM daily_profit_view
-- WHERE date >= CURRENT_DATE - 30
-- GROUP BY shop_name
-- ORDER BY avg_daily_profit DESC;

-- =====================================================
-- 10. 创建 RLS 策略（如果需要行级安全）
-- =====================================================

-- ALTER TABLE daily_marketing ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sku_costs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE profit_alerts ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow authenticated read" ON daily_marketing FOR SELECT TO authenticated USING (TRUE);
-- CREATE POLICY "Allow authenticated write" ON daily_marketing FOR ALL TO authenticated USING (TRUE);

COMMENT ON TABLE daily_marketing IS '每日推广消耗表 - 区分淘宝直通车和抖音千川';
COMMENT ON TABLE sku_costs IS 'SKU 成本表 - 存储采购价和快递费';
COMMENT ON VIEW daily_profit_view IS '每日利润计算视图 - 自动关联销售、推广、成本数据';
COMMENT ON VIEW shop_daily_summary IS '店铺每日汇总视图';
COMMENT ON TABLE profit_alerts IS '利润预警表';
