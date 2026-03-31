'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface ShopDailyReport {
  id: number
  shop_id: number
  stat_date: string
  paying_amount: number
  paying_buyers: number
  visitors: number
  ad_cost_total: number
  ad_keyword_cost: number
  ad_smart_cost: number
  refund_amount: number
}

interface Shop {
  id: number
  name: string
  platform: string
  group_id: number
}

interface ShopGroup {
  id: number
  name: string
}

type DateRangeType = '1day' | '7days' | '14days' | 'custom'

export default function ShopDailyProfit() {
  const router = useRouter()
  
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('7days')
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  
  const [shops, setShops] = useState<Shop[]>([])
  const [shopData, setShopData] = useState<ShopDailyReport[]>([])
  const [loading, setLoading] = useState(true)

  // 加载店铺列表
  useEffect(() => {
    const loadShops = async () => {
      const { data } = await supabase
        .from('shops')
        .select('*')
        .order('name')
      
      if (data) {
        setShops(data)
        if (data.length > 0) {
          setSelectedShop(String(data[0].id))
        }
      }
    }
    loadShops()
  }, [])

  // 加载数据
  useEffect(() => {
    if (!selectedShop) return
    
    loadData()
  }, [selectedShop, dateRangeType, customDateRange])

  const loadData = async () => {
    setLoading(true)
    try {
      const { start, end } = getDateRange()
      
      const { data, error } = await supabase
        .from('shop_daily_reports')
        .select('*')
        .eq('shop_id', selectedShop)
        .gte('stat_date', start)
        .lte('stat_date', end)
        .order('stat_date', { ascending: false })
      
      if (error) throw error
      setShopData(data || [])
    } catch (err: any) {
      console.error('加载数据失败:', err)
      setShopData([])
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = () => {
    const end = customDateRange.end
    let start = customDateRange.start
    
    if (dateRangeType === '1day') {
      start = end
    } else if (dateRangeType === '7days') {
      const d = new Date(end)
      d.setDate(d.getDate() - 6)
      start = d.toISOString().split('T')[0]
    } else if (dateRangeType === '14days') {
      const d = new Date(end)
      d.setDate(d.getDate() - 13)
      start = d.toISOString().split('T')[0]
    }
    
    return { start, end }
  }

  // 计算汇总
  const totalSales = shopData.reduce((sum, d) => sum + (d.paying_amount || 0), 0)
  const totalOrders = shopData.reduce((sum, d) => sum + (d.paying_buyers || 0), 0)
  const totalVisitors = shopData.reduce((sum, d) => sum + (d.visitors || 0), 0)
  const totalAdCost = shopData.reduce((sum, d) => {
    return sum + (d.ad_cost_total || 0) + (d.ad_keyword_cost || 0) + (d.ad_smart_cost || 0)
  }, 0)
  const totalRefund = shopData.reduce((sum, d) => sum + (d.refund_amount || 0), 0)

  const roi = totalAdCost > 0 ? (totalSales / totalAdCost).toFixed(2) : '0.00'
  const refundRate = totalSales > 0 ? ((totalRefund / totalSales) * 100).toFixed(1) : '0.0'

  if (loading) {
    return <div style={{ padding: 20 }}>加载中...</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🏪 店铺每日盈亏</h1>
      
      <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <label>选择店铺：</label>
        <select
          value={selectedShop}
          onChange={(e) => setSelectedShop(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        >
          {shops.map(shop => (
            <option key={shop.id} value={shop.id}>
              {shop.name} ({shop.platform})
            </option>
          ))}
        </select>

        <label>日期范围：</label>
        <button
          onClick={() => setDateRangeType('1day')}
          style={{ padding: '8 16', background: dateRangeType === '1day' ? '#007bff' : '#f0f0f0', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          1 天
        </button>
        <button
          onClick={() => setDateRangeType('7days')}
          style={{ padding: '8 16', background: dateRangeType === '7days' ? '#007bff' : '#f0f0f0', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          7 天
        </button>
        <button
          onClick={() => setDateRangeType('14days')}
          style={{ padding: '8 16', background: dateRangeType === '14days' ? '#007bff' : '#f0f0f0', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          14 天
        </button>
      </div>

      {shopData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <p>暂无数据</p>
          <button
            onClick={() => router.push('/import')}
            style={{ marginTop: 10, padding: '10 20', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            去导入数据
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ padding: 16, background: '#f0f8ff', borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: '#666' }}>总销售额</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>¥{totalSales.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div style={{ padding: 16, background: '#f0f8ff', borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: '#666' }}>总订单数</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{totalOrders}</div>
            </div>
            <div style={{ padding: 16, background: '#f0f8ff', borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: '#666' }}>总访客数</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>{totalVisitors.toLocaleString()}</div>
            </div>
            <div style={{ padding: 16, background: '#f0f8ff', borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: '#666' }}>推广费</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>¥{totalAdCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div style={{ padding: 16, background: '#f0f8ff', borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: '#666' }}>ROI</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#eb2f96' }}>{roi}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '2px solid #e8e8e8' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>日期</th>
                <th style={{ padding: 12, textAlign: 'right' }}>销售额</th>
                <th style={{ padding: 12, textAlign: 'right' }}>订单数</th>
                <th style={{ padding: 12, textAlign: 'right' }}>访客数</th>
                <th style={{ padding: 12, textAlign: 'right' }}>推广费</th>
                <th style={{ padding: 12, textAlign: 'right' }}>退款</th>
              </tr>
            </thead>
            <tbody>
              {shopData.map((row, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: 12 }}>{row.stat_date}</td>
                  <td style={{ padding: 12, textAlign: 'right', color: '#1890ff', fontWeight: 500 }}>
                    ¥{(row.paying_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{row.paying_buyers || 0}</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{row.visitors || 0}</td>
                  <td style={{ padding: 12, textAlign: 'right', color: '#fa8c16' }}>
                    ¥{((row.ad_cost_total || 0) + (row.ad_keyword_cost || 0) + (row.ad_smart_cost || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: 12, textAlign: 'right', color: '#ff4d4f' }}>
                    ¥{(row.refund_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
