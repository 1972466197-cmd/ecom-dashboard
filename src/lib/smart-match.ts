/**
 * 智能表头匹配工具
 * 用于自动识别 Excel 表头并映射到数据库字段
 */

// 字段映射配置
export interface FieldMapping {
  excelHeader: string
  dbField: string
  matched: boolean
  required: boolean
}

// 字段配置：数据库字段 -> 可能的 Excel 表头变体
export const FIELD_CONFIGS: Record<string, { labels: string[]; required?: boolean }> = {
  // 日期时间
  'date': { labels: ['日期', '时间', '下单时间', '付款时间', '统计日期', '交易时间'], required: true },
  'week_day': { labels: ['星期', '工作日'] },
  'stat_date': { labels: ['统计日期', '日期', '时间'] },
  'report_time': { labels: ['时间', '报告时间', '统计时间'] },
  'report_date': { labels: ['日期', '报告日期', '统计日期'] },
  
  // 店铺信息
  'shop_name': { labels: ['店铺名称', '店铺', '店名', '主体名称'], required: true },
  'shop_id': { labels: ['店铺 ID', '店铺编号'] },
  
  // 销售数据（sales_data 表）
  'pay_amount': { labels: ['销售额', '成交金额', '总成交', '总成交金额'], required: false },
  'pay_orders': { labels: ['支付订单数', '订单数', '付款订单数'], required: false },
  
  // 店铺日概况数据（shop_daily_reports 表）
  'paying_amount': { labels: ['支付金额', '付款金额', '支付金额 (元)'], required: true },
  'paying_buyers': { labels: ['支付买家数', '买家数'], required: false },
  'total_sales': { labels: ['总成交', '总销售额', '销售总额'] },
  'gross_profit': { labels: ['毛利', '毛利润', '总利润'] },
  'net_profit': { labels: ['净利', '净利润', '纯利润'] },
  
  // 流量数据
  'visitors': { labels: ['访客数', '访客', 'UV', '访客人数'] },
  'views': { labels: ['浏览量', 'PV', '访问次数'] },
  'cart_count': { labels: ['加购', '加购件数', '收藏加购'] },
  'cart_users': { labels: ['加购人数', '加购用户数'] },
  
  // 转化数据
  'cvr': { labels: ['转化率', '支付转化率', '成交转化率'] },
  'ctr': { labels: ['点击率'] },
  'avg_order_value': { labels: ['客单价', '平均订单金额'] },
  
  // 推广数据
  'ad_cost_total': { labels: ['全站推广花费', '全站推广', '全站推广费用', '推广费', '广告费', '总推广费', '总推广花费'], required: false },
  'ad_keyword_cost': { labels: ['关键词推广花费', '关键词推广', '关键词', '关键词费用'], required: false },
  'ad_smart_cost': { labels: ['智能场景花费', '智能场景', '智能场景推广', '智能场景费用'], required: false },
  'shop_roi': { labels: ['店铺 ROI', 'ROI', '投产比', '投入产出比'], required: false },
  'net_roi': { labels: ['净投产', '净 ROI'] },
  
  // 退款数据
  'refund_amount': { labels: ['退款金额', '成功退款金额', '买家退款金额'] },
  'return_refund_jqn': { labels: ['退货退款 (千牛)', '退货退款'] },
  'return_refund_jst': { labels: ['退货退款 (水潭)'] },
  'only_refund_amount': { labels: ['仅退款', '仅退款金额'] },
  
  // 刷单数据
  'fake_orders_amount': { labels: ['补单金额', '刷单金额'] },
  'fake_orders_count': { labels: ['补单数', '刷单数', '单量'] },
  
  // 百亿补贴专用字段
  '百亿补贴_info': { labels: ['百亿补贴', '百亿补贴_info', '百亿补贴信息', '百亿补贴活动信息'] },
  '百亿补贴_refund_info': { labels: ['百亿补贴退款', '百亿补贴_refund_info', '百亿补贴退款信息', '百亿补贴售后'] },
  
  // 商品数据
  'product_name': { labels: ['商品名称', '商品标题', '宝贝标题', '产品名称'] },
  'product_id': { labels: ['商品 ID', '商品编号'] },
  'item_number': { labels: ['货号', '商品货号'] },
  'price': { labels: ['商品价格', '单价', '价格'] },
  'quantity': { labels: ['购买数量', '数量', '件数'] },
  
  // 订单数据
  'order_id': { labels: ['订单号', '订单编号', '主订单编号'] },
  'buyer_amount': { labels: ['买家实付金额', '实付金额'] },
  
  // 费用数据
  'commission': { labels: ['佣金', '平台佣金'] },
  'logistics_fee': { labels: ['物流费用', '运费', '快递费'] },
  'platform_fee': { labels: ['手续费', '平台手续费'] },
  'labor_cost': { labels: ['人工场地费用', '人工费'] },
  'purchase_cost': { labels: ['销售采购成本', '采购成本', '成本'] },
  
  // 其他
  'review_count': { labels: ['评价数', '出评数量', '评价数量'] },
  'cs_score': { labels: ['客服评分'] },
  'shop_score': { labels: ['店铺评分'] }
}

/**
 * 智能匹配表头
 * @param header Excel 表头名称
 * @returns 匹配的数据库字段，未匹配返回 null
 */
export function matchHeader(header: string): string | null {
  const normalizedHeader = header.trim().toLowerCase().replace(/\s+/g, '')
  
  // 精确匹配优先
  for (const [dbField, config] of Object.entries(FIELD_CONFIGS)) {
    for (const label of config.labels) {
      const normalizedLabel = label.toLowerCase().replace(/\s+/g, '')
      if (normalizedHeader === normalizedLabel) {
        return dbField
      }
    }
  }
  
  // 包含匹配
  for (const [dbField, config] of Object.entries(FIELD_CONFIGS)) {
    for (const label of config.labels) {
      const normalizedLabel = label.toLowerCase().replace(/\s+/g, '')
      if (normalizedHeader.includes(normalizedLabel) || normalizedLabel.includes(normalizedHeader)) {
        return dbField
      }
    }
  }
  
  // 模糊匹配 - 检查关键字
  const fuzzyMap: Record<string, string> = {
    '日期': 'date', '时间': 'date',
    '店铺': 'shop_name', '店名': 'shop_name',
    '金额': 'pay_amount', '销售': 'pay_amount', '成交': 'pay_amount',
    '订单': 'pay_orders', '买家': 'pay_orders',
    '访客': 'visitors', '浏览': 'views',
    '加购': 'cart_count', '收藏': 'cart_count',
    '转化': 'cvr', '点击': 'ctr',
    '推广': 'ad_cost_total', '广告': 'ad_cost_total',
    'ROI': 'shop_roi', '投产': 'shop_roi',
    '退款': 'refund_amount', '退货': 'refund_amount',
    '补单': 'fake_orders_amount', '刷单': 'fake_orders_amount',
    '百亿补贴': '百亿补贴_info',
    '商品': 'product_name', '宝贝': 'product_name',
    '货号': 'item_number', '成本': 'purchase_cost',
    '佣金': 'commission', '运费': 'logistics_fee',
    '利润': 'gross_profit', '净利': 'net_profit'
  }
  
  for (const [keyword, dbField] of Object.entries(fuzzyMap)) {
    if (normalizedHeader.includes(keyword.toLowerCase())) {
      return dbField
    }
  }
  
  return null
}

/**
 * 自动匹配所有表头
 * @param headers Excel 表头数组
 * @returns FieldMapping[]
 */
export function autoMatchHeaders(headers: string[]): FieldMapping[] {
  return headers.map(header => {
    const dbField = matchHeader(header)
    const config = Object.values(FIELD_CONFIGS).find(c => 
      c.labels.some(l => header.includes(l) || l.includes(header))
    )
    
    return {
      excelHeader: header,
      dbField: dbField || '',
      matched: dbField !== null,
      required: config?.required || false
    }
  })
}

/**
 * 根据映射转换数据行
 * @param row 原始数据行
 * @param mappings 字段映射
 * @returns 转换后的数据对象
 */
export function transformRow(row: any, mappings: FieldMapping[]): any {
  const result: any = {}
  
  mappings.forEach(mapping => {
    if (mapping.matched && mapping.dbField) {
      let value = row[mapping.excelHeader]
      
      // 数值类型转换
      if (typeof value === 'string') {
        // 处理带逗号的数字
        value = value.replace(/,/g, '')
        const numValue = parseFloat(value)
        if (!isNaN(numValue)) {
          value = numValue
        }
      }
      
      result[mapping.dbField] = value
    }
  })
  
  return result
}

/**
 * 获取字段配置
 * @param dbField 数据库字段
 * @returns 字段配置
 */
export function getFieldConfig(dbField: string) {
  return FIELD_CONFIGS[dbField] || { labels: [], required: false }
}
