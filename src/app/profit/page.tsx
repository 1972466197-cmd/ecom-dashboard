'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import { supabase } from '@/lib/supabase-data'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)



interface DailyProfit {
  shop_name: string
  platform: string
  date: string
  gross_sales: number
  net_sales: number
  total_refunds: number
  product_cost: number
  shipping_cost: number
  total_marketing: number
  taobao_ztc_spend: number
  douyin_qc_spend: number
  total_cost: number
  net_profit: number
  gross_margin_rate: number
  net_margin_rate: number
  roi: number
  break_even_roi: number
  is_below_break_even: boolean
}

interface ProfitAlert {
  id: number
  shop_name: string
  date: string
  alert_type: string
  alert_level: string
  current_value: number
  threshold_value: number
  message: string
  is_resolved: boolean
  created_at: string
}

export default function ProfitMonitor() {
  const [profitData, setProfitData] = useState<DailyProfit[]>([])
  const [alerts, setAlerts] = useState<ProfitAlert[]>([])
  const [selectedShop, setSelectedShop] = useState<string>('全部店铺')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'trend' | 'alerts' | 'detail'>('trend')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0) // 用于强制刷新图表

  // 显示提示框
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // 加载利润数据
  const loadProfitData = useCallback(async () => {
    try {
      let query = supabase
        .from('daily_profit_view')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)

      if (selectedShop !== '全部店铺') {
        query = query.eq('shop_name', selectedShop)
      }

      if (dateRange.start) {
        query = query.gte('date', dateRange.start)
      }
      if (dateRange.end) {
        query = query.lte('date', dateRange.end)
      }

      const { data, error } = await query
      if (error) throw error
      setProfitData(data || [])
    } catch (error) {
      console.error('加载利润数据失败:', error)
      showToast('加载数据失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [selectedShop, dateRange, showToast])

  const loadAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profit_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setAlerts(data || [])
    } catch (error) {
      console.error('加载预警失败:', error)
    }
  }, [])

  useEffect(() => {
    loadProfitData()
    loadAlerts()
  }, [loadProfitData, loadAlerts, refreshKey])

  const resolveAlert = async (alertId: number) => {
    try {
      await supabase
        .from('profit_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId)
      loadAlerts()
      showToast('预警已解决', 'success')
    } catch (error) {
      showToast('解决预警失败', 'error')
    }
  }

  // 强制刷新图表
  const refreshCharts = () => {
    setRefreshKey(prev => prev + 1)
    loadProfitData()
    loadAlerts()
    showToast('数据已更新', 'success')
  }

  // 计算汇总数据
  const summary = {
    totalSales: profitData.reduce((sum, d) => sum + d.net_sales, 0),
    totalProfit: profitData.reduce((sum, d) => sum + d.net_profit, 0),
    avgMargin: profitData.length > 0 
      ? profitData.reduce((sum, d) => sum + d.gross_margin_rate, 0) / profitData.length 
      : 0,
    avgRoi: profitData.length > 0 
      ? profitData.reduce((sum, d) => sum + d.roi, 0) / profitData.length 
      : 0,
    alertCount: alerts.filter(a => !a.is_resolved).length,
    criticalCount: alerts.filter(a => !a.is_resolved && a.alert_level === 'critical').length
  }

  // 趋势图数据
  const trendData = {
    labels: profitData.slice(0, 15).map(d => d.date).reverse(),
    datasets: [
      {
        label: '净利润',
        data: profitData.slice(0, 15).map(d => d.net_profit).reverse(),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        yAxisID: 'y'
      },
      {
        label: '毛利率 (%)',
        data: profitData.slice(0, 15).map(d => d.gross_margin_rate).reverse(),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        yAxisID: 'y1'
      },
      {
        label: 'ROI',
        data: profitData.slice(0, 15).map(d => d.roi).reverse(),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: false,
        yAxisID: 'y1'
      }
    ]
  }

  const trendOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: '金额 (¥)' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: '比率' },
        grid: { drawOnChartArea: false }
      }
    }
  }

  // 推广消耗对比数据
  const marketingData = {
    labels: profitData.slice(0, 15).map(d => d.date).reverse(),
    datasets: [
      {
        label: '淘宝直通车',
        data: profitData.slice(0, 15).map(d => d.taobao_ztc_spend).reverse(),
        backgroundColor: 'rgb(255, 140, 0)'
      },
      {
        label: '抖音千川',
        data: profitData.slice(0, 15).map(d => d.douyin_qc_spend).reverse(),
        backgroundColor: 'rgb(0, 0, 0)'
      }
    ]
  }

  const shops = ['全部店铺', ...new Set(profitData.map(d => d.shop_name))]

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-slate-500">正在加载利润数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Toast 提示框 */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white animate-pulse`}>
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
          <a href="/shops" className="block py-2 px-4 hover:bg-slate-800 rounded">📈 店铺每日盈亏</a>
          <a href="/profit" className="block py-2 px-4 bg-slate-800 rounded">💰 利润监控</a>
          <a href="/settings" className="block py-2 px-4 hover:bg-slate-800 rounded">⚙️ 系统设置</a>
        </nav>

        {/* 预警提示 */}
        {summary.criticalCount > 0 && (
          <div className="mt-6 bg-red-500 rounded-lg p-4 animate-pulse">
            <p className="font-bold">⚠️ 严重预警</p>
            <p className="text-sm mt-1">{summary.criticalCount} 个店铺 ROI 低于损益平衡点</p>
          </div>
        )}
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-8">
        {/* 头部 */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">💰 利润监控中心</h1>
              <p className="text-slate-500 mt-1">实时监控淘宝直通车和抖音千川的利润表现</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={refreshCharts}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                🔄 刷新数据
              </button>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg"
              >
                {shops.map(shop => (
                  <option key={shop} value={shop}>{shop}</option>
                ))}
              </select>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="开始日期"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="结束日期"
              />
            </div>
          </div>
        </header>

        {/* 汇总卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">总销售额</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">¥{(summary.totalSales / 10000).toFixed(1)}万</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">总净利润</p>
            <p className={`text-2xl font-bold mt-1 ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ¥{(summary.totalProfit / 10000).toFixed(1)}万
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">平均毛利率</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{summary.avgMargin.toFixed(1)}%</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">平均 ROI</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{summary.avgRoi.toFixed(2)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">预警数量</p>
            <p className={`text-2xl font-bold mt-1 ${summary.alertCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.alertCount}
            </p>
            {summary.criticalCount > 0 && (
              <p className="text-xs text-red-600 mt-1">{summary.criticalCount} 个严重</p>
            )}
          </div>
        </div>

        {/* 标签页 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('trend')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'trend' 
                  ? 'text-orange-600 border-b-2 border-orange-500' 
                  : 'text-slate-600'
              }`}
            >
              📈 利润趋势
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'alerts' 
                  ? 'text-orange-600 border-b-2 border-orange-500' 
                  : 'text-slate-600'
              }`}
            >
              🔔 预警中心
              {summary.alertCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {summary.alertCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('detail')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'detail' 
                  ? 'text-orange-600 border-b-2 border-orange-500' 
                  : 'text-slate-600'
              }`}
            >
              📊 详细数据
            </button>
          </div>

          <div className="p-6">
            {/* 利润趋势图 */}
            {activeTab === 'trend' && (
              <div>
                <h3 className="font-bold text-slate-800 mb-4">每日净利润 & 毛利率趋势</h3>
                <div className="h-96">
                  <Line data={trendData} options={trendOptions} />
                </div>

                <h3 className="font-bold text-slate-800 mb-4 mt-8">推广消耗对比</h3>
                <div className="h-64">
                  <Bar data={marketingData} options={{ responsive: true }} />
                </div>
              </div>
            )}

            {/* 预警中心 */}
            {activeTab === 'alerts' && (
              <div>
                <h3 className="font-bold text-slate-800 mb-4">未解决预警</h3>
                {alerts.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="text-6xl mb-4">✅</div>
                    <p>暂无预警，所有指标正常</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          alert.alert_level === 'critical'
                            ? 'bg-red-50 border-red-500'
                            : 'bg-yellow-50 border-yellow-500'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                alert.alert_type === 'low_roi' ? 'bg-orange-100 text-orange-700' :
                                alert.alert_type === 'negative_profit' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {alert.alert_type === 'low_roi' ? 'ROI 过低' :
                                 alert.alert_type === 'negative_profit' ? '净利润为负' :
                                 '毛利率过低'}
                              </span>
                              <span className={`text-xs ${
                                alert.alert_level === 'critical' ? 'text-red-600 font-bold' : 'text-yellow-600'
                              }`}>
                                {alert.alert_level === 'critical' ? '🔴 严重' : '🟡 警告'}
                              </span>
                            </div>
                            <p className="text-slate-800 font-medium mt-2">{alert.message}</p>
                            <p className="text-sm text-slate-500 mt-1">
                              当前值：{alert.current_value?.toFixed(2)} | 阈值：{alert.threshold_value?.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(alert.created_at).toLocaleString('zh-CN')}
                            </p>
                          </div>
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                          >
                            标记为已解决
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 详细数据表 */}
            {activeTab === 'detail' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">日期</th>
                      <th className="px-3 py-2 font-medium">店铺</th>
                      <th className="px-3 py-2 font-medium text-right">销售额</th>
                      <th className="px-3 py-2 font-medium text-right">产品成本</th>
                      <th className="px-3 py-2 font-medium text-right">直通车</th>
                      <th className="px-3 py-2 font-medium text-right">千川</th>
                      <th className="px-3 py-2 font-medium text-right">总推广</th>
                      <th className="px-3 py-2 font-medium text-right">净利润</th>
                      <th className="px-3 py-2 font-medium text-right">毛利率</th>
                      <th className="px-3 py-2 font-medium text-right">ROI</th>
                      <th className="px-3 py-2 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profitData.map((row, i) => (
                      <tr key={i} className={`hover:bg-slate-50 ${row.is_below_break_even ? 'bg-red-50' : ''}`}>
                        <td className="px-3 py-2">{row.date}</td>
                        <td className="px-3 py-2 font-medium">{row.shop_name}</td>
                        <td className="px-3 py-2 text-right">¥{row.net_sales.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">¥{row.product_cost.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-orange-600">¥{row.taobao_ztc_spend.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">¥{row.douyin_qc_spend.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-medium">¥{row.total_marketing.toLocaleString()}</td>
                        <td className={`px-3 py-2 text-right font-bold ${row.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ¥{row.net_profit.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right text-blue-600">{row.gross_margin_rate.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-right text-orange-600">{row.roi.toFixed(2)}</td>
                        <td className="px-3 py-2">
                          {row.is_below_break_even ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">⚠️ 低于盈亏平衡</span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">✅ 正常</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="font-bold text-blue-900 mb-2">💡 利润监控说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>📊 <strong>净利润</strong> = 销售额 - 产品成本 - 快递费 - 推广费 - 平台扣点 (5%) - 税费 (3%)</li>
            <li>💰 <strong>毛利率</strong> = (销售额 - 产品成本 - 快递费) / 销售额 × 100%</li>
            <li>📈 <strong>ROI</strong> = 销售额 / 推广总消耗</li>
            <li>⚠️ <strong>损益平衡点</strong> = 1 / (毛利率 - 其他费用率) ≈ 3.7</li>
            <li>🔴 <strong>红色高亮</strong> = ROI 低于损益平衡点，需要优化推广策略</li>
            <li>🔔 <strong>预警中心</strong> = 自动监控 ROI、净利润、毛利率异常</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
