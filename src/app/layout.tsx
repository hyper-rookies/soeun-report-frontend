import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI 리포트 시스템 - 카카오/구글 광고 분석',
  description: '카카오 모먼트와 구글 검색광고 데이터를 자연어 대화로 분석하는 AI 리포트 시스템입니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <div className="h-screen flex flex-col overflow-hidden bg-[var(--surface-canvas)]">
          {/* 글로벌 헤더 */}
          <header className="shrink-0 bg-[var(--surface-elevated)] border-b border-[var(--border-default)]">
            <div className="px-8 pt-5 pb-4">
              <h1 className="text-[18px] font-bold text-[var(--text-ink)] tracking-[-0.02em] leading-tight">
                AI 리포트 시스템
              </h1>
              <p className="text-[12px] text-[var(--text-soft)] mt-0.5">
                대시보드를 보지 말고, 대화하세요.
              </p>
            </div>
          </header>

          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}