'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Shop { id: number; name: string; platform: string; group_id: number }
interface ShopGroup { id: number; name: string }
interface ShopSalesData {
  group_id: number
  group_name: string
  shop_id: number
  shop_name: string
  sales: number
  orders: number
  netSales: number
  refund: number
  adCost: number
  cost: number
  returnCost: number
  commission: number
  profit: number
  roi: number
  grossMargin: number
  refundRate: number
}

const GROUPS: ShopGroup[] = [
  { id: 1, name: '海林组' },
  { id: 2, name: '培君组' },
  { id: 3, name: '淑贞组' },
  { id: 4, name: '敏贞组' },
]

export default function Home() {
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedShop, setSelectedShop] = useState<string>('all')
  const [dateRangeType, setDateRangeType] = useState<string>('yesterday')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  const [yesterdayStr, setYesterdayStr] = useState<string>('')
  const [shops, setShops] = useState<Shop[]>([])
  const [shopData, setShopData] = useState<ShopSalesData[]>([])
  const [loading, setLoading] = useState(true)

  // 昨日汇总数据
  const [yesterdayStats, setYesterdayStats] = useState({
    netSales: 0,
    adCost: 0,
    roi: 0,
    profit: 0,
  })

  useEffect(() => { loadShops() }, [])
  useEffect(() => { 
    if (!loading && shops.length > 0) loadData() 
  }, [selectedGroup, selectedShop])

  async function loadShops() {
    try {
      const { data } = await supabase.from('shops').select('*').order('name')
      if (data) setShops(data)
    } catch (err) { console.error('加载店铺失败:', err) }
    finally { setLoading(false) }
  }



  async function loadData() {
    try {
      // 获取昨日日期
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      setYesterdayStr(yesterdayStr)
      
      // 获取昨日店铺日报数据
      let yesterdayQuery = supabase
        .from('shop_daily_reports')
        .select('*')
        .eq('stat_date', yesterdayStr)
      
      if (selectedShop !== 'all') {
        yesterdayQuery = yesterdayQuery.eq('shop_id', selectedShop)
      } else if (selectedGroup !== 'all') {
        const ids = shops.filter(s => s.group_id.toString() === selectedGroup).map(s => s.id)
        if (ids.length > 0) yesterdayQuery = yesterdayQuery.in('shop_id', ids)
      }
      
      const { data: yesterdayData } = await yesterdayQuery
      
      // 计算昨日汇总
      let totalSales = 0, totalAdCost = 0, totalRefund = 0
      yesterdayData?.forEach(d => {
        totalSales += d.paying_amount || 0
        totalAdCost += (d.ad_cost_total || 0) + (d.ad_keyword_cost || 0) + (d.ad_smart_cost || 0)
        totalRefund += d.refund_amount || 0
      })
      const netSales = totalSales - totalRefund
      const roi = totalAdCost > 0 ? (netSales / totalAdCost) : 0
      const profit = netSales - totalAdCost
      setYesterdayStats({ netSales, adCost: totalAdCost, roi, profit })
      
      // 获取昨日店铺日报数据（用于底部表格）
      let query = supabase
        .from('shop_daily_reports')
        .select('*')
        .eq('stat_date', yesterdayStr)
      
      if (selectedShop !== 'all') {
        query = query.eq('shop_id', selectedShop)
      } else if (selectedGroup !== 'all') {
        const ids = shops.filter(s => s.group_id.toString() === selectedGroup).map(s => s.id)
        if (ids.length > 0) query = query.in('shop_id', ids)
      }
      
      const { data: salesData } = await query
      
      // 获取手动编辑数据
      let manualQuery = supabase
        .from('shop_daily_manual')
        .select('*')
        .eq('stat_date', yesterdayStr)
      
      if (selectedShop !== 'all') {
        manualQuery = manualQuery.eq('shop_id', selectedShop)
      } else if (selectedGroup !== 'all') {
        const ids = shops.filter(s => s.group_id.toString() === selectedGroup).map(s => s.id)
        if (ids.length > 0) manualQuery = manualQuery.in('shop_id', ids)
      }
      
      const { data: manualData } = await manualQuery
      
      // 按店铺聚合
      const shopMap = new Map<number, ShopSalesData>()
      
      // 初始化所有店铺（按分组）
      const targetShops = selectedShop !== 'all' 
        ? shops.filter(s => s.id.toString() === selectedShop)
        : selectedGroup !== 'all'
          ? shops.filter(s => s.group_id.toString() === selectedGroup)
          : shops
      
      targetShops.forEach(shop => {
        const group = GROUPS.find(g => g.id === shop.group_id)
        shopMap.set(shop.id, {
          group_id: shop.group_id,
          group_name: group?.name || '',
          shop_id: shop.id,
          shop_name: shop.name,
          sales: 0,
          orders: 0,
          netSales: 0,
          refund: 0,
          adCost: 0,
          cost: 0,
          returnCost: 0,
          commission: 0,
          profit: 0,
          roi: 0,
          grossMargin: 0,
          refundRate: 0
        })
      })
      
      // 聚合店铺日报数据
      salesData?.forEach(d => {
        const shopId = d.shop_id
        if (!shopMap.has(shopId)) return
        const s = shopMap.get(shopId)!
        s.sales += d.paying_amount || 0
        s.orders += d.paying_buyers || 0
        s.refund += d.refund_amount || 0
        s.adCost += (d.ad_cost_total || 0) + (d.ad_keyword_cost || 0) + (d.ad_smart_cost || 0)
      })
      
      // 聚合手动编辑数据
      manualData?.forEach(m => {
        const shopId = m.shop_id
        if (!shopMap.has(shopId)) return
        const s = shopMap.get(shopId)!
        s.cost += m.cost || 0
        s.returnCost += m.return_cost || 0
        s.commission += m.commission || 0
      })
      
      // 计算各店铺指标
      const result = Array.from(shopMap.values()).map(s => {
        const netSales = s.sales - s.refund
        const roi = s.adCost > 0 ? (netSales / s.adCost) : 0
        const grossMargin = netSales > 0 ? ((1 - s.cost / netSales) * 100) : 0
        const refundRate = s.sales > 0 ? ((s.refund / s.sales) * 100) : 0
        const profit = netSales - s.commission - s.cost - s.adCost + s.returnCost
        return { ...s, netSales, roi, grossMargin, refundRate, profit }
      })
      
      // 按分组和店铺排序
      result.sort((a, b) => {
        if (a.group_id !== b.group_id) return a.group_id - b.group_id
        return b.sales - a.sales
      })
      
      setShopData(result)
    } catch (err) { console.error('加载数据失败:', err) }
  }

  const getFilteredShops = () => selectedGroup === 'all' ? shops : shops.filter(s => s.group_id.toString() === selectedGroup)

  if (shops.length === 0) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>加载中...</div>

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#1a1a2e' }}>📊 经营看板</h1>

      {/* 顶部：昨日数据汇总 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e' }}>📈 昨日经营数据</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard title="昨日净销售额" value={`¥${yesterdayStats.netSales.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} color="#1890ff" />
          <StatCard title="推广费" value={`¥${yesterdayStats.adCost.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} color="#fa8c16" />
          <StatCard title="ROI" value={yesterdayStats.roi.toFixed(2)} color="#eb2f96" />
          <StatCard title="利润" value={`¥${yesterdayStats.profit.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} color={yesterdayStats.profit >= 0 ? '#52c41a' : '#ff4d4f'} />
        </div>
      </div>

      {/* 中部：筛选区 */}
      <div style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e' }}>🔍 数据筛选（昨日数据）</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 15, color: '#333', marginBottom: 8, fontWeight: 500 }}>店铺范围</label>
            <select value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedShop('') }} style={{ width: '100%', padding: '10 12', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14 }}>
              <option value="all">全部小组</option>
              {GROUPS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 15, color: '#333', marginBottom: 8, fontWeight: 500 }}>选择店铺</label>
            <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)} style={{ width: '100%', padding: '10 12', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14 }}>
              <option value="all">全部店铺</option>
              {getFilteredShops().map(s => <option key={s.id} value={s.id}>{s.name} ({s.platform})</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 底部：店铺销售情况 */}
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', padding: '16 24', borderBottom: '1px solid #e8e8e8', color: '#1a1a2e' }}>🏪 店铺销售情况</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '2px solid #e8e8e8' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>小组</th>
                <th style={{ padding: 12, textAlign: 'left' }}>店铺</th>
                <th style={{ padding: 12, textAlign: 'right' }}>销售额</th>
                <th style={{ padding: 12, textAlign: 'right' }}>订单量</th>
                <th style={{ padding: 12, textAlign: 'right' }}>净销售额</th>
                <th style={{ padding: 12, textAlign: 'right' }}>发货成本</th>
                <th style={{ padding: 12, textAlign: 'right' }}>刷单金额</th>
                <th style={{ padding: 12, textAlign: 'right' }}>刷单量</th>
                <th style={{ padding: 12, textAlign: 'right' }}>刷单佣金</th>
                <th style={{ padding: 12, textAlign: 'right' }}>退款金额</th>
                <th style={{ padding: 12, textAlign: 'right' }}>退回成本</th>
                <th style={{ padding: 12, textAlign: 'right' }}>推广费</th>
                <th style={{ padding: 12, textAlign: 'right' }}>运费</th>
                <th style={{ padding: 12, textAlign: 'right' }}>手续费</th>
                <th style={{ padding: 12, textAlign: 'right' }}>人工场地费</th>
                <th style={{ padding: 12, textAlign: 'right' }}>ROI</th>
                <th style={{ padding: 12, textAlign: 'right' }}>毛利率</th>
                <th style={{ padding: 12, textAlign: 'right' }}>退货率</th>
                <th style={{ padding: 12, textAlign: 'right' }}>利润</th>
              </tr>
            </thead>
            <tbody>
              {shopData.length === 0 ? (
                <tr>
                  <td colSpan={19} style={{ padding: 60, textAlign: 'center', color: '#999' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                    <div>暂无数据</div>
                  </td>
                </tr>
              ) : (
                shopData.map((shop, index) => (
                  <tr key={shop.shop_id} style={{ borderBottom: '1px solid #f0f0f0', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: 12, fontWeight: 500, background: index % 2 === 0 ? 'white' : '#fafafa' }}>{shop.group_name}</td>
                    <td style={{ padding: 12, fontWeight: 500, background: index % 2 === 0 ? 'white' : '#fafafa' }}>{shop.shop_name}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#1890ff' }}>¥{shop.sales.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>{shop.orders}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#722ed1' }}>¥{shop.netSales.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>¥{shop.cost.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#fa8c16' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#fa8c16' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#fa8c16' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#ff4d4f' }}>¥{shop.refund.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#52c41a' }}>¥{shop.returnCost.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#fa8c16' }}>¥{shop.adCost.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#eb2f96', fontWeight: 600 }}>{shop.roi.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#13c2c2' }}>{shop.grossMargin.toFixed(2)}%</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#ff4d4f' }}>{shop.refundRate.toFixed(2)}%</td>
                    <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold', color: shop.profit >= 0 ? '#52c41a' : '#ff4d4f' }}>¥{shop.profit.toFixed(2)}</td>
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

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div style={{ padding: 20, background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 'bold', color }}>{value}</div>
    </div>
  )
}
