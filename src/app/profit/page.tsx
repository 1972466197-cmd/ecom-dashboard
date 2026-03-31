'use client'

export default function ProfitPage() {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#1a1a2e' }}>
        💰 利润监控
      </h1>

      <div style={{
        padding: 60,
        background: 'white',
        borderRadius: 12,
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚧</div>
        <h2 style={{ fontSize: 20, color: '#1a1a2e', marginBottom: 8 }}>功能开发中</h2>
        <p style={{ color: '#666', fontSize: 16 }}>
          利润监控功能正在开发中，敬请期待...
        </p>
        <p style={{ color: '#999', fontSize: 14, marginTop: 16 }}>
          即将上线：实时利润分析、成本核算、利润率趋势图
        </p>
      </div>
    </div>
  )
}
