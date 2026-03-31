// 测试数据导入脚本
// 用法：node test-import.js

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ergesvxuiajxrewfpydk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZ2Vzdnh1aWFqeHJld2ZweWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjIzNzksImV4cCI6MjA4OTc5ODM3OX0.tbJyeC_PixTwk6fnAE1m6w_uQ2nXMdECFBCUGeph8V0'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testImport() {
  console.log('🧪 开始测试数据导入...\n')
  
  // 测试数据
  const testData = {
    shop_id: 15, // 大福纯银
    stat_date: '2026-03-30',
    shop_name: '大福纯银',
    visitors: 5000,
    cart_users: 200,
    paying_amount: 25000.00,
    paying_buyers: 60,
    paying_sub_orders: 60,
    paying_items: 65,
    ad_cost_total: 5000.00,
    ad_keyword_cost: 200.00,
    ad_audience_cost: 0,
    ad_smart_cost: 0,
    refund_amount: 1000.00,
    review_count: 40,
    review_with_image: 5
  }
  
  console.log('📋 测试数据:')
  console.log(JSON.stringify(testData, null, 2))
  
  // 插入测试数据
  const {data, error} = await supabase
    .from('shop_daily_reports')
    .upsert([testData], {onConflict: 'shop_id,stat_date'})
    .select()
  
  if (error) {
    console.log('\n❌ 插入失败:', error.message)
    return
  }
  
  console.log('\n✅ 插入成功:', data.length, '行')
  
  // 验证数据
  const {data: verifyData} = await supabase
    .from('shop_daily_reports')
    .select('*')
    .eq('shop_id', 15)
    .eq('stat_date', '2026-03-30')
    .single()
  
  if (verifyData) {
    console.log('\n📊 验证结果:')
    console.log('  店铺:', verifyData.shop_name)
    console.log('  日期:', verifyData.stat_date)
    console.log('  销售额: ¥' + verifyData.paying_amount)
    console.log('  访客数:', verifyData.visitors)
    console.log('  订单数:', verifyData.paying_buyers)
    console.log('  推广费: ¥' + verifyData.ad_cost_total)
    
    // 检查字段是否正确
    const checks = [
      {name: 'paying_amount', expected: 25000, actual: verifyData.paying_amount},
      {name: 'visitors', expected: 5000, actual: verifyData.visitors},
      {name: 'ad_cost_total', expected: 5000, actual: verifyData.ad_cost_total}
    ]
    
    console.log('\n✅ 字段验证:')
    checks.forEach(c => {
      const pass = c.expected === c.actual
      console.log(`  ${pass ? '✅' : '❌'} ${c.name}: ${c.actual} (期望：${c.expected})`)
    })
  }
  
  console.log('\n✅ 测试完成！\n')
}

testImport().catch(console.error)
