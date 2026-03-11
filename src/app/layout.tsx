import type { Metadata } from 'next';
import { Noto_Sans, Palette_Mosaic } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import Providers from '@/components/Providers';
import { Sidebar } from '@/components/layout/Sidebar';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const paletteMosaic = Palette_Mosaic({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-palette-mosaic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'nADu',
  description: '카카오 키워드와 구글 검색광고 데이터를 자연어 대화로 분석하는 AI 리포트 시스템입니다.',
  icons: {
    icon: '/apple_logo.png',
    apple: '/apple_logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${notoSans.className} ${paletteMosaic.variable}`}>
        <Providers>
          {/* 글로벌 헤더 — fixed 80px */}
          <header className="cds-header">
            <Link href="/" className="flex flex-col justify-center gap-2">
              <h1 className="text-[26px] leading-tight"
                  style={{ color: 'var(--neutral-700)', fontFamily: 'var(--font-palette-mosaic)' }}>
                nADu
              </h1>
              <p className="text-[11px] leading-tight" style={{ color: 'var(--neutral-400)' }}>
                NHN AD with U, 나두!
              </p>
            </Link>
          </header>

          {/* 헤더 아래 영역 */}
          <div style={{ paddingTop: '80px' }} className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}