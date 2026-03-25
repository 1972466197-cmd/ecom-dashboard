'use client'

import React, { useState } from 'react'

// 商品数据类型
interface Product {
  id: number
  name: string
  sku: string
  category: string
  price: number
  cost: number
  stock: number
  sales: number
  status: 'onsale' | 'offline' | 'warning'
  platform: string[]
}

// 模拟商品数据
const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: '新款春夏 T 恤', sku: 'TS-2026-001', category: '服装', price: 99, cost: 35, stock: 1250, sales: 3420, status: 'onsale', platform: ['天猫', '拼多多', '抖音'] },
  { id: 2, name: '休闲牛仔裤', sku: 'JN-2026-002', category: '服装', price: 199, cost: 80, stock: 580, sales: 1890, status: 'onsale', platform: ['天猫', '拼多多'] },
  { id: 3, name: '运动卫衣', sku: 'WD-2026-003', category: '服装', price: 159, cost: 55, stock: 45, sales: 2100, status: 'warning', platform: ['天猫', '抖音'] },
  { id: 4, name: '经典小白鞋', sku: 'SX-2026-004', category: '鞋履', price: 299, cost: 120, stock: 0, sales: 890, status: 'offline', platform: [] },
  { id: 5, name: '商务休闲裤', sku: 'CK-2026-005', category: '服装', price: 179, cost: 65, stock: 320, sales: 1560, status: 'onsale', platform: ['天猫', '拼多多', '抖音'] },
  { id: 6, name: '防晒外套', sku: 'JK-2026-006', category: '服装', price: 229, cost: 90, stock: 180, sales: 670, status: 'onsale', platform: ['抖音'] },
]

const CATEGORIES = ['全部类目', '服装', '鞋履', '配饰', '其他']
const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'onsale', label: '售卖中' },
  { value: 'offline', label: '已下架' },
  { value: 'warning', label: '库存预警' },
]

export default function ProductManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('全部类目')
  const [statusFilter, setStatusFilter] = useState('all')
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // 筛选商品
  const filteredProducts = products.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = categoryFilter === '全部类目' || product.category === categoryFilter
    const matchStatus = statusFilter === 'all' || product.status === statusFilter
    return matchSearch && matchCategory && matchStatus
  })

  // 切换商品上下架
  const toggleProductStatus = (id: number) => {
    setProducts(products.map(p => 
      p.id === id 
        ? { ...p, status: p.status === 'offline' ? 'onsale' : 'offline' as 'onsale' | 'offline' | 'warning' }
        : p
    ))
    showToast('商品状态已更新')
  }

  // 打开编辑
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p))
      setEditingProduct(null)
      showToast('商品信息已保存')
    }
  }

  // 状态标签
  const getStatusBadge = (status: Product['status']) => {
    const config = {
      onsale: { bg: 'bg-green-100', text: 'text-green-700', label: '售卖中' },
      offline: { bg: 'bg-slate-100', text: 'text-slate-700', label: '已下架' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '库存预警' },
    }
    const { bg, text, label } = config[status]
    return <span className={`px-2 py-1 ${bg} ${text} rounded-full text-xs`}>{label}</span>
  }

  // 平台标签
  const getPlatformTags = (platforms: string[]) => {
    if (platforms.length === 0) return <span className="text-slate-400 text-sm">未上架</span>
    return (
      <div className="flex gap-1 flex-wrap">
        {platforms.map(p => (
          <span key={p} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{p}</span>
        ))}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 侧边栏 */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <h2 className="text-2xl font-bold mb-8 text-orange-500">山麓众创科技</h2>
        <nav className="space-y-4">
          <a href="/" className="block py-2 px-4 hover:bg-slate-800 rounded">📊 经营看板</a>
          <a href="/products" className="block py-2 px-4 bg-slate-800 rounded">📦 商品管理</a>
          <a href="/sales" className="block py-2 px-4 hover:bg-slate-800 rounded">🏪 店铺销售情况</a>
          <a href="/shops" className="block py-2 px-4 hover:bg-slate-800 rounded">🏢 店铺分组管理</a>
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
        {/* Toast 提示 */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white animate-pulse`}>
            {toast.message}
          </div>
        )}

        {/* 头部 */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">商品管理</h1>
            <p className="text-slate-500 mt-1">管理全平台商品信息、库存和上下架状态</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-orange-500 text-white px-6 py-2.5 rounded-lg hover:bg-orange-600 shadow-md transition-colors flex items-center gap-2"
          >
            <span>➕</span> 新增商品
          </button>
        </header>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">商品总数</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{products.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">售卖中</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{products.filter(p => p.status === 'onsale').length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">库存预警</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{products.filter(p => p.status === 'warning').length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm">已下架</p>
            <p className="text-2xl font-bold text-slate-600 mt-1">{products.filter(p => p.status === 'offline').length}</p>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="搜索商品名称或 SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 商品表格 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-4">商品信息</th>
                <th className="px-6 py-4">类目</th>
                <th className="px-6 py-4">价格</th>
                <th className="px-6 py-4">成本</th>
                <th className="px-6 py-4">库存</th>
                <th className="px-6 py-4">销量</th>
                <th className="px-6 py-4">平台</th>
                <th className="px-6 py-4">状态</th>
                <th className="px-6 py-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-500">{product.sku}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{product.category}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">¥{product.price}</td>
                  <td className="px-6 py-4 text-slate-600">¥{product.cost}</td>
                  <td className="px-6 py-4">
                    <span className={product.stock < 50 ? 'text-red-600 font-medium' : 'text-slate-700'}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{product.sales}</td>
                  <td className="px-6 py-4">{getPlatformTags(product.platform)}</td>
                  <td className="px-6 py-4">{getStatusBadge(product.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                      >
                        编辑
                      </button>
                      <button 
                        onClick={() => toggleProductStatus(product.id)}
                        className="text-slate-600 hover:text-slate-700 text-sm font-medium"
                      >
                        {product.status === 'offline' ? '上架' : '下架'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              暂无符合条件的商品
            </div>
          )}
        </div>
      </main>

      {/* 编辑商品模态框 */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">编辑商品</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">商品名称</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">类目</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {CATEGORIES.filter(c => c !== '全部类目').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">售价</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">成本</label>
                  <input
                    type="number"
                    value={editingProduct.cost}
                    onChange={(e) => setEditingProduct({ ...editingProduct, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">库存</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增商品模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">新增商品</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">商品名称</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">类目</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                    {CATEGORIES.filter(c => c !== '全部类目').map(cat => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">售价</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">成本</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">初始库存</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  showToast('商品已添加（演示）', 'success')
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
