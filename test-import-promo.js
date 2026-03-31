// 商品推广明细导入测试脚本
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ergesvxuiajxrewfpydk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZ2Vzdnh1aWFqeHJld2ZweWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjIzNzksImV4cCI6MjA4OTc5ODM3OX0.tbJyeC_PixTwk6fnAE1m6w_uQ2nXMdECFBCUGeph8V0'
const SHOP_ID = 15 // 大福纯银

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function importProductPromo() {
  console.log('🚀 开始导入商品推广明细...\n')
  
  // 读取 Excel 文件
  const files = require('fs').readdirSync('E:\\山麓众创科技有限公司\\大福纯银')
  const targetFile = files.find(f => f.includes('商品推广') || f.includes('20260330'))
  const filePath = 'E:\\山麓众创科技有限公司\\大福纯银\\' + targetFile
  console.log('📄 读取文件:', filePath, '=>', targetFile)
  
  const workbook = XLSX.readFile(filePath)
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawData = XLSX.utils.sheet_to_json(worksheet, {header: 1})
  
  console.log('总行数:', rawData.length)
  console.log('表头:', rawData[0])
  console.log('第一行数据:', rawData[1], '\n')
  
  // 提取表头
  const headers = rawData[0] || []
  
  // 转换为对象数组
  const data = rawData.slice(1).map(row => {
    const obj = {}
    headers.forEach((h, i) => {
      if (h && String(h).trim()) {
        obj[String(h).trim()] = row[i] || ''
      }
    })
    return obj
  }).filter(obj => Object.keys(obj).length > 0)
  
  console.log('转换后数据量:', data.length)
  console.log('示例数据:', JSON.stringify(data[0], null, 2), '\n')
  
  // 转换为数据库格式
  const rowsToInsert = data.map(row => ({
    shop_id: SHOP_ID,
    report_date: String(row['日期'] || new Date().toISOString()).split('T')[0],
    subject_id: String(row['主体 ID'] || ''),
    subject_type: row['主体类型'] || '',
    subject_name: row['主体名称'] || '',
    impressions: Number(row['展现量'] || 0),
    clicks: Number(row['点击量'] || 0),
    cost: Number(row['花费'] || 0),
    ctr: Number(row['点击率'] || 0),
    avg_click_cost: Number(row['平均点击花费'] || 0),
    cpm: Number(row['千次展现花费'] || 0),
    presale_gmv: Number(row['总预售成交金额'] || 0),
    presale_orders: Number(row['总预售成交笔数'] || 0),
    direct_presale_gmv: Number(row['直接预售成交金额'] || 0),
    direct_presale_orders: Number(row['直接预售成交笔数'] || 0),
    indirect_presale_gmv: Number(row['间接预售成交金额'] || 0),
    indirect_presale_orders: Number(row['间接预售成交笔数'] || 0),
    direct_gmv: Number(row['直接成交金额'] || 0),
    indirect_gmv: Number(row['间接成交金额'] || 0),
    total_gmv: Number(row['总成交金额'] || 0),
    total_orders: Number(row['总成交笔数'] || 0),
    direct_orders: Number(row['直接成交笔数'] || 0),
    indirect_orders: Number(row['间接成交笔数'] || 0),
    click_cv_rate: Number(row['点击转化率'] || 0),
    roi: Number(row['投入产出比'] || 0),
    presale_roi: Number(row['含预售投产比'] || 0),
    total_cost: Number(row['总成交成本'] || 0),
    total_cart: Number(row['总购物车数'] || 0),
    direct_cart: Number(row['直接购物车数'] || 0),
    indirect_cart: Number(row['间接购物车数'] || 0),
    cart_rate: Number(row['加购率'] || 0),
    fav_item_count: Number(row['收藏宝贝数'] || 0),
    fav_shop_count: Number(row['收藏店铺数'] || 0),
    fav_shop_cost: Number(row['店铺收藏成本'] || 0),
    total_fav_cart: Number(row['总收藏加购数'] || 0),
    total_fav_cart_cost: Number(row['总收藏加购成本'] || 0),
    item_fav_cart: Number(row['宝贝收藏加购数'] || 0),
    item_fav_cart_cost: Number(row['宝贝收藏加购成本'] || 0),
    total_fav: Number(row['总收藏数'] || 0),
    item_fav_cost: Number(row['宝贝收藏成本'] || 0),
    item_fav_rate: Number(row['宝贝收藏率'] || 0),
    cart_cost: Number(row['加购成本'] || 0),
    order_count: Number(row['拍下订单笔数'] || 0),
    order_amount: Number(row['拍下订单金额'] || 0),
    direct_fav_item: Number(row['直接收藏宝贝数'] || 0),
    indirect_fav_item: Number(row['间接收藏宝贝数'] || 0),
    coupon_count: Number(row['优惠券领取量'] || 0),
    deposit_count: Number(row['购物金充值笔数'] || 0),
    deposit_amount: Number(row['购物金充值金额'] || 0),
    wangwang_count: Number(row['旺旺咨询量'] || 0),
    guide_visitors: Number(row['引导访问量'] || 0),
    guide_visitor_count: Number(row['引导访问人数'] || 0),
    guide_potential_count: Number(row['引导访问潜客数'] || 0),
    guide_potential_rate: Number(row['引导访问潜客占比'] || 0),
    member_rate: Number(row['入会率'] || 0),
    member_count: Number(row['入会量'] || 0),
    guide_rate: Number(row['引导访问率'] || 0),
    deep_visit_count: Number(row['深度访问量'] || 0),
    avg_page_count: Number(row['平均访问页面数'] || 0),
    new_customer_count: Number(row['成交新客数'] || 0),
    new_customer_rate: Number(row['成交新客占比'] || 0),
    member_first_count: Number(row['会员首购人数'] || 0),
    member_gmv: Number(row['会员成交金额'] || 0),
    member_orders: Number(row['会员成交笔数'] || 0),
    buyer_count: Number(row['成交人数'] || 0),
    avg_orders_per_buyer: Number(row['人均成交笔数'] || 0),
    avg_amount_per_buyer: Number(row['人均成交金额'] || 0),
    organic_gmv: Number(row['自然流量转化金额'] || 0),
    organic_impressions: Number(row['自然流量曝光量'] || 0),
    platform_boost_gmv: Number(row['平台助推总成交'] || 0),
    platform_boost_direct_gmv: Number(row['平台助推直接成交'] || 0),
    platform_boost_clicks: Number(row['平台助推点击'] || 0),
    coupon_discount: Number(row['宝贝优惠券抵扣金额'] || 0),
    coupon_boost_gmv: Number(row['宝贝优惠券撬动总成交'] || 0),
    coupon_boost_direct_gmv: Number(row['宝贝优惠券撬动直接成交'] || 0),
    coupon_boost_clicks: Number(row['宝贝优惠券撬动点击'] || 0)
  }))
  
  // 去重
  const uniqueMap = new Map()
  rowsToInsert.forEach(r => {
    const key = r.report_date + '_' + r.subject_id
    uniqueMap.set(key, r)
  })
  const uniqueRows = Array.from(uniqueMap.values())
  console.log('去重后数据量:', uniqueRows.length, '\n')
  
  // 删除旧数据
  const dates = [...new Set(uniqueRows.map(r => r.report_date))]
  const subjectIds = [...new Set(uniqueRows.map(r => r.subject_id))]
  console.log('准备删除：shop_id=', SHOP_ID, 'dates=', dates, 'subjectIds count=', subjectIds.length)
  
  const { error: deleteError } = await supabase
    .from('product_promo_reports')
    .delete()
    .eq('shop_id', SHOP_ID)
    .in('report_date', dates)
    .in('subject_id', subjectIds)
  
  if (deleteError) {
    console.error('❌ 删除失败:', deleteError.message)
  } else {
    console.log('✅ 删除成功')
  }
  
  // 插入新数据
  console.log('\n准备插入', uniqueRows.length, '行数据...')
  const { data: insertData, error: insertError } = await supabase.from('product_promo_reports').insert(uniqueRows)
  
  if (insertError) {
    console.error('❌ 插入失败:', insertError.message)
    console.error('错误详情:', insertError)
  } else {
    console.log('\n✅ 导入成功！')
    console.log('插入行数:', insertData?.length || uniqueRows.length)
    
    // 验证数据
    const { data: verifyData } = await supabase
      .from('product_promo_reports')
      .select('report_date,subject_name,impressions,clicks,cost,roi')
      .eq('shop_id', SHOP_ID)
      .order('report_date', {ascending: false})
      .limit(5)
    
    console.log('\n📊 最新 5 条数据:')
    verifyData?.forEach(row => {
      console.log(`  ${row.report_date} | ${row.subject_name} | 展现:${row.impressions} | 点击:${row.clicks} | 花费:¥${row.cost} | ROI:${row.roi}`)
    })
  }
}

importProductPromo().catch(console.error)
