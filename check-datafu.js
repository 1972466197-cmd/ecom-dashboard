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
  console.log('\n🔍 检查大福太古数据...\n');
  
  // 1. 查找大福太古店铺
  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('*, shop_groups(name)')
    .ilike('name', '%大福太古%')
    .single();
  
  if (shopError) {
    console.log(`❌ 查找店铺失败：${shopError.message}`);
    return;
  }
  
  console.log('✅ 找到店铺:');
  console.log(`   名称：${shop.name}`);
  console.log(`   平台：${shop.platform}`);
  console.log(`   分组：${shop.shop_groups?.name || 'N/A'}`);
  console.log(`   分组 ID: ${shop.group_id}`);
  console.log(`   店铺 ID: ${shop.id}\n`);
  
  // 2. 查询该店铺的销售数据
  const { data: sales, error: salesError } = await supabase
    .from('sales_data')
    .select('*')
    .eq('shop_id', shop.id)
    .order('date', { ascending: false });
  
  if (salesError) {
    console.log(`❌ 查询销售数据失败：${salesError.message}`);
    return;
  }
  
  console.log(`✅ 销售数据：${sales?.length || 0} 行\n`);
  
  if (sales && sales.length > 0) {
    console.log('📊 数据明细:');
    sales.forEach(row => {
      console.log(`   ${row.date}: ¥${row.pay_amount} (${row.pay_orders}单)`);
    });
  }
  
  console.log('\n========================================\n');
}

check();
