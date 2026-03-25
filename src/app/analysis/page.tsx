'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface ProductDailyData {
  id: number
  shop_id: number
  product_id_external: string
  product_name: string
  report_date: string
  visitors: number
  views: number
  paying_buyers: number
  paying_amount: number
  paying_cv_rate: number
  cart_users: number
  fav_count: number
  competitiveness_score: number
}

interface ShopOption {
  id: number
  name: string
  platform: string
}

interface ProductOption {
  product_id: string
  product_name: string
}

export default function ProductAnalysis() {
  const router = useRouter()
  const [shops, setShops] = useState<ShopOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [productSearch, setProductSearch] = useState<string>('')
  const [filteredProducts, setFilteredProducts] = useState<ProductOption[]>([])
  const [dateRange, setDateRange] = useState({ start: '2026-03-17', end: '2026-03-23' })
  const [productData, setProductData] = useState<ProductDailyData[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // 加载店铺列表
  useEffect(() => {
    const loadShops = async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name, platform')
        .order('name')
      if (data) setShops(data)
    }
    loadShops()
  }, [])

  // 加载商品列表（从所有导入模板中获取）
  useEffect(() => {
    if (selectedShop) {
      loadProducts()
    }
  }, [selectedShop])

  // 筛选商品
  useEffect(() => {
    if (productSearch.trim()) {
      const search = productSearch.toLowerCase()
      const filtered = products.filter(p => 
        p.product_id.toLowerCase().includes(search) ||
        p.product_name.toLowerCase().includes(search)
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [productSearch, products])

  const loadProducts = async () => {
    try {
      // 从商品日概况表获取商品
      const { data: productDailyData } = await supabase
        .from('product_daily_reports')
        .select('product_id_external, product_name')
        .eq('shop_id', selectedShop)
        .limit(1000)

      // 从销售数据表获取商品（如果有）
      const { data: salesData } = await supabase
        .from('sales_data')
        .select('product_id_external, product_name')
        .eq('shop_id', selectedShop)
        .limit(1000)

      // 合并去重
      const allProducts = new Map<string, string>()
      
      productDailyData?.forEach(p => {
        if (p.product_id_external && !allProducts.has(p.product_id_external)) {
          allProducts.set(p.product_id_external, p.product_name || p.product_id_external)
        }
      })

      salesData?.forEach(p => {
        if (p.product_id_external && !allProducts.has(p.product_id_external)) {
          allProducts.set(p.product_id_external, p.product_name || p.product_id_external)
        }
      })

      const productList = Array.from(allProducts.entries()).map(([id, name]) => ({
        product_id: id,
        product_name: name
      })).sort((a, b) => a.product_name.localeCompare(b.product_name))

      setProducts(productList)
      setFilteredProducts(productList)
    } catch (err) {
      console.error('加载商品列表失败:', err)
      setProducts([])
      setFilteredProducts([])
    }
  }

  // 加载商品数据
  useEffect(() => {
    if (selectedShop) {
      loadProductData()
    }
  }, [selectedShop, selectedProduct, dateRange])

  const loadProductData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('product_daily_reports')
        .select('*')
        .eq('shop_id', selectedShop)
        .gte('report_date', dateRange.start)
        .lte('report_date', dateRange.end)
        .order('report_date', { ascending: false })

      // 如果选择了商品，只加载该商品的数据
      if (selectedProduct) {
        query = query.eq('product_id_external', selectedProduct)
      }

      const { data, error } = await query

      if (error) throw error
      setProductData(data || [])
    } catch (err: any) {
      console.error('加载商品数据失败:', err)
      showToast('加载商品数据失败', 'error')
      setProductData([])
    } finally {
      setLoading(false)
    }
  }

  // 计算汇总数据
  const totalVisitors = productData.reduce((sum, p) => sum + (p.visitors || 0), 0)
  const totalViews = productData.reduce((sum, p) => sum + (p.views || 0), 0)
  const totalPayingBuyers = productData.reduce((sum, p) => sum + (p.paying_buyers || 0), 0)
  const totalPayingAmount = productData.reduce((sum, p) => sum + (p.paying_amount || 0), 0)
  const avgCvRate = productData.length > 0 
    ? productData.reduce((sum, p) => sum + (p.paying_cv_rate || 0), 0) / productData.length 
    : 0

  // 商品排行榜（按支付金额）
  const productRanking = productData
    .reduce((acc, p) => {
      const existing = acc.find(item => item.product_name === p.product_name)
      if (existing) {
        existing.paying_amount += p.paying_amount || 0
        existing.visitors += p.visitors || 0
        existing.paying_buyers += p.paying_buyers || 0
      } else {
        acc.push({
          product_name: p.product_name || p.product_id_external || '未知商品',
          product_id: p.product_id_external,
          paying_amount: p.paying_amount || 0,
          visitors: p.visitors || 0,
          paying_buyers: p.paying_buyers || 0
        })
      }
      return acc
    }, [] as any[])
    .sort((a, b) => b.paying_amount - a.paying_amount)
    .slice(0, 10)

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
          <a href="/analysis" className="block py-2 px-4 bg-slate-800 rounded">📈 商品分析</a>
          <a href="/shops" className="block py-2 px-4 hover:bg-slate-800 rounded">📈 店铺每日盈亏</a>
          <a href="/profit" className="block py-2 px-4 hover:bg-slate-800 rounded">💰 利润监控</a>
          <a href="/settings" className="block py-2 px-4 hover:bg-slate-800 rounded">⚙️ 系统设置</a>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-8">
        {/* 头部 */}
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              ← 返回
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">📈 商品分析</h1>
              <p className="text-slate-500 mt-1">查看商品经营数据和趋势分析</p>
            </div>
          </div>
        </header>

        {/* 筛选栏 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 店铺选择 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">选择店铺</label>
              <select
                value={selectedShop}
                onChange={(e) => {
                  setSelectedShop(e.target.value)
                  setSelectedProduct('')
                  setProductSearch('')
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">请选择店铺</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} ({shop.platform})
                  </option>
                ))}
              </select>
            </div>

            {/* 商品搜索 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">搜索商品（ID/名称）</label>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="输入商品 ID 或名称搜索..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* 商品选择 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">选择商品</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">全部商品</option>
                {filteredProducts.map(product => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.product_name} ({product.product_id})
                  </option>
                ))}
              </select>
            </div>

            {/* 日期范围 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">日期范围</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1 px-2 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <span className="text-slate-400">至</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1 px-2 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* 商品信息提示 */}
          {selectedProduct && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                🔍 当前查看商品：<strong>{products.find(p => p.product_id === selectedProduct)?.product_name || selectedProduct}</strong>
                {productData.length > 0 && (
                  <span className="ml-4">
                    📊 共 <strong>{productData.length}</strong> 条数据
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-slate-500">加载中...</p>
          </div>
        ) : productData.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-slate-500 mb-4">
              {selectedShop ? '暂无商品数据' : '请先选择店铺'}
            </p>
            {selectedShop && (
              <button
                onClick={() => router.push('/import')}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                去导入数据
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm">总访客数</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalVisitors.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm">总浏览量</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalViews.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm">支付买家数</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalPayingBuyers.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm">支付金额</p>
                <p className="text-2xl font-bold text-green-600 mt-1">¥{totalPayingAmount.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm">平均转化率</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{avgCvRate.toFixed(1)}%</p>
              </div>
            </div>

            {/* 商品排行榜 */}
            {productRanking.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">🏆 商品排行榜（TOP 10）</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-sm">
                      <tr>
                        <th className="px-4 py-3">排名</th>
                        <th className="px-4 py-3">商品名称</th>
                        <th className="px-4 py-3">商品 ID</th>
                        <th className="px-4 py-3 text-right">支付金额</th>
                        <th className="px-4 py-3 text-right">访客数</th>
                        <th className="px-4 py-3 text-right">支付买家数</th>
                        <th className="px-4 py-3 text-right">转化率</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productRanking.map((product, index) => (
                        <tr key={product.product_id || index} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-slate-100 text-slate-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-50 text-slate-600'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">{product.product_name}</td>
                          <td className="px-4 py-3 text-slate-500 text-sm">{product.product_id}</td>
                          <td className="px-4 py-3 text-right text-green-600 font-medium">
                            ¥{product.paying_amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {product.visitors.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {product.paying_buyers.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-orange-600">
                            {product.visitors > 0 ? ((product.paying_buyers / product.visitors) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 数据明细表 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">📋 商品数据明细</h2>
                <p className="text-sm text-slate-500">
                  {dateRange.start} 至 {dateRange.end} · 共 {productData.length} 条数据
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">日期</th>
                      <th className="px-4 py-3">商品 ID</th>
                      <th className="px-4 py-3">商品名称</th>
                      <th className="px-4 py-3 text-right">访客数</th>
                      <th className="px-4 py-3 text-right">浏览量</th>
                      <th className="px-4 py-3 text-right">支付买家数</th>
                      <th className="px-4 py-3 text-right">支付金额</th>
                      <th className="px-4 py-3 text-right">转化率</th>
                      <th className="px-4 py-3 text-right">加购人数</th>
                      <th className="px-4 py-3 text-right">收藏数</th>
                      <th className="px-4 py-3 text-right">竞争力评分</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.report_date}</td>
                        <td className="px-4 py-3 text-slate-500 text-sm">{item.product_id_external}</td>
                        <td className="px-4 py-3 text-slate-700">{item.product_name || '-'}</td>
                        <td className="px-4 py-3 text-right">{item.visitors.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{item.views.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{item.paying_buyers.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-green-600">¥{item.paying_amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-orange-600">{item.paying_cv_rate.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right">{item.cart_users.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{item.fav_count.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-1 rounded text-xs ${
                            (item.competitiveness_score || 0) >= 80 ? 'bg-green-100 text-green-700' :
                            (item.competitiveness_score || 0) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.competitiveness_score || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
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
