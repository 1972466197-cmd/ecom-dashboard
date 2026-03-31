/**
 * 商品管理 API 工具
 * 提供商品 CRUD 操作
 */

import { supabase } from './supabase'

export interface Product {
  id: number
  name: string
  sku: string
  category: string
  price: number
  cost: number
  stock: number
  sales: number
  status: 'onsale' | 'offline' | 'warning'
  image_url?: string
  created_at: string
  updated_at: string
}

export interface ProductShop {
  id: number
  product_id: number
  shop_id: number
  platform_stock: number
  platform_price?: number
  is_listed: boolean
}

/**
 * 获取所有商品
 */
export async function getProducts(filters?: {
  category?: string
  status?: string
  search?: string
}) {
  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.category && filters.category !== '全部类目') {
    query = query.eq('category', filters.category)
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * 获取单个商品
 */
export async function getProduct(id: number) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

/**
 * 创建商品
 */
export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'sales'>) {
  const { data, error } = await supabase
    .from('products')
    .insert([{
      ...product,
      sales: 0
    }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * 更新商品
 */
export async function updateProduct(id: number, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * 删除商品
 */
export async function deleteProduct(id: number) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

/**
 * 批量更新商品库存
 */
export async function updateProductStock(updates: { id: number; stock: number }[]) {
  const { error } = await supabase.rpc('batch_update_stock', {
    stock_updates: updates
  })
  
  if (error) {
    // 降级处理：逐个更新
    for (const update of updates) {
      await updateProduct(update.id, { stock: update.stock })
    }
  }
}

/**
 * 获取商品 - 店铺关联
 */
export async function getProductShops(productId: number) {
  const { data, error } = await supabase
    .from('product_shops')
    .select(`
      *,
      shops (
        id,
        name,
        platform
      )
    `)
    .eq('product_id', productId)
  
  if (error) throw error
  return data || []
}

/**
 * 更新商品 - 店铺关联
 */
export async function updateProductShops(productId: number, shopIds: number[]) {
  // 删除旧关联
  await supabase
    .from('product_shops')
    .delete()
    .eq('product_id', productId)

  // 添加新关联
  if (shopIds.length > 0) {
    const { error } = await supabase
      .from('product_shops')
      .insert(shopIds.map(shopId => ({
        product_id: productId,
        shop_id: shopId,
        is_listed: true
      })))
    
    if (error) throw error
  }
}

/**
 * 获取库存预警商品
 */
export async function getLowStockProducts(threshold: number = 50) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .lte('stock', threshold)
    .eq('status', 'onsale')
    .order('stock', { ascending: true })
  
  if (error) throw error
  return data || []
}

/**
 * 获取商品统计
 */
export async function getProductStats() {
  const { data, error } = await supabase
    .from('products')
    .select('status, stock, sales')
  
  if (error) throw error

  const stats = {
    total: data.length,
    onsale: data.filter(p => p.status === 'onsale').length,
    offline: data.filter(p => p.status === 'offline').length,
    warning: data.filter(p => p.status === 'warning' || (p.status === 'onsale' && p.stock < 50)).length,
    totalStock: data.reduce((sum, p) => sum + p.stock, 0),
    totalSales: data.reduce((sum, p) => sum + p.sales, 0)
  }

  return stats
}
