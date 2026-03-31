const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ergesvxuiajxrewfpydk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZ2Vzdnh1aWFqeHJld2ZweWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjIzNzksImV4cCI6MjA4OTc5ODM3OX0.tbJyeC_PixTwk6fnAE1m6w_uQ2nXMdECFBCUGeph8V0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncData() {
    console.log('🔄 开始同步数据...\n');
    
    // 从 shop_daily_reports 读取数据
    const { data: shopDailyData, error: fetchError } = await supabase
        .from('shop_daily_reports')
        .select('*');
    
    if (fetchError) {
        console.log('❌ 读取失败:', fetchError.message);
        return;
    }
    
    console.log(`📊 读取到 ${shopDailyData.length} 行店铺日报数据\n`);
    
    // 转换为 sales_data 格式
    const salesData = shopDailyData.map(row => ({
        shop_id: row.shop_id,
        date: row.stat_date,
        pay_amount: row.paying_amount || 0,
        pay_orders: row.paying_buyers || 0,
        ad_cost_total: (row.ad_cost_total || 0) + (row.ad_keyword_cost || 0) + (row.ad_smart_cost || 0),
        visitors: row.visitors || 0,
        gross_profit: row.paying_amount ? (row.paying_amount * 0.3) : 0, // 估算毛利
        net_profit: row.paying_amount ? (row.paying_amount * 0.2) : 0,   // 估算净利
        total_cost: row.paying_amount ? (row.paying_amount * 0.7) : 0,   // 估算总成本
    }));
    
    // 批量插入 sales_data
    const { data: result, error: insertError } = await supabase
        .from('sales_data')
        .upsert(salesData, { onConflict: 'shop_id,date' })
        .select();
    
    if (insertError) {
        console.log('❌ 同步失败:', insertError.message);
    } else {
        console.log(`✅ 成功同步 ${result ? result.length : salesData.length} 行数据到 sales_data 表\n`);
    }
    
    // 验证结果
    const { data: verifyData } = await supabase
        .from('sales_data')
        .select('shop_id,date,pay_amount')
        .eq('shop_id', 15)
        .order('date', { ascending: false })
        .limit(5);
    
    if (verifyData && verifyData.length > 0) {
        console.log('📋 大福纯银最新 5 条数据:');
        verifyData.forEach(row => {
            console.log(`  ${row.date}: ¥${row.pay_amount}`);
        });
    }
}

syncData().catch(console.error);
