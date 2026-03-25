'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        // 注册
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        alert('注册成功！请检查邮箱验证链接')
      } else {
        // 登录
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        // 登录成功，跳转到首页
        localStorage.setItem('erp_login', 'ok')
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = () => {
    // 快速登录（开发用，生产环境建议移除）
    localStorage.setItem('erp_login', 'ok')
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-500">山麓众创科技</h1>
          <p className="text-slate-500 mt-2">电商数据中台 ERP</p>
        </div>

        {/* 登录/注册切换 */}
        <div className="flex mb-6 border-b border-slate-200">
          <button
            onClick={() => setIsSignUp(false)}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              !isSignUp
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              isSignUp
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            注册
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位密码"
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : isSignUp ? '注册' : '登录'}
          </button>
        </form>

        {/* 快速登录（开发用） */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center mb-3">开发模式</p>
          <button
            onClick={handleQuickLogin}
            className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            快速登录（跳过认证）
          </button>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>💡 提示：</strong>首次使用请先注册，或联系管理员创建账号。
            <br />
            开发模式可使用快速登录跳过认证。
          </p>
        </div>
      </div>
    </div>
  )
}
