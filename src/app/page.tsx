'use client';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const login = localStorage.getItem('erp_login');
    if (!login) {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>ERP 系统</h1>
      <p>已登录</p>
      <a href="/shops" style={{ color: '#0070f3' }}>店铺管理</a>
    </div>
  );
}