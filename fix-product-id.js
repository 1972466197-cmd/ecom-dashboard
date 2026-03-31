// 修复商品日概况的商品 ID
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ergesvxuiajxrewfpydk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZ2Vzdnh1aWFqeHJld2ZweWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjIzNzksImV4cCI6MjA4OTc5ODM3OX0.tbJyeC_PixTwk6fnAE1m6w_uQ2nXMdECFBCUGeph8V0'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function fixProductId() {
  console.log('🔧 开始修复商品 ID...\n')
  
  // 读取 Excel 文件获取商品 ID 映射
  const files = require('fs').readdirSync('E:\\山麓众创科技有限公司\\大福纯银')
  const targetFile = files.find(f => f.includes('商品日概况') && f.endsWith('.xls'))
  if (!targetFile) {
    console.error('❌ 未找到商品日概况文件')
    return
  }
  
  console.log('📄 读取文件:', targetFile)
  const workbook = XLSX.readFile('E:\\山麓众创科技有限公司\\大福纯银\\' + targetFile)
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawData = XLSX.utils.sheet_to_json(worksheet, {header: 1})
  
  // 提取表头
  const headers = rawData[0] || []
  console.log('表头:', headers)
  
  // 商品 ID 在第 2 列（索引 1），商品名称在第 3 列（索引 2）
  const productIdIndex = 1
  const productNameIndex = 2
  
  console.log('商品 ID 列索引:', productIdIndex)
  console.log('商品名称列索引:', productNameIndex)
  
  // 构建商品名称 -> 商品 ID 的映射
  const nameToIdMap = new Map()
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i]
    const name = row[productNameIndex]
    const id = row[productIdIndex]
    if (name && id) {
      nameToIdMap.set(String(name).trim(), String(id).trim())
    }
  }
  
  console.log('\n商品名称 -> 商品 ID 映射数量:', nameToIdMap.size)
  console.log('示例映射:', Array.from(nameToIdMap.entries()).slice(0, 3))
  
  // 获取数据库中需要修复的数据（空字符串）
  console.log('\n📊 查询数据库...')
  const { data: products } = await supabase
    .from('product_daily_reports')
    .select('id, product_id_external, product_name')
    .eq('product_id_external', '')
    .limit(1000)
  
  console.log('需要修复的记录数:', products?.length || 0)
  
  if (!products || products.length === 0) {
    console.log('✅ 无需修复')
    // 验证一下有多少有商品 ID 的记录
    const { count } = await supabase.from('product_daily_reports').select('*', { count: 'exact', head: true }).neq('product_id_external', '')
    console.log('有商品 ID 的记录数:', count)
    return
  }
  
  // 批量更新
  let updated = 0
  const batchSize = 100
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    const updates = batch.map(p => {
      const productId = nameToIdMap.get(String(p.product_name).trim())
      return {
        id: p.id,
        product_id_external: productId || p.product_id_external
      }
    }).filter(u => u.product_id_external)
    
    if (updates.length > 0) {
      const { error } = await supabase
        .from('product_daily_reports')
        .upsert(updates, { onConflict: 'id' })
      
      if (error) {
        console.error(`❌ 批次 ${Math.floor(i/batchSize)+1} 失败:`, error.message)
      } else {
        updated += updates.length
        console.log(`✅ 批次 ${Math.floor(i/batchSize)+1}: 更新 ${updates.length} 条`)
      }
    }
  }
  
  console.log(`\n📊 总计更新：${updated}/${products.length} 条记录`)
  
  // 验证
  const { count } = await supabase
    .from('product_daily_reports')
    .select('*', { count: 'exact', head: true })
    .not('product_id_external', 'is', null)
  
  console.log('\n✅ 修复完成！')
  console.log('有商品 ID 的记录数:', count)
}

fixProductId().catch(console.error)
