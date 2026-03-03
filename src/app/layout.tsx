import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SE Report - AI 광고 분석',
  description: '카카오/구글 광고 데이터를 AI와 대화하며 분석합니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen bg-[var(--surface-canvas)]">
          
          {/* 헤더: 그림자 제거, 디자인 시스템 컬러 적용, 이모지 제거 */}
          <header className="bg-[var(--surface-elevated)] border-b border-[var(--border-default)]">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <h1 className="text-[22px] font-bold text-[var(--text-ink)] tracking-[-0.02em] leading-tight">
                SE Report
              </h1>
              <p className="text-[13px] text-[var(--text-soft)] mt-1">
                AI와 함께 광고 성과를 분석하세요
              </p>
            </div>
          </header>

          {/* 메인 콘텐츠: flex-1을 추가해 화면 하단 빈 공간까지 꽉 채우기 */}
          <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 py-6">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}