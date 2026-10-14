import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/providers';

export const metadata: Metadata = {
  title: 'Chứng Sĩ Tỉnh Táo',
  description: 'Đừng nghe tiếng lòng, hãy nghe dữ liệu. Phân tích kỹ thuật chứng khoán Việt Nam bằng AI.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Chứng Sĩ Tỉnh Táo',
    description: 'Đừng nghe tiếng lòng, hãy nghe dữ liệu.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{ background: '#020617', fontFamily: "'Inter', sans-serif" }}
        className="text-slate-100 min-h-screen"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
