import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: '山麓众创科技 - 电商数据中台',
  description: '电商多平台数据管理系统',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}