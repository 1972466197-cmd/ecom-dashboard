'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ShopDailyReport {
  id: number
  shop_id: number
  stat_date: string
  paying_amount: number
  paying_buyers: number
  ad_cost_total: number
  ad_keyword_cost: number
  ad_smart_cost: number
  refund_amount: number
}

interface ShopManualData {
  shop_id: number
  stat_date: string
  cost: number
  return_cost: number
  commission: number
}

interface Shop {
  id: number
  name: string
  platform: string
  group_id: number
}

interface DailyData {
  date: string
  sales: number
  orders: number
  refund: number
  adCost: number
  cost: number
  returnCost: number
  commission: number
  netSales: number
  fakeAmount: number
  fakeOrders: number
  commissionAmount: number
  shippingCost: number
  platformFee: number
  laborCost: number
  roi: number
  grossMargin: number
  refundRate: number
  profit: number
  editingCost?: boolean
  editingReturnCost?: boolean
  editingCommission?: boolean
  tempCost?: number
  tempReturnCost?: number
  tempCommission?: number
}

const GROUPS = [
  { id: 1, name: '海林组' },
  { id: 2, name: '培君组' },
  { id: 3, name: '淑贞组' },
  { id: 4, name: '敏贞组' },
]

export default function ShopDailyProfit() {
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [dateRangeType, setDateRangeType] = useState<string>('7days')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  const [shops, setShops] = useState<Shop[]>([])
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const canEdit = selectedShop && selectedShop !== 'all' && selectedShop !== ''

  useEffect(() => { loadShops() }, [])
  useEffect(() => { if (!loading) loadData() }, [selectedGroup, selectedShop, dateRangeType, customDateRange])

  async function loadShops() {
    try {
      const { data } = await supabase.from('shops').select('*').order('name')
      if (data) { setShops(data) }
    } catch (err) { console.error('加载店铺失败:', err) }
    finally { setLoading(false) }
  }

  async function loadData() {
    setLoading(true)
    try {
      const { start, end } = getDateRange()
      
      let shopQuery = supabase.from('shop_daily_reports').select('*').gte('stat_date', start).lte('stat_date', end)
      if (selectedShop) shopQuery = shopQuery.eq('shop_id', selectedShop)
      else if (selectedGroup !== 'all') {
        const ids = shops.filter(s => s.group_id.toString() === selectedGroup).map(s => s.id)
        if (ids.length > 0) shopQuery = shopQuery.in('shop_id', ids)
      }
      const { data: shopReports } = await shopQuery

      let manualQuery = supabase.from('shop_daily_manual').select('*').gte('stat_date', start).lte('stat_date', end)
      if (selectedShop) manualQuery = manualQuery.eq('shop_id', selectedShop)
      else if (selectedGroup !== 'all') {
        const ids = shops.filter(s => s.group_id.toString() === selectedGroup).map(s => s.id)
        if (ids.length > 0) manualQuery = manualQuery.in('shop_id', ids)
      }
      const { data: manualData } = await manualQuery

      // 从 orders 表获取刷单数据（先查所有，前端过滤日期和 is_delivery）
      let fakeQuery = supabase.from('orders').select('created_at, buyer_paid_amount, quantity, shop_id, is_delivery')
      if (selectedShop) fakeQuery = fakeQuery.eq('shop_id', selectedShop)
      else if (selectedGroup !== 'all') {
        const ids = shops.filter(s => s.group_id.toString() === selectedGroup).map(s => s.id)
        if (ids.length > 0) fakeQuery = fakeQuery.in('shop_id', ids)
      }
      const { data: allOrders } = await fakeQuery
      console.log('[DEBUG] orders query:', {
        dateRange: `${start} to ${end}`,
        totalRecords: allOrders?.length || 0,
        shop: selectedShop || 'all'
      })
      // 前端过滤：日期范围 + is_delivery=false（处理时区问题）
      const fakeOrders = allOrders?.filter((o: any) => {
        const isDeliveryFalse = o.is_delivery === false || o.is_delivery === 'false'
        if (!isDeliveryFalse) return false
        // 将 ISO 日期转换为本地日期（+8 时区）
        const orderDate = o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : null
        return orderDate && orderDate >= start && orderDate <= end
      }) || []
      console.log('[DEBUG] fake orders:', {
        count: fakeOrders.length,
        totalAmount: fakeOrders.reduce((sum, o) => sum + (o.buyer_paid_amount || 0), 0),
        totalQty: fakeOrders.reduce((sum, o) => sum + (o.quantity || 0), 0)
      })

      const dailyMap = new Map()
      const cur = new Date(start), endD = new Date(end)
      while (cur <= endD) {
        const d = cur.toISOString().split('T')[0]
        dailyMap.set(d, { 
          date: d, sales: 0, orders: 0, refund: 0, adCost: 0, 
          cost: 0, returnCost: 0, commission: 0,
          netSales: 0, fakeAmount: 0, fakeOrders: 0, commissionAmount: 0, 
          shippingCost: 0, platformFee: 0, laborCost: 0, 
          roi: 0, grossMargin: 0, refundRate: 0, profit: 0,
          editingCost: false, editingReturnCost: false, editingCommission: false 
        })
        cur.setDate(cur.getDate() + 1)
      }

      if (shopReports) shopReports.forEach((r: any) => {
        const d = dailyMap.get(r.stat_date)
        if (d) { 
          d.sales += r.paying_amount || 0
          d.orders += r.paying_buyers || 0
          d.refund += r.refund_amount || 0
          d.adCost += (r.ad_cost_total || 0) + (r.ad_keyword_cost || 0) + (r.ad_smart_cost || 0)
        }
      })

      if (manualData) manualData.forEach((m: any) => {
        const d = dailyMap.get(m.stat_date)
        if (d) { 
          d.cost = m.cost || 0
          d.returnCost = m.return_cost || 0
          d.commission = m.commission || 0
        }
      })

      // 从 orders 表获取刷单金额和刷单量
      if (fakeOrders) fakeOrders.forEach((f: any) => {
        const dt = f.created_at?.split('T')[0]
        const d = dailyMap.get(dt)
        if (d) { 
          d.fakeAmount += f.buyer_paid_amount || 0    // 刷单金额从 orders 获取
          d.fakeOrders += f.quantity || 0             // 刷单量从 orders 获取
          // commissionAmount 不变，从 manualData 获取（手动填写）
        }
      })
      
      // 从 shop_daily_manual 表获取手动填写的佣金
      if (manualData) manualData.forEach((m: any) => {
        const dt = m.stat_date
        const d = dailyMap.get(dt)
        if (d) { 
          d.commissionAmount = m.commission || 0      // 刷单佣金保持手动填写
        }
      })

      const result = Array.from(dailyMap.values()).map((data: any) => {
        const netSales = data.sales - data.refund - data.fakeAmount
        const roi = data.adCost > 0 ? (netSales / data.adCost) : 0
        const grossMargin = netSales > 0 ? ((1 - data.cost / netSales) * 100) : 0
        const refundRate = data.sales > 0 ? ((data.refund / data.sales) * 100) : 0
        const profit = netSales - data.commission - data.cost - data.adCost - data.shippingCost - data.platformFee - data.laborCost + data.returnCost
        return { ...data, netSales, roi, grossMargin, refundRate, profit }
      })

      result.sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''))
      setDailyData(result)
    } catch (err) { console.error('加载失败:', err) }
    finally { setLoading(false) }
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

  const saveManualData = async (date: string, field: 'cost' | 'returnCost' | 'commission', value: number) => {
    if (!canEdit) return
    const shopId = Number(selectedShop)
    if (!shopId) return

    try {
      const dbField = field === 'cost' ? 'cost' : field === 'returnCost' ? 'return_cost' : 'commission'
      const { error } = await supabase.from('shop_daily_manual').upsert({
        shop_id: shopId,
        stat_date: date,
        [dbField]: value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'shop_id,stat_date' })

      if (error) throw error

      setDailyData(prev => prev.map(d => {
        if (d.date === date) {
          const updated = { 
            ...d, 
            [field]: value,
            [`editing${field.charAt(0).toUpperCase() + field.slice(1)}`]: false,
            [`temp${field.charAt(0).toUpperCase() + field.slice(1)}`]: undefined
          }
          const netSales = updated.sales - updated.refund - updated.fakeAmount
          updated.netSales = netSales
          updated.roi = updated.adCost > 0 ? (netSales / updated.adCost) : 0
          updated.grossMargin = netSales > 0 ? ((1 - updated.cost / netSales) * 100) : 0
          updated.refundRate = updated.sales > 0 ? ((updated.refund / updated.sales) * 100) : 0
          updated.profit = netSales - updated.commission - updated.cost - updated.adCost - updated.shippingCost - updated.platformFee - updated.laborCost + updated.returnCost
          return updated
        }
        return d
      }))

      showToast('保存成功', 'success')
    } catch (err: any) {
      console.error('保存失败:', err)
      showToast('保存失败：' + err.message, 'error')
    }
  }

  const handleEditClick = (date: string, field: 'cost' | 'returnCost' | 'commission', currentValue: number) => {
    setDailyData(prev => prev.map(d => {
      if (d.date === date) {
        return {
          ...d,
          [`editing${field.charAt(0).toUpperCase() + field.slice(1)}`]: true,
          [`temp${field.charAt(0).toUpperCase() + field.slice(1)}`]: currentValue
        }
      }
      return d
    }))
  }

  const handleEditChange = (date: string, field: 'cost' | 'returnCost' | 'commission', value: string) => {
    const numValue = parseFloat(value) || 0
    setDailyData(prev => prev.map(d => {
      if (d.date === date) {
        return { ...d, [`temp${field.charAt(0).toUpperCase() + field.slice(1)}`]: numValue }
      }
      return d
    }))
  }

  const handleEditSave = (date: string, field: 'cost' | 'returnCost' | 'commission') => {
    const data = dailyData.find(d => d.date === date)
    if (!data) return
    const tempField = `temp${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof DailyData
    const value = data[tempField] as number || 0
    saveManualData(date, field, value)
  }

  const handleEditCancel = (date: string, field: 'cost' | 'returnCost' | 'commission') => {
    setDailyData(prev => prev.map(d => {
      if (d.date === date) {
        return {
          ...d,
          [`editing${field.charAt(0).toUpperCase() + field.slice(1)}`]: false,
          [`temp${field.charAt(0).toUpperCase() + field.slice(1)}`]: undefined
        }
      }
      return d
    }))
  }

  const totalSales = dailyData.reduce((s, d) => s + d.sales, 0)
  const totalOrders = dailyData.reduce((s, d) => s + d.orders, 0)
  const totalNetSales = dailyData.reduce((s, d) => s + d.netSales, 0)
  const totalCost = dailyData.reduce((s, d) => s + d.cost, 0)
  const totalRefund = dailyData.reduce((s, d) => s + d.refund, 0)
  const totalAdCost = dailyData.reduce((s, d) => s + d.adCost, 0)
  const totalProfit = dailyData.reduce((s, d) => s + d.profit, 0)
  const avgRoi = dailyData.length > 0 ? dailyData.reduce((s, d) => s + d.roi, 0) / dailyData.length : 0
  const avgGrossMargin = dailyData.length > 0 ? dailyData.reduce((s, d) => s + d.grossMargin, 0) / dailyData.length : 0
  const avgRefundRate = dailyData.length > 0 ? dailyData.reduce((s, d) => s + d.refundRate, 0) / dailyData.length : 0

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>加载中...</div>

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#1a1a2e' }}>📉 店铺每日盈亏</h1>

      {!canEdit && (
        <div style={{
          padding: '12 20',
          marginBottom: 20,
          borderRadius: 8,
          background: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffc107',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span>请先选择具体店铺，选择后才能编辑成本、刷单佣金和退回成本</span>
        </div>
      )}

      {toast && (
        <div style={{
          padding: '12 20',
          marginBottom: 20,
          borderRadius: 8,
          background: toast.type === 'success' ? '#d4edda' : '#f8d7da',
          color: toast.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${toast.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
        }}>
          {toast.message}
        </div>
      )}

      <div style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 15, color: '#333', marginBottom: 8, fontWeight: 500 }}>店铺范围</label>
            <select value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedShop('') }} style={{ width: '100%', padding: '10 12', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14 }}>
              <option value="all">全部店铺</option>
              {GROUPS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 15, color: '#333', marginBottom: 8, fontWeight: 500 }}>选择店铺</label>
            <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)} style={{ width: '100%', padding: '10 12', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14 }}>
              <option value="">请选择店铺</option>
              {getFilteredShops().map(s => <option key={s.id} value={s.id}>{s.name} ({s.platform})</option>)}
            </select>
          </div>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard title="销售额" value={`¥${totalSales.toFixed(2)}`} color="#1890ff" />
        <StatCard title="订单量" value={totalOrders} color="#52c41a" />
        <StatCard title="净销售额" value={`¥${totalNetSales.toFixed(2)}`} color="#722ed1" />
        <StatCard title="发货成本" value={`¥${totalCost.toFixed(2)}`} color="#fa8c16" />
        <StatCard title="退款金额" value={`¥${totalRefund.toFixed(2)}`} color="#ff4d4f" />
        <StatCard title="推广费" value={`¥${totalAdCost.toFixed(2)}`} color="#faad14" />
        <StatCard title="ROI" value={avgRoi.toFixed(2)} color="#eb2f96" />
        <StatCard title="毛利率" value={`${avgGrossMargin.toFixed(2)}%`} color="#13c2c2" />
        <StatCard title="退货率" value={`${avgRefundRate.toFixed(2)}%`} color="#ff7a45" />
        <StatCard title="利润" value={`¥${totalProfit.toFixed(2)}`} color={totalProfit >= 0 ? '#52c41a' : '#ff4d4f'} />
      </div>

      {dailyData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, color: '#999' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 16 }}>暂无数据</div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '2px solid #e8e8e8' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>日期</th>
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
                {dailyData.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: 12, fontWeight: 500 }}>{row.date}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#1890ff' }}>¥{row.sales.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>{row.orders}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#722ed1' }}>¥{row.netSales.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      {canEdit && row.editingCost ? (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <input type="number" value={row.tempCost ?? row.cost} onChange={(e) => handleEditChange(row.date, 'cost', e.target.value)} onBlur={() => handleEditSave(row.date, 'cost')} onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(row.date, 'cost'); if (e.key === 'Escape') handleEditCancel(row.date, 'cost') }} autoFocus style={{ width: 80, padding: '4 8', border: '1px solid #1890ff', borderRadius: 4, fontSize: 13 }} />
                          <button onClick={() => handleEditSave(row.date, 'cost')} style={{ padding: '4 8', background: '#52c41a', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✓</button>
                          <button onClick={() => handleEditCancel(row.date, 'cost')} style={{ padding: '4 8', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✗</button>
                        </div>
                      ) : canEdit ? (
                        <span onClick={() => handleEditClick(row.date, 'cost', row.cost)} style={{ cursor: 'pointer', color: '#fa8c16', borderBottom: '1px dashed #fa8c16' }} title="点击编辑">¥{row.cost.toFixed(2)}</span>
                      ) : (
                        <span style={{ color: '#999' }}>¥{row.cost.toFixed(2)}</span>
                      )}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#fa8c16' }}>¥{row.fakeAmount.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>{row.fakeOrders}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      {canEdit && row.editingCommission ? (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <input type="number" value={row.tempCommission ?? row.commission} onChange={(e) => handleEditChange(row.date, 'commission', e.target.value)} onBlur={() => handleEditSave(row.date, 'commission')} onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(row.date, 'commission'); if (e.key === 'Escape') handleEditCancel(row.date, 'commission') }} autoFocus style={{ width: 80, padding: '4 8', border: '1px solid #1890ff', borderRadius: 4, fontSize: 13 }} />
                          <button onClick={() => handleEditSave(row.date, 'commission')} style={{ padding: '4 8', background: '#52c41a', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✓</button>
                          <button onClick={() => handleEditCancel(row.date, 'commission')} style={{ padding: '4 8', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✗</button>
                        </div>
                      ) : canEdit ? (
                        <span onClick={() => handleEditClick(row.date, 'commission', row.commission)} style={{ cursor: 'pointer', color: '#fa8c16', borderBottom: '1px dashed #fa8c16' }} title="点击编辑">¥{row.commission.toFixed(2)}</span>
                      ) : (
                        <span style={{ color: '#999' }}>¥{row.commission.toFixed(2)}</span>
                      )}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#ff4d4f' }}>¥{row.refund.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      {canEdit && row.editingReturnCost ? (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <input type="number" value={row.tempReturnCost ?? row.returnCost} onChange={(e) => handleEditChange(row.date, 'returnCost', e.target.value)} onBlur={() => handleEditSave(row.date, 'returnCost')} onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(row.date, 'returnCost'); if (e.key === 'Escape') handleEditCancel(row.date, 'returnCost') }} autoFocus style={{ width: 80, padding: '4 8', border: '1px solid #1890ff', borderRadius: 4, fontSize: 13 }} />
                          <button onClick={() => handleEditSave(row.date, 'returnCost')} style={{ padding: '4 8', background: '#52c41a', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✓</button>
                          <button onClick={() => handleEditCancel(row.date, 'returnCost')} style={{ padding: '4 8', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✗</button>
                        </div>
                      ) : canEdit ? (
                        <span onClick={() => handleEditClick(row.date, 'returnCost', row.returnCost)} style={{ cursor: 'pointer', color: '#52c41a', borderBottom: '1px dashed #52c41a' }} title="点击编辑">¥{row.returnCost.toFixed(2)}</span>
                      ) : (
                        <span style={{ color: '#999' }}>¥{row.returnCost.toFixed(2)}</span>
                      )}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#fa8c16' }}>¥{row.adCost.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>¥{row.shippingCost.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>¥{row.platformFee.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>¥{row.laborCost.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#eb2f96', fontWeight: 500 }}>{row.roi.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#13c2c2' }}>{row.grossMargin.toFixed(2)}%</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#ff4d4f' }}>{row.refundRate.toFixed(2)}%</td>
                    <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold', color: row.profit >= 0 ? '#52c41a' : '#ff4d4f' }}>¥{row.profit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div style={{ padding: 20, background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 20, color: '#333', marginBottom: 8, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 'bold', color }}>{value}</div>
    </div>
  )
}
