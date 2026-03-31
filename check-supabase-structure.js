// 检查 Supabase 数据库表结构
import { supabase } from './supabase'

async function checkTableStructure() {
  console.log('=== 检查数据库表结构 ===')
  
  // 1. 检查 shop_daily_reports 表
  console.log('\n1. 检查 shop_daily_reports 表...')
  const { data: shopDailyColumns, error: shopDailyError } = await supabase
    .from('shop_daily_reports')
    .select('*')
    .limit(1)
  
  if (shopDailyError) {
    console.error('shop_daily_reports 表检查失败:', shopDailyError)
  } else {
    console.log('shop_daily_reports 表结构:', shopDailyColumns?.[0] ? Object.keys(shopDailyColumns[0]) : '空表')
  }
  
  // 2. 检查 sales_data 表
  console.log('\n2. 检查 sales_data 表...')
  const { data: salesColumns, error: salesError } = await supabase
    .from('sales_data')
    .select('*')
    .limit(1)
  
  if (salesError) {
    console.error('sales_data 表检查失败:', salesError)
  } else {
    console.log('sales_data 表结构:', salesColumns?.[0] ? Object.keys(salesColumns[0]) : '空表')
  }
  
  // 3. 检查 RLS 策略
  console.log('\n3. 检查 RLS 策略...')
  const { data: policies, error: policiesError } = await supabase
    .rpc('get_policies', { table_name: 'shop_daily_reports' })
  
  if (policiesError) {
    console.log('无法获取 RLS 策略（可能需要管理员权限）:', policiesError.message)
  } else {
    console.log('RLS 策略:', policies)
  }
  
  // 4. 测试插入权限
  console.log('\n4. 测试插入权限...')
  const testRow = {
    shop_id: 1,
    stat_date: '2026-03-27',
    paying_amount: 100,
    visitors: 100
  }
  
  const { data: insertData, error: insertError } = await supabase
    .from('shop_daily_reports')
    .insert([testRow])
    .select()
  
  if (insertError) {
    console.error('❌ 插入测试失败:', insertError)
  } else {
    console.log('✅ 插入测试成功:', insertData)
    
    // 清理测试数据
    await supabase
      .from('shop_daily_reports')
      .delete()
      .eq('shop_id', 1)
      .eq('stat_date', '2026-03-27')
  }
}

// 运行检查
checkTableStructure()
