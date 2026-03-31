const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://ergesvxuiajxrewfpydk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZ2Vzdnh1aWFqeHJld2ZweWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjIzNzksImV4cCI6MjA4OTc5ODM3OX0.tbJyeC_PixTwk6fnAE1m6w_uQ2nXMdECFBCUGeph8V0';
const SHOP_ID = 15;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DATA_DIR = 'E:\\山麓众创科技有限公司\\大福纯银';

async function importSalesData() {
    console.log('\n📈 导入销售数据...');
    
    // 尝试多个可能的文件名
    const files = ['销售数据.xlsx', '店铺日概况.xlsx'];
    let file = null;
    
    for (const f of files) {
        const path = require('path').join(DATA_DIR, f);
        if (fs.existsSync(path)) {
            file = path;
            console.log('  找到文件:', f);
            break;
        }
    }
    
    if (!file) {
        console.log('  ⚠️  未找到销售数据文件');
        return;
    }

    const workbook = XLSX.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log('  读取到', data.length, '行数据');
    console.log('  示例数据:', JSON.stringify(data[0], null, 2));

    const rows = data.map(row => {
        // 尝试多种字段名
        const date = row['日期'] || row['统计日期'] || new Date().toISOString().split('T')[0];
        const payAmount = row['支付金额'] || row['成交金额'] || 0;
        const payOrders = row['支付订单数'] || row['订单数'] || 0;
        const visitors = row['访客数'] || row['访客'] || 0;
        const adCost = row['全站推广'] || row['全站推广花费'] || row['推广花费'] || 0;
        const grossProfit = row['毛利'] || row['毛利润'] || 0;
        const netProfit = row['净利'] || row['净利润'] || 0;

        return {
            shop_id: SHOP_ID,
            date: date,
            pay_amount: parseFloat(payAmount) || 0,
            pay_orders: parseInt(payOrders) || 0,
            visitors: parseInt(visitors) || 0,
            ad_cost_total: parseFloat(adCost) || 0,
            gross_profit: parseFloat(grossProfit) || 0,
            net_profit: parseFloat(netProfit) || 0,
        };
    });

    const { data: result, error } = await supabase
        .from('sales_data')
        .upsert(rows, { onConflict: 'shop_id,date' })
        .select();

    if (error) {
        console.log('  ❌ 导入失败:', error.message);
    } else {
        console.log(`  ✅ 成功导入 ${result ? result.length : rows.length} 行销售数据`);
    }
}

async function importProductData() {
    console.log('\n📦 导入商品数据...');
    
    const files = ['商品日报.xls', '商品数据.xlsx', '商品数据.csv'];
    let file = null;
    
    for (const f of files) {
        const path = require('path').join(DATA_DIR, f);
        if (fs.existsSync(path)) {
            file = path;
            console.log('  找到文件:', f);
            break;
        }
    }
    
    if (!file) {
        console.log('  ⚠️  未找到商品数据文件');
        return;
    }

    const workbook = XLSX.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log('  读取到', data.length, '行数据');

    const rows = data.map(row => ({
        shop_id: SHOP_ID,
        report_date: row['日期'] || new Date().toISOString().split('T')[0],
        product_id_external: String(row['商品 ID'] || row['商品 id'] || ''),
        product_name: row['商品名称'] || row['商品'] || '',
        visitors: parseInt(row['访客数'] || row['访客'] || 0),
        paying_buyers: parseInt(row['支付买家数'] || row['买家数'] || 0),
        paying_amount: parseFloat(row['支付金额'] || row['成交金额'] || 0),
    }));

    const { data: result, error } = await supabase
        .from('product_daily_reports')
        .upsert(rows, { onConflict: 'shop_id,report_date,product_id_external' })
        .select();

    if (error) {
        console.log('  ❌ 导入失败:', error.message);
    } else {
        console.log(`  ✅ 成功导入 ${result ? result.length : rows.length} 行商品数据`);
    }
}

async function main() {
    await importSalesData();
    await importProductData();
    console.log('\n✅ 完成！');
}

main().catch(console.error);
