const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
  const [k, v] = l.split('=');
  if (k && v) env[k.trim()] = v.trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  console.log('\n🔍 检查 sales_data 表数据...\n');
  
  // 检查表结构
  const { data: schema, error: schemaError } = await supabase
    .from('sales_data')
    .select('*')
    .limit(1);
  
  if (schemaError) {
    console.log(`❌ 表结构错误：${schemaError.message}`);
    return;
  }
  
  console.log('✅ sales_data 表存在');
  console.log('字段:', Object.keys(schema[0] || {}).join(', '));
  
  // 查询所有数据
  const { data: allData, error: allError } = await supabase
    .from('sales_data')
    .select('*')
    .order('date', { ascending: false });
  
  if (allError) {
    console.log(`❌ 查询错误：${allError.message}`);
    return;
  }
  
  console.log(`\n📊 总数据量：${allData?.length || 0} 行`);
  
  if (allData && allData.length > 0) {
    console.log('\n📋 数据示例:');
    allData.slice(0, 5).forEach((row, i) => {
      console.log(`\n${i+1}. shop_id=${row.shop_id}, date=${row.date}, pay_amount=${row.pay_amount}, pay_orders=${row.pay_orders}`);
    });
    
    // 按店铺分组统计
    const shopMap = new Map();
    allData.forEach(row => {
      if (!shopMap.has(row.shop_id)) {
        shopMap.set(row.shop_id, []);
      }
      shopMap.get(row.shop_id).push(row);
    });
    
    console.log('\n📈 按店铺统计:');
    shopMap.forEach((rows, shopId) => {
      const totalAmount = rows.reduce((sum, r) => sum + (r.pay_amount || 0), 0);
      const totalOrders = rows.reduce((sum, r) => sum + (r.pay_orders || 0), 0);
      const dateRange = rows.length > 0 ? `${rows[rows.length-1].date} 至 ${rows[0].date}` : 'N/A';
      console.log(`   店铺 ${shopId}: ${rows.length} 行数据，总金额 ¥${totalAmount}, 总订单 ${totalOrders}, 日期范围：${dateRange}`);
    });
  }
  
  console.log('\n========================================\n');
}

check();
