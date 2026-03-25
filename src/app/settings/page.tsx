'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Shop {
  id: number
  shop_id: number | null
  shop_name: string
  platform: string | null
  group_id: number | null
  manager_name: string | null
  account_name: string | null
  is_custom: boolean
}

interface ShopGroup {
  id: number
  name: string
}

interface UserGroup {
  id: number
  name: string
  description: string
}

interface SystemUser {
  id: number
  username: string | null
  email: string | null
  full_name: string | null
  group_id: number | null
  role: string
  phone: string | null
  status: string
}

interface MenuPermission {
  menu_code: string
  menu_name: string
  parent_code: string | null
  sort_order: number
  icon: string
  path: string
  template_type: string | null
}

type TabType = 'shop' | 'user' | 'permission' | 'group'

// 角色配置
const ROLES = [
  { value: 'admin', label: '管理员', color: 'bg-red-100 text-red-700' },
  { value: 'group_leader', label: '组长', color: 'bg-purple-100 text-purple-700' },
  { value: 'shop_manager', label: '店长', color: 'bg-blue-100 text-blue-700' },
  { value: 'operator', label: '运营', color: 'bg-green-100 text-green-700' },
  { value: 'assistant', label: '运营助理', color: 'bg-slate-100 text-slate-700' }
]

// 分组配置
const GROUPS = [
  { id: 1, name: '海林组' },
  { id: 2, name: '培君组' },
  { id: 3, name: '敏贞组' },
  { id: 4, name: '淑贞组' }
]

export default function Settings() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('shop')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // 店铺相关
  const [shops, setShops] = useState<Shop[]>([])
  const [shopGroups, setShopGroups] = useState<ShopGroup[]>([])
  const [showAddShopModal, setShowAddShopModal] = useState(false)
  const [newShop, setNewShop] = useState({
    shop_name: '',
    platform: '天猫',
    group_id: '',
    manager_name: '',
    account_name: ''
  })

  // 用户相关
  const [users, setUsers] = useState<SystemUser[]>([])
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [newUser, setNewUser] = useState<Partial<SystemUser>>({})

  // 用户分组相关
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [newGroup, setNewGroup] = useState<{ name: string; description: string }>({ name: '', description: '' })

  // 权限相关
  const [menuPermissions, setMenuPermissions] = useState<MenuPermission[]>([])
  const [rolePermissions, setRolePermissions] = useState<Map<string, Map<string, { view: boolean; edit: boolean; delete: boolean; export: boolean }>>>(new Map())

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // 加载数据
  useEffect(() => {
    loadShopData()
    loadUserData()
    loadPermissionData()
  }, [])

  const loadShopData = async () => {
    // 加载店铺设置
    const { data: shopsData } = await supabase.from('shop_settings').select('*').order('shop_name')
    if (shopsData) setShops(shopsData)

    // 加载店铺分组
    const { data: groupsData } = await supabase.from('shop_groups').select('*').order('sort_order')
    if (groupsData) setShopGroups(groupsData)
  }

  const loadUserData = async () => {
    try {
      // 加载用户
      const { data: usersData, error: usersError } = await supabase.from('system_users').select('*').order('id')
      if (usersError) {
        console.warn('加载用户失败:', usersError.message)
        // 表不存在时设置空数组
        if (usersError.code === 'PGRST205') {
          console.warn('system_users 表不存在，请先执行 create-settings-tables.sql')
          setUsers([])
        }
      } else if (usersData) {
        setUsers(usersData)
      }

      // 加载用户分组
      const { data: groupsData, error: groupsError } = await supabase.from('user_groups').select('*').order('id')
      if (groupsError) {
        console.warn('加载用户分组失败:', groupsError.message)
        if (groupsError.code === 'PGRST205') {
          console.warn('user_groups 表不存在，请先执行 create-settings-tables.sql')
          setUserGroups([])
        }
      } else if (groupsData) {
        setUserGroups(groupsData)
      }
    } catch (err) {
      console.error('加载用户数据失败:', err)
    }
  }

  const loadPermissionData = async () => {
    // 加载菜单权限
    const { data: menuData } = await supabase.from('menu_permissions').select('*').order('sort_order')
    if (menuData) setMenuPermissions(menuData)

    // 加载角色权限
    const { data: roleData } = await supabase.from('role_menu_permissions').select('*')
    if (roleData) {
      const map = new Map()
      roleData.forEach(p => {
        if (!map.has(p.role)) map.set(p.role, new Map())
        map.get(p.role).set(p.menu_code, {
          view: p.can_view || false,
          edit: p.can_edit || false,
          delete: p.can_delete || false,
          export: p.can_export || false
        })
      })
      setRolePermissions(map)
    }
  }

  // 添加店铺
  const handleAddShop = async () => {
    if (!newShop.shop_name) {
      showToast('请填写店铺名称', 'error')
      return
    }

    try {
      await supabase.from('shop_settings').insert({
        shop_name: newShop.shop_name,
        platform: newShop.platform,
        group_id: newShop.group_id ? Number(newShop.group_id) : null,
        manager_name: newShop.manager_name,
        account_name: newShop.account_name,
        is_custom: true
      })
      showToast('店铺添加成功')
      setShowAddShopModal(false)
      setNewShop({ shop_name: '', platform: '天猫', group_id: '', manager_name: '', account_name: '' })
      loadShopData()
    } catch (err: any) {
      showToast('添加失败：' + err.message, 'error')
    }
  }

  // 删除店铺
  const handleDeleteShop = async (shopId: number) => {
    if (!confirm('确定要删除这个店铺吗？')) return

    try {
      await supabase.from('shop_settings').delete().eq('id', shopId)
      showToast('店铺删除成功')
      loadShopData()
    } catch (err: any) {
      showToast('删除失败：' + err.message, 'error')
    }
  }

  // 保存店铺设置
  const saveShopSetting = async (shopId: number, field: string, value: string) => {
    try {
      await supabase.from('shop_settings').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', shopId)
      showToast('保存成功')
    } catch (err: any) {
      showToast('保存失败：' + err.message, 'error')
    }
  }

  // 添加用户
  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email) {
      showToast('请填写用户名和邮箱', 'error')
      return
    }

    try {
      const { data, error } = await supabase.from('system_users').insert({
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name || '',
        group_id: newUser.group_id ? Number(newUser.group_id) : null,
        role: newUser.role || 'operator',
        phone: newUser.phone || '',
        status: 'active'
      }).select()
      
      if (error) {
        // 详细错误信息
        const errorMsg = error.message || (error.details as any)?.message || '未知错误'
        console.error('Supabase 错误:', error)
        throw new Error(errorMsg)
      }
      
      console.log('用户添加成功:', data)
      showToast('用户添加成功')
      setShowUserModal(false)
      setNewUser({})
      await loadUserData()
    } catch (err: any) {
      console.error('添加用户失败:', err)
      const msg = err?.message || err?.toString() || '添加失败，请检查数据库表是否存在'
      showToast(msg, 'error')
    }
  }

  // 添加用户分组
  const handleAddGroup = async () => {
    if (!newGroup.name) {
      showToast('请填写分组名称', 'error')
      return
    }

    try {
      await supabase.from('user_groups').insert({
        name: newGroup.name,
        description: newGroup.description || ''
      })
      showToast('分组添加成功')
      setShowGroupModal(false)
      setNewGroup({ name: '', description: '' })
      loadUserData()
    } catch (err: any) {
      showToast('添加失败：' + err.message, 'error')
    }
  }

  // 更新权限
  const togglePermission = async (role: string, menuCode: string, field: 'view' | 'edit' | 'delete' | 'export', current: boolean) => {
    try {
      const perms = rolePermissions.get(role)?.get(menuCode) || { view: false, edit: false, delete: false, export: false }
      const newPerms = { ...perms, [field]: !current }

      if (newPerms.view || newPerms.edit || newPerms.delete || newPerms.export) {
        // 更新或插入
        await supabase.from('role_menu_permissions').upsert({
          role,
          menu_code: menuCode,
          can_view: newPerms.view,
          can_edit: newPerms.edit,
          can_delete: newPerms.delete,
          can_export: newPerms.export
        }, { onConflict: 'role,menu_code' })
      } else {
        // 删除
        await supabase.from('role_menu_permissions').delete().eq('role', role).eq('menu_code', menuCode)
      }
      loadPermissionData()
      showToast('权限已更新')
    } catch (err: any) {
      showToast('更新失败：' + err.message, 'error')
    }
  }

  const getGroupName = (groupId: number | null) => {
    if (!groupId) return '-'
    const group = userGroups.find(g => g.id === groupId)
    return group?.name || '-'
  }

  const getShopGroupName = (groupId: number | null) => {
    if (!groupId) return '-'
    const group = shopGroups.find(g => g.id === groupId)
    return group?.name || '-'
  }

  const getRoleLabel = (role: string) => {
    return ROLES.find(r => r.value === role)?.label || role
  }

  const getRoleColor = (role: string) => {
    return ROLES.find(r => r.value === role)?.color || 'bg-slate-100 text-slate-700'
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
          <a href="/import" className="block py-2 px-4 hover:bg-slate-800 rounded">📥 数据导入</a>
          <a href="/analysis" className="block py-2 px-4 hover:bg-slate-800 rounded">📈 商品分析</a>
          <a href="/shops" className="block py-2 px-4 hover:bg-slate-800 rounded">📈 店铺每日盈亏</a>
          <a href="/profit" className="block py-2 px-4 hover:bg-slate-800 rounded">💰 利润监控</a>
          <a href="/settings" className="block py-2 px-4 bg-slate-800 rounded">⚙️ 系统设置</a>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-8">
        {/* 头部 */}
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">← 返回</button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">⚙️ 系统设置</h1>
              <p className="text-slate-500 mt-1">管理店铺、用户、权限和分组</p>
            </div>
          </div>
        </header>

        {/* 选项卡 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button onClick={() => setActiveTab('shop')} className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'shop' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-slate-600 hover:bg-slate-50'}`}>🏪 店铺设置</button>
            <button onClick={() => setActiveTab('user')} className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'user' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-slate-600 hover:bg-slate-50'}`}>👥 用户管理</button>
            <button onClick={() => setActiveTab('permission')} className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'permission' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-slate-600 hover:bg-slate-50'}`}>🔐 权限管理</button>
            <button onClick={() => setActiveTab('group')} className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'group' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-slate-600 hover:bg-slate-50'}`}>📁 用户分组</button>
          </div>

          {/* 店铺设置 */}
          {activeTab === 'shop' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">店铺列表</h2>
                <button onClick={() => setShowAddShopModal(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2">➕ 添加店铺</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">序号</th>
                      <th className="px-4 py-3">店铺 ID</th>
                      <th className="px-4 py-3">店铺名称</th>
                      <th className="px-4 py-3">店铺负责人</th>
                      <th className="px-4 py-3">所属平台</th>
                      <th className="px-4 py-3">账号名称</th>
                      <th className="px-4 py-3">店铺分组</th>
                      <th className="px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shops.map((shop, index) => (
                      <tr key={shop.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{index + 1}</td>
                        <td className="px-4 py-3 text-slate-700">{shop.shop_id || '-'}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{shop.shop_name}</td>
                        <td className="px-4 py-3"><input type="text" value={shop.manager_name || ''} onChange={(e) => saveShopSetting(shop.id, 'manager_name', e.target.value)} placeholder="设置负责人" className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-orange-500" /></td>
                        <td className="px-4 py-3 text-slate-700">{shop.platform || '-'}</td>
                        <td className="px-4 py-3"><input type="text" value={shop.account_name || ''} onChange={(e) => saveShopSetting(shop.id, 'account_name', e.target.value)} placeholder="设置账号名称" className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-orange-500" /></td>
                        <td className="px-4 py-3 text-slate-700">{getShopGroupName(shop.group_id)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDeleteShop(shop.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">🗑️ 删除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 用户管理 */}
          {activeTab === 'user' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">用户列表</h2>
                <button onClick={() => setShowUserModal(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2">➕ 添加用户</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">用户名</th>
                      <th className="px-4 py-3">姓名</th>
                      <th className="px-4 py-3">邮箱</th>
                      <th className="px-4 py-3">电话</th>
                      <th className="px-4 py-3">角色</th>
                      <th className="px-4 py-3">所属分组</th>
                      <th className="px-4 py-3">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{user.username || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{user.full_name || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{user.email || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{user.phone || '-'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getRoleColor(user.role)}`}>{getRoleLabel(user.role)}</span></td>
                        <td className="px-4 py-3 text-slate-700">{getGroupName(user.group_id)}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{user.status === 'active' ? '启用' : '禁用'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 权限管理 */}
          {activeTab === 'permission' && (
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">角色菜单权限</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">菜单</th>
                      {ROLES.map(role => (
                        <th key={role.value} className="px-4 py-3 text-center">{role.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {menuPermissions.filter(m => !m.parent_code).map(menu => (
                      <tr key={menu.menu_code} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{menu.icon} {menu.menu_name}</td>
                        {ROLES.map(role => {
                          const perms = rolePermissions.get(role.value)?.get(menu.menu_code) || { view: false, edit: false, delete: false, export: false }
                          return (
                            <td key={role.value} className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <label className="flex items-center gap-1 text-xs">
                                  <input type="checkbox" checked={perms.view} onChange={(e) => togglePermission(role.value, menu.menu_code, 'view', e.target.checked)} className="w-3 h-3 text-orange-600 rounded" title="查看" />看
                                </label>
                                <label className="flex items-center gap-1 text-xs">
                                  <input type="checkbox" checked={perms.edit} onChange={(e) => togglePermission(role.value, menu.menu_code, 'edit', e.target.checked)} className="w-3 h-3 text-orange-600 rounded" title="编辑" />编
                                </label>
                                <label className="flex items-center gap-1 text-xs">
                                  <input type="checkbox" checked={perms.delete} onChange={(e) => togglePermission(role.value, menu.menu_code, 'delete', e.target.checked)} className="w-3 h-3 text-orange-600 rounded" title="删除" />删
                                </label>
                                <label className="flex items-center gap-1 text-xs">
                                  <input type="checkbox" checked={perms.export} onChange={(e) => togglePermission(role.value, menu.menu_code, 'export', e.target.checked)} className="w-3 h-3 text-orange-600 rounded" title="导出" />导
                                </label>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 用户分组 */}
          {activeTab === 'group' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">用户分组列表</h2>
                <button onClick={() => setShowGroupModal(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2">➕ 添加分组</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userGroups.map(group => (
                  <div key={group.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="font-bold text-slate-800">{group.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{group.description || '暂无描述'}</p>
                    <p className="text-xs text-slate-400 mt-2">{users.filter(u => u.group_id === group.id).length} 个用户</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 添加店铺模态框 */}
      {showAddShopModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-100"><h2 className="text-xl font-bold text-slate-800">添加店铺</h2></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">店铺名称 *</label><input type="text" value={newShop.shop_name} onChange={(e) => setNewShop({ ...newShop, shop_name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="请输入店铺名称" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">所属平台</label><select value={newShop.platform} onChange={(e) => setNewShop({ ...newShop, platform: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"><option value="天猫">天猫</option><option value="淘宝">淘宝</option><option value="拼多多">拼多多</option><option value="抖音">抖音</option></select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">店铺分组</label><select value={newShop.group_id} onChange={(e) => setNewShop({ ...newShop, group_id: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"><option value="">请选择分组</option>{GROUPS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">店铺负责人</label><input type="text" value={newShop.manager_name} onChange={(e) => setNewShop({ ...newShop, manager_name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="请输入负责人姓名" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">账号名称</label><input type="text" value={newShop.account_name} onChange={(e) => setNewShop({ ...newShop, account_name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="请输入平台账号名称" /></div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setShowAddShopModal(false); setNewShop({ shop_name: '', platform: '天猫', group_id: '', manager_name: '', account_name: '' }) }} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">取消</button>
              <button onClick={handleAddShop} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 添加用户模态框 */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-100"><h2 className="text-xl font-bold text-slate-800">添加用户</h2></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">用户名 *</label><input type="text" value={newUser.username || ''} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="请输入用户名" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">邮箱 *</label><input type="email" value={newUser.email || ''} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="请输入邮箱" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">姓名</label><input type="text" value={newUser.full_name || ''} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="请输入姓名" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">电话</label><input type="text" value={newUser.phone || ''} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="请输入电话" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">角色</label><select value={newUser.role || 'operator'} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500">{ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">所属分组</label><select value={newUser.group_id || ''} onChange={(e) => setNewUser({ ...newUser, group_id: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"><option value="">请选择分组</option>{userGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setShowUserModal(false); setNewUser({}) }} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">取消</button>
              <button onClick={handleAddUser} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 添加分组模态框 */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-100"><h2 className="text-xl font-bold text-slate-800">添加用户分组</h2></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">分组名称 *</label><input type="text" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="如：运营组、财务组" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">分组描述</label><textarea value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="描述该分组的职责" rows={3} /></div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setShowGroupModal(false); setNewGroup({ name: '', description: '' }) }} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">取消</button>
              <button onClick={handleAddGroup} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
