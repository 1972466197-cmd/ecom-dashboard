'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase, saveSalesData, saveMarketingData, loadSalesData, loadMarketingData } from '@/lib/supabase-data'

interface SalesRecord {
  id?: number
  shop_name: string
  platform: string
  date: string
  sales_amount: number
  order_count: number
  refund_amount: number
  ad_cost: number
  created_at?: string
  updated_at?: string
}

export default function SalesSupabase() {
  const [records, setRecords] = useState<SalesRecord[]>([])
  const [selectedShop, setSelectedShop] = useState('淘宝楠箐')
  const [formData, setFormData] = useState<Partial<SalesRecord>>({
    date: new Date().toISOString().split('T')[0],
    sales_amount: 0,
    order_count: 0,
    refund_amount: 0,
    ad_cost: 0
  })
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      const [salesData, marketingData] = await Promise.all([
        loadSalesData(selectedShop),
        loadMarketingData(selectedShop)
      ])
      
      // 合并数据
      const merged = salesData.map(sale => {
        const marketing = marketingData.find(m => m.date === sale.date)
        return {
          ...sale,
          ad_cost: marketing?.total_spend || 0
        }
      })
      
      setRecords(merged)
    } catch (error) {
      console.error('加载数据失败:', error)
      showToast('加载数据失败', 'error')
    }
  }, [selectedShop, showToast])

  useEffect(() => {
    loadData()
  }, [loadData, refreshKey])

  // 保存数据（使用 upsert 去重）
  const handleSave = async () => {
    if (!formData.date || !formData.shop_name) {
      showToast('请填写完整信息', 'error')
      return
    }

    setIsSaving(true)
    try {
      // 保存销售数据
      await saveSalesData(formData.shop_name || selectedShop, formData.date!, {
        sales_amount: formData.sales_amount || 0,
        order_count: formData.order_count || 0,
        refund_amount: formData.refund_amount || 0,
        platform: selectedShop.includes('抖音') ? 'douyin' : 'taobao'
      })

      // 保存推广数据
      await saveMarketingData(formData.shop_name || selectedShop, formData.date!, {
        taobao_ztc_spend: selectedShop.includes('淘宝') ? (formData.ad_cost || 0) : 0,
        douyin_qc_spend: selectedShop.includes('抖音') ? (formData.ad_cost || 0) : 0,
        platform: selectedShop.includes('抖音') ? 'douyin' : 'taobao'
      })

      showToast('数据已保存到 Supabase！✅', 'success')
      
      // 自动刷新图表
      setRefreshKey(prev => prev + 1)
      
      // 清空表单
      setFormData({
        date: new Date().toISOString().split('T')[0],
        sales_amount: 0,
        order_count: 0,
        refund_amount: 0,
        ad_cost: 0
      })
    } catch (error) {
      console.error('保存失败:', error)
      showToast('保存失败，请重试', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const shops = ['淘宝楠箐', '宝怡城', '大福银饰', '抖音楠箐', '抖音心宿']

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
          <a href="/sales" className="block py-2 px-4 bg-slate-800 rounded">🏪 店铺销售（Supabase）</a>
          <a href="/profit" className="block py-2 px-4 hover:bg-slate-800 rounded">💰 利润监控</a>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">📝 销售数据录入（Supabase）</h1>
          <p className="text-slate-500 mt-1">数据保存到 Supabase，同一天 + 同一店铺自动覆盖更新</p>
        </header>

        {/* 表单 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
          <h2 className="font-bold text-slate-800 mb-4">录入数据</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">店铺</label>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                {shops.map(shop => (
                  <option key={shop} value={shop}>{shop}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">日期</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">销售金额</label>
              <input
                type="number"
                value={formData.sales_amount}
                onChange={(e) => setFormData({ ...formData, sales_amount: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">订单数</label>
              <input
                type="number"
                value={formData.order_count}
                onChange={(e) => setFormData({ ...formData, order_count: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">退款金额</label>
              <input
                type="number"
                value={formData.refund_amount}
                onChange={(e) => setFormData({ ...formData, refund_amount: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">推广费用</label>
              <input
                type="number"
                value={formData.ad_cost}
                onChange={(e) => setFormData({ ...formData, ad_cost: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="0"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? '💾 保存中...' : '💾 保存到 Supabase'}
          </button>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">销售数据</h2>
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              🔄 刷新
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">日期</th>
                  <th className="px-3 py-2 font-medium">店铺</th>
                  <th className="px-3 py-2 font-medium text-right">销售金额</th>
                  <th className="px-3 py-2 font-medium text-right">订单数</th>
                  <th className="px-3 py-2 font-medium text-right">退款金额</th>
                  <th className="px-3 py-2 font-medium text-right">推广费</th>
                  <th className="px-3 py-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center text-slate-500">
                      暂无数据，请点击上方表单添加
                    </td>
                  </tr>
                ) : (
                  records.map((record, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2">{record.date}</td>
                      <td className="px-3 py-2 font-medium">{record.shop_name}</td>
                      <td className="px-3 py-2 text-right">¥{record.sales_amount?.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{record.order_count?.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-red-600">¥{record.refund_amount?.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-orange-600">¥{record.ad_cost?.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          ✅ 已同步
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="font-bold text-blue-900 mb-2">💡 Supabase 保存说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ <strong>自动去重</strong>：同一天 + 同一个店铺的数据会自动覆盖更新，不会重复</li>
            <li>🟢 <strong>绿色提示</strong>：保存成功后显示绿色提示框</li>
            <li>🔄 <strong>自动刷新</strong>：保存成功后自动刷新下方数据表格</li>
            <li>💾 <strong>持久化存储</strong>：数据保存在 Supabase，刷新页面不丢失</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
