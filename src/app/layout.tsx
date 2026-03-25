import './globals.css';

export const metadata = {
  title: '店铺销售管理',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}