'use client'

import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

interface SheetData {
  name: string
  rowCount: number
  columns: string[]
  data: Record<string, any>[]
  selected: boolean
}

interface ImportHistory {
  id: number
  fileName: string
  sheetName: string
  importTime: string
  rowCount: number
  status: 'success' | 'failed'
  type: 'link' | 'file'
}

const MOCK_HISTORY: ImportHistory[] = [
  { id: 1, fileName: '抖音后宫数据报表从 11.01 开始', sheetName: '总表', importTime: '2026-03-23 09:00', rowCount: 156, status: 'success', type: 'link' },
  { id: 2, fileName: '抖音后宫数据报表从 11.01 开始', sheetName: '商品明细', importTime: '2026-03-23 09:00', rowCount: 89, status: 'success', type: 'link' },
  { id: 3, fileName: '抖音后宫数据报表从 11.01 开始', sheetName: '直播数据', importTime: '2026-03-22 18:00', rowCount: 45, status: 'success', type: 'link' },
]

export default function WPSImport() {
  const [activeTab, setActiveTab] = useState<'link' | 'file'>('link')
  const [link, setLink] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; currentSheet: string } | null>(null)
  const [importHistory, setImportHistory] = useState<ImportHistory[]>(MOCK_HISTORY)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // 分析文档链接
  const analyzeDocument = async () => {
    if (!link.trim()) {
      showToast('请先粘贴文档链接', 'error')
      return
    }

    if (!link.includes('kdocs.cn')) {
      showToast('请输入有效的金山文档链接', 'error')
      return
    }

    setIsAnalyzing(true)
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 模拟解析结果 - 模拟从链接中获取的所有工作表
    const mockSheets: SheetData[] = [
      {
        name: '总表',
        rowCount: 156,
        columns: ['日期', '商品名称', 'SKU', '销售额', '订单数', '转化率', 'GPM', '观看人数'],
        data: [
          { '日期': '2026-03-22', '商品名称': '新款春夏 T 恤', 'SKU': 'TS-2026-001', '销售额': 15680, '订单数': 158, '转化率': '3.2%', 'GPM': 520, '观看人数': 4937 },
          { '日期': '2026-03-22', '商品名称': '休闲牛仔裤', 'SKU': 'JN-2026-002', '销售额': 8940, '订单数': 45, '转化率': '2.8%', 'GPM': 380, '观看人数': 3192 },
        ],
        selected: true
      },
      {
        name: '商品明细',
        rowCount: 89,
        columns: ['商品 ID', '商品名称', 'SKU', '类目', '价格', '成本', '库存', '销量'],
        data: [
          { '商品 ID': 1, '商品名称': '新款春夏 T 恤', 'SKU': 'TS-2026-001', '类目': '服装', '价格': 99, '成本': 35, '库存': 1250, '销量': 3420 },
          { '商品 ID': 2, '商品名称': '休闲牛仔裤', 'SKU': 'JN-2026-002', '类目': '服装', '价格': 199, '成本': 80, '库存': 580, '销量': 1890 },
        ],
        selected: true
      },
      {
        name: '直播数据',
        rowCount: 45,
        columns: ['日期', '场次', '主播', '观看人数', '峰值人数', '销售额', '订单数', '平均停留'],
        data: [
          { '日期': '2026-03-22', '场次': '早场', '主播': '小王', '观看人数': 15680, '峰值人数': 2340, '销售额': 45680, '订单数': 456, '平均停留': '2:35' },
          { '日期': '2026-03-22', '场次': '晚场', '主播': '小李', '观看人数': 28900, '峰值人数': 4560, '销售额': 89560, '订单数': 892, '平均停留': '3:12' },
        ],
        selected: true
      },
      {
        name: '流量数据',
        rowCount: 62,
        columns: ['日期', '流量来源', '访客数', '占比', '转化率', 'GPM'],
        data: [
          { '日期': '2026-03-22', '流量来源': '推荐 Feed', '访客数': 12580, '占比': '45%', '转化率': '3.5%', 'GPM': 580 },
          { '日期': '2026-03-22', '流量来源': '关注页', '访客数': 8900, '占比': '32%', '转化率': '4.2%', 'GPM': 620 },
        ],
        selected: true
      },
      {
        name: '商品转化',
        rowCount: 78,
        columns: ['商品名称', '曝光次数', '点击次数', '点击率', '成交件数', '转化率', '销售额'],
        data: [
          { '商品名称': '新款春夏 T 恤', '曝光次数': 25680, '点击次数': 3420, '点击率': '13.3%', '成交件数': 158, '转化率': '4.6%', '销售额': 15642 },
          { '商品名称': '休闲牛仔裤', '曝光次数': 18900, '点击次数': 2100, '点击率': '11.1%', '成交件数': 45, '转化率': '2.1%', '销售额': 8955 },
        ],
        selected: true
      },
    ]
    
    setSheets(mockSheets)
    setIsAnalyzing(false)
    showToast(`解析成功！发现 ${mockSheets.length} 个工作表`)
  }

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showToast('请上传 Excel 文件（.xlsx 或 .xls）', 'error')
      return
    }

    setIsAnalyzing(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      
      const parsedSheets: any[] = workbook.SheetNames.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)
        const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : []
        
        return {
          name: sheetName,
          rowCount: jsonData.length,
          columns,
          data: jsonData.slice(0, 3),
          selected: true
        }
      })

      setSheets(parsedSheets)
      showToast(`解析成功！发现 ${parsedSheets.length} 个工作表`)
    } catch (error) {
      console.error('文件解析失败:', error)
      showToast('文件解析失败，请检查文件格式', 'error')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 切换工作表选择
  const toggleSheet = (sheetName: string) => {
    setSheets(sheets.map(sheet => 
      sheet.name === sheetName 
        ? { ...sheet, selected: !sheet.selected }
        : sheet
    ))
  }

  // 全选/取消全选
  const toggleAllSheets = (selected: boolean) => {
    setSheets(sheets.map(sheet => ({ ...sheet, selected })))
  }

  // 执行导入
  const handleImport = async () => {
    const selectedSheets = sheets.filter(s => s.selected)
    if (selectedSheets.length === 0) {
      showToast('请至少选择一个工作表', 'error')
      return
    }

    setIsImporting(true)
    const newHistory: ImportHistory[] = []

    for (let i = 0; i < selectedSheets.length; i++) {
      const sheet = selectedSheets[i]
      setImportProgress({
        current: i + 1,
        total: selectedSheets.length,
        currentSheet: sheet.name
      })

      // 模拟导入延迟
      await new Promise(resolve => setTimeout(resolve, 800))

      newHistory.push({
        id: Date.now() + i,
        fileName: activeTab === 'link' ? '抖音后宫数据报表从 11.01 开始' : '上传的文件',
        sheetName: sheet.name,
        importTime: new Date().toLocaleString('zh-CN', { 
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        }),
        rowCount: sheet.rowCount,
        status: 'success',
        type: activeTab as 'link' | 'file'
      })
    }

    setImportHistory([...newHistory, ...importHistory])
    setImportProgress(null)
    setIsImporting(false)
    setSheets([])
    setLink('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    showToast(`成功导入 ${selectedSheets.length} 个工作表，共 ${selectedSheets.reduce((sum, s) => sum + s.rowCount, 0)} 条数据`, 'success')
  }

  // 使用示例链接
  const fillExampleLink = () => {
    setLink('https://www.kdocs.cn/l/cnD21ll2zNzc')
    showToast('已填入示例链接，点击"分析文档"继续')
  }

  return (
    <div className="">
      {/* Toast 提示 */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' :
          toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
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
      <main className="p-8">
        {/* 头部 */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">WPS 文档导入</h1>
              <p className="text-slate-500 mt-1">导入金山文档或本地 Excel 文件到系统</p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-slate-600 hover:text-slate-700 flex items-center gap-2"
            >
              📜 导入历史
            </button>
          </div>
        </header>

        {/* 导入方式选择 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1 mb-8 inline-flex">
          <button
            onClick={() => setActiveTab('link')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'link'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🔗 金山文档链接
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'file'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📁 本地文件上传
          </button>
        </div>

        {/* 链接导入 */}
        {activeTab === 'link' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
            <h3 className="font-bold text-slate-800 mb-4">📋 粘贴文档链接</h3>
            
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="粘贴金山文档链接，例如：https://www.kdocs.cn/l/cnD21ll2zNzc"
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                onClick={fillExampleLink}
                className="px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300"
              >
                使用示例
              </button>
              <button
                onClick={analyzeDocument}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin">⏳</span> 分析中...
                  </>
                ) : (
                  <>
                    🔍 分析文档
                  </>
                )}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-2">💡 当前示例文档：</p>
              <p className="text-blue-700">抖音后宫数据报表从 11.01 开始</p>
              <p className="text-blue-600 text-xs mt-1">包含：总表、商品明细、直播数据、流量数据、商品转化 等工作表</p>
            </div>
          </div>
        )}

        {/* 文件上传 */}
        {activeTab === 'file' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
            <h3 className="font-bold text-slate-800 mb-4">📁 上传本地 Excel 文件</h3>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-orange-500 transition-colors cursor-pointer"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="text-6xl mb-4">📊</div>
              <p className="text-slate-700 font-medium mb-2">点击选择文件或拖拽到此处</p>
              <p className="text-slate-500 text-sm">支持 .xlsx 和 .xls 格式</p>
            </div>

            <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-800">
              <p className="font-medium mb-2">✅ 支持的文件类型：</p>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>Excel 工作簿 (.xlsx)</li>
                <li>Excel 97-2003 (.xls)</li>
                <li>自动识别所有工作表</li>
              </ul>
            </div>
          </div>
        )}

        {/* 导入进度 */}
        {importProgress && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
            <h3 className="font-bold text-slate-800 mb-4">📥 导入进度</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>正在导入：{importProgress.currentSheet}</span>
                <span>{importProgress.current} / {importProgress.total}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-300"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* 工作表列表 */}
        {sheets.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">📊 工作表列表</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => toggleAllSheets(true)}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  全选
                </button>
                <button
                  onClick={() => toggleAllSheets(false)}
                  className="text-sm text-slate-600 hover:text-slate-700 font-medium"
                >
                  取消全选
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <span className="animate-spin">⏳</span> 导入中...
                    </>
                  ) : (
                    <>
                      ✅ 导入选中的工作表
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {sheets.map((sheet, index) => (
                <div
                  key={sheet.name}
                  className={`border rounded-xl p-4 transition-colors ${
                    sheet.selected 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={sheet.selected}
                        onChange={() => toggleSheet(sheet.name)}
                        className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                      />
                      <div>
                        <h4 className="font-bold text-slate-800">{sheet.name}</h4>
                        <p className="text-sm text-slate-500">{sheet.rowCount} 行数据 · {sheet.columns.length} 个字段</p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-500">表 {index + 1}</span>
                  </div>

                  {/* 字段预览 */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {sheet.columns.slice(0, 8).map((col, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                        {col}
                      </span>
                    ))}
                    {sheet.columns.length > 8 && (
                      <span className="px-2 py-1 text-slate-400 text-xs">+{sheet.columns.length - 8} 更多</span>
                    )}
                  </div>

                  {/* 数据预览 */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          {sheet.columns.slice(0, 5).map((col, i) => (
                            <th key={i} className="px-3 py-2 font-medium">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sheet.data.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-slate-50">
                            {sheet.columns.slice(0, 5).map((col, colIndex) => (
                              <td key={colIndex} className="px-3 py-2 text-slate-700">
                                {row[col]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">显示前 5 个字段，前 2 行数据预览</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 导入历史 */}
        {showHistory && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-4">📜 导入历史</h3>
            <div className="space-y-3">
              {importHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      record.type === 'link' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <span className={record.type === 'link' ? 'text-blue-600' : 'text-green-600'}>
                        {record.type === 'link' ? '🔗' : '📁'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{record.fileName}</p>
                      <p className="text-sm text-slate-500">
                        {record.sheetName} · {record.rowCount} 行 · {record.importTime}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    record.status === 'success' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {record.status === 'success' ? '导入成功' : '导入失败'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {sheets.length === 0 && !showHistory && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📥</div>
            <p className="text-slate-500 text-lg">
              {activeTab === 'link' 
                ? '粘贴 WPS 文档链接开始导入数据' 
                : '上传 Excel 文件开始导入数据'}
            </p>
            <p className="text-slate-400 text-sm mt-2">
              {activeTab === 'link' 
                ? '支持金山文档在线表格链接' 
                : '支持 .xlsx 和 .xls 格式'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
