'use client'

import React, { useState } from 'react'

interface SyncRecord {
  id: number
  fileName: string
  sheetName: string
  lastSync: string
  status: 'success' | 'failed' | 'pending'
  records: number
  type: '商品' | '订单' | '库存'
}

interface WPSDoc {
  id: string
  name: string
  type: '表格' | '文档'
  url: string
  modified: string
}

const MOCK_RECORDS: SyncRecord[] = [
  { id: 1, fileName: '商品清单 2026.xlsx', sheetName: '天猫商品', lastSync: '2026-03-23 08:30', status: 'success', records: 156, type: '商品' },
  { id: 2, fileName: '商品清单 2026.xlsx', sheetName: '拼多多商品', lastSync: '2026-03-23 08:30', status: 'success', records: 89, type: '商品' },
  { id: 3, fileName: '商品清单 2026.xlsx', sheetName: '抖音商品', lastSync: '2026-03-23 08:30', status: 'success', records: 45, type: '商品' },
  { id: 4, fileName: '每日订单汇总.xlsx', sheetName: '2026-03-22', lastSync: '2026-03-23 02:00', status: 'success', records: 1467, type: '订单' },
  { id: 5, fileName: '库存预警表.xlsx', sheetName: '低库存商品', lastSync: '2026-03-23 07:00', status: 'failed', records: 0, type: '库存' },
]

const MOCK_DOCS: WPSDoc[] = [
  { id: '1', name: '商品清单 2026.xlsx', type: '表格', url: 'https://kdocs.cn/xxx', modified: '2026-03-23 08:00' },
  { id: '2', name: '每日订单汇总.xlsx', type: '表格', url: 'https://kdocs.cn/xxx', modified: '2026-03-23 02:00' },
  { id: '3', name: '库存预警表.xlsx', type: '表格', url: 'https://kdocs.cn/xxx', modified: '2026-03-22 18:00' },
  { id: '4', name: '运营日报模板.docx', type: '文档', url: 'https://kdocs.cn/xxx', modified: '2026-03-20 10:00' },
]

export default function WPSSync() {
  const [records] = useState<SyncRecord[]>(MOCK_RECORDS)
  const [docs] = useState<WPSDoc[]>(MOCK_DOCS)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [autoSync, setAutoSync] = useState(true)
  const [syncInterval, setSyncInterval] = useState(30)

  const getStatusBadge = (status: SyncRecord['status']) => {
    const config = {
      success: { bg: 'bg-green-100', text: 'text-green-700', label: '同步成功' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: '同步失败' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '同步中' },
    }
    const { bg, text, label } = config[status]
    return <span className={`px-2 py-1 ${bg} ${text} rounded-full text-xs`}>{label}</span>
  }

  const handleConnect = () => {
    setIsConnecting(true)
    setTimeout(() => {
      setIsConnected(true)
      setIsConnecting(false)
    }, 2000)
  }

  const handleSync = (id: number) => {
    console.log('同步 ID:', id)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 侧边栏 */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <h2 className="text-2xl font-bold mb-8 text-orange-500">山麓众创科技</h2>
        <nav className="space-y-4">
          <a href="/" className="block py-2 px-4 hover:bg-slate-800 rounded">📊 经营看板</a>
          <a href="/products" className="block py-2 px-4 hover:bg-slate-800 rounded">📦 商品管理</a>
          <a href="/sales" className="block py-2 px-4 hover:bg-slate-800 rounded">🏪 店铺销售情况</a>
          <a href="/shops" className="block py-2 px-4 hover:bg-slate-800 rounded">🏢 店铺分组管理</a>
          <div>
            <a href="/wps" className="block py-2 px-4 bg-slate-800 rounded mb-2">🔗 WPS 同步</a>
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
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">WPS 同步</h1>
            <p className="text-slate-500 mt-1">将 WPS 金山文档数据自动同步到系统</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/wps/import"
              className="bg-green-500 text-white px-6 py-2.5 rounded-lg hover:bg-green-600 shadow-md transition-colors flex items-center gap-2"
            >
              📥 导入文档
            </a>
            <button className="bg-orange-500 text-white px-6 py-2.5 rounded-lg hover:bg-orange-600 shadow-md transition-colors">
              ➕ 添加同步任务
            </button>
          </div>
        </header>

        {/* 连接状态 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <p className="font-medium text-slate-900">
                  {isConnected ? '已连接 WPS 金山文档' : '未连接 WPS 账号'}
                </p>
                <p className="text-sm text-slate-500">
                  {isConnected ? '上次连接：2026-03-23 08:00' : '请授权连接以使用同步功能'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isConnected && (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {isConnecting ? '连接中...' : '连接 WPS'}
                </button>
              )}
              <button className="text-slate-600 hover:text-slate-700 px-4 py-2">
                断开连接
              </button>
            </div>
          </div>
        </div>

        {/* 自动同步设置 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
          <h3 className="font-bold text-slate-800 mb-4">自动同步设置</h3>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
              />
              <span className="text-slate-700">启用自动同步</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-slate-700">同步间隔：</span>
              <select
                value={syncInterval}
                onChange={(e) => setSyncInterval(Number(e.target.value))}
                disabled={!autoSync}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-slate-100"
              >
                <option value={15}>15 分钟</option>
                <option value={30}>30 分钟</option>
                <option value={60}>1 小时</option>
                <option value={180}>3 小时</option>
                <option value={360}>6 小时</option>
              </select>
            </div>
            <button className="ml-auto text-orange-600 hover:text-orange-700 font-medium">
              立即同步全部
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 同步记录 */}
          <div>
            <h3 className="font-bold text-slate-800 mb-4">同步记录</h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                  <tr>
                    <th className="px-4 py-3">文件</th>
                    <th className="px-4 py-3">类型</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">记录数</th>
                    <th className="px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{record.fileName}</p>
                        <p className="text-xs text-slate-500">{record.sheetName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">{record.type}</span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                      <td className="px-4 py-3 text-slate-700">{record.records}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleSync(record.id)}
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                        >
                          同步
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* WPS 文档列表 */}
          <div>
            <h3 className="font-bold text-slate-800 mb-4">可用 WPS 文档</h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {docs.map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 text-lg">📄</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{doc.name}</p>
                        <p className="text-sm text-slate-500">修改于 {doc.modified}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">{doc.type}</span>
                      <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                        配置同步
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 同步映射说明 */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
          <h4 className="font-bold text-blue-900 mb-3">📘 同步映射说明</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-medium">商品同步</p>
              <p className="text-blue-600 mt-1">WPS 商品清单 → 系统商品库</p>
              <p className="text-blue-600">自动更新价格、库存、状态</p>
            </div>
            <div>
              <p className="font-medium">订单同步</p>
              <p className="text-blue-600 mt-1">WPS 订单表 → 系统订单</p>
              <p className="text-blue-600">每日 2 点自动同步前一日订单</p>
            </div>
            <div>
              <p className="font-medium">库存同步</p>
              <p className="text-blue-600 mt-1">WPS 库存表 → 系统库存</p>
              <p className="text-blue-600">库存预警自动推送</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
