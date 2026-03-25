'use client'

import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface SalesDataRow {
  date: string
  week_day: string
  pay_amount: number
  pay_orders: number
  avg_order_value: number
  visitors: number
  cart_count: number
  cart_rate: number
  ctr: number
  cvr: number
  refund_amount: number
  return_refund_jqn: number
  return_refund_jst: number
  return_refund_orders: number
  only_refund_amount: number
  fake_orders_amount: number
  fake_orders_count: number
  commission: number
  review_count: number
  product_list_count: number
  after_sale_duration: number
  cs_score: number
  shop_score: number
  purchase_cost: number
  return_cost: number
  gross_profit: number
  total_cost: number
  total_sales: number
  ad_cost_total: number
  ad_keyword: number
  ad_audience: number
  shop_roi: number
  logistics_fee: number
  platform_fee: number
  labor_cost: number
  ad_coupon_return: number
  net_profit: number
  net_roi: number
}

interface ShopGroup {
  id: number
  name: string
  shops: ShopOption[]
}

interface ShopOption {
  id: number
  name: string
  platform: string
}

interface ImportTemplate {
  id: string
  name: string
  description: string
  columns: string[]
  requiredColumns: string[]
}

// 分组配置
const GROUP_CONFIG = [
  { id: 1, name: '海林组' },
  { id: 2, name: '培君组' },
  { id: 3, name: '淑贞组' },
  { id: 4, name: '敏贞组' },
]

// 导入模板配置
const IMPORT_TEMPLATES: ImportTemplate[] = [
  {
    id: 'sales',
    name: '销售数据模板',
    description: '店铺每日销售数据（30+ 列）',
    columns: ['日期', '星期', '支付金额', '支付订单数', '客单价', '访客', '加购', '全站推广', '净利', 'ROI'],
    requiredColumns: ['日期', '支付金额', '支付订单数']
  },
  {
    id: 'shop-daily',
    name: '店铺日概况报表',
    description: '店铺每日经营概况（17 列）',
    columns: ['时间', '统计日期', '店铺名称', '访客数', '加购人数', '支付金额', '支付买家数', '推广花费'],
    requiredColumns: ['统计日期', '店铺名称', '支付金额']
  },
  {
    id: 'product-promo',
    name: '商品推广报表',
    description: '淘宝/天猫商品推广数据（56 列）',
    columns: ['时间周期', '日期', '主体名称', '展现量', '点击量', '花费', '点击率', '总成交金额', '投入产出比'],
    requiredColumns: ['日期', '主体名称', '总成交金额']
  },
  {
    id: 'product-daily',
    name: '商品日概况报表',
    description: '商品每日经营数据（42 列）',
    columns: ['日期', '商品名称', '访客数', '浏览量', '下单金额', '支付金额', '支付买家数', '支付转化率'],
    requiredColumns: ['日期', '商品名称', '支付金额']
  },
  {
    id: 'fake-order',
    name: '刷单明细报表',
    description: '刷单订单明细（42 列）',
    columns: ['月份', '时间', '单量', '商品标题', '商品价格', '购买数量', '主订单编号', '买家实付金额'],
    requiredColumns: ['主订单编号', '商品标题', '买家实付金额']
  },
  {
    id: 'refund',
    name: '退款明细报表',
    description: '退款订单明细（54 列）',
    columns: ['月份', '订单编号', '退款编号', '宝贝标题', '买家退款金额', '退款状态', '退款类型', '退款操作人', '业务类型'],
    requiredColumns: ['订单编号', '退款编号', '买家退款金额']
  }
]

export default function DataImport() {
  const router = useRouter()
  const [groupedShops, setGroupedShops] = useState<ShopGroup[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('sales')
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // 加载店铺列表（按分组）
  React.useEffect(() => {
    let mounted = true
    
    const loadShops = async () => {
      setLoading(true)
      try {
        console.log('开始加载店铺列表...')
        
        // 加载店铺数据（包含分组信息）
        const { data: shopsData, error: shopsError } = await supabase
          .from('shops')
          .select('id, name, platform, group_id')
          .order('name')
        
        if (shopsError) throw shopsError
        
        console.log('店铺数据:', shopsData)
        
        if (mounted) {
          // 按分组组织店铺
          const grouped = GROUP_CONFIG.map(group => ({
            id: group.id,
            name: group.name,
            shops: (shopsData || []).filter(s => s.group_id === group.id)
          }))
          
          setGroupedShops(grouped)
          
          const totalShops = grouped.reduce((sum, g) => sum + g.shops.length, 0)
          if (totalShops > 0) {
            showToast(`已加载 ${totalShops} 个店铺`, 'success')
          }
        }
      } catch (err: any) {
        console.error('加载店铺失败:', err)
        if (mounted) {
          showToast('加载店铺失败，使用本地数据', 'error')
          // 降级：使用硬编码店铺列表（按分组）
          const fallbackGroups: ShopGroup[] = [
            {
              id: 1,
              name: '海林组',
              shops: [
                { id: 1, name: '大福珠宝', platform: '淘宝' },
                { id: 2, name: '香港大福', platform: '淘宝' },
                { id: 3, name: '香港万达', platform: '淘宝' },
                { id: 4, name: '星悦芳', platform: '淘宝' },
                { id: 5, name: '抖音安然', platform: '抖音' },
                { id: 6, name: '抖音后宫', platform: '抖音' },
                { id: 7, name: '德国好物', platform: '淘宝' },
                { id: 8, name: '德国冠营', platform: '淘宝' },
                { id: 9, name: '德国黑森林', platform: '淘宝' },
              ]
            },
            {
              id: 2,
              name: '培君组',
              shops: [
                { id: 10, name: '淘宝楠箐', platform: '淘宝' },
                { id: 11, name: '宝怡城', platform: '淘宝' },
                { id: 12, name: '大福银饰', platform: '淘宝' },
                { id: 13, name: '德国 kymy 家居生活馆', platform: '淘宝' },
                { id: 14, name: '山居香铺', platform: '淘宝' },
              ]
            },
            {
              id: 3,
              name: '淑贞组',
              shops: [
                { id: 15, name: '大福纯银', platform: '淘宝' },
                { id: 16, name: '淘宝轻奢', platform: '淘宝' },
                { id: 17, name: '淘宝汀禾', platform: '淘宝' },
                { id: 18, name: '大福太古', platform: '淘宝' },
                { id: 19, name: '抖音楠箐', platform: '抖音' },
                { id: 20, name: '抖音心宿', platform: '抖音' },
                { id: 21, name: '淘宝 VMVB 数码', platform: '淘宝' },
                { id: 22, name: '德国精选', platform: '淘宝' },
                { id: 23, name: '大福小饰逅', platform: '淘宝' },
              ]
            },
            {
              id: 4,
              name: '敏贞组',
              shops: [
                { id: 24, name: '天猫心宿', platform: '淘宝' },
                { id: 25, name: '大福万达', platform: '淘宝' },
                { id: 26, name: '淘宝百年', platform: '淘宝' },
                { id: 27, name: '淘宝范琦', platform: '淘宝' },
                { id: 28, name: '抖音轻奢', platform: '抖音' },
              ]
            },
          ]
          setGroupedShops(fallbackGroups)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    loadShops()
    
    return () => {
      mounted = false
    }
  }, [])

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setPreview([])

    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      setPreview(jsonData.slice(0, 5))
      showToast(`已加载 ${jsonData.length} 行数据`)
    } catch (err) {
      showToast('文件解析失败', 'error')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 映射 Excel 列到数据库字段
  const mapRowToData = (row: any, shopId: number): SalesDataRow => {
    const dateStr = row['日期'] || new Date().toISOString().split('T')[0]
    return {
      date: dateStr,
      week_day: row['星期'] || '',
      pay_amount: Number(row['支付金额'] || 0),
      pay_orders: Number(row['支付订单数'] || 0),
      avg_order_value: Number(row['客单价'] || 0),
      visitors: Number(row['访客'] || 0),
      cart_count: Number(row['加购'] || 0),
      cart_rate: Number(row['加购率'] || 0),
      ctr: Number(row['点击率'] || 0),
      cvr: Number(row['转化率'] || 0),
      refund_amount: Number(row['退款金额'] || 0),
      return_refund_jqn: Number(row['退货退款 (千牛)'] || 0),
      return_refund_jst: Number(row['退货退款 (水潭)'] || 0),
      return_refund_orders: Number(row['退货订单'] || 0),
      only_refund_amount: Number(row['仅退款'] || 0),
      fake_orders_amount: Number(row['补单金额'] || 0),
      fake_orders_count: Number(row['补单量'] || 0),
      commission: Number(row['佣金'] || 0),
      review_count: Number(row['出评数量 (带图)'] || 0),
      product_list_count: Number(row['上品数量'] || 0),
      after_sale_duration: Number(row['售后处理时长'] || 0),
      cs_score: Number(row['客服评分'] || 0),
      shop_score: Number(row['店铺评分'] || 0),
      purchase_cost: Number(row['销售采购成本'] || 0),
      return_cost: Number(row['退回成本'] || 0),
      gross_profit: Number(row['毛利'] || 0),
      total_cost: Number(row['总花费'] || 0),
      total_sales: Number(row['总成交'] || 0),
      ad_cost_total: Number(row['全站推广'] || 0),
      ad_keyword: Number(row['关键词'] || 0),
      ad_audience: Number(row['人群'] || 0),
      shop_roi: Number(row['店铺 ROI'] || 0),
      logistics_fee: Number(row['物流费用'] || 0),
      platform_fee: Number(row['手续费'] || 0),
      labor_cost: Number(row['人工场地费用'] || 0),
      ad_coupon_return: Number(row['推广优惠券返还'] || 0),
      net_profit: Number(row['净利'] || 0),
      net_roi: Number(row['净投产'] || 0),
    }
  }

  // 执行导入
  const handleImport = async () => {
    if (!file || !selectedShop) {
      showToast('请选择店铺和文件', 'error')
      return
    }

    setImporting(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const shopId = Number(selectedShop)

      if (selectedTemplate === 'shop-daily') {
        // 店铺日概况报表导入
        const rowsToInsert = jsonData.map((row: any) => ({
          shop_id: shopId,
          report_time: row['时间'] || '',
          stat_date: row['统计日期'] || new Date().toISOString().split('T')[0],
          shop_name: row['店铺名称'] || '',
          visitors: Number(row['访客数'] || 0),
          cart_users: Number(row['加购人数'] || 0),
          paying_amount: Number(row['支付金额'] || 0),
          paying_buyers: Number(row['支付买家数'] || 0),
          paying_sub_orders: Number(row['支付子订单数'] || 0),
          paying_items: Number(row['支付件数'] || 0),
          ad_cost_total: Number(row['全站推广花费'] || 0),
          ad_keyword_cost: Number(row['关键词推广花费'] || 0),
          ad_audience_cost: Number(row['精准人群推广花费'] || 0),
          ad_smart_cost: Number(row['智能场景花费'] || 0),
          refund_amount: Number(row['成功退款金额'] || 0),
          review_count: Number(row['评价数'] || 0),
          review_with_image: Number(row['有图评价数'] || 0),
          desc_score: Number(row['描述相符评分'] || 0),
        }))
        
        const { data, error } = await supabase
          .from('shop_daily_reports')
          .upsert(rowsToInsert, { onConflict: 'shop_id,stat_date' })
          .select()
        if (error) throw error
        showToast(`成功导入 ${rowsToInsert.length} 行店铺日概况数据！`)
      } else if (selectedTemplate === 'sales') {
        // 销售数据导入
        const rowsToInsert = jsonData.map((row: any) => mapRowToData(row, shopId))
        const { data, error } = await supabase
          .from('sales_data')
          .upsert(rowsToInsert, { onConflict: 'shop_id,date' })
          .select()
        if (error) throw error
        showToast(`成功导入 ${rowsToInsert.length} 行销售数据！`)
      } else if (selectedTemplate === 'product-promo') {
        // 商品推广报表导入
        showToast('商品推广报表导入功能开发中，请联系技术支持', 'error')
        return
      } else if (selectedTemplate === 'product-daily') {
        // 商品日概况报表导入
        const rowsToInsert = jsonData.map((row: any) => ({
          shop_id: shopId,
          time_period: row['时间周期'] || '',
          report_date: row['日期'] || row['统计日期'] || new Date().toISOString().split('T')[0],
          stat_date: row['统计日期'] || row['日期'] || new Date().toISOString().split('T')[0],
          product_id_external: row['商品 ID'] || '',
          product_name: row['商品名称'] || '',
          main_product_id: row['主商品 ID'] || '',
          product_type: row['商品类型'] || '',
          item_number: row['货号'] || '',
          product_status: row['商品状态'] || '',
          product_tags: row['商品标签'] || '',
          visitors: Number(row['商品访客数'] || 0),
          views: Number(row['商品浏览量'] || 0),
          avg_stay_time: Number(row['平均停留时长'] || 0),
          bounce_rate: Number(row['商品详情页跳出率'] || 0),
          fav_count: Number(row['商品收藏人数'] || 0),
          cart_items: Number(row['商品加购件数'] || 0),
          cart_users: Number(row['商品加购人数'] || 0),
          order_buyers: Number(row['下单买家数'] || 0),
          order_items: Number(row['下单件数'] || 0),
          order_amount: Number(row['下单金额'] || 0),
          order_cv_rate: Number(row['下单转化率'] || 0),
          paying_buyers: Number(row['支付买家数'] || 0),
          paying_items: Number(row['支付件数'] || 0),
          paying_amount: Number(row['支付金额'] || 0),
          paying_cv_rate: Number(row['商品支付转化率'] || 0),
          new_paying_buyers: Number(row['支付新买家数'] || 0),
          returning_paying_buyers: Number(row['支付老买家数'] || 0),
          returning_paying_amount: Number(row['老买家支付金额'] || 0),
          juhuasuan_amount: Number(row['聚划算支付金额'] || 0),
          avg_visitor_value: Number(row['访客平均价值'] || 0),
          refund_amount: Number(row['成功退款金额'] || 0),
          competitiveness_score: Number(row['竞争力评分'] || 0),
          yearly_paying_amount: Number(row['年累计支付金额'] || 0),
          monthly_paying_amount: Number(row['月累计支付金额'] || 0),
          monthly_paying_items: Number(row['月累计支付件数'] || 0),
          search_cv_rate: Number(row['搜索引导支付转化率'] || 0),
          search_visitors: Number(row['搜索引导访客数'] || 0),
          search_paying_buyers: Number(row['搜索引导支付买家数'] || 0),
          structured_detail_cv_rate: Number(row['结构化详情引导转化率'] || 0),
          structured_detail_ratio: Number(row['结构化详情引导成交占比'] || 0),
        }))
        
        const { data, error } = await supabase
          .from('product_daily_reports')
          .upsert(rowsToInsert, { onConflict: 'product_id_external,report_date' })
          .select()
        if (error) throw error
        showToast(`成功导入 ${rowsToInsert.length} 行商品日概况数据！`)
      } else if (selectedTemplate === 'fake-order') {
        // 刷单明细报表导入
        const rowsToInsert = jsonData.map((row: any) => ({
          shop_id: shopId,
          month: row['月份'] || '',
          report_time: row['时间'] || '',
          shop_order_count: Number(row['单量 (店铺)'] || 0),
          product_order_count: Number(row['单量 (单品)'] || 0),
          order_id: row['id'] || '',
          sub_order_no: row['子订单编号'] || '',
          main_order_no: row['主订单编号'] || '',
          product_title: row['商品标题'] || '',
          product_price: Number(row['商品价格'] || 0),
          quantity: Number(row['购买数量'] || 0),
          external_id: row['外部系统编号'] || '',
          product_attrs: row['商品属性'] || '',
          package_info: row['套餐信息'] || '',
          contact_remark: row['联系方式备注'] || '',
          order_status: row['订单状态'] || '',
          merchant_code: row['商家编码'] || '',
          payment_no: row['支付单号'] || '',
          payable_amount: Number(row['买家应付货款'] || 0),
          paid_amount: Number(row['买家实付金额'] || 0),
          refund_status: row['退款状态'] || '',
          refund_amount: Number(row['退款金额'] || 0),
          order_created_at: row['订单创建时间'] || null,
          order_paid_at: row['订单付款时间'] || null,
          ship_time: row['发货时间'] || null,
          should_ship_at: row['应发货时间'] || null,
          taoxianda_channel: row['淘鲜达渠道'] || '',
          fliggy_order_info: row['飞猪购订单信息'] || '',
          free_order_qualification: row['免单资格'] || '',
          free_order_amount: Number(row['免单金额'] || 0),
          百亿补贴_info: row['百亿补贴超链订单信息'] || '',
          chain_half_managed_info: row['超链半托管订单信息'] || '',
          product_id_external: row['商品 ID'] || '',
          remark_tag: row['备注标签'] || '',
          merchant_remark: row['商家备注'] || '',
          buyer_message: row['主订单买家留言'] || '',
          tracking_no: row['物流单号'] || '',
          logistics_company: row['物流公司'] || '',
          is_compensation: row['是否主动赔付'] === '是' || row['是否主动赔付'] === true,
          compensation_amount: Number(row['主动赔付金额'] || 0),
          compensation_paid_at: row['主动赔付出账时间'] || null,
        }))
        
        const { data, error } = await supabase
          .from('fake_order_reports')
          .upsert(rowsToInsert, { onConflict: 'main_order_no' })
          .select()
        if (error) throw error
        showToast(`成功导入 ${rowsToInsert.length} 行刷单明细数据！`)
      } else if (selectedTemplate === 'refund') {
        // 退款明细报表导入（新版 54 列）
        const rowsToInsert = jsonData.map((row: any) => ({
          shop_id: shopId,
          month: row['月份'] || '',
          product_time: row['单品情况用时间'] || '',
          refund_finished_at: row['退款完结时间'] || null,
          refund_apply_at: row['退款的申请时间'] || null,
          paid_at: row['付款时间'] || null,
          refund_type1: row['退款类型 1'] || '',
          refund_type2: row['退款类型 2'] || '',
          order_count: Number(row['单量'] || 0),
          order_no: row['订单编号'] || '',
          refund_no: row['退款编号'] || '',
          payment_no: row['支付单号'] || '',
          order_paid_at: row['订单付款时间'] || null,
          product_id_external: row['商品 id'] || '',
          product_code: row['商品编码'] || '',
          product_title: row['宝贝标题'] || '',
          refund_finished_at_1: row['退款完结时间.1'] || null,
          buyer_paid_amount: Number(row['买家实际支付金额'] || 0),
          buyer_refund_amount: Number(row['买家退款金额'] || 0),
          refund_method: row['手工退款 / 系统退款'] || '',
          after_sale_type: row['售后类型'] || '',
          refund_apply_at_1: row['退款的申请时间.1'] || null,
          timeout_at: row['超时时间'] || null,
          finish_at: row['完结时间'] || null,
          refund_status: row['退款状态'] || '',
          goods_status: row['货物状态'] || '',
          return_logistics_info: row['退货物流信息'] || '',
          ship_logistics_info: row['发货物流信息'] || '',
          cs_intervention_status: row['客服介入状态'] || '',
          seller_name: row['卖家真实姓名'] || '',
          seller_name_new: row['卖家真实姓名 (新)'] || '',
          seller_return_address: row['卖家退货地址'] || '',
          seller_zip: row['卖家邮编'] || '',
          seller_phone: row['卖家电话'] || '',
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
          refund_scope: row['部分退款 / 全部退款'] || '',
          auditor_name: row['审核操作人'] || '',
          auditor_name_new: row['审核操作人新会员名'] || '',
          evidence_timeout_at: row['举证超时'] || null,
          is_zero_response: row['是否零秒响应'] === '是' || row['是否零秒响应'] === true,
          // 新增字段（AW-BG 列）
          refund_auditor: row['退款操作人'] || '',
          refund_auditor_new: row['退款操作人新会员名'] || '',
          refund_reason_tag: row['退款原因标签'] || '',
          business_type: row['业务类型'] || '',
          is_help_refund: row['是否帮他退款'] === '是' || row['是否帮他退款'] === true,
          help_refund_account: row['帮他退款操作账号'] || '',
          small_amount_collection: Number(row['小额收款'] || 0),
          taote_order_info: row['淘特订单'] || '',
          百亿补贴_refund_info: row['百亿补贴超链退款信息'] || '',
          smart_refund_strategy: row['智能退款策略'] || '',
          execution_plan: row['执行方案'] || '',
        }))
        
        const { data, error } = await supabase
          .from('refund_reports')
          .upsert(rowsToInsert, { onConflict: 'refund_no' })
          .select()
        if (error) throw error
        showToast(`成功导入 ${rowsToInsert.length} 行退款明细数据！`)
      }

      setFile(null)
      setPreview([])
      setSelectedShop('')
    } catch (err: any) {
      console.error('导入失败:', err)
      showToast(`导入失败：${err.message}`, 'error')
    } finally {
      setImporting(false)
    }
  }

  // 下载导入模板
  const handleDownloadTemplate = () => {
    if (selectedTemplate === 'shop-daily') {
      // 店铺日概况报表模板
      const template = [
        {
          '时间': '2026-03-23',
          '统计日期': '2026-03-23',
          '店铺名称': '大福珠宝',
          '访客数': 3750,
          '加购人数': 562,
          '支付金额': 125000,
          '支付买家数': 1389,
          '支付子订单数': 1528,
          '支付件数': 2083,
          '全站推广花费': 27500,
          '关键词推广花费': 16500,
          '精准人群推广花费': 8250,
          '智能场景花费': 2750,
          '成功退款金额': 6250,
          '评价数': 278,
          '有图评价数': 139,
          '描述相符评分': 4.8
        }
      ]
      const worksheet = XLSX.utils.json_to_sheet(template)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '店铺日概况')
      XLSX.writeFile(workbook, '店铺日概况报表导入模板.xlsx')
      showToast('店铺日概况报表模板已下载')
    } else if (selectedTemplate === 'refund') {
      // 退款明细报表模板（新版 54 列）
      const template = [
        {
          '月份': '2026-03',
          '单品情况用时间': '2026-03-23',
          '退款完结时间': '2026-03-25 15:00:00',
          '退款的申请时间': '2026-03-23 10:30:00',
          '付款时间': '2026-03-22 14:00:00',
          '退款类型 1': '仅退款',
          '退款类型 2': '未收到货',
          '单量': 1,
          '订单编号': 'MO202603230001',
          '退款编号': 'RF202603230001',
          '支付单号': 'PAY202603230001',
          '订单付款时间': '2026-03-22 14:05:00',
          '商品 id': '12345678',
          '商品编码': 'TS-2026-001',
          '退款完结时间.1': '2026-03-25 15:00:00',
          '买家实际支付金额': 198,
          '宝贝标题': '测试商品 A 春夏新款 T 恤',
          '买家退款金额': 198,
          '手工退款 / 系统退款': '系统退款',
          '售后类型': '售中退款',
          '退款的申请时间.1': '2026-03-23 10:30:00',
          '超时时间': '2026-03-26 10:30:00',
          '退款状态': '退款成功',
          '货物状态': '未发货',
          '退货物流信息': '',
          '发货物流信息': '',
          '客服介入状态': '未介入',
          '卖家真实姓名': '张三',
          '卖家真实姓名 (新)': '张三',
          '卖家退货地址': '广东省广州市天河区 XXX 路 XXX 号',
          '卖家邮编': '510000',
          '卖家电话': '020-12345678',
          '卖家手机': '13800138000',
          '退货物流单号': '',
          '退货物流公司': '',
          '买家退款原因': '拍错/多拍',
          '买家退款说明': '不想要了',
          '买家退货时间': '',
          '责任方': '买家',
          '售中或售后': '售中',
          '备注标签': '快速退款',
          '商家备注': '同意退款',
          '完结时间': '2026-03-25 15:00:00',
          '部分退款 / 全部退款': '全部退款',
          '审核操作人': 'admin',
          '审核操作人新会员名': 'admin',
          '举证超时': '',
          '是否零秒响应': '是',
          '退款操作人': 'admin',
          '退款操作人新会员名': 'admin',
          '退款原因标签': '拍错',
          '业务类型': '淘宝',
          '是否帮他退款': '否',
          '帮他退款操作账号': '',
          '小额收款': 0,
          '淘特订单': '',
          '百亿补贴超链退款信息': '',
          '智能退款策略': '自动通过',
          '执行方案': '标准流程'
        }
      ]
      const worksheet = XLSX.utils.json_to_sheet(template)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '退款明细')
      XLSX.writeFile(workbook, '退款明细报表导入模板（新版 54 列）.xlsx')
      showToast('退款明细报表模板（新版）已下载')
    } else if (selectedTemplate === 'fake-order') {
      // 商品日概况报表模板
      const template = [
        {
          '时间周期': '2026-03-23~2026-03-23',
          '日期': '2026-03-23',
          '统计日期': '2026-03-23',
          '商品 ID': '12345678',
          '商品名称': '测试商品 A',
          '主商品 ID': '12345678',
          '商品类型': '宝贝',
          '货号': 'TS-2026-001',
          '商品状态': '在售',
          '商品标签': '新款，热销',
          '商品访客数': 3750,
          '商品浏览量': 11250,
          '平均停留时长': 185,
          '商品详情页跳出率': 35,
          '商品收藏人数': 315,
          '商品加购件数': 562,
          '商品加购人数': 450,
          '下单买家数': 450,
          '下单件数': 675,
          '下单金额': 67500,
          '下单转化率': 12,
          '支付买家数': 375,
          '支付件数': 525,
          '支付金额': 52500,
          '商品支付转化率': 10,
          '支付新买家数': 225,
          '支付老买家数': 150,
          '老买家支付金额': 21000,
          '聚划算支付金额': 10500,
          '访客平均价值': 14,
          '成功退款金额': 2625,
          '竞争力评分': 85,
          '年累计支付金额': 1575000,
          '月累计支付金额': 1575000,
          '月累计支付件数': 15750,
          '搜索引导支付转化率': 8,
          '搜索引导访客数': 1875,
          '搜索引导支付买家数': 150,
          '结构化详情引导转化率': 15,
          '结构化详情引导成交占比': 60
        }
      ]
      const worksheet = XLSX.utils.json_to_sheet(template)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '商品日概况')
      XLSX.writeFile(workbook, '商品日概况报表导入模板.xlsx')
      showToast('商品日概况报表模板已下载')
    } else if (selectedTemplate === 'sales') {
      // 销售数据模板
      const template = [
        {
          '日期': '2026-03-23',
          '星期': '周一',
          '支付金额': 125000,
          '支付订单数': 1389,
          '客单价': 89.9,
          '访客': 3750,
          '加购': 562,
          '加购率': 15.1,
          '点击率': 4.2,
          '转化率': 37.1,
          '退款金额': 8750,
          '退货退款 (千牛)': 6250,
          '退货退款 (水潭)': 6000,
          '退货订单': 83,
          '仅退款': 2500,
          '补单金额': 5000,
          '补单量': 56,
          '佣金': 3750,
          '出评数量 (带图)': 45,
          '上品数量': 8,
          '售后处理时长': 18.5,
          '客服评分': 4.8,
          '店铺评分': 4.7,
          '销售采购成本': 43750,
          '退回成本': 3750,
          '毛利': 43750,
          '总花费': 81250,
          '总成交': 125000,
          '全站推广': 27500,
          '关键词': 16500,
          '人群': 11000,
          '店铺 ROI': 4.55,
          '物流费用': 5000,
          '手续费': 6250,
          '人工场地费用': 8500,
          '推广优惠券返还': 1375,
          '净利': 31250,
          '净投产': 1.14
        }
      ]
      const worksheet = XLSX.utils.json_to_sheet(template)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '销售数据模板')
      XLSX.writeFile(workbook, '销售数据导入模板.xlsx')
      showToast('销售数据模板已下载')
    } else if (selectedTemplate === 'product') {
      // 商品推广报表模板
      const template = [
        {
          '时间周期': '2026-03-23~2026-03-23',
          '日期': '2026-03-23',
          '主体 ID': '12345',
          '主体类型': '宝贝',
          '主体名称': '测试商品 A',
          '展现量': 125000,
          '点击量': 5250,
          '花费': 8750,
          '点击率': 4.2,
          '平均点击花费': 1.67,
          '千次展现花费': 70,
          '总预售成交金额': 0,
          '总预售成交笔数': 0,
          '直接预售成交金额': 0,
          '直接预售成交笔数': 0,
          '间接预售成交金额': 0,
          '间接预售成交笔数': 0,
          '直接成交金额': 45000,
          '间接成交金额': 15000,
          '总成交金额': 60000,
          '总成交笔数': 525,
          '直接成交笔数': 350,
          '间接成交笔数': 175,
          '点击转化率': 6.67,
          '投入产出比': 6.86,
          '含预售投产比': 6.86,
          '总成交成本': 8750,
          '总购物车数': 788,
          '直接购物车数': 525,
          '间接购物车数': 263,
          '加购率': 15,
          '收藏宝贝数': 315,
          '收藏店铺数': 105,
          '店铺收藏成本': 83.33,
          '总收藏加购数': 1103,
          '总收藏加购成本': 7.93,
          '宝贝收藏加购数': 840,
          '宝贝收藏加购成本': 10.42,
          '总收藏数': 420,
          '宝贝收藏成本': 20.83,
          '宝贝收藏率': 0.25,
          '加购成本': 11.11,
          '拍下订单笔数': 525,
          '拍下订单金额': 60000,
          '直接收藏宝贝数': 210,
          '间接收藏宝贝数': 105,
          '优惠券领取量': 1050,
          '购物金充值笔数': 53,
          '购物金充值金额': 10500,
          '旺旺咨询量': 210,
          '引导访问量': 2100,
          '引导访问人数': 1575,
          '引导访问潜客数': 945,
          '引导访问潜客占比': 60,
          '入会率': 8.5,
          '入会量': 134,
          '引导访问率': 12.6,
          '深度访问量': 1050,
          '平均访问页面数': 4.2,
          '成交新客数': 315,
          '成交新客占比': 60,
          '会员首购人数': 53,
          '会员成交金额': 18000,
          '会员成交笔数': 158,
          '成交人数': 525,
          '人均成交笔数': 1,
          '人均成交金额': 114.29,
          '自然流量转化金额': 24000,
          '自然流量曝光量': 62500,
          '平台助推总成交': 12000,
          '平台助推直接成交': 9000,
          '平台助推点击': 1050
        }
      ]
      const worksheet = XLSX.utils.json_to_sheet(template)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '商品推广报表')
      XLSX.writeFile(workbook, '商品推广报表导入模板.xlsx')
      showToast('商品推广报表模板已下载')
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* 侧边栏 */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <h2 className="text-2xl font-bold mb-8 text-orange-500">山麓众创科技</h2>
        <nav className="space-y-4">
          <a href="/" className="block py-2 px-4 hover:bg-slate-800 rounded">📊 经营看板</a>
          <a href="/products" className="block py-2 px-4 hover:bg-slate-800 rounded">📦 商品管理</a>
          <a href="/sales" className="block py-2 px-4 hover:bg-slate-800 rounded">🏪 店铺销售情况</a>
          <a href="/import" className="block py-2 px-4 bg-slate-800 rounded">📥 数据导入</a>
          <a href="/shops" className="block py-2 px-4 hover:bg-slate-800 rounded">📈 店铺每日盈亏</a>
          <a href="/profit" className="block py-2 px-4 hover:bg-slate-800 rounded">💰 利润监控</a>
          <a href="/settings" className="block py-2 px-4 hover:bg-slate-800 rounded">⚙️ 系统设置</a>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-8">
        {/* 头部 + 返回按钮 */}
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              title="返回上一页"
            >
              ← 返回
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">📥 数据导入</h1>
              <p className="text-slate-500 mt-1">上传 Excel 文件导入店铺销售数据</p>
            </div>
          </div>
        </header>

        {/* 导入表单 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
          {/* 模板选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              选择导入模板 *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {IMPORT_TEMPLATES.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800">{template.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        必填：{template.requiredColumns.join('、')}
                      </p>
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="text-orange-500 text-xl">✅</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 模板说明 */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                当前模板
              </label>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-medium text-slate-800">
                  {IMPORT_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {IMPORT_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
                </p>
              </div>
            </div>

            {/* 店铺选择（按分组） */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                选择店铺 *
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="animate-spin">⏳</span>
                  加载中...
                </div>
              ) : (
                <select
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">请选择店铺</option>
                  {groupedShops.map(group => (
                    <optgroup key={group.id} label={group.name}>
                      {group.shops.map(shop => (
                        <option key={shop.id} value={shop.id}>
                          {shop.name} - {shop.platform}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
              {groupedShops.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  共 {groupedShops.reduce((sum, g) => sum + g.shops.length, 0)} 个店铺
                </p>
              )}
            </div>

            {/* 文件上传 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                上传 Excel 文件 *
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-orange-500 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div>
                    <p className="text-lg">📄</p>
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl mb-2">📁</p>
                    <p className="text-slate-500">点击选择 Excel 文件</p>
                    <p className="text-xs text-slate-400 mt-1">支持 .xlsx, .xls 格式</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
            >
              📥 下载导入模板
            </button>
            <button
              onClick={handleImport}
              disabled={!file || !selectedShop || importing}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  导入中...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  开始导入
                </>
              )}
            </button>
          </div>
        </div>

        {/* 数据预览 */}
        {preview.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">📋 数据预览（前 5 行）</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3">日期</th>
                    <th className="px-4 py-3">支付金额</th>
                    <th className="px-4 py-3">订单数</th>
                    <th className="px-4 py-3">推广费</th>
                    <th className="px-4 py-3">净利</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{row['日期'] || '-'}</td>
                      <td className="px-4 py-3">¥{Number(row['支付金额'] || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">{Number(row['支付订单数'] || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-orange-600">¥{Number(row['全站推广'] || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-600">¥{Number(row['净利'] || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="font-bold text-blue-900 mb-2">📖 导入模板说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-medium mb-1">必填列：</p>
              <ul className="space-y-1">
                <li>• 日期（格式：2026-03-23）</li>
                <li>• 支付金额</li>
                <li>• 支付订单数</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">可选列：</p>
              <ul className="space-y-1">
                <li>• 星期、访客、加购率、转化率</li>
                <li>• 退款金额、退货退款</li>
                <li>• 推广费、ROI、净利</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-3">
            💡 提示：相同店铺 + 日期的数据会自动覆盖更新
          </p>
        </div>
      </main>
    </div>
  )
}
