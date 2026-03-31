const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Supabase 配置
const SUPABASE_URL = 'https://ergesvxuiajxrewfpydk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZ2Vzdnh1aWFqeHJld2ZweWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjIzNzksImV4cCI6MjA4OTc5ODM3OX0.tbJyeC_PixTwk6fnAE1m6w_uQ2nXMdECFBCUGeph8V0';
const SHOP_ID = 15; // 大福纯银店铺 ID

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DATA_DIR = 'E:\\山麓众创科技有限公司\\大福纯银';

async function importShopDaily() {
    console.log('\n📊 1. 导入店铺日概况报表...');
    const file = path.join(DATA_DIR, '店铺日概况.xlsx');
    if (!fs.existsSync(file)) {
        console.log('  ⚠️  文件不存在:', file);
        return;
    }

    const workbook = XLSX.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const rows = data.map(row => ({
        shop_id: SHOP_ID,
        stat_date: row['统计日期'] || new Date().toISOString().split('T')[0],
        shop_name: row['店铺名称'] || '',
        visitors: parseInt(row['访客数']) || 0,
        cart_users: parseInt(row['加购人数']) || 0,
        paying_amount: parseFloat(row['支付金额']) || 0,
        paying_buyers: parseInt(row['支付买家数']) || 0,
        ad_cost_total: parseFloat(row['全站推广花费']) || 0,
        ad_keyword_cost: parseFloat(row['关键词推广花费']) || 0,
        ad_smart_cost: parseFloat(row['智能场景花费']) || 0,
    }));

    const { data: result, error } = await supabase
        .from('shop_daily_reports')
        .upsert(rows, { onConflict: 'shop_id,stat_date' })
        .select();

    if (error) {
        console.log('  ❌ 导入失败:', error.message);
    } else {
        console.log(`  ✅ 成功导入 ${result ? result.length : rows.length} 行店铺日报数据`);
    }
}

async function importSales() {
    console.log('\n📈 2. 导入销售数据...');
    const file = path.join(DATA_DIR, '销售数据.xlsx');
    if (!fs.existsSync(file)) {
        console.log('  ⚠️  文件不存在:', file);
        return;
    }

    const workbook = XLSX.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const rows = data.map(row => ({
        shop_id: SHOP_ID,
        date: row['日期'] || new Date().toISOString().split('T')[0],
        week_day: row['星期'] || '',
        pay_amount: parseFloat(row['支付金额']) || 0,
        pay_orders: parseInt(row['支付订单数']) || 0,
        visitors: parseInt(row['访客数']) || 0,
        ad_cost_total: parseFloat(row['全站推广']) || 0,
        gross_profit: parseFloat(row['毛利']) || 0,
        net_profit: parseFloat(row['净利']) || 0,
    }));

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

async function importProductDaily() {
    console.log('\n📦 3. 导入商品日报...');
    const file = path.join(DATA_DIR, '商品日报.xls');
    if (!fs.existsSync(file)) {
        console.log('  ⚠️  文件不存在:', file);
        return;
    }

    const workbook = XLSX.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const rows = data.map(row => ({
        shop_id: SHOP_ID,
        report_date: row['日期'] || new Date().toISOString().split('T')[0],
        product_id_external: String(row['商品 ID'] || ''),
        product_name: row['商品名称'] || '',
        visitors: parseInt(row['访客数']) || 0,
        paying_buyers: parseInt(row['支付买家数']) || 0,
        paying_amount: parseFloat(row['支付金额']) || 0,
    }));

    const { data: result, error } = await supabase
        .from('product_daily_reports')
        .upsert(rows, { onConflict: 'shop_id,report_date,product_id_external' })
        .select();

    if (error) {
        console.log('  ❌ 导入失败:', error.message);
    } else {
        console.log(`  ✅ 成功导入 ${result ? result.length : rows.length} 行商品日报数据`);
    }
}

async function importFakeOrders() {
    console.log('\n📝 4. 导入刷单数据...');
    const file = path.join(DATA_DIR, '刷单.xlsx');
    if (!fs.existsSync(file)) {
        console.log('  ⚠️  文件不存在:', file);
        return;
    }

    const workbook = XLSX.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const rows = data.map(row => ({
        shop_id: SHOP_ID,
        order_created_at: row['时间'] || new Date().toISOString(),
        paid_amount: parseFloat(row['实际付款金额']) || 0,
        product_order_count: parseInt(row['购买数量']) || 0,
        commission: parseFloat(row['佣金']) || 0,
    }));

    const { data: result, error } = await supabase
        .from('fake_order_reports')
        .insert(rows);

    if (error) {
        console.log('  ❌ 导入失败:', error.message);
    } else {
        console.log(`  ✅ 成功导入 ${result.length} 行刷单数据`);
    }
}

async function importRefunds() {
    console.log('\n💰 5. 导入退款数据...');
    const file = path.join(DATA_DIR, '退款.xls');
    if (!fs.existsSync(file)) {
        console.log('  ⚠️  文件不存在:', file);
        return;
    }

    const workbook = XLSX.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const rows = data.slice(0, 50).map(row => ({
        shop_id: SHOP_ID,
        order_id: String(row['订单编号'] || ''),
        refund_id: String(row['退款 ID'] || ''),
        refund_amount: parseFloat(row['退款金额']) || 0,
    }));

    const { data: result, error } = await supabase
        .from('refund_reports')
        .insert(rows);

    if (error) {
        console.log('  ⚠️  导入失败（可能表不存在）:', error.message);
    } else {
        console.log(`  ✅ 成功导入 ${result.length} 行退款数据`);
    }
}

async function main() {
    console.log('🚀 开始导入大福纯银数据...');
    console.log('📁 数据目录:', DATA_DIR);
    console.log('🏪 店铺 ID:', SHOP_ID);

    await importShopDaily();
    await importSales();
    await importProductDaily();
    await importFakeOrders();
    await importRefunds();

    console.log('\n✅ 数据导入完成！');
    console.log('🌐 请访问 http://localhost:3000 查看数据');
}

main().catch(console.error);
