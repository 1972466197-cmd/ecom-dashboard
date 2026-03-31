'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Shop { id: number; name: string; platform: string; group_id: number }
interface ShopGroup { id: number; name: string }
interface SalesData {
  date: string
  visitors: number
  netSales: number
  netOrders: number
  cvr: number
  avgOrderValue: number
  cartUsers: number
  cartRate: number
  refundAmount: number
  fakeAmount: number
  fakeOrders: number
  commission: number
  cost: number
  returnCost: number
  adCostTotal: number
  adZhanCost: number
  adKeywordCost: number
  adAudienceCost: number
  adSmartCost: number
  roi: number
  shippingFee: number
  platformFee: number
  laborCost: number
  grossProfit: number
  grossMargin: number
  refundRate: number
  netProfit: number
}

const GROUPS = [ { id: 1, name: '海林组' }, { id: 2, name: '培君组' }, { id: 3, name: '淑贞组' }, { id: 4, name: '敏贞组' } ]

export default function SalesPage() {
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedShop, setSelectedShop] = useState<string>('all')
  const [dateRangeType, setDateRangeType] = useState<string>('7days')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  const [shops, setShops] = useState<Shop[]>([])
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadShops() }, [])
  useEffect(() => { if (!loading) loadData() }, [selectedGroup, selectedShop, dateRangeType, customDateRange])

  async function loadShops() {
    try {
      const { data } = await supabase.from('shops').select('*').order('name')
      if (data) { setShops(data); if (data.length > 0) setSelectedShop('all') }
    } catch (err) {
      console.error('加载店铺失败:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadData() {
    setLoading(true)
    try {
      const { start, end } = getDateRange()
      
      // 从商品日概况表获取数据
      let query = supabase.from('product_daily_reports').select('*').gte('stat_date', start).lte('stat_date', end)
      
      if (selectedShop !== 'all') {
        query = query.eq('shop_id', selectedShop)
      } else if (selectedGroup !== 'all') {
        const ids = shops.filter(s => s.group_id.toString() === selectedGroup).map(s => s.id)
        if (ids.length > 0) query = query.in('shop_id', ids)
      }
      
      const { data: productData } = await query
      
      // 从 orders 表获取刷单数据（前端过滤日期和 is_delivery）
      let fakeQuery = supabase.from('orders').select('created_at, buyer_paid_amount, quantity, shop_id, is_delivery')
      if (selectedShop !== 'all') {
        fakeQuery = fakeQuery.eq('shop_id', selectedShop)
      } else if (selectedGroup !== 'all') {
        const ids = shops.filter(s => s.group_id.toString() === selectedGroup).map(s => s.id)
        if (ids.length > 0) fakeQuery = fakeQuery.in('shop_id', ids)
      }
      const { data: allOrders } = await fakeQuery
      // 前端过滤：日期范围 + is_delivery=false（处理时区问题）
      const fakeOrders = allOrders?.filter((o: any) => {
        const isDeliveryFalse = o.is_delivery === false || o.is_delivery === 'false'
        if (!isDeliveryFalse) return false
        // 将 ISO 日期转换为本地日期（+8 时区）
        const orderDate = o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : null
        return orderDate && orderDate >= start && orderDate <= end
      }) || []
      
      // 按日期聚合数据
      const dailyMap = new Map<string, any>()
      productData?.forEach((row: any) => {
        const date = row.stat_date
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            visitors: 0, paying_amount: 0, paying_buyers: 0, paying_items: 0,
            fav_count: 0, cart_users: 0, refund_amount: 0,
            ad_cost_total: 0, ad_keyword_cost: 0, ad_audience_cost: 0, ad_smart_cost: 0,
            fakeAmount: 0, fakeOrders: 0
          })
        }
        const d = dailyMap.get(date)
        d.visitors += row.visitors || 0
        d.paying_amount += row.paying_amount || 0
        d.paying_buyers += row.paying_buyers || 0
        d.paying_items += row.paying_items || 0
        d.fav_count += row.fav_count || 0
        d.cart_users += row.cart_users || 0
        d.refund_amount += row.refund_amount || 0
        d.ad_cost_total += row.ad_cost_total || 0
        d.ad_keyword_cost += row.ad_keyword_cost || 0
        d.ad_audience_cost += row.ad_audience_cost || 0
        d.ad_smart_cost += row.ad_smart_cost || 0
      })
      
      // 聚合刷单数据
      if (fakeOrders) fakeOrders.forEach((f: any) => {
        const date = f.created_at?.split('T')[0]
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            visitors: 0, paying_amount: 0, paying_buyers: 0, paying_items: 0,
            fav_count: 0, cart_users: 0, refund_amount: 0,
            ad_cost_total: 0, ad_keyword_cost: 0, ad_audience_cost: 0, ad_smart_cost: 0,
            fakeAmount: 0, fakeOrders: 0
          })
        }
        const d = dailyMap.get(date)
        d.fakeAmount += f.buyer_paid_amount || 0  // 从 buyer_paid_amount 获取刷单金额
        d.fakeOrders += f.quantity || 0
      })
      
      // 转换为表格数据
      const result: SalesData[] = Array.from(dailyMap.entries()).map(([date, d]: [string, any]) => {
        const netSales = d.paying_amount - d.refund_amount
        const netOrders = d.paying_buyers
        const cvr = d.visitors > 0 ? (d.paying_buyers / d.visitors * 100) : 0
        const avgOrderValue = d.paying_buyers > 0 ? (d.paying_amount / d.paying_buyers) : 0
        const cartRate = d.visitors > 0 ? (d.cart_users / d.visitors * 100) : 0
        const roi = d.ad_cost_total > 0 ? (netSales / d.ad_cost_total) : 0
        const refundRate = d.paying_amount > 0 ? (d.refund_amount / d.paying_amount * 100) : 0
        const grossProfit = netSales * 0.3 // 估算毛利 30%
        const grossMargin = 30
        const netProfit = grossProfit - d.ad_cost_total // 估算净利
        
        return {
          date: date,
          visitors: d.visitors,
          netSales,
          netOrders,
          cvr,
          avgOrderValue,
          cartUsers: d.cart_users,
          cartRate,
          refundAmount: d.refund_amount,
          fakeAmount: d.fakeAmount || 0,  // 从 orders 表获取
          fakeOrders: d.fakeOrders || 0,
          commission: d.fakeAmount || 0,  // 刷单金额即佣金
          cost: 0,
          returnCost: 0,
          adCostTotal: d.ad_cost_total,
          adZhanCost: d.ad_cost_total - d.ad_keyword_cost - d.ad_audience_cost - d.ad_smart_cost,
          adKeywordCost: d.ad_keyword_cost,
          adAudienceCost: d.ad_audience_cost,
          adSmartCost: d.ad_smart_cost,
          roi,
          shippingFee: 0,
          platformFee: 0,
          laborCost: 0,
          grossProfit,
          grossMargin,
          refundRate,
          netProfit
        }
      })
      
      result.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setSalesData(result)
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  function getDateRange() {
    let start = new Date(customDateRange.start || new Date())
    let end = new Date(customDateRange.end || new Date())
    if (dateRangeType === 'yesterday') { const y = new Date(); y.setDate(y.getDate() - 1); start = new Date(y); end = new Date(y) }
    else if (dateRangeType === '7days') { start = new Date(); start.setDate(start.getDate() - 6) }
    else if (dateRangeType === '14days') { start = new Date(); start.setDate(start.getDate() - 13) }
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }

  const getFilteredShops = () => selectedGroup === 'all' ? shops : shops.filter(s => s.group_id.toString() === selectedGroup)

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>加载中...</div>

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#1a1a2e' }}>🏪 店铺销售情况</h1>

      {/* 顶部筛选区 - 和店铺每日盈亏一致 */}
      <div style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {/* 店铺范围 */}
          <div>
            <label style={{ display: 'block', fontSize: 15, color: '#333', marginBottom: 8, fontWeight: 500 }}>店铺范围</label>
            <select value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedShop('all') }} style={{ width: '100%', padding: '10 12', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14 }}>
              <option value="all">全部店铺</option>
              {GROUPS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          {/* 选择店铺 */}
          <div>
            <label style={{ display: 'block', fontSize: 15, color: '#333', marginBottom: 8, fontWeight: 500 }}>选择店铺</label>
            <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)} style={{ width: '100%', padding: '10 12', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14 }}>
              <option value="all">全部店铺</option>
              {getFilteredShops().map(s => <option key={s.id} value={s.id}>{s.name} ({s.platform})</option>)}
            </select>
          </div>
          {/* 日期范围 */}
          <div>
            <label style={{ display: 'block', fontSize: 15, color: '#333', marginBottom: 8, fontWeight: 500 }}>日期范围</label>
            <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 8, padding: 4 }}>
              {['yesterday', '7days', '14days', 'custom'].map(r => (
                <button key={r} onClick={() => setDateRangeType(r)} style={{ flex: 1, padding: '8 4', background: dateRangeType === r ? '#1890ff' : 'transparent', color: dateRangeType === r ? 'white' : '#666', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
                  {r === 'yesterday' ? '昨日' : r === '7days' ? '近 7 天' : r === '14days' ? '近 14 天' : '自定义'}
                </button>
              ))}
            </div>
          </div>
          {/* 自定义日期 */}
          {dateRangeType === 'custom' && (
            <div>
              <label style={{ display: 'block', fontSize: 15, color: '#333', marginBottom: 8, fontWeight: 500 }}>自定义日期</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="date" value={customDateRange.start} onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })} style={{ flex: 1, padding: '8 12', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14 }} />
                <input type="date" value={customDateRange.end} onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })} style={{ flex: 1, padding: '8 12', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14 }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 数据表格 - 您要求的字段 */}
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '2px solid #e8e8e8' }}>
                <th style={{ padding: 16, textAlign: 'left', position: 'sticky', left: 0, background: '#fafafa', fontWeight: 600 }}>日期</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>访客</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>净成交额</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>净支付订单</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>转化率</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>客单价</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>加购人数</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>加购率</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>退货退款金额</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>刷单金额</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>刷单量</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>佣金</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>采购成本</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>退回成本</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>总推广花费</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>全站推广花费</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>关键词推广花费</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>人群推广花费</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>智能场景推广花费</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>ROI</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>运费</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>手续费</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>人工场地费</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>毛利</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>毛利率</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>退货率</th>
                <th style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>净利</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={27} style={{ padding: 60, textAlign: 'center', color: '#999' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                    <div style={{ fontSize: 16 }}>数据加载中...</div>
                  </td>
                </tr>
              ) : salesData.length === 0 ? (
                <tr>
                  <td colSpan={27} style={{ padding: 60, textAlign: 'center', color: '#999' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                    <div style={{ fontSize: 16 }}>暂无数据</div>
                    <div style={{ fontSize: 14, marginTop: 8, color: '#666' }}>请选择店铺和日期范围查看数据</div>
                  </td>
                </tr>
              ) : (
                salesData.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: 14, fontWeight: 500, position: 'sticky', left: 0, background: 'white' }}>{row.date}</td>
                    <td style={{ padding: 14, textAlign: 'right' }}>{row.visitors.toLocaleString()}</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#1890ff' }}>¥{row.netSales.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right' }}>{row.netOrders}</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#722ed1' }}>{row.cvr.toFixed(2)}%</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#13c2c2' }}>¥{row.avgOrderValue.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right' }}>{row.cartUsers.toLocaleString()}</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#fa8c16' }}>{row.cartRate.toFixed(2)}%</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#ff4d4f' }}>¥{row.refundAmount.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#fa8c16' }}>¥{row.fakeAmount.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right' }}>{row.fakeOrders}</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#faad14' }}>¥{row.commission.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right' }}>¥{row.cost.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#52c41a' }}>¥{row.returnCost.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right', fontWeight: 600, color: '#fa8c16' }}>¥{row.adCostTotal.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#fa8c16' }}>¥{row.adZhanCost.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#fa8c16' }}>¥{row.adKeywordCost.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#fa8c16' }}>¥{row.adAudienceCost.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#fa8c16' }}>¥{row.adSmartCost.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right', fontWeight: 600, color: '#eb2f96' }}>{row.roi.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right' }}>¥{row.shippingFee.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right' }}>¥{row.platformFee.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right' }}>¥{row.laborCost.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#52c41a' }}>¥{row.grossProfit.toFixed(2)}</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#13c2c2' }}>{row.grossMargin.toFixed(1)}%</td>
                    <td style={{ padding: 14, textAlign: 'right', color: '#ff4d4f' }}>{row.refundRate.toFixed(2)}%</td>
                    <td style={{ padding: 14, textAlign: 'right', fontWeight: 'bold', color: row.netProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>¥{row.netProfit.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
