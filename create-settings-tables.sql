-- 用户及权限管理数据库表（完整版）
-- 用于系统设置、用户管理、权限控制

-- ============================================
-- 1. 用户分组表
-- ============================================
CREATE TABLE IF NOT EXISTS user_groups (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,       -- 组名（海林组、培君组、敏贞组、淑贞组）
  description TEXT,                 -- 分组描述
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 用户表（扩展 Supabase Auth）
-- ============================================
CREATE TABLE IF NOT EXISTS system_users (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,             -- 用户名
  email TEXT,                       -- 邮箱
  full_name TEXT,                   -- 姓名
  group_id BIGINT REFERENCES user_groups(id), -- 所属分组
  role TEXT DEFAULT 'operator',     -- 角色：admin 管理员，group_leader 组长，shop_manager 店长，operator 运营，assistant 运营助理
  phone TEXT,                       -- 电话
  status TEXT DEFAULT 'active',     -- active, inactive
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_users_group ON system_users(group_id);
CREATE INDEX idx_system_users_role ON system_users(role);
CREATE INDEX idx_system_users_status ON system_users(status);

-- ============================================
-- 3. 菜单权限表
-- ============================================
CREATE TABLE IF NOT EXISTS menu_permissions (
  id BIGSERIAL PRIMARY KEY,
  menu_code TEXT NOT NULL UNIQUE,   -- 菜单代码
  menu_name TEXT NOT NULL,          -- 菜单名称
  parent_code TEXT,                 -- 父菜单代码
  sort_order INTEGER DEFAULT 0,     -- 排序
  icon TEXT,                        -- 图标
  path TEXT,                        -- 路径
  template_type TEXT,               -- 关联模板类型：sales, shop_daily, product_daily, fake_order, refund
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 角色菜单权限关联表
-- ============================================
CREATE TABLE IF NOT EXISTS role_menu_permissions (
  id BIGSERIAL PRIMARY KEY,
  role TEXT NOT NULL,               -- 角色：admin, group_leader, shop_manager, operator, assistant
  menu_code TEXT NOT NULL REFERENCES menu_permissions(menu_code),
  can_view BOOLEAN DEFAULT true,    -- 可查看
  can_edit BOOLEAN DEFAULT false,   -- 可编辑
  can_delete BOOLEAN DEFAULT false, -- 可删除
  can_export BOOLEAN DEFAULT false, -- 可导出
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, menu_code)
);

-- ============================================
-- 5. 用户自定义权限表
-- ============================================
CREATE TABLE IF NOT EXISTS user_custom_permissions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES system_users(id) ON DELETE CASCADE,
  menu_code TEXT NOT NULL REFERENCES menu_permissions(menu_code),
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, menu_code)
);

-- ============================================
-- 6. 店铺设置表（扩展）
-- ============================================
CREATE TABLE IF NOT EXISTS shop_settings (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT,                   -- 关联 shops 表 ID（可为空，表示自定义店铺）
  shop_name TEXT NOT NULL,          -- 店铺名称
  platform TEXT,                    -- 所属平台
  group_id BIGINT,                  -- 店铺分组 ID
  manager_name TEXT,                -- 店铺负责人
  account_name TEXT,                -- 账号名称
  is_custom BOOLEAN DEFAULT false,  -- 是否自定义店铺
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shop_settings_shop ON shop_settings(shop_id);
CREATE INDEX idx_shop_settings_group ON shop_settings(group_id);

-- ============================================
-- 初始化数据
-- ============================================

-- 用户分组（4 个组）
INSERT INTO user_groups (name, description) VALUES
  ('海林组', '海林组负责店铺'),
  ('培君组', '培君组负责店铺'),
  ('敏贞组', '敏贞组负责店铺'),
  ('淑贞组', '淑贞组负责店铺')
ON CONFLICT (name) DO NOTHING;

-- 菜单权限（包含所有模板）
INSERT INTO menu_permissions (menu_code, menu_name, parent_code, sort_order, icon, path, template_type) VALUES
  -- 主菜单
  ('dashboard', '经营看板', NULL, 1, '📊', '/', NULL),
  ('products', '商品管理', NULL, 2, '📦', '/products', NULL),
  ('sales', '店铺销售', NULL, 3, '🏪', '/sales', NULL),
  ('import', '数据导入', NULL, 4, '📥', '/import', NULL),
  ('analysis', '商品分析', NULL, 5, '📈', '/analysis', NULL),
  ('shops', '店铺盈亏', NULL, 6, '💰', '/shops', NULL),
  ('profit', '利润监控', NULL, 7, '💵', '/profit', NULL),
  ('settings', '系统设置', NULL, 8, '⚙️', '/settings', NULL),
  
  -- 导入模板权限
  ('import_sales', '销售数据导入', 'import', 1, '📊', '/import?template=sales', 'sales'),
  ('import_shop_daily', '店铺日概况导入', 'import', 2, '📈', '/import?template=shop_daily', 'shop_daily'),
  ('import_product_promo', '商品推广导入', 'import', 3, '📣', '/import?template=product_promo', 'product_promo'),
  ('import_product_daily', '商品日概况导入', 'import', 4, '📦', '/import?template=product_daily', 'product_daily'),
  ('import_fake_order', '刷单明细导入', 'import', 5, '📝', '/import?template=fake_order', 'fake_order'),
  ('import_refund', '退款明细导入', 'import', 6, '💰', '/import?template=refund', 'refund'),
  
  -- 数据查看权限
  ('view_sales_data', '销售数据查看', NULL, 10, '📊', '/sales', 'sales'),
  ('view_shop_daily', '店铺日概况查看', NULL, 11, '📈', '/shops', 'shop_daily'),
  ('view_product_daily', '商品日概况查看', NULL, 12, '📦', '/analysis', 'product_daily'),
  ('view_fake_order', '刷单明细查看', NULL, 13, '📝', '/shops', 'fake_order'),
  ('view_refund', '退款明细查看', NULL, 14, '💰', '/shops', 'refund')
ON CONFLICT (menu_code) DO NOTHING;

-- 角色菜单权限
-- 管理员：所有权限
INSERT INTO role_menu_permissions (role, menu_code, can_view, can_edit, can_delete, can_export) VALUES
  ('admin', 'dashboard', true, true, true, true),
  ('admin', 'products', true, true, true, true),
  ('admin', 'sales', true, true, true, true),
  ('admin', 'import', true, true, true, true),
  ('admin', 'analysis', true, true, true, true),
  ('admin', 'shops', true, true, true, true),
  ('admin', 'profit', true, true, true, true),
  ('admin', 'settings', true, true, true, true),
  ('admin', 'import_sales', true, true, true, true),
  ('admin', 'import_shop_daily', true, true, true, true),
  ('admin', 'import_product_promo', true, true, true, true),
  ('admin', 'import_product_daily', true, true, true, true),
  ('admin', 'import_fake_order', true, true, true, true),
  ('admin', 'import_refund', true, true, true, true),
  ('admin', 'view_sales_data', true, true, true, true),
  ('admin', 'view_shop_daily', true, true, true, true),
  ('admin', 'view_product_daily', true, true, true, true),
  ('admin', 'view_fake_order', true, true, true, true),
  ('admin', 'view_refund', true, true, true, true)
ON CONFLICT (role, menu_code) DO NOTHING;

-- 组长：查看 + 编辑，不能删除
INSERT INTO role_menu_permissions (role, menu_code, can_view, can_edit, can_delete, can_export) VALUES
  ('group_leader', 'dashboard', true, true, false, true),
  ('group_leader', 'sales', true, true, false, true),
  ('group_leader', 'import', true, true, false, true),
  ('group_leader', 'analysis', true, false, false, true),
  ('group_leader', 'shops', true, true, false, true),
  ('group_leader', 'import_sales', true, true, false, true),
  ('group_leader', 'import_shop_daily', true, true, false, true),
  ('group_leader', 'view_sales_data', true, true, false, true),
  ('group_leader', 'view_shop_daily', true, true, false, true)
ON CONFLICT (role, menu_code) DO NOTHING;

-- 店长：查看 + 编辑自己店铺
INSERT INTO role_menu_permissions (role, menu_code, can_view, can_edit, can_delete, can_export) VALUES
  ('shop_manager', 'dashboard', true, false, false, false),
  ('shop_manager', 'sales', true, true, false, false),
  ('shop_manager', 'import', true, true, false, false),
  ('shop_manager', 'shops', true, false, false, false),
  ('shop_manager', 'import_sales', true, true, false, false),
  ('shop_manager', 'import_shop_daily', true, true, false, false),
  ('shop_manager', 'view_sales_data', true, true, false, false),
  ('shop_manager', 'view_shop_daily', true, true, false, false)
ON CONFLICT (role, menu_code) DO NOTHING;

-- 运营：基础查看 + 导入
INSERT INTO role_menu_permissions (role, menu_code, can_view, can_edit, can_delete, can_export) VALUES
  ('operator', 'dashboard', true, false, false, false),
  ('operator', 'products', true, false, false, false),
  ('operator', 'sales', true, false, false, false),
  ('operator', 'import', true, true, false, false),
  ('operator', 'analysis', true, false, false, false),
  ('operator', 'shops', true, false, false, false),
  ('operator', 'import_sales', true, true, false, false),
  ('operator', 'import_shop_daily', true, true, false, false),
  ('operator', 'view_sales_data', true, false, false, false),
  ('operator', 'view_shop_daily', true, false, false, false)
ON CONFLICT (role, menu_code) DO NOTHING;

-- 运营助理：只读
INSERT INTO role_menu_permissions (role, menu_code, can_view, can_edit, can_delete, can_export) VALUES
  ('assistant', 'dashboard', true, false, false, false),
  ('assistant', 'sales', true, false, false, false),
  ('assistant', 'analysis', true, false, false, false),
  ('assistant', 'view_sales_data', true, false, false, false),
  ('assistant', 'view_shop_daily', true, false, false, false)
ON CONFLICT (role, menu_code) DO NOTHING;

-- RLS 策略
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_menu_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- 允许认证用户读取
CREATE POLICY "Users can view system_users" ON system_users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view user_groups" ON user_groups FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view menu_permissions" ON menu_permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view shop_settings" ON shop_settings FOR SELECT USING (auth.role() = 'authenticated');

-- 允许管理员操作
CREATE POLICY "Admins can manage system_users" ON system_users FOR ALL USING (
  EXISTS (SELECT 1 FROM system_users su WHERE su.user_id = auth.uid() AND su.role = 'admin')
);

CREATE POLICY "Admins can manage user_groups" ON user_groups FOR ALL USING (
  EXISTS (SELECT 1 FROM system_users su WHERE su.user_id = auth.uid() AND su.role = 'admin')
);

CREATE POLICY "Admins can manage shop_settings" ON shop_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM system_users su WHERE su.user_id = auth.uid() AND su.role = 'admin')
);

COMMENT ON TABLE user_groups IS '用户分组表';
COMMENT ON TABLE system_users IS '系统用户表';
COMMENT ON TABLE menu_permissions IS '菜单权限表';
COMMENT ON TABLE role_menu_permissions IS '角色菜单权限关联表';
COMMENT ON TABLE user_custom_permissions IS '用户自定义权限表';
COMMENT ON TABLE shop_settings IS '店铺设置表';
