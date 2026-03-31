'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const menuItems = [
  { path: '/', label: '经营看板', icon: '📊', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { path: '/products', label: '商品管理', icon: '📦', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { path: '/sales', label: '店铺销售情况', icon: '🏪', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { path: '/import', label: '数据导入', icon: '📥', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { path: '/analysis', label: '商品分析', icon: '📈', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { path: '/shops', label: '店铺每日盈亏', icon: '📉', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { path: '/profit', label: '利润监控', icon: '💰', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { path: '/settings', label: '系统设置', icon: '⚙️', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
          
          {/* 左侧边栏 */}
          <aside style={{
            width: 260,
            background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
            color: 'white',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '6px 0 24px rgba(0,0,0,0.3)',
          }}>
            {/* Logo 区域 */}
            <div style={{
              padding: '56 32 40',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
              textAlign: 'center',
            }}>
              <div style={{
                width: 64,
                height: 64,
                margin: '0 auto 16',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                boxShadow: '0 8px 24px rgba(102,126,234,0.4)',
              }}>
                🦐
              </div>
              <h1 style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 'bold',
                color: '#ffffff',
                letterSpacing: '4px',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}>
                山麓众创
              </h1>
              <p style={{
                margin: '12 0 0',
                fontSize: 13,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}>
                ECOMMERCE ERP
              </p>
            </div>

            {/* 菜单 */}
            <nav style={{ padding: '32 16' }}>
              {menuItems.map((item) => {
                const isActive = pathname === item.path
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '18 20',
                      margin: '6 8',
                      borderRadius: 12,
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.65)',
                      background: isActive ? 'linear-gradient(135deg, rgba(24,144,255,0.25) 0%, rgba(24,144,255,0.1) 100%)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderLeft: isActive ? '5px solid #1890ff' : '5px solid transparent',
                      fontWeight: isActive ? 600 : 500,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                        e.currentTarget.style.color = '#ffffff'
                        e.currentTarget.style.transform = 'translateX(4px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }
                    }}
                  >
                    {/* 图标背景 */}
                    <span style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: isActive ? item.gradient : 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      boxShadow: isActive ? '0 4px 16px rgba(0,0,0,0.3)' : 'none',
                      transition: 'all 0.3s ease',
                    }}>
                      {item.icon}
                    </span>
                    
                    {/* 文字 */}
                    <span style={{ 
                      fontSize: 16,
                      letterSpacing: '0.5px',
                      flex: 1,
                    }}>{item.label}</span>
                    
                    {/* 激活指示器 */}
                    {isActive && (
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#1890ff',
                        boxShadow: '0 0 12px #1890ff',
                      }} />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* 底部信息 */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '32 24',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'linear-gradient(0deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)',
              textAlign: 'center',
            }}>
              <p style={{
                margin: 0,
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '1px',
              }}>
                © 2026 山麓众创科技
              </p>
              <p style={{
                margin: '8 0 0',
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
              }}>
                电商数据中台系统 v2.0
              </p>
            </div>
          </aside>

          {/* 主内容区 */}
          <main style={{
            marginLeft: 260,
            flex: 1,
            padding: 32,
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #f0f2f5 0%, #e6e9f0 100%)',
          }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
