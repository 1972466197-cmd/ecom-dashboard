'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Shop { id: number; name: string; platform: string; group_id: number }
interface ShopGroup { id: number; name: string }
interface ProductData {
  product_id_external: string
  product_name: string
  paying_amount: number
  paying_buyers: number
  visitors: number
  cart_users: number
  refund_amount: number
  // 计算字段
  avgOrderValue: number
  cartRate: number
  cvr: number
}

type SortKey = keyof ProductData | 'product_name'
type SortOrder = 'asc' | 'desc'

const GROUPS = [
  { id: 1, name: '海林组' },
  { id: 2, name: '培君组' },
  { id: 3, name: '淑贞组' },
  { id: 4, name: '敏贞组' },
]

export default function AnalysisPage() {
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [dateRangeType, setDateRangeType] = useState<string>('7days')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  const [productId, setProductId] = useState<string>('')
  const [productData, setProductData] = useState<ProductData[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('paying_amount')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => { loadShops() }, [])
  useEffect(() => { if (!loading && selectedShop) handleSearch() }, [loading, selectedShop, selectedGroup, dateRangeType, customDateRange])
  useEffect(() => { if (productData.length > 0) setProductData(sortData(productData)) }, [sortKey, sortOrder])

  async function loadShops() {
    try {
      const { data } = await supabase.from('shops').select('*').order('name')
      if (data) { setShops(data) }
    } catch (err) { console.error('加载店铺失败:', err) }
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

  const handleSearch = async (productIdsInput?: string) => {
    setSearching(true)
    try {
      const { start, end } = getDateRange()
      
      // 从商品日概况表获取数据（不限制商品 ID，获取所有商品）
      let query = supabase
        .from('product_daily_reports')
        .select('*')
        .gte('stat_date', start)
        .lte('stat_date', end)
      
      if (selectedShop) {
        query = query.eq('shop_id', selectedShop)
      } else if (selectedGroup !== 'all') {
        const ids = shops.filter(s => s.group_id.toString() === selectedGroup).map(s => s.id)
        if (ids.length > 0) query = query.in('shop_id', ids)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // 按商品 ID 聚合数据（去重）
      const productMap = new Map<string, ProductData>()
      data?.forEach((row: any) => {
        const pid = row.product_id_external || 'UNKNOWN'
        if (!productMap.has(pid)) {
          productMap.set(pid, {
            product_id_external: pid,
            product_name: row.product_name || '',
            paying_amount: 0,
            paying_buyers: 0,
            visitors: 0,
            cart_users: 0,
            refund_amount: 0,
            avgOrderValue: 0,
            cartRate: 0,
            cvr: 0
          })
        }
        const p = productMap.get(pid)!
        p.paying_amount += row.paying_amount || 0
        p.paying_buyers += row.paying_buyers || 0
        p.visitors += row.visitors || 0
        p.cart_users += row.cart_users || 0
        p.refund_amount += row.refund_amount || 0
      })
      
      // 计算指标
      const result = Array.from(productMap.values()).map(p => ({
        ...p,
        avgOrderValue: p.paying_buyers > 0 ? p.paying_amount / p.paying_buyers : 0,
        cartRate: p.visitors > 0 ? (p.cart_users / p.visitors * 100) : 0,
        cvr: p.visitors > 0 ? (p.paying_buyers / p.visitors * 100) : 0
      }))
      
      // 如果输入了商品 ID，则过滤
      if (productIdsInput && productIdsInput.trim()) {
        const filterIds = productIdsInput.split(',').map(id => id.trim()).filter(id => id)
        const filtered = result.filter(p => filterIds.includes(p.product_id_external))
        setProductData(sortData(filtered))
      } else {
        setProductData(sortData(result))
      }
    } catch (err) {
      console.error('搜索失败:', err)
    } finally {
      setSearching(false)
    }
  }
  
  // 排序函数
  const sortData = (data: ProductData[]) => {
    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
  }
  
  // 处理表头点击排序
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>加载中...</div>

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#1a1a2e' }}>📈 商品分析</h1>

      {/* 顶部筛选区 */}
      <div style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
          {/* 店铺范围 */}
          <div>
            <label style={{ display: 'block', fontSize: 15, color: '#333', marginBottom: 8, fontWeight: 500 }}>店铺范围</label>
            <select value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedShop('') }} style={{ width: '100%', padding: '10 12', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14 }}>
              <option value="all">全部店铺</option>
              {GROUPS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          {/* 选择店铺 */}
          <div>
            <label style={{ display: 'block', fontSize: 15, color: '#333', marginBottom: 8, fontWeight: 500 }}>选择店铺</label>
            <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)} style={{ width: '100%', padding: '10 12', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14 }}>
              <option value="">请选择店铺</option>
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

        {/* 商品 ID 搜索 */}
        <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 15, color: '#333', marginBottom: 8, fontWeight: 500 }}>商品 ID 搜索</label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="输入商品 ID 进行搜索..."
                style={{ width: '100%', padding: '12 16', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 15 }}
              />
            </div>
            <button
              onClick={() => handleSearch(productId)}
              disabled={searching}
              style={{
                padding: '12 32',
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                background: searching ? '#d9d9d9' : '#1890ff',
                color: 'white',
                cursor: searching ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(24,144,255,0.3)',
              }}
            >
              {searching ? '搜索中...' : '🔍 搜索'}
            </button>
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '2px solid #e8e8e8' }}>
                <th style={{ padding: 12, textAlign: 'center', position: 'sticky', left: 0, background: '#fafafa', fontWeight: 600, minWidth: 150 }}>商品 ID</th>
                <th onClick={() => handleSort('paying_amount')} style={{ padding: 12, textAlign: 'center', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>支付金额 {sortKey === 'paying_amount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('paying_buyers')} style={{ padding: 12, textAlign: 'center', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>支付人数 {sortKey === 'paying_buyers' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('avgOrderValue')} style={{ padding: 12, textAlign: 'center', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>客单价 {sortKey === 'avgOrderValue' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('visitors')} style={{ padding: 12, textAlign: 'center', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>访客 {sortKey === 'visitors' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('cart_users')} style={{ padding: 12, textAlign: 'center', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>加购人数 {sortKey === 'cart_users' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('cartRate')} style={{ padding: 12, textAlign: 'center', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>加购率 {sortKey === 'cartRate' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('cvr')} style={{ padding: 12, textAlign: 'center', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>转化率 {sortKey === 'cvr' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('refund_amount')} style={{ padding: 12, textAlign: 'center', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>退款金额 {sortKey === 'refund_amount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>未发货仅退单量</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>未发货仅退金额</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>退货退款单量</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>退货退款金额</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>补单金额</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>补单量</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>佣金</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>成交额（减刷单）</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>单量（减刷单）</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>成交额（减退款）</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>单量（减仅退款）</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>实际发出件数</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>成本</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>毛利</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>花费</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>点击量</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>加购</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>成交额</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>成交笔数</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#999' }}>投产</th>
              </tr>
            </thead>
            <tbody>
              {productData.length === 0 ? (
                <tr>
                  <td colSpan={29} style={{ padding: 60, textAlign: 'center', color: '#999' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                    <div style={{ fontSize: 16 }}>暂无商品数据</div>
                    <div style={{ fontSize: 14, marginTop: 8, color: '#666' }}>请选择店铺或输入商品 ID 搜索</div>
                  </td>
                </tr>
              ) : (
                productData.map((product, index) => (
                  <tr key={product.product_id_external + '-' + index} style={{ borderBottom: '1px solid #f0f0f0', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: 12, textAlign: 'center', position: 'sticky', left: 0, background: index % 2 === 0 ? 'white' : '#fafafa', fontWeight: 500, fontFamily: 'monospace' }}>{product.product_id_external}</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#1890ff', fontWeight: sortKey === 'paying_amount' ? 'bold' : 'normal' }}>¥{product.paying_amount.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'center', fontWeight: sortKey === 'paying_buyers' ? 'bold' : 'normal' }}>{product.paying_buyers}</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#13c2c2', fontWeight: sortKey === 'avgOrderValue' ? 'bold' : 'normal' }}>¥{product.avgOrderValue.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'center', fontWeight: sortKey === 'visitors' ? 'bold' : 'normal' }}>{product.visitors.toLocaleString()}</td>
                    <td style={{ padding: 12, textAlign: 'center', fontWeight: sortKey === 'cart_users' ? 'bold' : 'normal' }}>{product.cart_users.toLocaleString()}</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#fa8c16', fontWeight: sortKey === 'cartRate' ? 'bold' : 'normal' }}>{product.cartRate.toFixed(2)}%</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#722ed1', fontWeight: sortKey === 'cvr' ? 'bold' : 'normal' }}>{product.cvr.toFixed(2)}%</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#ff4d4f', fontWeight: sortKey === 'refund_amount' ? 'bold' : 'normal' }}>¥{product.refund_amount.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#999' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#999' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#999' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#999' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#fa8c16' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#fa8c16' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#999' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#999' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#999' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#52c41a' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#999' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#999' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#999' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>-</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#999' }}>-</td>
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
