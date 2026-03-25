'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'
import { getAllShopData, calculateGrandTotal, onShopDataSync } from '@/lib/shop-data-sync'

// 类型定义
interface PlatformData {
  id: number
  name: string
  platform: string
  orders: number
  gmv: number
  adSpend: number
  profit: number
  status: 'healthy' | 'low-profit'
  statusLabel: string
}

interface MetricCardProps {
  title: string
  value: string
  change: string
  isPositive: boolean
  valueColor?: string
}

interface DashboardProps {
  lastSyncTime?: string
  onRefresh?: () => void
}

// 平台选项
const PLATFORM_OPTIONS = [
  { value: 'all', label: '全部平台' },
  { value: '天猫', label: '天猫' },
  { value: '拼多多', label: '拼多多' },
  { value: '抖音', label: '抖音' },
]

// 指标卡片组件
function MetricCard({ title, value, change, isPositive, valueColor = 'text-slate-900' }: MetricCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <p className="text-slate-500 text-sm font-semibold uppercase">{title}</p>
      <p className={`text-3xl font-bold ${valueColor} mt-2`}>{value}</p>
      <p className={`text-sm mt-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {change}
      </p>
    </div>
  )
}

// 状态标签组件
function StatusBadge({ status, label }: { status: 'healthy' | 'low-profit'; label: string }) {
  const styles = status === 'healthy' 
    ? 'bg-green-100 text-green-700' 
    : 'bg-red-100 text-red-700'
  
  return (
    <span className={`px-2 py-1 ${styles} rounded-full text-xs`}>
      {label}
    </span>
  )
}

// 模拟数据
const MOCK_DATA: PlatformData[] = [
  { id: 1, name: '天猫旗舰店', platform: '天猫', orders: 452, gmv: 68000, adSpend: 12000, profit: 25000, status: 'healthy', statusLabel: '健康' },
  { id: 2, name: '拼多多店', platform: '拼多多', orders: 891, gmv: 42450, adSpend: 5800, profit: 18000, status: 'healthy', statusLabel: '健康' },
  { id: 3, name: '抖音小店', platform: '抖音', orders: 124, gmv: 18000, adSpend: 9200, profit: 3500, status: 'low-profit', statusLabel: '利润偏低' },
]

// 主仪表盘组件
export default function Dashboard({ 
  lastSyncTime = '10:30 AM', 
  onRefresh 
}: DashboardProps) {
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ start: string | null, end: string | null }>({ start: null, end: null })
  const [selectedPreset, setSelectedPreset] = useState<number>(0)
  const [filteredData, setFilteredData] = useState<PlatformData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const pieChartRef = useRef<HTMLDivElement>(null)

  // 获取日期范围
  const getDateRange = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - DATE_PRESETS[selectedPreset].days)
    return {
      start: selectedPreset === 0 ? null : start.toISOString(),
      end: end.toISOString()
    }
  }

  // 从 localStorage 获取实时店铺数据
  useEffect(() => {
    const loadShopData = () => {
      const allShopData = getAllShopData()
      const shopNames = Object.keys(allShopData)
      
      if (shopNames.length > 0) {
        // 汇总所有店铺数据
        const aggregatedData = shopNames.map(shopName => {
          const data = allShopData[shopName]
          const summary = data.reduce((acc, row) => ({
            gmv: acc.gmv + (row.totalSales || 0),
            orders: acc.orders + (row.totalOrders || 0),
            adSpend: acc.adSpend + (row.adCost || 0),
            profit: acc.profit + (row.grossProfit || 0),
          }), { gmv: 0, orders: 0, adSpend: 0, profit: 0 })
          
          // 根据店铺名称判断平台
          let platform = '其他'
          if (shopName.includes('天猫') || shopName.includes('淘宝')) platform = '天猫'
          else if (shopName.includes('抖音')) platform = '抖音'
          else if (shopName.includes('京东')) platform = '京东'
          else if (shopName.includes('拼多多')) platform = '拼多多'
          
          return {
            id: Date.now() + Math.random(),
            name: shopName,
            platform,
            orders: summary.orders,
            gmv: summary.gmv,
            adSpend: summary.adSpend,
            profit: summary.profit,
            status: 'healthy' as const,
            statusLabel: '健康',
          }
        })
        
        // 筛选
        const filtered = platformFilter === 'all' 
          ? aggregatedData 
          : aggregatedData.filter(item => item.platform === platformFilter)
        
        setFilteredData(filtered)
      } else {
        // 没有店铺数据时使用模拟数据
        setFilteredData(MOCK_DATA.filter(item => 
          platformFilter === 'all' || item.platform === platformFilter
        ))
      }
      
      setIsLoading(false)
    }

    loadShopData()
    
    // 监听数据同步事件
    const unsubscribe = onShopDataSync(() => {
      loadShopData()
    })
    
    return () => unsubscribe()
  }, [platformFilter])

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      const { start, end } = getDateRange()
    }, 60000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, platformFilter, selectedPreset])

  // 初始化图表
  useEffect(() => {
    if (isLoading || !chartRef.current || !pieChartRef.current) return

    // 柱状图 - 各平台 GMV 对比
    const barChart = echarts.init(chartRef.current)
    const platformStats = filteredData.reduce((acc, item) => {
      if (!acc[item.platform]) {
        acc[item.platform] = { gmv: 0, orders: 0, profit: 0 }
      }
      acc[item.platform].gmv += item.gmv
      acc[item.platform].orders += item.orders
      acc[item.platform].profit += item.profit
      return acc
    }, {} as Record<string, { gmv: number; orders: number; profit: number }>)

    barChart.setOption({
      title: { text: '各平台 GMV 对比', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: Object.keys(platformStats)
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'GMV',
          type: 'bar',
          data: Object.values(platformStats).map(s => s.gmv),
          itemStyle: { color: '#f97316' }
        },
        {
          name: '订单数',
          type: 'bar',
          data: Object.values(platformStats).map(s => s.orders),
          itemStyle: { color: '#3b82f6' }
        }
      ]
    })

    // 饼图 - 利润分布
    const pieChart = echarts.init(pieChartRef.current)
    pieChart.setOption({
      title: { text: '利润分布', left: 'center' },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '50%',
        data: Object.entries(platformStats).map(([name, data]) => ({
          name,
          value: data.profit
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    })

    // 响应式调整
    const handleResize = () => {
      barChart.resize()
      pieChart.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      barChart.dispose()
      pieChart.dispose()
    }
  }, [filteredData, isLoading])

  // 计算汇总指标
  const totalGmv = filteredData.reduce((sum, item) => sum + (item.gmv || 0), 0)
  const totalOrders = filteredData.reduce((sum, item) => sum + (item.orders || 0), 0)
  const totalAdSpend = filteredData.reduce((sum, item) => sum + (item.adSpend || 0), 0)
  const totalProfit = filteredData.reduce((sum, item) => sum + (item.profit || (item.gmv - item.adSpend)), 0)
  const roi = totalAdSpend > 0 ? (totalGmv / totalAdSpend).toFixed(2) : '0.00'

  // 导出 Excel
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.map(item => ({
        '店铺名称': item.name,
        '平台': item.platform,
        '订单数': item.orders,
        'GMV': item.gmv,
        '广告支出': item.adSpend,
        '利润': item.profit,
        '状态': item.statusLabel
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '销售数据')
    XLSX.writeFile(workbook, `销售数据_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 侧边栏 */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <h2 className="text-2xl font-bold mb-8 text-orange-500">山麓众创科技</h2>
        <nav className="space-y-4">
          <a href="/" className="block py-2 px-4 bg-slate-800 rounded">📊 经营看板</a>
          <a href="/products" className="block py-2 px-4 hover:bg-slate-800 rounded">📦 商品管理</a>
          <a href="/sales" className="block py-2 px-4 hover:bg-slate-800 rounded">🏪 店铺销售情况</a>
          <a href="/shops" className="block py-2 px-4 hover:bg-slate-800 rounded">📈 店铺每日盈亏</a>
          <div>
            <a href="/wps" className="block py-2 px-4 hover:bg-slate-800 rounded mb-2">🔗 WPS 同步</a>
            <div className="ml-4 space-y-1">
              <a href="/wps/import" className="block py-1.5 px-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded">📥 导入文档</a>
              <a href="/wps" className="block py-1.5 px-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded">🔄 同步任务</a>
            </div>
          </div>
          <a href="/settings" className="block py-2 px-4 hover:bg-slate-800 rounded">⚙️ 系统设置</a>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-8">
        {/* 头部 */}
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">我的电商后台</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-500">
              最后同步时间：{lastSyncTime}
            </span>
            <button
              onClick={onRefresh}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 shadow-md transition-colors"
            >
              立即刷新
            </button>
          </div>
        </header>

        {/* 筛选控制栏 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* 平台筛选 */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">平台</label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 px-3 py-2"
              >
                {PLATFORM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 日期快捷选项 */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">日期范围</label>
              <div className="flex gap-2">
                {DATE_PRESETS.map((preset, index) => (
                  <button
                    key={preset.label}
                    onClick={() => setSelectedPreset(index)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedPreset === index
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 自动刷新 */}
            <div className="ml-auto flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                自动刷新 (1 分钟)
              </label>

              {/* 导出按钮 */}
              <button
                onClick={handleExport}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                📥 导出 Excel
              </button>
            </div>
          </div>
        </div>

        {/* 指标卡片 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <MetricCard
              title="总成交额 (GMV)"
              value={`¥ ${totalGmv.toLocaleString('zh-CN')}`}
              change="↑ 12% 较昨日"
              isPositive={true}
            />
            <MetricCard
              title="全店利润"
              value={`¥ ${totalProfit.toLocaleString('zh-CN')}`}
              change="↑ 5% 较昨日"
              isPositive={true}
              valueColor="text-orange-600"
            />
            <MetricCard
              title="综合 ROI"
              value={roi}
              change={parseFloat(roi) >= 3 ? "↑ 8% 较昨日" : "↓ 3% 较昨日"}
              isPositive={parseFloat(roi) >= 3}
            />
          </div>
        )}

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div ref={chartRef} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80"></div>
          <div ref={pieChartRef} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80"></div>
        </div>

        {/* 销售明细表格 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">多平台销售明细</h3>
            <span className="text-sm text-slate-500">
              共 {filteredData.length} 个店铺
            </span>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="h-4 bg-slate-200 rounded flex-1"></div>
                  <div className="h-4 bg-slate-200 rounded flex-1"></div>
                  <div className="h-4 bg-slate-200 rounded flex-1"></div>
                </div>
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              暂无数据
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                <tr>
                  <th className="px-6 py-4">平台</th>
                  <th className="px-6 py-4">订单数</th>
                  <th className="px-6 py-4">GMV</th>
                  <th className="px-6 py-4">投放支出</th>
                  <th className="px-6 py-4">利润</th>
                  <th className="px-6 py-4">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {item.name}
                    </td>
                    <td className="px-6 py-4">{item.orders}</td>
                    <td className="px-6 py-4">¥ {item.gmv.toLocaleString('zh-CN')}</td>
                    <td className="px-6 py-4">¥ {item.adSpend.toLocaleString('zh-CN')}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">
                      ¥ {item.profit.toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} label={item.statusLabel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

// 日期快捷选项
const DATE_PRESETS = [
  { label: '今日', days: 0 },
  { label: '近 7 天', days: 7 },
  { label: '近 30 天', days: 30 },
  { label: '近 90 天', days: 90 },
]
