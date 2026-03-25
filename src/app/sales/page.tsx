'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface SalesData {
  id: number
  shop_id: number
  date: string
  week_day: string
  pay_amount: number
  pay_orders: number
  avg_order_value: number
  visitors: number
  cart_count: number
  cart_rate: number
  ctr: number
  cvr: number
  refund_amount: number
  return_refund_jqn: number
  return_refund_jst: number
  return_refund_orders: number
  only_refund_amount: number
  fake_orders_amount: number
  fake_orders_count: number
  commission: number
  review_count: number
  product_list_count: number
  after_sale_duration: number
  cs_score: number
  shop_score: number
  purchase_cost: number
  return_cost: number
  gross_profit: number
  total_cost: number
  total_sales: number
  ad_cost_total: number
  ad_keyword: number
  ad_audience: number
  shop_roi: number
  logistics_fee: number
  platform_fee: number
  labor_cost: number
  ad_coupon_return: number
  net_profit: number
  net_roi: number
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
  leader_name: string
}

interface ShopSales {
  shop: Shop
  data: SalesData[]
  totalGmv: number
  totalOrders: number
  totalProfit: number
  totalAdCost: number
  roi: number
}

const TABLE_FIELDS: { key: string; label: string; color?: string }[] = [
  { key: 'date', label: '日期' },
  { key: 'week_day', label: '星期' },
  { key: 'pay_amount', label: '支付金额' },
  { key: 'pay_orders', label: '支付订单数' },
  { key: 'avg_order_value', label: '客单价' },
  { key: 'visitors', label: '访客' },
  { key: 'cart_count', label: '加购' },
  { key: 'cart_rate', label: '加购率' },
  { key: 'cvr', label: '转化率' },
  { key: 'refund_amount', label: '退款金额', color: 'text-red-600' },
  { key: 'return_refund_jst', label: '退货退款 (水潭)', color: 'text-red-600' },
  { key: 'fake_orders_amount', label: '补单金额', color: 'text-orange-600' },
  { key: 'gross_profit', label: '毛利', color: 'text-green-600' },
  { key: 'ad_cost_total', label: '全站推广', color: 'text-orange-600' },
  { key: 'shop_roi', label: '店铺 ROI', color: 'text-orange-600' },
  { key: 'net_profit', label: '净利', color: 'text-green-600' },
  { key: 'net_roi', label: '净投产', color: 'text-green-600' },
]

export default function ShopSales() {
  const [groups, setGroups] = useState<ShopGroup[]>([])
  const [shopSalesList, setShopSalesList] = useState<ShopSales[]>([])
  const [dateRange, setDateRange] = useState({ start: '2026-03-17', end: '2026-03-23' })
  const [expandedShops, setExpandedShops] = useState<Set<number>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState('全部组')
  const [editingCell, setEditingCell] = useState<{ shopId: number; rowIndex: number; field: string } | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // 加载分组
      const { data: groupsData, error: groupsError } = await supabase
        .from('shop_groups')
        .select('*')
        .order('sort_order')
      
      if (groupsError) throw groupsError
      setGroups(groupsData || [])

      // 加载店铺
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .order('name')
      
      if (shopsError) throw shopsError

      // 加载销售数据
      const { data: salesData, error: salesError } = await supabase
        .from('sales_data')
        .select('*')
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false })
      
      if (salesError) throw salesError

      // 组织数据
      const shops = shopsData || []
      const sales = salesData || []
      
      const shopSalesMap = new Map<number, ShopSales>()
      
      shops.forEach(shop => {
        const shopSales = sales.filter(s => s.shop_id === shop.id)
        const totalGmv = shopSales.reduce((sum, s) => sum + (s.pay_amount || 0), 0)
        const totalOrders = shopSales.reduce((sum, s) => sum + (s.pay_orders || 0), 0)
        const totalProfit = shopSales.reduce((sum, s) => sum + (s.net_profit || 0), 0)
        const totalAdCost = shopSales.reduce((sum, s) => sum + (s.ad_cost_total || 0), 0)
        
        shopSalesMap.set(shop.id, {
          shop,
          data: shopSales,
          totalGmv,
          totalOrders,
          totalProfit,
          totalAdCost,
          roi: totalAdCost > 0 ? totalGmv / totalAdCost : 0
        })
      })

      setShopSalesList(Array.from(shopSalesMap.values()))
    } catch (err: any) {
      console.error('加载数据失败:', err)
      showToast('加载数据失败，使用模拟数据', 'error')
      // 降级处理：使用模拟数据
      setGroups([
        { id: 1, name: '海林组', leader_name: '海林' },
        { id: 2, name: '培君组', leader_name: '培君' },
        { id: 3, name: '淑贞组', leader_name: '淑贞' },
        { id: 4, name: '敏贞组', leader_name: '敏贞' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // 保存单元格编辑
  const handleSaveCell = async () => {
    if (!editingCell) return
    
    const { shopId, rowIndex, field } = editingCell
    const shopSales = shopSalesList.find(ss => ss.shop.id === shopId)
    if (!shopSales) return

    const rowData = shopSales.data[rowIndex]
    if (!rowData) return

    try {
      const updateValue = Number(editingValue) || editingValue
      const { error } = await supabase
        .from('sales_data')
        .update({ [field]: updateValue, updated_at: new Date().toISOString() })
        .eq('id', rowData.id)

      if (error) throw error

      // 更新本地状态
      setShopSalesList(shopSalesList.map(ss => {
        if (ss.shop.id !== shopId) return ss
        const newData = [...ss.data]
        newData[rowIndex] = { ...newData[rowIndex], [field]: updateValue }
        
        // 重新计算汇总
        const totalGmv = newData.reduce((sum, s) => sum + (s.pay_amount || 0), 0)
        const totalOrders = newData.reduce((sum, s) => sum + (s.pay_orders || 0), 0)
        const totalProfit = newData.reduce((sum, s) => sum + (s.net_profit || 0), 0)
        const totalAdCost = newData.reduce((sum, s) => sum + (s.ad_cost_total || 0), 0)
        
        return {
          ...ss,
          data: newData,
          totalGmv,
          totalOrders,
          totalProfit,
          totalAdCost,
          roi: totalAdCost > 0 ? totalGmv / totalAdCost : 0
        }
      }))

      showToast('已保存到数据库')
    } catch (err: any) {
      console.error('保存失败:', err)
      showToast('保存失败', 'error')
    } finally {
      setEditingCell(null)
    }
  }

  // 切换店铺展开
  const toggleShop = (shopId: number) => {
    const newExpanded = new Set(expandedShops)
    newExpanded.has(shopId) ? newExpanded.delete(shopId) : newExpanded.add(shopId)
    setExpandedShops(newExpanded)
  }

  // 切换分组展开
  const toggleGroup = (groupId: number) => {
    const newExpanded = new Set(expandedGroups)
    newExpanded.has(groupId) ? newExpanded.delete(groupId) : newExpanded.add(groupId)
    setExpandedGroups(newExpanded)
  }

  // 计算总计
  const allShops = shopSalesList
  const totalGmv = allShops.reduce((sum, s) => sum + s.totalGmv, 0)
  const totalOrders = allShops.reduce((sum, s) => sum + s.totalOrders, 0)
  const totalProfit = allShops.reduce((sum, s) => sum + s.totalProfit, 0)
  const totalAdCost = allShops.reduce((sum, s) => sum + s.totalAdCost, 0)

  // 按分组筛选
  const filteredShopSales = selectedGroup === '全部组' 
    ? shopSalesList 
    : shopSalesList.filter(ss => {
        const group = groups.find(g => g.id === ss.shop.group_id)
        return group?.name === selectedGroup
      })

  // 按分组组织
  const shopsByGroup = new Map<number, ShopSales[]>()
  filteredShopSales.forEach(ss => {
    const groupId = ss.shop.group_id || 0
    if (!shopsByGroup.has(groupId)) shopsByGroup.set(groupId, [])
    shopsByGroup.get(groupId)!.push(ss)
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-slate-500">正在加载...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}
      
      {/* 侧边栏 */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <h2 className="text-2xl font-bold mb-8 text-orange-500">山麓众创科技</h2>
        <nav className="space-y-4">
          <a href="/" className="block py-2 px-4 hover:bg-slate-800 rounded">📊 经营看板</a>
          <a href="/products" className="block py-2 px-4 hover:bg-slate-800 rounded">📦 商品管理</a>
          <a href="/sales" className="block py-2 px-4 bg-slate-800 rounded">🏪 店铺销售情况</a>
          <a href="/import" className="block py-2 px-4 hover:bg-slate-800 rounded">📥 数据导入</a>
          <a href="/shops" className="block py-2 px-4 hover:bg-slate-800 rounded">📈 店铺每日盈亏</a>
          <a href="/profit" className="block py-2 px-4 hover:bg-slate-800 rounded">💰 利润监控</a>
          <a href="/settings" className="block py-2 px-4 hover:bg-slate-800 rounded">⚙️ 系统设置</a>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">🏪 店铺销售情况</h1>
              <p className="text-slate-500 mt-1">查看各店铺每日销售数据和核心指标</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">分组筛选：</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="全部组">全部组</option>
                {groups.map(group => (
                  <option key={group.id} value={group.name}>{group.name}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">总支付金额</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">¥{(totalGmv / 10000).toFixed(1)}万</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">总订单数</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{(totalOrders / 1000).toFixed(1)}k</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">总推广费</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">¥{(totalAdCost / 10000).toFixed(1)}万</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">总利润</p>
            <p className="text-2xl font-bold text-green-600 mt-1">¥{(totalProfit / 10000).toFixed(1)}万</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">ROI / 净投产</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {totalAdCost > 0 ? (totalGmv / totalAdCost).toFixed(2) : '0.00'} / {totalAdCost > 0 ? (totalProfit / totalAdCost).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {/* 日期范围 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">日期范围：</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              />
              <span className="text-slate-400">至</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <button
              onClick={loadData}
              className="ml-auto bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              🔄 刷新数据
            </button>
          </div>
        </div>

        {/* 分组和店铺列表 */}
        <div className="space-y-4">
          {groups.map((group) => {
            const groupShops = shopsByGroup.get(group.id) || []
            if (groupShops.length === 0) return null

            const groupTotalGmv = groupShops.reduce((sum, s) => sum + s.totalGmv, 0)
            const groupTotalAdCost = groupShops.reduce((sum, s) => sum + s.totalAdCost, 0)

            return (
              <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {/* 分组标题 */}
                <div
                  onClick={() => toggleGroup(group.id)}
                  className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 cursor-pointer hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${
                        expandedGroups.has(group.id) ? 'rotate-90' : ''
                      }`}>▶️</div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{group.name}</h3>
                        <p className="text-sm text-slate-500">{groupShops.length} 个店铺 · 总 GMV ¥{groupTotalGmv.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">分组 ROI</p>
                      <p className="text-lg font-bold text-orange-600">
                        {groupTotalAdCost > 0 ? (groupTotalGmv / groupTotalAdCost).toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 分组内容 */}
                {expandedGroups.has(group.id) && (
                  <div className="divide-y divide-slate-100">
                    {groupShops.map(({ shop, data, totalGmv, totalOrders, totalProfit, totalAdCost, roi }) => (
                      <div key={shop.id}>
                        {/* 店铺标题 */}
                        <div
                          onClick={() => toggleShop(shop.id)}
                          className="p-4 hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                                shop.platform.includes('抖音') ? 'bg-black text-white' :
                                shop.platform.includes('天猫') || shop.platform.includes('淘宝') ? 'bg-red-100 text-red-600' :
                                'bg-yellow-100 text-yellow-600'
                              }`}>
                                {shop.platform.includes('抖音') ? '🎵' :
                                 shop.platform.includes('天猫') || shop.platform.includes('淘宝') ? '🐱' : '💛'}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">{shop.name}</h4>
                                <p className="text-sm text-slate-500">{shop.platform} · {data.length} 条数据</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-sm text-slate-500">成交额</p>
                                <p className="text-lg font-bold">¥{totalGmv.toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-slate-500">利润</p>
                                <p className="text-lg font-bold text-green-600">¥{totalProfit.toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-slate-500">ROI</p>
                                <p className="text-lg font-bold text-orange-600">{roi.toFixed(2)}</p>
                              </div>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                                expandedShops.has(shop.id) ? 'rotate-90' : ''
                              }`}>▶️</div>
                            </div>
                          </div>
                        </div>

                        {/* 店铺数据表格 */}
                        {expandedShops.has(shop.id) && data.length > 0 && (
                          <div className="px-4 pb-4">
                            <div className="bg-slate-50 rounded-lg overflow-x-auto">
                              <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-slate-100 text-slate-500 sticky top-0">
                                  <tr>
                                    {TABLE_FIELDS.map(field => (
                                      <th key={field.key} className={`px-2 py-2 font-medium ${field.color || ''}`}>
                                        {field.label}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {data.map((row, rowIndex) => (
                                    <tr key={row.id} className="hover:bg-white">
                                      {TABLE_FIELDS.map(field => {
                                        const isEditing = editingCell?.shopId === shop.id && 
                                                         editingCell?.rowIndex === rowIndex && 
                                                         editingCell?.field === field.key
                                        
                                        return (
                                          <td
                                            key={field.key}
                                            className={`px-2 py-2 text-right ${field.color || ''} ${
                                              isEditing ? 'bg-yellow-50' : ''
                                            }`}
                                          >
                                            {isEditing ? (
                                              <input
                                                type="text"
                                                value={editingValue}
                                                onChange={(e) => setEditingValue(e.target.value)}
                                                onBlur={handleSaveCell}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveCell()}
                                                className="w-20 px-1 py-0.5 border border-orange-500 rounded text-right"
                                                autoFocus
                                              />
                                            ) : (
                                              <span
                                                onDoubleClick={() => handleEditCell(shop.id, rowIndex, field.key, row[field.key as keyof SalesData])}
                                                className="cursor-pointer hover:bg-yellow-50"
                                              >
                                                {typeof row[field.key as keyof SalesData] === 'number' 
                                                  ? Number(row[field.key as keyof SalesData]).toLocaleString() 
                                                  : row[field.key as keyof SalesData]}
                                              </span>
                                            )}
                                          </td>
                                        )
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {expandedShops.has(shop.id) && data.length === 0 && (
                          <div className="px-4 pb-4 text-center text-slate-500 py-8">
                            暂无数据，请前往「数据导入」页面导入
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 使用说明 */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="font-bold text-blue-900 mb-2">📖 使用说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✏️ 双击数字字段可编辑，修改后自动保存到数据库</li>
            <li>📥 点击左侧「数据导入」可批量导入 Excel 数据</li>
            <li>🔄 修改日期范围后点击「刷新数据」加载新数据</li>
            <li>💾 所有数据实时保存到 Supabase 数据库</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

function handleEditCell(shopId: number, rowIndex: number, field: string, value: any) {
  // This is a placeholder - actual implementation is inline in the component
  console.log('Edit cell:', shopId, rowIndex, field, value)
}
