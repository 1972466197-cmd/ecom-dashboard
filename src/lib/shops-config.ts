// 28 家店铺配置模板
// 数据来源：Supabase shops 表

export const SHOP_GROUPS = [
  { id: 1, name: '海林组' },
  { id: 2, name: '培君组' },
  { id: 3, name: '淑贞组' },
  { id: 4, name: '敏贞组' }
]

export const SHOPS = [
  // 海林组（9 家）
  { id: 1, name: '银鳞宝', platform: '淘宝', group_id: 1 },
  { id: 2, name: '银时代', platform: '淘宝', group_id: 1 },
  { id: 3, name: '银如意', platform: '淘宝', group_id: 1 },
  { id: 4, name: '银饰坊', platform: '淘宝', group_id: 1 },
  { id: 5, name: '银饰物语', platform: '抖音', group_id: 1 },
  { id: 6, name: '银之韵', platform: '抖音', group_id: 1 },
  { id: 7, name: '德国银饰', platform: '淘宝', group_id: 1 },
  { id: 8, name: '德国银饰店', platform: '淘宝', group_id: 1 },
  { id: 9, name: '德国银饰城', platform: '淘宝', group_id: 1 },
  
  // 培君组（5 家）
  { id: 10, name: '淘宝银饰', platform: '淘宝', group_id: 2 },
  { id: 11, name: '银饰阁', platform: '淘宝', group_id: 2 },
  { id: 12, name: '银饰品', platform: '淘宝', group_id: 2 },
  { id: 13, name: '德国 kymy 家居旗舰店', platform: '淘宝', group_id: 2 },
  { id: 14, name: '山银饰品', platform: '抖音', group_id: 2 },
  
  // 淑贞组（9 家）
  { id: 15, name: '大福纯银', platform: '淘宝', group_id: 3 },
  { id: 16, name: '淘宝银楼', platform: '淘宝', group_id: 3 },
  { id: 17, name: '淘宝银坊', platform: '淘宝', group_id: 3 },
  { id: 18, name: '银太阳', platform: '淘宝', group_id: 3 },
  { id: 19, name: '银饰品店', platform: '抖音', group_id: 3 },
  { id: 20, name: '银饰品铺', platform: '抖音', group_id: 3 },
  { id: 21, name: '淘宝 VMVB 银饰', platform: '淘宝', group_id: 3 },
  { id: 22, name: '德国银选', platform: '淘宝', group_id: 3 },
  { id: 23, name: '银小饰', platform: '淘宝', group_id: 3 },
  
  // 敏贞组（5 家）
  { id: 24, name: '天猫银饰', platform: '天猫', group_id: 4 },
  { id: 25, name: '银之饰', platform: '淘宝', group_id: 4 },
  { id: 26, name: '淘宝银楼', platform: '淘宝', group_id: 4 },
  { id: 27, name: '淘宝银铺', platform: '淘宝', group_id: 4 },
  { id: 28, name: '银饰天堂', platform: '抖音', group_id: 4 }
]

// 按分组获取店铺
export function getShopsByGroup(groupId: number) {
  return SHOPS.filter(s => s.group_id === groupId)
}

// 获取所有店铺总数
export function getTotalShopsCount() {
  return SHOPS.length
}

// 按平台筛选店铺
export function getShopsByPlatform(platform: string) {
  return SHOPS.filter(s => s.platform === platform)
}

// 根据 ID 获取店铺
export function getShopById(id: number) {
  return SHOPS.find(s => s.id === id)
}

// 获取分组统计
export function getGroupStats() {
  return SHOP_GROUPS.map(group => ({
    ...group,
    shopCount: SHOPS.filter(s => s.group_id === group.id).length
  }))
}
