-- 修复 RLS 策略无限递归问题（完整版）
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 1. 先禁用 RLS
-- ============================================
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_menu_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_permissions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. 删除所有现有策略
-- ============================================
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON system_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON system_users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON system_users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON system_users;
DROP POLICY IF EXISTS "Users can view system_users" ON system_users;
DROP POLICY IF EXISTS "Admins can manage system_users" ON system_users;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON user_groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_groups;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON user_groups;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON user_groups;
DROP POLICY IF EXISTS "Users can view user_groups" ON user_groups;
DROP POLICY IF EXISTS "Admins can manage user_groups" ON user_groups;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON menu_permissions;
DROP POLICY IF EXISTS "Users can view menu_permissions" ON menu_permissions;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON shop_settings;
DROP POLICY IF EXISTS "Users can view shop_settings" ON shop_settings;
DROP POLICY IF EXISTS "Admins can manage shop_settings" ON shop_settings;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON role_menu_permissions;
DROP POLICY IF EXISTS "Users can view role_menu_permissions" ON role_menu_permissions;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON user_custom_permissions;
DROP POLICY IF EXISTS "Users can view user_custom_permissions" ON user_custom_permissions;

-- ============================================
-- 3. 重新启用 RLS
-- ============================================
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_menu_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. 创建新的简单策略（避免递归）
-- ============================================

-- system_users 表
CREATE POLICY "Enable read access for all authenticated users" ON system_users FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON system_users FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON system_users FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON system_users FOR DELETE
  USING (auth.role() = 'authenticated');

-- user_groups 表
CREATE POLICY "Enable read access for all authenticated users" ON user_groups FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON user_groups FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON user_groups FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON user_groups FOR DELETE
  USING (auth.role() = 'authenticated');

-- menu_permissions 表
CREATE POLICY "Enable read access for all authenticated users" ON menu_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- shop_settings 表
CREATE POLICY "Enable read access for all authenticated users" ON shop_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON shop_settings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON shop_settings FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON shop_settings FOR DELETE
  USING (auth.role() = 'authenticated');

-- role_menu_permissions 表
CREATE POLICY "Enable read access for all authenticated users" ON role_menu_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- user_custom_permissions 表
CREATE POLICY "Enable read access for all authenticated users" ON user_custom_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- 5. 验证策略
-- ============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('system_users', 'user_groups', 'menu_permissions', 'shop_settings', 'role_menu_permissions', 'user_custom_permissions')
ORDER BY tablename, policyname;
