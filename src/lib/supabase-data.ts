// Supabase 客户端配置
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// =====================================================
// 数据保存工具函数
// =====================================================

/**
 * 保存销售数据（使用 upsert 去重）
 * @param shopName 店铺名称
 * @param date 日期
 * @param data 销售数据
 */
export async function saveSalesData(
  shopName: string,
  date: string,
  data: Partial<SalesRecord>
) {
  const record: SalesRecord = {
    shop_name: shopName,
    date,
    platform: shopName.includes('抖音') ? 'douyin' : shopName.includes('天猫') || shopName.includes('淘宝') ? 'taobao' : 'other',
    sales_amount: data.sales_amount || 0,
    order_count: data.order_count || 0,
    item_count: data.item_count || 0,
    refund_amount: data.refund_amount || 0,
    refund_order_count: data.refund_order_count || 0,
    ...data
  }

  const { data: result, error } = await supabase
    .from('sales_data')
    .upsert(record, {
      onConflict: 'shop_name,date' // 同一天 + 同一个店覆盖更新
    })
    .select()
    .single()

  if (error) throw error
  return result
}

/**
 * 保存推广数据（使用 upsert 去重）
 * @param shopName 店铺名称
 * @param date 日期
 * @param data 推广数据
 */
export async function saveMarketingData(
  shopName: string,
  date: string,
  data: Partial<MarketingRecord>
) {
  const platform = shopName.includes('抖音') ? 'douyin' : shopName.includes('天猫') || shopName.includes('淘宝') ? 'taobao' : 'other'
  
  const record: MarketingRecord = {
    shop_name: shopName,
    platform,
    date,
    taobao_ztc_spend: data.taobao_ztc_spend || 0,
    taobao_ztc_clicks: data.taobao_ztc_clicks || 0,
    taobao_ztc_impressions: data.taobao_ztc_impressions || 0,
    douyin_qc_spend: data.douyin_qc_spend || 0,
    douyin_qc_clicks: data.douyin_qc_clicks || 0,
    douyin_qc_impressions: data.douyin_qc_impressions || 0,
    other_spend: data.other_spend || 0,
    ...data
  }

  const { data: result, error } = await supabase
    .from('daily_marketing')
    .upsert(record, {
      onConflict: 'shop_name,date' // 同一天 + 同一个店覆盖更新
    })
    .select()
    .single()

  if (error) throw error
  return result
}

/**
 * 保存 SKU 成本数据（使用 upsert 去重）
 * @param skuCode SKU 编码
 * @param data 成本数据
 */
export async function saveSkuCost(
  skuCode: string,
  data: Partial<SkuCostRecord>
) {
  const record: SkuCostRecord = {
    sku_code: skuCode,
    product_name: data.product_name || '',
    shop_name: data.shop_name || null,
    purchase_price: data.purchase_price || 0,
    shipping_cost: data.shipping_cost || 0,
    packaging_cost: data.packaging_cost || 0,
    labor_cost: data.labor_cost || 0,
    effective_date: data.effective_date || new Date().toISOString().split('T')[0],
    is_active: data.is_active ?? true,
    ...data
  }

  const { data: result, error } = await supabase
    .from('sku_costs')
    .upsert(record, {
      onConflict: 'sku_code,effective_date' // 同一 SKU+ 生效日期覆盖更新
    })
    .select()
    .single()

  if (error) throw error
  return result
}

/**
 * 批量保存销售数据
 */
export async function saveSalesDataBatch(records: SalesRecord[]) {
  const { data: result, error } = await supabase
    .from('sales_data')
    .upsert(records, {
      onConflict: 'shop_name,date,sku_code'
    })
    .select()

  if (error) throw error
  return result
}

/**
 * 批量保存推广数据
 */
export async function saveMarketingDataBatch(records: MarketingRecord[]) {
  const { data: result, error } = await supabase
    .from('daily_marketing')
    .upsert(records, {
      onConflict: 'shop_name,date'
    })
    .select()

  if (error) throw error
  return result
}

/**
 * 从 Supabase 加载销售数据
 */
export async function loadSalesData(shopName?: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('sales_data')
    .select('*')
    .order('date', { ascending: false })

  if (shopName && shopName !== '全部店铺') {
    query = query.eq('shop_name', shopName)
  }

  if (startDate) {
    query = query.gte('date', startDate)
  }

  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * 从 Supabase 加载推广数据
 */
export async function loadMarketingData(shopName?: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('daily_marketing')
    .select('*')
    .order('date', { ascending: false })

  if (shopName && shopName !== '全部店铺') {
    query = query.eq('shop_name', shopName)
  }

  if (startDate) {
    query = query.gte('date', startDate)
  }

  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * 从 Supabase 加载利润视图数据
 */
export async function loadProfitData(shopName?: string, startDate?: string, endDate?: string, limit = 30) {
  let query = supabase
    .from('daily_profit_view')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit)

  if (shopName && shopName !== '全部店铺') {
    query = query.eq('shop_name', shopName)
  }

  if (startDate) {
    query = query.gte('date', startDate)
  }

  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// =====================================================
// TypeScript 类型定义
// =====================================================

export interface SalesRecord {
  id?: number
  shop_name: string
  platform: string
  date: string
  sku_code?: string
  sales_amount: number
  order_count: number
  item_count: number
  refund_amount: number
  refund_order_count: number
  created_at?: string
  updated_at?: string
}

export interface MarketingRecord {
  id?: number
  shop_name: string
  platform: string
  date: string
  taobao_ztc_spend: number
  taobao_ztc_clicks: number
  taobao_ztc_impressions: number
  douyin_qc_spend: number
  douyin_qc_clicks: number
  douyin_qc_impressions: number
  other_spend: number
  total_spend?: number
  created_at?: string
  updated_at?: string
}

export interface SkuCostRecord {
  id?: number
  sku_code: string
  product_name: string
  shop_name?: string | null
  purchase_price: number
  shipping_cost: number
  packaging_cost: number
  labor_cost: number
  total_cost?: number
  effective_date: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ProfitRecord {
  shop_name: string
  platform: string
  date: string
  gross_sales: number
  net_sales: number
  total_refunds: number
  product_cost: number
  shipping_cost: number
  total_marketing: number
  taobao_ztc_spend: number
  douyin_qc_spend: number
  total_cost: number
  net_profit: number
  gross_margin_rate: number
  net_margin_rate: number
  roi: number
  break_even_roi: number
  is_below_break_even: boolean
}
