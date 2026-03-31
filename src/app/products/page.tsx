'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ProductReport {
  id: number
  shop_id: number
  report_date: string
  product_name: string
  product_id_external: string
  paying_amount: number
  visitors: number
  paying_buyers: number
}

interface Shop {
  id: number
  name: string
  platform: string
}

export default function ProductsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [productData, setProductData] = useState<ProductReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedShop) {
      loadProductData()
    }
  }, [selectedShop])

  async function loadData() {
    const { data } = await supabase.from('shops').select('*').order('name')
    if (data) {
      setShops(data)
      if (data.length > 0) {
        setSelectedShop(String(data[0].id))
      }
    }
  }

  async function loadProductData() {
    setLoading(true)
    const { data } = await supabase
      .from('product_daily_reports')
      .select('*')
      .eq('shop_id', selectedShop)
      .order('report_date', { ascending: false })
      .limit(100)
    
    setProductData(data || [])
    setLoading(false)
  }

  const filteredData = productData.filter(row =>
    row.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.product_id_external?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalSales = filteredData.reduce((sum, d) => sum + (d.paying_amount || 0), 0)
  const totalVisitors = filteredData.reduce((sum, d) => sum + (d.visitors || 0), 0)
  const totalBuyers = filteredData.reduce((sum, d) => sum + (d.paying_buyers || 0), 0)

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#1a1a2e' }}>
        📦 商品管理
      </h1>

      {/* 筛选区 */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <select
          value={selectedShop}
          onChange={(e) => setSelectedShop(e.target.value)}
          style={{ padding: '10 16', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14 }}
        >
          {shops.map(shop => (
            <option key={shop.id} value={shop.id}>
              {shop.name} ({shop.platform})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="搜索商品名称或 ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10 16',
            borderRadius: 8,
            border: '1px solid #d9d9d9',
            fontSize: 14,
            minWidth: 300,
          }}
        />
      </div>

      {/* 汇总卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}>
        <div style={{ padding: 20, background: '#f0f8ff', borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>商品销售额</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
            ¥{(totalSales / 10000).toFixed(2)}万
          </div>
        </div>
        <div style={{ padding: 20, background: '#f6ffed', borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>总访客数</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
            {totalVisitors.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: 20, background: '#fff7e6', borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>支付买家数</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
            {totalBuyers.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>加载中...</div>
      ) : filteredData.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 60,
          background: 'white',
          borderRadius: 12,
          color: '#999',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <div style={{ fontSize: 16 }}>暂无商品数据</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>请先导入商品日报数据</div>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '2px solid #e8e8e8' }}>
                <th style={{ padding: 16, textAlign: 'left' }}>日期</th>
                <th style={{ padding: 16, textAlign: 'left' }}>商品 ID</th>
                <th style={{ padding: 16, textAlign: 'left' }}>商品名称</th>
                <th style={{ padding: 16, textAlign: 'right' }}>访客数</th>
                <th style={{ padding: 16, textAlign: 'right' }}>支付买家数</th>
                <th style={{ padding: 16, textAlign: 'right' }}>销售额</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 50).map((row, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: 16 }}>{row.report_date}</td>
                  <td style={{ padding: 16, fontFamily: 'monospace' }}>{row.product_id_external}</td>
                  <td style={{ padding: 16, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.product_name}
                  </td>
                  <td style={{ padding: 16, textAlign: 'right' }}>{row.visitors?.toLocaleString() || 0}</td>
                  <td style={{ padding: 16, textAlign: 'right', color: '#52c41a' }}>
                    {row.paying_buyers?.toLocaleString() || 0}
                  </td>
                  <td style={{ padding: 16, textAlign: 'right', fontWeight: 500, color: '#1890ff' }}>
                    ¥{(row.paying_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length > 50 && (
            <div style={{ padding: 16, textAlign: 'center', color: '#999', background: '#fafafa' }}>
              显示前 50 条，共 {filteredData.length} 条数据
            </div>
          )}
        </div>
      )}
    </div>
  )
}
