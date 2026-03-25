// 店铺数据同步工具
// 用于在 localStorage 中存储和同步店铺数据

const STORAGE_KEY_PREFIX = 'shop_data_'
const SYNC_EVENT = 'shop-data-sync'

// 获取店铺数据
export function getShopData(shopName: string): any[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${shopName}`)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

// 保存店铺数据
export function saveShopData(shopName: string, data: any[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${shopName}`, JSON.stringify(data))
  // 触发同步事件
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { shopName, data } }))
}

// 获取所有店铺数据
export function getAllShopData(): Record<string, any[]> {
  if (typeof window === 'undefined') return {}
  const result: Record<string, any[]> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      const shopName = key.replace(STORAGE_KEY_PREFIX, '')
      try {
        result[shopName] = JSON.parse(localStorage.getItem(key) || '[]')
      } catch {
        result[shopName] = []
      }
    }
  }
  return result
}

// 计算店铺汇总数据
export function calculateShopSummary(data: any[]) {
  const totalSales = data.reduce((sum, row) => sum + (row.totalSales || 0), 0)
  const totalProfit = data.reduce((sum, row) => sum + (row.grossProfit || 0), 0)
  const totalAdCost = data.reduce((sum, row) => sum + (row.adCost || 0), 0)
  const totalOrders = data.reduce((sum, row) => sum + (row.totalOrders || 0), 0)
  
  return {
    totalSales,
    totalProfit,
    totalAdCost,
    totalOrders,
    roi: totalAdCost > 0 ? (totalSales / totalAdCost).toFixed(2) : '0.00',
    avgReturnRate: data.length > 0 
      ? (data.reduce((sum, row) => sum + (row.returnRate || 0), 0) / data.length).toFixed(1)
      : '0.0'
  }
}

// 计算所有店铺的总汇总
export function calculateGrandTotal(allData: Record<string, any[]>) {
  let grandTotalSales = 0
  let grandTotalProfit = 0
  let grandTotalAdCost = 0
  let grandTotalOrders = 0
  let shopCount = 0
  
  Object.values(allData).forEach(data => {
    if (data.length > 0) {
      shopCount++
      grandTotalSales += data.reduce((sum, row) => sum + (row.totalSales || 0), 0)
      grandTotalProfit += data.reduce((sum, row) => sum + (row.grossProfit || 0), 0)
      grandTotalAdCost += data.reduce((sum, row) => sum + (row.adCost || 0), 0)
      grandTotalOrders += data.reduce((sum, row) => sum + (row.totalOrders || 0), 0)
    }
  })
  
  return {
    totalSales: grandTotalSales,
    totalProfit: grandTotalProfit,
    totalAdCost: grandTotalAdCost,
    totalOrders: grandTotalOrders,
    roi: grandTotalAdCost > 0 ? (grandTotalSales / grandTotalAdCost).toFixed(2) : '0.00',
    shopCount
  }
}

// 监听数据同步事件
export function onShopDataSync(callback: (data: { shopName: string, data: any[] }) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent
    callback(customEvent.detail)
  }
  window.addEventListener(SYNC_EVENT, handler as EventListener)
  return () => window.removeEventListener(SYNC_EVENT, handler as EventListener)
}
