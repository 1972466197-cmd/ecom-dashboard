'use client'

import React, { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Shop { id: number; name: string; platform: string; group_id: number }
interface ShopGroup { id: number; name: string }

const GROUP_CONFIG: ShopGroup[] = [
  { id: 1, name: '海林组' },
  { id: 2, name: '培君组' },
  { id: 3, name: '淑贞组' },
  { id: 4, name: '敏贞组' }
]

const TEMPLATES = [
  { id: 'shop-daily', name: '店铺日概况报表', icon: '📊', color: '#1890ff', desc: '店铺每日经营概况数据' },
  { id: 'product-daily', name: '商品日概况', icon: '📦', color: '#722ed1', desc: '商品每日经营数据' },
  { id: 'product-promo', name: '商品推广明细', icon: '📢', color: '#fa8c16', desc: '商品推广投放数据' },
  { id: 'fake-order', name: '刷单明细', icon: '📝', color: '#faad14', desc: '刷单订单明细数据' },
  { id: 'refund', name: '退款明细', icon: '💰', color: '#ff4d4f', desc: '退款订单明细数据' },
  { id: 'sales', name: '销售数据', icon: '📈', color: '#52c41a', desc: '店铺每日销售数据' }
]

export default function DataImport() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedShop, setSelectedShop] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null)

  useEffect(() => { 
    supabase.from('shops').select('*').order('name').then(({data}) => { if(data) setShops(data) })
  }, [])

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
    setToast({message, type})
    setTimeout(() => setToast(null), 5000)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
    const selectedFile = e instanceof File ? e : e.target.files?.[0]
    if (!selectedFile) return
    if (!selectedTemplate) { showToast('请先选择模板', 'error'); return }
    setFile(selectedFile)
    try {
      const workbook = XLSX.read(await selectedFile.arrayBuffer(), {type: 'array'})
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {header: 1, defval: ''})
      const headers = rawData[0] || []
      const data = rawData.slice(1).map(row => {
        const obj: any = {}
        headers.forEach((h: string, i: number) => { if(h && h.trim()) obj[h.trim()] = row[i] || '' })
        return obj
      }).filter(obj => Object.keys(obj).length > 0)
      setHeaders(headers)
      setPreview(data.slice(0, 5))
      console.log('[导入调试] Excel 列名:', headers)
      console.log('[导入调试] 第一行数据:', data[0])
      // 显示所有可能的日期列的值
      const dateCols = ['时间', '日期', '订单时间', '下单时间', '创建时间', '付款时间', '支付时间']
      dateCols.forEach(col => {
        if (data[0] && data[0][col] !== undefined) {
          console.log(`[导入调试] 列"${col}"的值:`, data[0][col], '类型:', typeof data[0][col])
        }
      })
      showToast(`已加载 ${data.length} 行数据，列名：${headers.join(', ')}`, 'success')
    } catch(err) { showToast('文件解析失败', 'error') }
  }

  const getNumber = (row: any, names: string[]) => {
    for (const name of names) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        const num = Number(String(row[name]).replace(/,/g, ''))
        if (!isNaN(num)) return num
      }
    }
    return 0
  }

  const convertRow = (row: any, shopId: number) => {
    // 辅助函数：安全处理日期（支持多种格式）
    const parseDate = (dateStr: string) => {
      if (!dateStr || dateStr === '') {
        console.warn('[parseDate] 空日期，返回今天')
        return new Date().toISOString().split('T')[0]
      }
      
      // 尝试直接解析字符串
      const str = String(dateStr).trim()
      console.log('[parseDate] 输入:', str, '类型:', typeof dateStr)
      
      // 格式 1: 已经是 ISO 格式 (2026-03-31T14:22:58+00:00)
      if (str.includes('T')) {
        const date = str.split('T')[0]
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.log('[parseDate] ISO 格式 ->', date)
          return date
        }
      }
      
      // 格式 2: 纯日期 (2026-03-31)
      if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.log('[parseDate] 标准日期 ->', str)
        return str
      }
      
      // 格式 3: 斜杠日期 (2026/03/31 或 2026/3/31)
      const slashMatch = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
      if (slashMatch) {
        const [, y, m, d] = slashMatch
        const result = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
        console.log('[parseDate] 斜杠日期 ->', result)
        return result
      }
      
      // 格式 4: 中文日期 (2026 年 03 月 31 日 或 2026 年 3 月 31 日)
      const zhMatch = str.match(/(\d{4}) 年 (\d{1,2}) 月 (\d{1,2}) 日/)
      if (zhMatch) {
        const [, y, m, d] = zhMatch
        const result = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
        console.log('[parseDate] 中文日期 ->', result)
        return result
      }
      
      // 格式 5: 横杠日期带时分秒 (2026-03-31 14:30:00)
      const dateTimeMatch = str.match(/^(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}:\d{2}/)
      if (dateTimeMatch) {
        console.log('[parseDate] 日期时间 ->', dateTimeMatch[1])
        return dateTimeMatch[1]
      }
      
      // 格式 6: Excel 序列号（数字）- 从 1900-01-01 开始的天数
      const num = Number(str)
      if (!isNaN(num) && num > 1000 && num < 100000) {
        // Excel 日期序列号转 JS 日期（Excel 的 1 是 1900-01-01）
        const excelBase = new Date(1900, 0, 1)
        // Excel 有个 bug：认为 1900 年是闰年，所以要减 2 天
        const jsDate = new Date(excelBase.getTime() + (num - 2) * 86400 * 1000)
        const result = jsDate.toISOString().split('T')[0]
        console.log('[parseDate] Excel 序列号', num, '->', result)
        return result
      }
      
      // 格式 7: MM/DD/YYYY (美式日期)
      const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (usMatch) {
        const [, m, d, y] = usMatch
        const result = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
        console.log('[parseDate] 美式日期 ->', result)
        return result
      }
      
      // 无法识别，返回今天并警告
      console.warn('[parseDate] 无法识别的日期格式:', str, '返回今天')
      return new Date().toISOString().split('T')[0]
    }
    
    if (selectedTemplate === 'shop-daily') {
      return {
        shop_id: shopId,
        stat_date: parseDate(row['统计日期']),
        shop_name: row['店铺名称'] || '',
        visitors: getNumber(row, ['访客数']),
        cart_users: getNumber(row, ['加购人数']),
        paying_amount: getNumber(row, ['支付金额']),
        paying_buyers: getNumber(row, ['支付买家数']),
        paying_sub_orders: getNumber(row, ['支付子订单数']),
        paying_items: getNumber(row, ['支付件数']),
        ad_cost_total: getNumber(row, ['全站推广花费']),
        ad_keyword_cost: getNumber(row, ['关键词推广花费']),
        ad_smart_cost: getNumber(row, ['智能场景花费']),
        refund_amount: getNumber(row, ['成功退款金额'])
      }
    }
    if (selectedTemplate === 'product-daily') {
      return {
        shop_id: shopId,
        stat_date: parseDate(row['统计日期']),
        product_id_external: String(row['商品 ID'] || ''),
        product_name: row['商品名称'] || '',
        main_product_id: String(row['主商品 ID'] || ''),
        visitors: getNumber(row, ['商品访客数']),
        fav_count: getNumber(row, ['商品收藏人数']),
        cart_users: getNumber(row, ['商品加购人数']),
        paying_buyers: getNumber(row, ['支付买家数']),
        paying_items: getNumber(row, ['支付件数']),
        paying_amount: getNumber(row, ['支付金额'])
      }
    }
    if (selectedTemplate === 'product-promo') {
      return {
        shop_id: shopId,
        report_date: parseDate(row['日期']),
        subject_id: String(row['主体 ID'] || ''),
        subject_type: row['主体类型'] || '',
        subject_name: row['主体名称'] || '',
        impressions: getNumber(row, ['展现量']),
        clicks: getNumber(row, ['点击量']),
        cost: getNumber(row, ['花费']),
        ctr: getNumber(row, ['点击率']),
        roi: getNumber(row, ['投入产出比'])
      }
    }
    if (selectedTemplate === 'fake-order') {
      // 刷单数据：生成虚拟订单号
      const timestamp = Date.now()
      const random = Math.random().toString(36).slice(2, 8)
      const fakeOrderNo = `FAKE${timestamp}${random}`
      // 兼容所有可能的日期列名（按优先级）
      const dateColNames = [
        '订单付款时间', '付款时间', '支付时间', '交易时间', '成交时间',
        '订单时间', '下单时间', '创建时间', '时间', '日期',
        'Date', 'Order Date', 'Time', 'Order Time', 'Payment Time'
      ]
      let dateValue = ''
      for (const col of dateColNames) {
        if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
          dateValue = row[col]
          console.log('[刷单导入] 找到日期列:', col, '值:', dateValue)
          break
        }
      }
      const orderDate = parseDate(dateValue)
      if (!dateValue) {
        console.warn('[刷单导入] 未找到日期列！可用列名:', Object.keys(row))
      }
      // 兼容所有可能的金额列名
      const paidAmount = getNumber(row, [
        '买家实付金额', '实际付款金额', '实付金额', '付款金额', '金额', '买家实付',
        '刷单金额', '佣金', '任务金额', '订单金额', '支付金额',
        '成交金额', '交易金额', '实付', '付款', '金额（元）',
        '付款额', '订单金额（元）', '实付金额（元）', '刷单金额（元）',
        '金额 (元)', '实付 (元)', '付款 (元)', '交易额', '成交金额（元）'
      ])
      const qty = Math.max(getNumber(row, ['购买数量', '数量', '件数', '下单数量', '商品数量', '订购数量']), 1)
      // 兼容所有可能的商品 ID 列名
      const productId = String(row['商品 ID'] || row['商品 id'] || row['product_id'] || row['主体 ID'] || row['商品编号'] || '')
      return {
        shop_id: shopId,
        sub_order_no: fakeOrderNo,
        order_no: fakeOrderNo,
        created_at: orderDate,  // 使用解析后的日期
        buyer_paid_amount: paidAmount,  // 买家实付金额
        quantity: qty,  // 购买数量
        product_id: productId,  // 商品 ID
        product_title: row['商品名称'] || '刷单商品',
        product_price: paidAmount / qty,
        sub_order_total: paidAmount,
        order_status: '已支付',
        is_delivery: false
      }
    }
    if (selectedTemplate === 'refund') {
      // 退款明细
      const dateStr = row['订单付款时间'] || row['订单时间'] || row['付款时间'] || ''
      const orderDate = dateStr ? parseDate(dateStr) : null
      const refundDateStr = row['退款完结时间'] || row['完结时间'] || ''
      const refundDate = refundDateStr ? parseDate(refundDateStr) : null
      // 辅助函数：空字符串转 undefined
      const strOrUndef = (val: any) => (val === '' || val === null || val === undefined) ? undefined : String(val)
      const numOrUndef = (val: any) => (val === '' || val === null || val === undefined) ? undefined : Number(val)
      return {
        shop_id: shopId,
        order_no: strOrUndef(row['订单编号']),
        refund_no: strOrUndef(row['退款编号']),
        payment_no: strOrUndef(row['支付单号']),
        order_paid_at: orderDate || undefined,
        refund_finished_at: refundDate || undefined,
        refund_apply_at: orderDate || undefined,
        product_id_external: strOrUndef(row['商品 id'] || row['商品 ID']),
        product_code: strOrUndef(row['商品编码']),
        product_title: strOrUndef(row['宝贝标题']),
        buyer_paid_amount: getNumber(row, ['买家实际支付金额', '买家实付金额', '实付金额']) || undefined,
        buyer_refund_amount: getNumber(row, ['买家退款金额', '退款金额']) || undefined,
        refund_method: strOrUndef(row['手工退款/系统退款']),
        after_sale_type: strOrUndef(row['售后类型']),
        refund_status: strOrUndef(row['退款状态']),
        goods_status: strOrUndef(row['货物状态']),
        return_logistics_info: strOrUndef(row['退货物流信息']),
        ship_logistics_info: strOrUndef(row['发货物流信息']),
        cs_intervention_status: strOrUndef(row['客服介入状态']),
        seller_name: strOrUndef(row['卖家真实姓名']),
        seller_mobile: strOrUndef(row['卖家手机']),
        return_tracking_no: strOrUndef(row['退货物流单号']),
        return_logistics_company: strOrUndef(row['退货物流公司']),
        buyer_refund_reason: strOrUndef(row['买家退款原因']),
        buyer_refund_desc: strOrUndef(row['买家退款说明']),
        buyer_return_at: row['买家退货时间'] ? parseDate(row['买家退货时间']) : undefined,
        responsibility_party: strOrUndef(row['责任方']),
        sale_stage: strOrUndef(row['售中或售后']),
        remark_tag: strOrUndef(row['备注标签']),
        merchant_remark: strOrUndef(row['商家备注']),
        refund_scope: strOrUndef(row['部分退款/全部退款']),
        auditor_name: strOrUndef(row['审核操作人']),
        refund_auditor: strOrUndef(row['退款操作人']),
        business_type: strOrUndef(row['业务类型']),
        is_help_refund: row['是否帮他退款'] ? (row['是否帮他退款'] === '是' ? true : false) : undefined,
        help_refund_account: strOrUndef(row['帮他退款操作账号']),
        small_amount_collection: getNumber(row, ['小额收款']) || undefined,
        taote_order_info: strOrUndef(row['淘特订单']),
        smart_refund_strategy: strOrUndef(row['智能退款策略']),
        execution_plan: strOrUndef(row['执行方案'])
      }
    }
    return {shop_id: shopId}
  }

  const handleImport = async () => {
    if (!file || !selectedShop || !selectedTemplate) {
      showToast('请选择模板、店铺和文件', 'error')
      return
    }
    setImporting(true)
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), {type: 'array'})
      const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
      const shopId = Number(selectedShop)
      const rowsToInsert = rawData.map(row => convertRow(row, shopId))
      
      let result
      if (selectedTemplate === 'product-daily') {
        const dates = [...new Set(rowsToInsert.map((r: any) => r.stat_date))]
        await supabase.from('product_daily_reports').delete().eq('shop_id', shopId).in('stat_date', dates)
        result = await supabase.from('product_daily_reports').insert(rowsToInsert)
      } else if (selectedTemplate === 'product-promo') {
          // 商品推广明细：先去重，再删除旧数据，最后插入
          const uniqueMap = new Map()
          rowsToInsert.forEach((r: any) => { const key = r.report_date + '_' + r.subject_id; uniqueMap.set(key, r) })
          const uniqueRows = Array.from(uniqueMap.values())
          const dates = [...new Set(uniqueRows.map((r: any) => r.report_date))]
          const subjectIds = [...new Set(uniqueRows.map((r: any) => r.subject_id))]
          await supabase.from('product_promo_reports').delete().eq('shop_id', shopId).in('report_date', dates).in('subject_id', subjectIds)
          result = await supabase.from('product_promo_reports').insert(uniqueRows)
      } else if (selectedTemplate === 'shop-daily') {
        result = await supabase.from('shop_daily_reports').upsert(rowsToInsert, {onConflict: 'shop_id,stat_date'})
      } else if (selectedTemplate === 'sales') {
        result = await supabase.from('sales_data').upsert(rowsToInsert, {onConflict: 'shop_id,date'})
      } else if (selectedTemplate === 'fake-order') {
        // 刷单数据：先删除该店铺该日期的旧刷单数据，再插入新数据（覆盖模式）
        const dates = [...new Set(rowsToInsert.map((r: any) => r.created_at?.split('T')[0]).filter(Boolean))]
        console.log('[导入] 刷单数据覆盖日期:', dates)
        if (dates.length > 0) {
          // 删除该店铺在这些日期的所有刷单数据（is_delivery=false）
          const { error: deleteError } = await supabase.from('orders').delete()
            .eq('shop_id', shopId)
            .in('created_at', dates.map(d => `${d}T00:00:00`))
          if (deleteError) console.error('删除旧数据失败:', deleteError)
        }
        result = await supabase.from('orders').insert(rowsToInsert)
      } else if (selectedTemplate === 'refund') {
        // 退款明细：按退款完结日期覆盖导入（只处理有日期的）
        const dates = [...new Set(rowsToInsert
          .map((r: any) => r.refund_finished_at)
          .filter(dt => dt && typeof dt === 'string' && dt.match(/^\d{4}-\d{2}-\d{2}$/))
        )]
        console.log('[导入] 退款数据覆盖日期:', dates)
        if (dates.length > 0) {
          // 删除该店铺在这些日期的旧退款数据
          const { error: deleteError } = await supabase.from('refund_reports').delete()
            .eq('shop_id', shopId)
            .in('refund_finished_at', dates.map(d => `${d}T00:00:00+00:00`))
          if (deleteError) console.error('删除旧退款数据失败:', deleteError)
        }
        result = await supabase.from('refund_reports').insert(rowsToInsert)
      }
      
      const {data, error} = result!
      console.log('[导入] Supabase 返回:', { data, error })
      if (error) {
        console.error('[导入] 详细错误:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      
      showToast(`✅ 成功导入 ${rowsToInsert.length} 行数据`, 'success')
      setFile(null)
      setPreview([])
      setHeaders([])
    } catch(err: any) {
      console.error('[导入] 异常:', err)
      console.error('[导入] 错误堆栈:', err.stack)
      const errorMsg = err.message || JSON.stringify(err) || '未知错误'
      showToast(`❌ 导入失败：${errorMsg}`, 'error')
    } finally {
      setImporting(false)
    }
  }

  const filteredShops = selectedGroup ? shops.filter(s => s.group_id.toString() === selectedGroup) : shops

  return (
    <div style={{maxWidth: 1400, margin: '0 auto', padding: 24}}>
      <h1 style={{fontSize: 32, fontWeight: 'bold', marginBottom: 32, color: '#1a1a2e'}}>📥 数据导入</h1>
      
      {toast && (
        <div style={{padding: '14 20', marginBottom: 24, borderRadius: 10, background: toast.type === 'success' ? '#d4edda' : '#f8d7da', color: toast.type === 'success' ? '#155724' : '#721c24', fontSize: 15}}>
          {toast.message}
        </div>
      )}

      {/* 顶部：导入模板（2 行 3 列） */}
      <div style={{marginBottom: 32}}>
        <h2 style={{fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e'}}>1️⃣ 选择导入模板</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16}}>
          {TEMPLATES.map(t => (
            <div key={t.id} onClick={() => setSelectedTemplate(t.id)} style={{
              padding: 28, background: selectedTemplate === t.id ? t.color : 'white',
              borderRadius: 14, cursor: 'pointer', border: `3px solid ${selectedTemplate === t.id ? t.color : '#e8e8e8'}`,
              transition: 'all 0.25s ease', boxShadow: selectedTemplate === t.id ? `0 8px 24px ${t.color}40` : '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{fontSize: 40, marginBottom: 14}}>{t.icon}</div>
              <h3 style={{fontSize: 17, fontWeight: 'bold', color: selectedTemplate === t.id ? 'white' : '#1a1a2e', marginBottom: 8}}>{t.name}</h3>
              <p style={{fontSize: 14, color: selectedTemplate === t.id ? 'rgba(255,255,255,0.9)' : '#666'}}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 中部：选择小组和店铺 */}
      <div style={{marginBottom: 32}}>
        <h2 style={{fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e'}}>2️⃣ 选择店铺</h2>
        <div style={{display: 'flex', gap: 16}}>
          <select value={selectedGroup} onChange={(e) => {setSelectedGroup(e.target.value); setSelectedShop('')}} style={{padding: '12 20', borderRadius: 10, border: '1px solid #d9d9d9', fontSize: 15, minWidth: 180}}>
            <option value="">全部小组</option>
            {GROUP_CONFIG.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)} style={{padding: '12 20', borderRadius: 10, border: '1px solid #d9d9d9', fontSize: 15, minWidth: 240}}>
            <option value="">请选择店铺</option>
            {filteredShops.map(s => <option key={s.id} value={s.id}>{s.name} ({s.platform})</option>)}
          </select>
        </div>
      </div>

      {/* 文件上传 */}
      {selectedTemplate && (
        <div style={{marginBottom: 32}}>
          <h2 style={{fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e'}}>3️⃣ 上传 Excel 文件</h2>
          <div onClick={() => fileInputRef.current?.click()} style={{
            border: file ? `3px solid ${TEMPLATES.find(t => t.id === selectedTemplate)?.color}` : '3px dashed #d9d9d9', borderRadius: 16, padding: 48,
            textAlign: 'center', cursor: 'pointer', background: file ? '#f0f8ff' : '#fafafa', transition: 'all 0.25s ease'
          }}>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} style={{display: 'none'}} />
            {file ? (
              <div>
                <div style={{fontSize: 64, marginBottom: 16}}>📄</div>
                <div style={{fontSize: 20, fontWeight: 'bold', color: TEMPLATES.find(t => t.id === selectedTemplate)?.color, marginBottom: 8}}>{file.name}</div>
                <div style={{fontSize: 15, color: '#666'}}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            ) : (
              <div>
                <div style={{fontSize: 64, marginBottom: 16}}>📥</div>
                <div style={{fontSize: 17, color: '#666', marginBottom: 8}}>点击上传 Excel 文件</div>
                <div style={{fontSize: 14, color: '#999'}}>支持 .xlsx, .xls 格式</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 底部：数据预览 */}
      {preview.length > 0 && (
        <div style={{marginBottom: 32}}>
          <h2 style={{fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e'}}>4️⃣ 数据预览（前 5 行）</h2>
          <div style={{background: 'white', borderRadius: 12, overflow: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,0.08)'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 14}}>
              <thead>
                <tr style={{background: '#fafafa'}}>
                  {headers.map(h => (
                    <th key={h} style={{padding: 14, textAlign: 'left', border: '1px solid #e8e8e8', fontWeight: 600}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {headers.map((h, j) => (
                      <td key={j} style={{padding: 14, border: '1px solid #e8e8e8'}}>{String(Object.values(row)[j] || '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 导入按钮 */}
      <button onClick={handleImport} disabled={!file || !selectedShop || importing} style={{
        padding: '16 40', fontSize: 17, fontWeight: 600, borderRadius: 10, border: 'none',
        background: (!file || !selectedShop || importing) ? '#d9d9d9' : TEMPLATES.find(t => t.id === selectedTemplate)?.color || '#1890ff', color: 'white',
        cursor: (!file || !selectedShop || importing) ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', transition: 'all 0.25s ease'
      }}>
        {importing ? '导入中...' : '开始导入'}
      </button>
    </div>
  )
}

