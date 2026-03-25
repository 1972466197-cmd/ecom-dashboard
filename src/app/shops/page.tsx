'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface SalesData {
  id: number
  shop_id: number
  date: string
  pay_amount: number
  pay_orders: number
  ad_cost_total: number
  net_profit: number
  gross_profit: number
  total_cost: number
  logistics_fee: number
  platform_fee: number
  labor_cost: number
  return_cost: number
  fake_orders_amount: number
  fake_orders_count: number
  commission: number
  refund_amount: number
}

interface ShopGroup {
  id: number
  name: string
  leader_name: string
}

interface Shop {
  id: number
  name: string
  platform: string
  group_id: number
}

type DateRangeType = '1day' | '7days' | '14days' | 'custom'
type SelectionType = 'all' | 'group' | 'shop'

export default function ShopDailyProfit() {
  const router = useRouter()
  
  // 筛选状态
  const [selectionType, setSelectionType] = useState<SelectionType>('all')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [shopSearch, setShopSearch] = useState<string>('')
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('7days')
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  
  // 数据状态
  const [groups, setGroups] = useState<ShopGroup[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // 计算日期范围
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

  // 加载店铺和分组
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载分组
        const { data: groupsData } = await supabase
          .from('shop_groups')
          .select('*')
          .order('sort_order')
        
        if (groupsData) setGroups(groupsData)

        // 加载店铺
        const { data: shopsData } = await supabase
          .from('shops')
          .select('*')
          .order('name')
        
        if (shopsData) setShops(shopsData)
      } catch (err) {
        console.error('加载数据失败:', err)
      }
    }
    loadData()
  }, [])

  // 加载销售数据
  useEffect(() => {
    loadSalesData()
  }, [selectionType, selectedGroup, selectedShop, dateRangeType, customDateRange])

  const loadSalesData = async () => {
    setLoading(true)
    try {
      const { start, end } = getDateRange()
      
      let query = supabase
        .from('sales_data')
        .select('*')
        .gte('date', start)
        .lte('date', end)
      
      if (selectionType === 'shop' && selectedShop) {
        query = query.eq('shop_id', selectedShop)
      } else if (selectionType === 'group' && selectedGroup) {
        // 获取该分组下的所有店铺 ID
        const groupShopIds = shops.filter(s => s.group_id.toString() === selectedGroup).map(s => s.id)
        if (groupShopIds.length > 0) {
          query = query.in('shop_id', groupShopIds)
        } else {
          setSalesData([])
          setLoading(false)
          return
        }
      }
      // selectionType === 'all' 时不加 shop_id 条件
      
      const { data, error } = await query.order('date', { ascending: false })
      
      if (error) throw error
      setSalesData(data || [])
    } catch (err: any) {
      console.error('加载销售数据失败:', err)
      setSalesData([])
    } finally {
      setLoading(false)
    }
  }

  // 筛选店铺（用于搜索）
  const filteredShops = shopSearch
    ? shops.filter(s => s.name.toLowerCase().includes(shopSearch.toLowerCase()))
    : shops

  // 筛选店铺（用于小组选择）
  const groupFilteredShops = selectedGroup
    ? shops.filter(s => s.group_id.toString() === selectedGroup)
    : shops

  // 计算汇总数据
  const totalSales = salesData.reduce((sum, d) => sum + (d.pay_amount || 0), 0)
  const totalOrders = salesData.reduce((sum, d) => sum + (d.pay_orders || 0), 0)
  const totalCost = salesData.reduce((sum, d) => sum + (d.total_cost || 0), 0)
  const totalFakeAmount = salesData.reduce((sum, d) => sum + (d.fake_orders_amount || 0), 0)
  const totalFakeOrders = salesData.reduce((sum, d) => sum + (d.fake_orders_count || 0), 0)
  const totalCommission = salesData.reduce((sum, d) => sum + (d.commission || 0), 0)
  const totalRefund = salesData.reduce((sum, d) => sum + (d.refund_amount || 0), 0)
  const totalReturnCost = salesData.reduce((sum, d) => sum + (d.return_cost || 0), 0)
  const totalAdCost = salesData.reduce((sum, d) => sum + (d.ad_cost_total || 0), 0)
  const totalLogistics = salesData.reduce((sum, d) => sum + (d.logistics_fee || 0), 0)
  const totalPlatformFee = salesData.reduce((sum, d) => sum + (d.platform_fee || 0), 0)
  const totalLabor = salesData.reduce((sum, d) => sum + (d.labor_cost || 0), 0)
  const totalProfit = salesData.reduce((sum, d) => sum + (d.net_profit || 0), 0)
  const totalGrossProfit = salesData.reduce((sum, d) => sum + (d.gross_profit || 0), 0)

  // 计算比率
  const roi = totalAdCost > 0 ? (totalSales / totalAdCost).toFixed(2) : '0.00'
  const grossMargin = totalSales > 0 ? ((totalGrossProfit / totalSales) * 100).toFixed(1) : '0.0'
  const refundRate = totalSales > 0 ? ((totalRefund / totalSales) * 100).toFixed(1) : '0.0'

  // 按日期分组汇总
  const dailyData = salesData.reduce((acc, d) => {
    const date = d.date
    if (!acc[date]) {
      acc[date] = {
        date,
        sales: 0,
        orders: 0,
        cost: 0,
        fakeAmount: 0,
        fakeOrders: 0,
        commission: 0,
        refund: 0,
        returnCost: 0,
        adCost: 0,
        logistics: 0,
        platformFee: 0,
        labor: 0,
        profit: 0,
        grossProfit: 0
      }
    }
    acc[date].sales += d.pay_amount || 0
    acc[date].orders += d.pay_orders || 0
    acc[date].cost += d.total_cost || 0
    acc[date].fakeAmount += d.fake_orders_amount || 0
    acc[date].fakeOrders += d.fake_orders_count || 0
    acc[date].commission += d.commission || 0
    acc[date].refund += d.refund_amount || 0
    acc[date].returnCost += d.return_cost || 0
    acc[date].adCost += d.ad_cost_total || 0
    acc[date].logistics += d.logistics_fee || 0
    acc[date].platformFee += d.platform_fee || 0
    acc[date].labor += d.labor_cost || 0
    acc[date].profit += d.net_profit || 0
    acc[date].grossProfit += d.gross_profit || 0
    return acc
  }, {} as any)

  const dailyList = Object.values(dailyData).sort((a: any, b: any) => 
    b.date.localeCompare(a.date)
  )

  const { start, end } = getDateRange()
  const dayCount = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000)) + 1

  // 获取当前选择的标题
  const getSelectionTitle = () => {
    if (selectionType === 'all') return '全部店铺'
    if (selectionType === 'group' && selectedGroup) {
      const group = groups.find(g => g.id.toString() === selectedGroup)
      return group?.name || '未知分组'
    }
    if (selectionType === 'shop' && selectedShop) {
      const shop = shops.find(s => s.id.toString() === selectedShop)
      return shop?.name || '未知店铺'
    }
    return '请选择'
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
          <a href="/sales" className="block py-2 px-4 hover:bg-slate-800 rounded">🏪 店铺销售情况</a>
          <a href="/import" className="block py-2 px-4 hover:bg-slate-800 rounded">📥 数据导入</a>
          <a href="/analysis" className="block py-2 px-4 hover:bg-slate-800 rounded">📈 商品分析</a>
          <a href="/shops" className="block py-2 px-4 bg-slate-800 rounded">📈 店铺每日盈亏</a>
          <a href="/profit" className="block py-2 px-4 hover:bg-slate-800 rounded">💰 利润监控</a>
          <a href="/settings" className="block py-2 px-4 hover:bg-slate-800 rounded">⚙️ 系统设置</a>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-8">
        {/* 头部 */}
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">← 返回</button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">📈 店铺每日盈亏</h1>
              <p className="text-slate-500 mt-1">
                查看店铺每日经营利润和成本明细
                <span className="ml-2 text-xs text-blue-600">💡 数据来自「销售数据模板」或「店铺日概况报表」导入</span>
              </p>
            </div>
          </div>
        </header>

        {/* 筛选栏 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* 选择类型 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">查看范围</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectionType('all'); setSelectedGroup(''); setSelectedShop(''); }}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                    selectionType === 'all'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  全部店铺
                </button>
                <button
                  onClick={() => { setSelectionType('group'); setSelectedShop(''); }}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                    selectionType === 'group'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  按分组
                </button>
                <button
                  onClick={() => { setSelectionType('shop'); setSelectedGroup(''); }}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                    selectionType === 'shop'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  按店铺
                </button>
              </div>
            </div>

            {/* 分组选择 */}
            {selectionType === 'group' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">选择小组</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">请选择小组</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 店铺选择 + 搜索 */}
            {selectionType === 'shop' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">搜索店铺</label>
                <input
                  type="text"
                  value={shopSearch}
                  onChange={(e) => setShopSearch(e.target.value)}
                  placeholder="输入店铺名称搜索..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            {selectionType === 'shop' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">选择店铺</label>
                <select
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">请选择店铺</option>
                  {filteredShops.map(shop => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name} ({shop.platform})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 日期范围 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">日期范围</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDateRangeType('1day')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                    dateRangeType === '1day'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  1 天
                </button>
                <button
                  onClick={() => setDateRangeType('7days')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                    dateRangeType === '7days'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  7 天
                </button>
                <button
                  onClick={() => setDateRangeType('14days')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                    dateRangeType === '14days'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  14 天
                </button>
              </div>
            </div>

            {/* 自定义日期 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">自定义日期</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => {
                    setCustomDateRange({ ...customDateRange, start: e.target.value })
                    setDateRangeType('custom')
                  }}
                  className="flex-1 px-2 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <span className="text-slate-400">至</span>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => {
                    setCustomDateRange({ ...customDateRange, end: e.target.value })
                    setDateRangeType('custom')
                  }}
                  className="flex-1 px-2 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* 当前选择显示 */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>📊 当前查看：</span>
            <span className="font-bold text-orange-600">{getSelectionTitle()}</span>
            <span>·</span>
            <span>{dayCount}天</span>
            <span>·</span>
            <span>{start} 至 {end}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-slate-500">加载中...</p>
          </div>
        ) : salesData.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-slate-500 mb-4">暂无数据</p>
            <button
              onClick={() => router.push('/import')}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              去导入数据
            </button>
          </div>
        ) : (
          <>
            {/* 汇总卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">销售额</p>
                <p className="text-xl font-bold text-slate-900 mt-1">¥{(totalSales / 10000).toFixed(2)}万</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">订单量</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{totalOrders}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">成本</p>
                <p className="text-xl font-bold text-red-600 mt-1">¥{(totalCost / 10000).toFixed(2)}万</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">刷单金额</p>
                <p className="text-xl font-bold text-orange-600 mt-1">¥{(totalFakeAmount / 10000).toFixed(2)}万</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">刷单量</p>
                <p className="text-xl font-bold text-orange-600 mt-1">{totalFakeOrders}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">刷单佣金</p>
                <p className="text-xl font-bold text-orange-600 mt-1">¥{(totalCommission / 10000).toFixed(2)}万</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">退款金额</p>
                <p className="text-xl font-bold text-red-600 mt-1">¥{(totalRefund / 10000).toFixed(2)}万</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">退回成本</p>
                <p className="text-xl font-bold text-red-600 mt-1">¥{(totalReturnCost / 10000).toFixed(2)}万</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">推广费</p>
                <p className="text-xl font-bold text-orange-600 mt-1">¥{(totalAdCost / 10000).toFixed(2)}万</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">运费</p>
                <p className="text-xl font-bold text-slate-700 mt-1">¥{(totalLogistics / 10000).toFixed(2)}万</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">平台服务费</p>
                <p className="text-xl font-bold text-slate-700 mt-1">¥{(totalPlatformFee / 10000).toFixed(2)}万</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">人工场地费</p>
                <p className="text-xl font-bold text-slate-700 mt-1">¥{(totalLabor / 10000).toFixed(2)}万</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">ROI</p>
                <p className="text-xl font-bold text-orange-600 mt-1">{roi}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">毛利率</p>
                <p className="text-xl font-bold text-green-600 mt-1">{grossMargin}%</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">退货率</p>
                <p className="text-xl font-bold text-red-600 mt-1">{refundRate}%</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs">利润</p>
                <p className={`text-xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{(totalProfit / 10000).toFixed(2)}万
                </p>
              </div>
            </div>

            {/* 数据明细表 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">📋 每日数据明细（{dayCount}天）</h2>
                <p className="text-sm text-slate-500">{start} 至 {end}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">日期</th>
                      <th className="px-4 py-3 text-right">销售额</th>
                      <th className="px-4 py-3 text-right">订单量</th>
                      <th className="px-4 py-3 text-right">成本</th>
                      <th className="px-4 py-3 text-right">刷单金额</th>
                      <th className="px-4 py-3 text-right">刷单量</th>
                      <th className="px-4 py-3 text-right">刷单佣金</th>
                      <th className="px-4 py-3 text-right">退款金额</th>
                      <th className="px-4 py-3 text-right">退回成本</th>
                      <th className="px-4 py-3 text-right">推广费</th>
                      <th className="px-4 py-3 text-right">运费</th>
                      <th className="px-4 py-3 text-right">平台费</th>
                      <th className="px-4 py-3 text-right">人工费</th>
                      <th className="px-4 py-3 text-right">ROI</th>
                      <th className="px-4 py-3 text-right">毛利率</th>
                      <th className="px-4 py-3 text-right">退货率</th>
                      <th className="px-4 py-3 text-right">利润</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyList.map((day: any) => {
                      const dayRoi = day.adCost > 0 ? (day.sales / day.adCost).toFixed(2) : '0.00'
                      const dayGrossMargin = day.sales > 0 ? ((day.grossProfit / day.sales) * 100).toFixed(1) : '0.0'
                      const dayRefundRate = day.orders > 0 ? ((day.refund / day.sales) * 100).toFixed(1) : '0.0'
                      
                      return (
                        <tr key={day.date} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{day.date}</td>
                          <td className="px-4 py-3 text-right text-slate-700">¥{(day.sales / 10000).toFixed(2)}万</td>
                          <td className="px-4 py-3 text-right text-slate-700">{day.orders}</td>
                          <td className="px-4 py-3 text-right text-red-600">¥{(day.cost / 10000).toFixed(2)}万</td>
                          <td className="px-4 py-3 text-right text-orange-600">¥{(day.fakeAmount / 10000).toFixed(2)}万</td>
                          <td className="px-4 py-3 text-right text-orange-600">{day.fakeOrders}</td>
                          <td className="px-4 py-3 text-right text-orange-600">¥{(day.commission / 10000).toFixed(2)}万</td>
                          <td className="px-4 py-3 text-right text-red-600">¥{(day.refund / 10000).toFixed(2)}万</td>
                          <td className="px-4 py-3 text-right text-red-600">¥{(day.returnCost / 10000).toFixed(2)}万</td>
                          <td className="px-4 py-3 text-right text-orange-600">¥{(day.adCost / 10000).toFixed(2)}万</td>
                          <td className="px-4 py-3 text-right text-slate-700">¥{(day.logistics / 10000).toFixed(2)}万</td>
                          <td className="px-4 py-3 text-right text-slate-700">¥{(day.platformFee / 10000).toFixed(2)}万</td>
                          <td className="px-4 py-3 text-right text-slate-700">¥{(day.labor / 10000).toFixed(2)}万</td>
                          <td className="px-4 py-3 text-right text-orange-600">{dayRoi}</td>
                          <td className="px-4 py-3 text-right text-green-600">{dayGrossMargin}%</td>
                          <td className="px-4 py-3 text-right text-red-600">{dayRefundRate}%</td>
                          <td className={`px-4 py-3 text-right font-medium ${day.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ¥{(day.profit / 10000).toFixed(2)}万
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
