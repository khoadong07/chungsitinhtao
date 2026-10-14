import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/providers';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://chungsitinhtao.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Chứng Sĩ Tỉnh Táo',
    template: '%s · Chứng Sĩ Tỉnh Táo',
  },
  description:
    'Phân tích kỹ thuật chứng khoán Việt Nam bằng AI — EMA, RSI, MACD, vùng hỗ trợ/kháng cự, tin tức và cộng đồng FireAnt. Đừng nghe tiếng lòng, hãy nghe dữ liệu.',
  keywords: ['chứng khoán', 'việt nam', 'phân tích kỹ thuật', 'AI', 'VN-Index', 'RSI', 'MACD', 'EMA', 'FireAnt'],
  authors: [{ name: 'Chứng Sĩ Tỉnh Táo' }],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: APP_URL,
    siteName: 'Chứng Sĩ Tỉnh Táo',
    title: 'Chứng Sĩ Tỉnh Táo — Phân tích chứng khoán Việt Nam bằng AI',
    description:
      'Đừng nghe tiếng lòng, hãy nghe dữ liệu. Phân tích kỹ thuật AI: EMA, RSI, MACD, vùng hỗ trợ/kháng cự, tin tức FireAnt.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Chứng Sĩ Tỉnh Táo — Phân tích chứng khoán Việt Nam bằng AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chứng Sĩ Tỉnh Táo — Phân tích chứng khoán Việt Nam bằng AI',
    description: 'Đừng nghe tiếng lòng, hãy nghe dữ liệu. Phân tích kỹ thuật AI cho thị trường Việt Nam.',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
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
