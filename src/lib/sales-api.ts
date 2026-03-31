/**
 * 销售数据 API 工具
 * 提供销售数据查询、汇总、导出功能
 */

import { supabase } from './supabase'

export interface SalesData {
  id: number
  shop_id: number
  date: string
  week_day?: string
  pay_amount: number
  pay_orders: number
  avg_order_value?: number
  visitors?: number
  cart_count?: number
  cart_rate?: number
  ctr?: number
  cvr?: number
  refund_amount?: number
  return_refund_jqn?: number
  return_refund_jst?: number
  return_refund_orders?: number
  only_refund_amount?: number
  fake_orders_amount?: number
  fake_orders_count?: number
  commission?: number
  review_count?: number
  product_list_count?: number
  after_sale_duration?: number
  cs_score?: number
  shop_score?: number
  purchase_cost?: number
  return_cost?: number
  gross_profit?: number
  total_cost?: number
  total_sales?: number
  ad_cost_total?: number
  ad_keyword?: number
  ad_audience?: number
  shop_roi?: number
  logistics_fee?: number
  platform_fee?: number
  labor_cost?: number
  ad_coupon_return?: number
  net_profit?: number
  net_roi?: number
  created_at: string
  updated_at: string
}

export interface ShopDailyReport {
  id: number
  shop_id: number
  stat_date: string
  report_time?: string
  shop_name?: string
  visitors?: number
  cart_users?: number
  paying_amount?: number
  paying_buyers?: number
  paying_sub_orders?: number
  paying_items?: number
  ad_cost_total?: number
  ad_keyword_cost?: number
  ad_audience_cost?: number
  ad_smart_cost?: number
  refund_amount?: number
  review_count?: number
  review_with_image?: number
  desc_score?: number
  created_at: string
  updated_at: string
}

export interface DailySummary {
  date: string
  sales: number
  orders: number
  netSales: number
  adCost: number
  fakeAmount: number
  fakeOrders: number
  commission: number
  refund: number
  returnCost: number
  logistics: number
  platformFee: number
  labor: number
  profit: number
  grossProfit: number
  roi: number
  refundRate: number
}

/**
 * 获取销售数据（日期范围）
 */
export async function getSalesData(options: {
  startDate: string
  endDate: string
  shopId?: number
  shopIds?: number[]
}) {
  let query = supabase
    .from('shop_daily_reports')
    .select('*')
    .gte('stat_date', options.startDate)
    .lte('stat_date', options.endDate)
    .order('stat_date', { ascending: false })

  if (options.shopId) {
    query = query.eq('shop_id', options.shopId)
  } else if (options.shopIds?.length) {
    query = query.in('shop_id', options.shopIds)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * 获取今日数据汇总
 */
export async function getTodaySummary(shopIds?: number[]) {
  const today = new Date().toISOString().split('T')[0]
  
  let query = supabase
    .from('shop_daily_reports')
    .select('paying_amount, paying_buyers, ad_cost_total, net_profit')
    .eq('stat_date', today)

  if (shopIds?.length) {
    query = query.in('shop_id', shopIds)
  }

  const { data, error } = await query
  if (error) throw error

  const summary = {
    gmv: 0,
    orders: 0,
    adCost: 0,
    profit: 0,
    roi: '0.00'
  }

  data?.forEach(row => {
    summary.gmv += row.paying_amount || 0
    summary.orders += row.paying_buyers || 0
    summary.adCost += row.ad_cost_total || 0
    summary.profit += row.net_profit || 0
  })

  summary.roi = summary.adCost > 0 ? (summary.gmv / summary.adCost).toFixed(2) : '0.00'

  return summary
}

/**
 * 获取每日汇总数据
 */
export async function getDailySummary(options: {
  startDate: string
  endDate: string
  shopId?: number
  shopIds?: number[]
}): Promise<DailySummary[]> {
  const data = await getSalesData(options)

  // 按日期聚合
  const dailyMap = new Map<string, DailySummary>()

  data.forEach(row => {
    const date = row.stat_date || row.date
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        sales: 0,
        orders: 0,
        netSales: 0,
        adCost: 0,
        fakeAmount: 0,
        fakeOrders: 0,
        commission: 0,
        refund: 0,
        returnCost: 0,
        logistics: 0,
        platformFee: 0,
        labor: 0,
        profit: 0,
        grossProfit: 0,
        roi: 0,
        refundRate: 0
      })
    }

    const daily = dailyMap.get(date)!
    daily.sales += row.paying_amount || row.pay_amount || 0
    daily.orders += row.paying_buyers || row.pay_orders || 0
    daily.adCost += (row.ad_cost_total || 0) + (row.ad_keyword_cost || 0) + (row.ad_audience_cost || 0) + (row.ad_smart_cost || 0)
    daily.fakeAmount += row.fake_orders_amount || 0
    daily.fakeOrders += row.fake_orders_count || 0
    daily.commission += row.commission || 0
    daily.refund += row.refund_amount || 0
    daily.logistics += row.logistics_fee || 0
    daily.platformFee += row.platform_fee || 0
    daily.labor += row.labor_cost || 0
    daily.profit += row.net_profit || 0
    daily.grossProfit += row.gross_profit || 0
  })

  // 计算净销售额和比率
  const result = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date))
  
  result.forEach(day => {
    day.netSales = day.sales - day.fakeAmount - day.refund
    day.roi = day.adCost > 0 ? Number((day.sales / day.adCost).toFixed(2)) : 0
    day.refundRate = day.sales > 0 ? Number(((day.refund / day.sales) * 100).toFixed(1)) : 0
  })

  return result
}

/**
 * 获取店铺汇总数据
 */
export async function getShopSummary(options: {
  startDate: string
  endDate: string
  shopIds?: number[]
}) {
  const data = await getSalesData(options)

  // 按店铺聚合
  const shopMap = new Map<number, {
    shop_id: number
    shop_name: string
    sales: number
    orders: number
    adCost: number
    profit: number
    roi: number
  }>()

  data.forEach(row => {
    if (!shopMap.has(row.shop_id)) {
      shopMap.set(row.shop_id, {
        shop_id: row.shop_id,
        shop_name: row.shop_name || '',
        sales: 0,
        orders: 0,
        adCost: 0,
        profit: 0,
        roi: 0
      })
    }

    const shop = shopMap.get(row.shop_id)!
    shop.sales += row.paying_amount || row.pay_amount || 0
    shop.orders += row.paying_buyers || row.pay_orders || 0
    shop.adCost += (row.ad_cost_total || 0) + (row.ad_keyword_cost || 0) + (row.ad_audience_cost || 0)
    shop.profit += row.net_profit || 0
  })

  // 计算 ROI
  const result = Array.from(shopMap.values())
  result.forEach(shop => {
    shop.roi = shop.adCost > 0 ? Number((shop.sales / shop.adCost).toFixed(2)) : 0
  })

  return result.sort((a, b) => b.sales - a.sales)
}

/**
 * 获取分组汇总数据
 */
export async function getGroupSummary(options: {
  startDate: string
  endDate: string
}) {
  // 获取所有店铺及其分组
  const { data: shops } = await supabase
    .from('shops')
    .select('id, name, group_id')
  
  if (!shops) return []

  const shopSummary = await getShopSummary({
    startDate: options.startDate,
    endDate: options.endDate,
    shopIds: shops.map(s => s.id)
  })

  // 按分组聚合
  const groupMap = new Map<number, {
    group_id: number
    group_name: string
    shopCount: number
    sales: number
    orders: number
    adCost: number
    profit: number
    roi: number
  }>()

  // 获取分组名称
  const { data: groups } = await supabase
    .from('shop_groups')
    .select('id, name')

  const groupNames = new Map(groups?.map(g => [g.id, g.name]) || [])

  shopSummary.forEach(shop => {
    const shopInfo = shops.find(s => s.id === shop.shop_id)
    if (!shopInfo) return

    const groupId = shopInfo.group_id || 0
    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        group_id: groupId,
        group_name: groupNames.get(groupId) || '未分组',
        shopCount: 0,
        sales: 0,
        orders: 0,
        adCost: 0,
        profit: 0,
        roi: 0
      })
    }

    const group = groupMap.get(groupId)!
    group.shopCount++
    group.sales += shop.sales
    group.orders += shop.orders
    group.adCost += shop.adCost
    group.profit += shop.profit
  })

  // 计算 ROI
  const result = Array.from(groupMap.values())
  result.forEach(group => {
    group.roi = group.adCost > 0 ? Number((group.sales / group.adCost).toFixed(2)) : 0
  })

  return result.sort((a, b) => b.sales - a.sales)
}

/**
 * 更新销售数据（单个字段）
 */
export async function updateSalesData(id: number, field: string, value: any) {
  const { data, error } = await supabase
    .from('shop_daily_reports')
    .update({
      [field]: value,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 获取刷单数据汇总
 */
export async function getFakeOrderSummary(options: {
  startDate: string
  endDate: string
  shopId?: number
}) {
  let query = supabase
    .from('orders')
    .select('shop_id, created_at, buyer_paid_amount, quantity')
    .gte('created_at', options.startDate)
    .lte('created_at', options.endDate)

  if (options.shopId) {
    query = query.eq('shop_id', options.shopId)
  }

  const { data, error } = await query
  if (error) throw error

  // 按日期聚合
  const dailyMap = new Map<string, { amount: number; count: number }>()

  data?.forEach(order => {
    const date = order.created_at?.split('T')[0] || order.created_at?.split(' ')[0]
    if (!date) return

    if (!dailyMap.has(date)) {
      dailyMap.set(date, { amount: 0, count: 0 })
    }

    const daily = dailyMap.get(date)!
    daily.amount += order.buyer_paid_amount || 0
    daily.count += order.quantity || 0
  })

  return Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    amount: data.amount,
    count: data.count
  }))
}

/**
 * 导出销售数据为 CSV
 */
export function exportSalesToCSV(data: any[], filename: string = 'sales_export.csv') {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(field => {
        const value = row[field]
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
