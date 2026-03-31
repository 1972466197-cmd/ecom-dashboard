const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 读取配置
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
  console.log('\n🔍 检查数据库表和数据...\n');
  
  const tables = [
    'shop_daily_reports',
    'product_daily_reports',
    'fake_order_reports',
    'refund_reports',
    'sales_data'
  ];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: ${count} 行`);
      
      // 查询最新 3 行数据
      if (count > 0) {
        const { data } = await supabase
          .from(table)
          .select('*')
          .order('id', { ascending: false })
          .limit(3);
        
        if (data && data.length > 0) {
          console.log(`   最新数据示例:`);
          data.forEach((row, i) => {
            console.log(`   ${i+1}. shop_id=${row.shop_id}, date=${row.stat_date || row.report_date || row.date || 'N/A'}`);
          });
        }
      }
    }
  }
  
  console.log('\n========================================\n');
}

check();
