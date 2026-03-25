'use client'

import React, { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { saveShopData } from '@/lib/shop-data-sync'

interface DailyData {
  id: number
  date: string
  selfSales: number
  selfOrders: number
  selfCost: number
  dropSales: number
  dropOrders: number
  dropCost: number
  totalSales: number
  totalOrders: number
  totalCost: number
  fakeSales: number
  fakeOrders: number
  fakeCommission: number
  refundAmount: number
  returnCost: number
  adCost: number
  shippingCost: number
  platformFee: number
  laborCost: number
  grossProfit: number
  roi: number
  returnRate: number
}

interface Shop {
  id: number
  name: string
  platform: string
  group: string
}

const SHOP_INFO: Record<string, Shop> = {
  '大福珠宝': { id: 1, name: '大福珠宝', platform: '天猫', group: '海林组' },
  '香港大福': { id: 2, name: '香港大福', platform: '抖音', group: '海林组' },
  '香港万达': { id: 3, name: '香港万达', platform: '天猫', group: '海林组' },
  '星悦芳': { id: 4, name: '星悦芳', platform: '天猫', group: '海林组' },
  '抖音安然': { id: 5, name: '抖音安然', platform: '抖音', group: '海林组' },
  '抖音后宫': { id: 6, name: '抖音后宫', platform: '抖音', group: '海林组' },
  '德国好物': { id: 7, name: '德国好物', platform: '天猫', group: '海林组' },
  '德国冠营': { id: 8, name: '德国冠营', platform: '天猫', group: '海林组' },
  '德国黑森林': { id: 9, name: '德国黑森林', platform: '京东', group: '海林组' },
  '淘宝楠箐': { id: 10, name: '淘宝楠箐', platform: '淘宝', group: '培君组' },
  '宝怡城': { id: 11, name: '宝怡城', platform: '天猫', group: '培君组' },
  '大福银饰': { id: 12, name: '大福银饰', platform: '天猫', group: '培君组' },
  '德国 kymy 家居生活馆': { id: 13, name: '德国 kymy 家居生活馆', platform: '天猫', group: '培君组' },
  '山居香铺': { id: 14, name: '山居香铺', platform: '抖音', group: '培君组' },
  '大福纯银': { id: 15, name: '大福纯银', platform: '天猫', group: '淑贞组' },
  '淘宝轻奢': { id: 16, name: '淘宝轻奢', platform: '淘宝', group: '淑贞组' },
  '淘宝汀禾': { id: 17, name: '淘宝汀禾', platform: '淘宝', group: '淑贞组' },
  '大福太古': { id: 18, name: '大福太古', platform: '天猫', group: '淑贞组' },
  '抖音楠箐': { id: 19, name: '抖音楠箐', platform: '抖音', group: '淑贞组' },
  '抖音心宿': { id: 20, name: '抖音心宿', platform: '抖音', group: '淑贞组' },
  '淘宝 VMVB 数码': { id: 21, name: '淘宝 VMVB 数码', platform: '淘宝', group: '淑贞组' },
  '德国精选': { id: 22, name: '德国精选', platform: '天猫', group: '淑贞组' },
  '大福小饰逅': { id: 23, name: '大福小饰逅', platform: '天猫', group: '淑贞组' },
  '天猫心宿': { id: 24, name: '天猫心宿', platform: '天猫', group: '敏贞组' },
  '大福万达': { id: 25, name: '大福万达', platform: '天猫', group: '敏贞组' },
  '淘宝百年': { id: 26, name: '淘宝百年', platform: '淘宝', group: '敏贞组' },
  '淘宝范琦': { id: 27, name: '淘宝范琦', platform: '淘宝', group: '敏贞组' },
  '抖音轻奢': { id: 28, name: '抖音轻奢', platform: '抖音', group: '敏贞组' },
}

const MOCK_DATA: DailyData[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 2, 23 - i)
  const selfSales = Math.floor(Math.random() * 50000) + 20000
  const dropSales = Math.floor(Math.random() * 30000) + 10000
  return {
    id: i + 1,
    date: date.toISOString().split('T')[0],
    selfSales,
    selfOrders: Math.floor(selfSales / 100),
    selfCost: Math.floor(selfSales * 0.35),
    dropSales,
    dropOrders: Math.floor(dropSales / 120),
    dropCost: Math.floor(dropSales * 0.4),
    totalSales: selfSales + dropSales,
    totalOrders: Math.floor(selfSales / 100) + Math.floor(dropSales / 120),
    totalCost: Math.floor(selfSales * 0.35) + Math.floor(dropSales * 0.4),
    fakeSales: Math.floor((selfSales + dropSales) * 0.05),
    fakeOrders: Math.floor((selfSales / 100 + dropSales / 120) * 0.05),
    fakeCommission: Math.floor((selfSales + dropSales) * 0.02),
    refundAmount: Math.floor((selfSales + dropSales) * 0.08),
    returnCost: Math.floor((selfSales + dropSales) * 0.03),
    adCost: Math.floor((selfSales + dropSales) * 0.25),
    shippingCost: Math.floor((selfSales + dropSales) * 0.05),
    platformFee: Math.floor((selfSales + dropSales) * 0.05),
    laborCost: 500,
    grossProfit: Math.floor((selfSales + dropSales) * 0.3),
    roi: Number((3 + Math.random()).toFixed(2)),
    returnRate: Number((5 + Math.random() * 5).toFixed(1)),
  }
})

export default function ShopDailyData() {
  const params = useParams()
  const router = useRouter()
  const shopName = decodeURIComponent(params.shop as string)
  const shop = SHOP_INFO[shopName]
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const getStoredData = () => {
    if (typeof window === 'undefined') return MOCK_DATA
    const stored = localStorage.getItem(`shop_data_${shopName}`)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return MOCK_DATA
      }
    }
    return MOCK_DATA
  }
  
  const [data, setData] = useState<DailyData[]>(getStoredData)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<Partial<DailyData>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '2026-02-23',
    end: '2026-03-23'
  })
  const [showImportModal, setShowImportModal] = useState(false)
  const [importPreview, setImportPreview] = useState<DailyData[]>([])
  const [selectedRows, setSelectedRows] = useState<number[]>([])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const saveData = () => {
    if (typeof window !== 'undefined') {
      saveShopData(shopName, data)
      setHasUnsavedChanges(false)
      showToast('数据已保存并同步到其他页面', 'success')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showToast('请上传 Excel 文件（.xlsx 或 .xls）', 'error')
      return
    }
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      const importedData: DailyData[] = jsonData.map((row: any, index: number) => ({
        id: Date.now() + index,
        date: row['日期'] || new Date().toISOString().split('T')[0],
        selfSales: Number(row['自发销售额'] || row['自发销售'] || 0),
        selfOrders: Number(row['自发单数'] || row['自发单'] || 0),
        selfCost: Number(row['自发成本'] || 0),
        dropSales: Number(row['代发销售额'] || row['代发销售'] || 0),
        dropOrders: Number(row['代发单数'] || row['代发单'] || 0),
        dropCost: Number(row['代发成本'] || 0),
        totalSales: Number(row['总销售额'] || row['总销售'] || 0),
        totalOrders: Number(row['总单数'] || 0),
        totalCost: Number(row['总成本'] || 0),
        fakeSales: Number(row['刷单金额'] || 0),
        fakeOrders: Number(row['刷单单数'] || 0),
        fakeCommission: Number(row['刷单佣金'] || 0),
        refundAmount: Number(row['退款金额'] || 0),
        returnCost: Number(row['退回成本'] || 0),
        adCost: Number(row['推广费'] || 0),
        shippingCost: Number(row['运费'] || 0),
        platformFee: Number(row['平台服务费'] || row['平台费'] || 0),
        laborCost: Number(row['人工场地费'] || row['人工场地'] || 500),
        grossProfit: Number(row['毛利'] || 0),
        roi: Number(row['roi'] || row['ROI'] || 0),
        returnRate: Number(row['退货率'] || 0),
      }))
      setImportPreview(importedData)
      setShowImportModal(true)
      showToast(`成功解析 ${importedData.length} 行数据`)
    } catch (error) {
      console.error('导入失败:', error)
      showToast('文件解析失败，请检查文件格式', 'error')
    }
  }

  const handleConfirmImport = () => {
    setData([...importPreview, ...data])
    setShowImportModal(false)
    setImportPreview([])
    setHasUnsavedChanges(true)
    showToast(`成功导入 ${importPreview.length} 行数据，请点击"💾 保存数据"按钮永久保存`)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCancelImport = () => {
    setShowImportModal(false)
    setImportPreview([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteRow = (id: number) => {
    if (window.confirm('确定要删除这条数据吗？删除后需要保存才能永久生效。')) {
      setData(data.filter(row => row.id !== id))
      setHasUnsavedChanges(true)
      showToast('数据已删除，请点击"💾 保存数据"按钮永久保存', 'success')
    }
  }

  const handleBatchDelete = () => {
    if (selectedRows.length === 0) {
      showToast('请先选择要删除的数据', 'error')
      return
    }
    if (window.confirm(`确定要删除选中的 ${selectedRows.length} 条数据吗？删除后需要保存才能永久生效。`)) {
      setData(data.filter(row => !selectedRows.includes(row.id)))
      setSelectedRows([])
      setHasUnsavedChanges(true)
      showToast(`已删除 ${selectedRows.length} 条数据，请点击"💾 保存数据"按钮永久保存`, 'success')
    }
  }

  const handleClearAll = () => {
    if (data.length === 0) return
    if (window.confirm(`确定要清空所有 ${data.length} 条数据吗？此操作保存后不可恢复！`)) {
      setData([])
      setSelectedRows([])
      setHasUnsavedChanges(true)
      showToast('所有数据已清空，请点击"💾 保存数据"按钮永久保存', 'success')
    }
  }

  const handleToggleSelect = (id: number) => {
    setSelectedRows(selectedRows.includes(id) ? selectedRows.filter(rowId => rowId !== id) : [...selectedRows, id])
  }

  const handleSelectAll = () => {
    if (selectedRows.length === data.length && data.length > 0) {
      setSelectedRows([])
    } else {
      setSelectedRows(data.map(row => row.id))
    }
  }

  const handleEdit = (row: DailyData) => {
    setEditingId(row.id)
    setEditingData({ ...row })
  }

  const handleSave = () => {
    if (editingId) {
      setData(data.map(row => row.id === editingId ? { ...row, ...editingData } as DailyData : row))
      setEditingId(null)
      setEditingData({})
      setHasUnsavedChanges(true)
      showToast('数据已修改，请点击"💾 保存数据"按钮永久保存')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingData({})
  }

  const handleAddRow = () => {
    const newRow: DailyData = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      selfSales: 0, selfOrders: 0, selfCost: 0,
      dropSales: 0, dropOrders: 0, dropCost: 0,
      totalSales: 0, totalOrders: 0, totalCost: 0,
      fakeSales: 0, fakeOrders: 0, fakeCommission: 0,
      refundAmount: 0, returnCost: 0,
      adCost: 0, shippingCost: 0, platformFee: 0, laborCost: 500,
      grossProfit: 0, roi: 0, returnRate: 0,
    }
    setData([newRow, ...data])
    setEditingId(newRow.id)
    setEditingData(newRow)
    setHasUnsavedChanges(true)
    showToast('已添加新行，请编辑数据后保存')
  }

  if (!shop) {
    return <div>店铺不存在</div>
  }

  const totalSales = data.reduce((sum, row) => sum + row.totalSales, 0)
  const totalProfit = data.reduce((sum, row) => sum + row.grossProfit, 0)
  const totalAdCost = data.reduce((sum, row) => sum + row.adCost, 0)
  const avgRoi = (totalSales / totalAdCost).toFixed(2)
  const avgReturnRate = (data.reduce((sum, row) => sum + row.returnRate, 0) / data.length).toFixed(1)

  return (
    <div className="flex min-h-screen bg-slate-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {toast.message}
        </div>
      )}

      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <h2 className="text-2xl font-bold mb-8 text-orange-500">山麓众创科技</h2>
        <nav className="space-y-4">
          <a href="/" className="block py-2 px-4 hover:bg-slate-800 rounded">📊 经营看板</a>
          <a href="/products" className="block py-2 px-4 hover:bg-slate-800 rounded">📦 商品管理</a>
          <a href="/sales" className="block py-2 px-4 hover:bg-slate-800 rounded">🏪 店铺销售情况</a>
          <a href="/shops" className="block py-2 px-4 bg-slate-800 rounded">🏢 店铺分组管理</a>
          <a href="/settings" className="block py-2 px-4 hover:bg-slate-800 rounded">⚙️ 系统设置</a>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.push('/shops')} className="text-slate-600 hover:text-slate-800">← 返回</button>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${shop.platform === '抖音' ? 'bg-black text-white' : shop.platform === '天猫' ? 'bg-red-100 text-red-600' : shop.platform === '京东' ? 'bg-red-50 text-red-500' : 'bg-yellow-100 text-yellow-600'}`}>
              {shop.platform === '抖音' ? '🎵' : shop.platform === '天猫' ? '🐱' : shop.platform === '京东' ? '🐶' : '💛'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{shop.name}</h1>
              <p className="text-slate-500">{shop.platform} · {shop.group}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm">总销售额</p>
              <p className="text-2xl font-bold text-slate-900">¥{(totalSales / 10000).toFixed(1)}万</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm">总毛利</p>
              <p className="text-2xl font-bold text-green-600">¥{(totalProfit / 10000).toFixed(1)}万</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm">总推广费</p>
              <p className="text-2xl font-bold text-orange-600">¥{(totalAdCost / 10000).toFixed(1)}万</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm">平均 ROI</p>
              <p className="text-2xl font-bold text-orange-600">{avgRoi}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm">平均退货率</p>
              <p className="text-2xl font-bold text-red-600">{avgReturnRate}%</p>
            </div>
          </div>
        </header>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg text-sm">
                <span>⚠️ 有未保存的更改</span>
                <button onClick={saveData} className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 text-xs flex items-center gap-1">💾 立即保存</button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">日期范围：</label>
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg" />
              <span className="text-slate-400">至</span>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="ml-auto bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">📥 导入 Excel</button>
            <button onClick={handleAddRow} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">➕ 添加日期</button>
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">📤 导出 Excel</button>
            <button onClick={saveData} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${hasUnsavedChanges ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`} disabled={!hasUnsavedChanges}>💾 保存数据</button>
            {selectedRows.length > 0 && (
              <button onClick={handleBatchDelete} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2">🗑️ 删除 ({selectedRows.length})</button>
            )}
            <button onClick={handleClearAll} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200">🗑️ 清空全部</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium sticky left-0 bg-slate-50 z-10">
                    <input type="checkbox" checked={selectedRows.length === data.length && data.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500" />
                  </th>
                  <th className="px-3 py-3 font-medium sticky left-10 bg-slate-50">日期</th>
                  <th className="px-3 py-3 font-medium text-right">自发销售</th>
                  <th className="px-3 py-3 font-medium text-right">自发单</th>
                  <th className="px-3 py-3 font-medium text-right">自发成本</th>
                  <th className="px-3 py-3 font-medium text-right">代发销售</th>
                  <th className="px-3 py-3 font-medium text-right">代发单</th>
                  <th className="px-3 py-3 font-medium text-right">代发成本</th>
                  <th className="px-3 py-3 font-medium text-right bg-blue-50">总销售</th>
                  <th className="px-3 py-3 font-medium text-right bg-blue-50">总单数</th>
                  <th className="px-3 py-3 font-medium text-right bg-blue-50">总成本</th>
                  <th className="px-3 py-3 font-medium text-right text-orange-600">刷单金额</th>
                  <th className="px-3 py-3 font-medium text-right text-orange-600">刷单单数</th>
                  <th className="px-3 py-3 font-medium text-right text-orange-600">刷单佣金</th>
                  <th className="px-3 py-3 font-medium text-right text-red-600">退款金额</th>
                  <th className="px-3 py-3 font-medium text-right text-red-600">退回成本</th>
                  <th className="px-3 py-3 font-medium text-right text-orange-600">推广费</th>
                  <th className="px-3 py-3 font-medium text-right">运费</th>
                  <th className="px-3 py-3 font-medium text-right">平台费</th>
                  <th className="px-3 py-3 font-medium text-right">人工场地</th>
                  <th className="px-3 py-3 font-medium text-right text-green-600">毛利</th>
                  <th className="px-3 py-3 font-medium text-right text-orange-600">ROI</th>
                  <th className="px-3 py-3 font-medium text-right text-red-600">退货率</th>
                  <th className="px-3 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row) => (
                  <tr key={row.id} className={`hover:bg-slate-50 ${selectedRows.includes(row.id) ? 'bg-red-50' : ''}`}>
                    <td className="px-3 py-3 sticky left-0 bg-white z-10">
                      <input type="checkbox" checked={selectedRows.includes(row.id)} onChange={() => handleToggleSelect(row.id)} className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500" />
                    </td>
                    <td className="px-3 py-3 font-medium sticky left-10 bg-white">{editingId === row.id ? <input type="date" value={editingData.date || row.date} onChange={(e) => setEditingData({ ...editingData, date: e.target.value })} className="w-full px-2 py-1 border rounded" /> : row.date}</td>
                    <td className="px-3 py-3 text-right">{editingId === row.id ? <input type="number" value={editingData.selfSales ?? row.selfSales} onChange={(e) => setEditingData({ ...editingData, selfSales: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.selfSales.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">{editingId === row.id ? <input type="number" value={editingData.selfOrders ?? row.selfOrders} onChange={(e) => setEditingData({ ...editingData, selfOrders: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.selfOrders.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">{editingId === row.id ? <input type="number" value={editingData.selfCost ?? row.selfCost} onChange={(e) => setEditingData({ ...editingData, selfCost: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.selfCost.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">{editingId === row.id ? <input type="number" value={editingData.dropSales ?? row.dropSales} onChange={(e) => setEditingData({ ...editingData, dropSales: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.dropSales.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">{editingId === row.id ? <input type="number" value={editingData.dropOrders ?? row.dropOrders} onChange={(e) => setEditingData({ ...editingData, dropOrders: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.dropOrders.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">{editingId === row.id ? <input type="number" value={editingData.dropCost ?? row.dropCost} onChange={(e) => setEditingData({ ...editingData, dropCost: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.dropCost.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-medium bg-blue-50">{editingId === row.id ? <input type="number" value={editingData.totalSales ?? row.totalSales} onChange={(e) => setEditingData({ ...editingData, totalSales: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.totalSales.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-medium bg-blue-50">{editingId === row.id ? <input type="number" value={editingData.totalOrders ?? row.totalOrders} onChange={(e) => setEditingData({ ...editingData, totalOrders: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.totalOrders.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-medium bg-blue-50">{editingId === row.id ? <input type="number" value={editingData.totalCost ?? row.totalCost} onChange={(e) => setEditingData({ ...editingData, totalCost: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.totalCost.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-orange-600">{editingId === row.id ? <input type="number" value={editingData.fakeSales ?? row.fakeSales} onChange={(e) => setEditingData({ ...editingData, fakeSales: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.fakeSales.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-orange-600">{editingId === row.id ? <input type="number" value={editingData.fakeOrders ?? row.fakeOrders} onChange={(e) => setEditingData({ ...editingData, fakeOrders: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.fakeOrders.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-orange-600">{editingId === row.id ? <input type="number" value={editingData.fakeCommission ?? row.fakeCommission} onChange={(e) => setEditingData({ ...editingData, fakeCommission: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.fakeCommission.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-red-600">{editingId === row.id ? <input type="number" value={editingData.refundAmount ?? row.refundAmount} onChange={(e) => setEditingData({ ...editingData, refundAmount: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.refundAmount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-red-600">{editingId === row.id ? <input type="number" value={editingData.returnCost ?? row.returnCost} onChange={(e) => setEditingData({ ...editingData, returnCost: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.returnCost.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-orange-600">{editingId === row.id ? <input type="number" value={editingData.adCost ?? row.adCost} onChange={(e) => setEditingData({ ...editingData, adCost: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.adCost.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">{editingId === row.id ? <input type="number" value={editingData.shippingCost ?? row.shippingCost} onChange={(e) => setEditingData({ ...editingData, shippingCost: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.shippingCost.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">{editingId === row.id ? <input type="number" value={editingData.platformFee ?? row.platformFee} onChange={(e) => setEditingData({ ...editingData, platformFee: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.platformFee.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">{editingId === row.id ? <input type="number" value={editingData.laborCost ?? row.laborCost} onChange={(e) => setEditingData({ ...editingData, laborCost: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.laborCost.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-green-600 font-medium">{editingId === row.id ? <input type="number" value={editingData.grossProfit ?? row.grossProfit} onChange={(e) => setEditingData({ ...editingData, grossProfit: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.grossProfit.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-orange-600 font-medium">{editingId === row.id ? <input type="number" step="0.01" value={editingData.roi ?? row.roi} onChange={(e) => setEditingData({ ...editingData, roi: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.roi.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right text-red-600 font-medium">{editingId === row.id ? <input type="number" step="0.1" value={editingData.returnRate ?? row.returnRate} onChange={(e) => setEditingData({ ...editingData, returnRate: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /> : row.returnRate.toFixed(1)}%</td>
                    <td className="px-3 py-3">
                      {editingId === row.id ? (
                        <div className="flex gap-1">
                          <button onClick={handleSave} className="px-2 py-1 bg-green-500 text-white rounded text-xs">保存</button>
                          <button onClick={handleCancel} className="px-2 py-1 bg-slate-300 rounded text-xs">取消</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(row)} className="text-orange-600 hover:text-orange-700 text-xs font-medium">✏️</button>
                          <button onClick={() => handleDeleteRow(row.id)} className="text-red-600 hover:text-red-700 text-xs font-medium">🗑️</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl my-8">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">📥 导入数据预览</h2>
                <p className="text-sm text-slate-500 mt-1">共解析 {importPreview.length} 行数据，请确认无误后导入</p>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 font-medium">日期</th>
                      <th className="px-2 py-2 font-medium text-right">自发销售</th>
                      <th className="px-2 py-2 font-medium text-right">代发销售</th>
                      <th className="px-2 py-2 font-medium text-right bg-blue-50">总销售</th>
                      <th className="px-2 py-2 font-medium text-right">总成本</th>
                      <th className="px-2 py-2 font-medium text-right text-orange-600">刷单金额</th>
                      <th className="px-2 py-2 font-medium text-right text-red-600">退款金额</th>
                      <th className="px-2 py-2 font-medium text-right text-orange-600">推广费</th>
                      <th className="px-2 py-2 font-medium text-right text-green-600">毛利</th>
                      <th className="px-2 py-2 font-medium text-right text-orange-600">ROI</th>
                      <th className="px-2 py-2 font-medium text-right text-red-600">退货率</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importPreview.slice(0, 10).map((row, index) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-2 py-2 font-medium">{row.date}</td>
                        <td className="px-2 py-2 text-right">{row.selfSales.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right">{row.dropSales.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right font-medium bg-blue-50">{row.totalSales.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right">{row.totalCost.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right text-orange-600">{row.fakeSales.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right text-red-600">{row.refundAmount.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right text-orange-600">{row.adCost.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right text-green-600">{row.grossProfit.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right text-orange-600">{row.roi.toFixed(2)}</td>
                        <td className="px-2 py-2 text-right text-red-600">{row.returnRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importPreview.length > 10 && (
                  <p className="text-center text-slate-400 text-sm mt-4">还有 {importPreview.length - 10} 行数据未显示，导入后将全部展示</p>
                )}
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={handleCancelImport} className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg">取消</button>
                <button onClick={handleConfirmImport} className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">✅ 确认导入 {importPreview.length} 行数据</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
