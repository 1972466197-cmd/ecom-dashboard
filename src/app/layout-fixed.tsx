'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const menuItems = [
  { path: '/', label: '经营看板', icon: '📊' },
  { path: '/products', label: '商品管理', icon: '📦' },
  { path: '/sales', label: '店铺销售情况', icon: '🏪' },
  { path: '/import', label: '数据导入', icon: '📥' },
  { path: '/products', label: '商品分析', icon: '📈' },
  { path: '/shops', label: '店铺每日盈亏', icon: '📉' },
  { path: '/profit', label: '利润监控', icon: '💰' },
  { path: '/settings', label: '系统设置', icon: '⚙️' },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 左侧边栏 */}
      <aside style={{
        width: 240,
        background: '#1a1a2e',
        color: 'white',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        overflowY: 'auto',
        zIndex: 1000,
      }}>
        {/* Logo */}
        <div style={{
          padding: '24 20',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 'bold',
            color: '#ff6b35',
          }}>
            山麓众创科技
          </h1>
        </div>

        {/* 菜单 */}
        <nav style={{ padding: '20 0' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14 24',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  borderLeft: isActive ? '3px solid #ff6b35' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = 'white'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                  }
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* 主内容区 */}
      <main style={{
        marginLeft: 240,
        flex: 1,
        padding: 24,
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  )
}
