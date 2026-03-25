-- 修复 shops 表的 RLS 策略，允许公开读取
-- 在 Supabase SQL Editor 中运行此脚本

-- 允许所有人读取 shops 表
DROP POLICY IF EXISTS "Users can view shops" ON shops;
CREATE POLICY "Allow public read access" ON shops
  FOR SELECT
  USING (true);

-- 允许所有人读取 shop_groups 表
DROP POLICY IF EXISTS "Users can view shop_groups" ON shop_groups;
CREATE POLICY "Allow public read access" ON shop_groups
  FOR SELECT
  USING (true);

-- 允许认证用户插入/更新/删除 shops 表
DROP POLICY IF EXISTS "Users can insert shops" ON shops;
CREATE POLICY "Users can insert shops" ON shops
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update shops" ON shops;
CREATE POLICY "Users can update shops" ON shops
  FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete shops" ON shops;
CREATE POLICY "Users can delete shops" ON shops
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- 允许所有人读取 products 表
DROP POLICY IF EXISTS "Users can view products" ON products;
CREATE POLICY "Allow public read access" ON products
  FOR SELECT
  USING (true);

-- 允许所有人读取 sales_data 表
DROP POLICY IF EXISTS "Users can view sales" ON sales_data;
CREATE POLICY "Allow public read access" ON sales_data
  FOR SELECT
  USING (true);

-- 允许认证用户操作 sales_data 表
DROP POLICY IF EXISTS "Users can insert sales" ON sales_data;
CREATE POLICY "Users can insert sales" ON sales_data
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update sales" ON sales_data;
CREATE POLICY "Users can update sales" ON sales_data
  FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete sales" ON sales_data;
CREATE POLICY "Users can delete sales" ON sales_data
  FOR DELETE
  USING (auth.role() = 'authenticated');
