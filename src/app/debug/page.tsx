'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkData()
  }, [])

  async function checkData() {
    setLoading(true)
    try {
      // 1. 检查所有表的数据量
      console.log('=== 开始诊断 ===')

      // 检查 shop_daily_reports（不限 shop_id）
      console.log('查询 shop_daily_reports...')
      const { data: shopData, error: shopError } = await supabase
        .from('shop_daily_reports')
        .select('shop_id, stat_date, paying_amount')
        .order('stat_date', { ascending: false })
        .limit(50)

      if (shopError) {
        console.error('❌ shop_daily_reports 查询失败:', shopError)
        setError('shop_daily_reports: ' + shopError.message)
      } else {
        console.log('✅ shop_daily_reports 成功:', shopData?.length, '条')
        console.log('数据样例:', shopData?.slice(0, 3))
        setData(shopData || [])
      }

      // 检查 shop_id=18 的数据
      console.log('\n查询 shop_id=18 的数据...')
      const { data: shop18Data } = await supabase
        .from('shop_daily_reports')
        .select('*')
        .eq('shop_id', 18)
        .limit(10)
      console.log('shop_id=18 数据量:', shop18Data?.length)

      // 查询所有店铺
      console.log('\n查询 shops 表...')
      const { data: allShops } = await supabase
        .from('shops')
        .select('id, name, group_id')
        .order('name')
      console.log('所有店铺:', allShops)
      
      // 查找包含"太古"的店铺
      const taiGuShops = allShops?.filter(s => s.name.includes('太古'))
      console.log('包含"太古"的店铺:', taiGuShops)
      
      // 查询这些店铺的销售数据
      if (taiGuShops && taiGuShops.length > 0) {
        const taiGuShopIds = taiGuShops.map(s => s.id)
        console.log('太古店铺 IDs:', taiGuShopIds)
        
        const { data: taiGuSales } = await supabase
          .from('shop_daily_reports')
          .select('*')
          .in('shop_id', taiGuShopIds)
          .limit(20)
        console.log('太古店铺销售数据:', taiGuSales?.length, '条')
        console.log('太古店铺销售数据样例:', taiGuSales?.slice(0, 3))
      }

      // 2. 检查 sales_data
      console.log('\n查询 sales_data...')
      const { data: salesData, error: salesError } = await supabase
        .from('sales_data')
        .select('*')
        .order('date', { ascending: false })
        .limit(20)

      if (salesError) {
        console.error('sales_data 查询失败:', salesError)
      } else {
        console.log('✅ sales_data 成功:', salesData?.length, '条')
      }

      // 3. 检查 product_daily_reports
      console.log('\n查询 product_daily_reports...')
      const { data: productData, error: productError } = await supabase
        .from('product_daily_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(20)

      if (productError) {
        console.error('product_daily_reports 查询失败:', productError)
      } else {
        console.log('✅ product_daily_reports 成功:', productData?.length, '条')
      }

    } catch (err: any) {
      console.error('诊断失败:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 数据诊断工具</h1>

        <button
          onClick={checkData}
          className="mb-6 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
        >
          🔄 重新诊断
        </button>

        {loading && <p>加载中...</p>}
        {error && <p className="text-red-500">错误：{error}</p>}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📊 shop_daily_reports 表数据</h2>
          {data.length === 0 ? (
            <p className="text-slate-500">暂无数据</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-2 text-left">日期</th>
                    <th className="px-4 py-2 text-left">店铺 ID</th>
                    <th className="px-4 py-2 text-left">支付金额</th>
                    <th className="px-4 py-2 text-left">访客数</th>
                    <th className="px-4 py-2 text-left">推广费</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-2">{row.stat_date}</td>
                      <td className="px-4 py-2">{row.shop_id}</td>
                      <td className="px-4 py-2">¥{row.paying_amount?.toLocaleString()}</td>
                      <td className="px-4 py-2">{row.visitors}</td>
                      <td className="px-4 py-2">¥{row.ad_cost_total?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">💡 诊断建议</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>如果 shop_daily_reports 有数据，说明导入成功</li>
            <li>如果 /shops 页面不显示，检查查询的 shop_id 是否匹配</li>
            <li>如果 /shops 页面不显示，检查日期范围是否包含数据</li>
            <li>按 F12 查看控制台详细日志</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
