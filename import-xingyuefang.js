const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// 读取 .env.local 配置
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const dataDir = 'E:\\\\山麓众创科技有限公司\\\\星悦芳店铺数据';

// 清理数字格式（去除逗号）
function cleanNumber(value) {
  if (typeof value === 'string') {
    return parseFloat(value.replace(/,/g, '')) || 0;
  }
  return value || 0;
}

// 清理日期格式
function cleanDate(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    return value.split(' ')[0]; // 只取日期部分
  }
  return value;
}

async function importShopDailyReports() {
  console.log('\n📊 导入店铺日概况报表...');
  
  const filePath = path.join(dataDir, '店铺日概况报表.xlsx');
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  // 查找星悦芳店铺 ID
  const { data: shops } = await supabase
    .from('shops')
    .select('id, name')
    .ilike('name', '%星悦芳%');
  
  const shopId = shops?.[0]?.id || 4; // 默认使用 ID 4（星悦芳）
  console.log(`使用店铺 ID: ${shopId}`);
  
  const rowsToInsert = data.map(row => ({
    shop_id: shopId,
    stat_date: cleanDate(row['统计日期']),
    shop_name: row['店铺名称'] || '星悦芳香港珠宝首饰店',
    visitors: cleanNumber(row['访客数']),
    cart_users: cleanNumber(row['加购人数']),
    paying_amount: cleanNumber(row['支付金额']),
    paying_buyers: cleanNumber(row['支付买家数']),
    paying_sub_orders: cleanNumber(row['支付子订单数']),
    paying_items: cleanNumber(row['支付件数']),
    ad_cost_total: cleanNumber(row['全站推广花费']),
    ad_keyword_cost: cleanNumber(row['关键词推广花费']),
    ad_audience_cost: cleanNumber(row['精准人群推广花费']),
    ad_smart_cost: cleanNumber(row['智能场景花费']),
    refund_amount: cleanNumber(row['成功退款金额']),
    review_count: cleanNumber(row['评价数']),
    review_with_image: cleanNumber(row['有图评价数']),
    desc_score: cleanNumber(row['描述相符评分'])
  }));
  
  const { data: result, error } = await supabase
    .from('shop_daily_reports')
    .upsert(rowsToInsert, { onConflict: 'shop_id,stat_date' })
    .select();
  
  if (error) {
    console.error('❌ 导入失败:', error.message);
  } else {
    console.log(`✅ 成功导入 ${result?.length || 0} 行店铺日概况数据`);
  }
}

async function importProductDailyReports() {
  console.log('\n📦 导入商品日概况报表...');
  
  const filePath = path.join(dataDir, '商品日概况报表.xls');
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // 跳过空行和标题行，找到真正的数据行
  const headers = data[1]; // 第二行是标题
  const headerMap = {};
  headers.forEach((h, i) => {
    if (h && typeof h === 'string' && h.trim()) {
      headerMap[h.trim()] = i;
    }
  });
  
  console.log('找到的字段:', Object.keys(headerMap).length);
  
  const rowsToInsert = [];
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue; // 跳过空行
    
    const getDate = (key) => {
      const idx = headerMap[key];
      return idx !== undefined ? cleanDate(row[idx]) : null;
    };
    
    const getNum = (key) => {
      const idx = headerMap[key];
      return idx !== undefined ? cleanNumber(row[idx]) : 0;
    };
    
    const getStr = (key) => {
      const idx = headerMap[key];
      return idx !== undefined ? (row[idx] || '') : '';
    };
    
    rowsToInsert.push({
      shop_id: 4, // 星悦芳
      report_date: getDate('统计日期'),
      stat_date: getDate('统计日期'),
      product_id_external: getStr('商品 ID'),
      product_name: getStr('商品名称'),
      main_product_id: getStr('主商品 ID'),
      product_type: getStr('商品类型'),
      item_number: getStr('货号'),
      product_status: getStr('商品状态'),
      product_tags: getStr('商品标签'),
      visitors: getNum('商品访客数'),
      views: getNum('商品浏览量'),
      avg_stay_time: getNum('平均停留时长'),
      bounce_rate: getNum('商品详情页跳出率'),
      fav_count: getNum('商品收藏人数'),
      cart_items: getNum('商品加购件数'),
      cart_users: getNum('商品加购人数'),
      order_buyers: getNum('下单买家数'),
      order_items: getNum('下单件数'),
      order_amount: getNum('下单金额'),
      order_cv_rate: getNum('下单转化率'),
      paying_buyers: getNum('支付买家数'),
      paying_items: getNum('支付件数'),
      paying_amount: getNum('支付金额'),
      paying_cv_rate: getNum('商品支付转化率'),
      new_paying_buyers: getNum('支付新买家数'),
      returning_paying_buyers: getNum('支付老买家数'),
      returning_paying_amount: getNum('老买家支付金额'),
      juhuasuan_amount: getNum('聚划算支付金额'),
      avg_visitor_value: getNum('访客平均价值'),
      refund_amount: getNum('成功退款金额'),
      competitiveness_score: getNum('竞争力评分'),
      yearly_paying_amount: getNum('年累计支付金额'),
      monthly_paying_amount: getNum('月累计支付金额'),
      monthly_paying_items: getNum('月累计支付件数'),
      search_cv_rate: getNum('搜索引导支付转化率'),
      search_visitors: getNum('搜索引导访客数'),
      search_paying_buyers: getNum('搜索引导支付买家数')
    });
  }
  
  console.log(`准备导入 ${rowsToInsert.length} 行数据...`);
  
  const { data: result, error } = await supabase
    .from('product_daily_reports')
    .upsert(rowsToInsert, { onConflict: 'product_id_external,report_date' })
    .select();
  
  if (error) {
    console.error('❌ 导入失败:', error.message);
  } else {
    console.log(`✅ 成功导入 ${result?.length || 0} 行商品日概况数据`);
  }
}

async function importFakeOrders() {
  console.log('\n📝 导入刷单报表...');
  
  const filePath = path.join(dataDir, '刷单报表.xlsx');
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  const rowsToInsert = data.map(row => ({
    shop_id: 4, // 星悦芳
    month: row['订单付款时间']?.substring(0, 7) || '',
    report_time: row['订单付款时间']?.split(' ')[0] || '',
    sub_order_no: row['子订单编号'] || '',
    main_order_no: row['主订单编号'] || '',
    product_title: row['商品标题'] || '',
    product_price: cleanNumber(row['商品价格']),
    quantity: cleanNumber(row['购买数量']),
    external_id: row['外部系统编号'] || '',
    product_attrs: row['商品属性'] || '',
    order_status: row['订单状态'] || '',
    merchant_code: row['商家编码'] || '',
    payment_no: row['支付单号'] || '',
    payable_amount: cleanNumber(row['买家应付货款']),
    paid_amount: cleanNumber(row['买家实付金额']),
    refund_status: row['退款状态'] || '',
    refund_amount: row['退款金额'] === '无退款申请' ? 0 : cleanNumber(row['退款金额']),
    order_created_at: row['订单创建时间'] || null,
    order_paid_at: row['订单付款时间'] || null,
    ship_time: row['发货时间'] || null,
    tracking_no: row['物流单号'] || '',
    logistics_company: row['物流公司'] || '',
    should_ship_at: row['应发货时间'] || null,
    product_id_external: row['商品 ID'] || ''
  }));
  
  const { data: result, error } = await supabase
    .from('fake_order_reports')
    .upsert(rowsToInsert, { onConflict: 'main_order_no' })
    .select();
  
  if (error) {
    console.error('❌ 导入失败:', error.message);
  } else {
    console.log(`✅ 成功导入 ${result?.length || 0} 行刷单数据`);
  }
}

async function importRefundReports() {
  console.log('\n💰 导入退款报表...');
  
  const filePath = path.join(dataDir, '退款报表.xls');
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  const rowsToInsert = data.map(row => ({
    shop_id: 4, // 星悦芳
    month: row['订单付款时间']?.substring(0, 7) || '',
    order_no: row['订单编号'] || '',
    refund_no: row['退款编号'] || '',
    payment_no: row['支付单号'] || '',
    order_paid_at: row['订单付款时间'] || null,
    product_id_external: row['商品 id'] || '',
    product_code: row['商品编码'] || '',
    refund_finished_at: row['退款完结时间'] || null,
    buyer_paid_amount: cleanNumber(row['买家实际支付金额']),
    product_title: row['宝贝标题'] || '',
    buyer_refund_amount: cleanNumber(row['买家退款金额']),
    refund_method: row['手工退款/系统退款'] || '',
    after_sale_type: row['售后类型'] || '',
    refund_apply_at: row['退款的申请时间'] || null,
    timeout_at: row['超时时间'] || null,
    refund_status: row['退款状态'] || '',
    goods_status: row['货物状态'] || '',
    return_logistics_info: row['退货物流信息'] || '',
    ship_logistics_info: row['发货物流信息'] || '',
    cs_intervention_status: row['客服介入状态'] || '',
    seller_name: row['卖家真实姓名'] || '',
    seller_return_address: row['卖家退货地址'] || '',
    seller_mobile: row['卖家手机'] || '',
    return_tracking_no: row['退货物流单号'] || '',
    return_logistics_company: row['退货物流公司'] || '',
    buyer_refund_reason: row['买家退款原因'] || '',
    buyer_refund_desc: row['买家退款说明'] || '',
    buyer_return_at: row['买家退货时间'] || null,
    responsibility_party: row['责任方'] || '',
    sale_stage: row['售中或售后'] || '',
    remark_tag: row['备注标签'] || '',
    merchant_remark: row['商家备注'] || '',
    finish_at: row['完结时间'] || '',
    refund_scope: row['部分退款/全部退款'] || '',
    is_zero_response: row['是否零秒响应'] === '是',
    refund_auditor: row['退款操作人'] || '',
    business_type: row['业务类型'] || ''
  }));
  
  const { data: result, error } = await supabase
    .from('refund_reports')
    .upsert(rowsToInsert, { onConflict: 'refund_no' })
    .select();
  
  if (error) {
    console.error('❌ 导入失败:', error.message);
  } else {
    console.log(`✅ 成功导入 ${result?.length || 0} 行退款数据`);
  }
}

async function main() {
  console.log('========================================');
  console.log('   星悦芳店铺数据导入工具');
  console.log('========================================');
  
  try {
    await importShopDailyReports();
    await importProductDailyReports();
    await importFakeOrders();
    await importRefundReports();
    
    console.log('\n========================================');
    console.log('   ✅ 所有数据导入完成！');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ 导入过程中出错:', error.message);
    console.error(error.stack);
  }
}

main();
