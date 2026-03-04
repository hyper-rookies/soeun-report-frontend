import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '광고 AI 리포터',
  description: '카카오 키워드와 구글 검색광고 데이터를 자연어 대화로 분석하는 AI 리포트 시스템입니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {/* 글로벌 헤더 — fixed 60px */}
        <header className="cds-header">
          <div className="flex items-center gap-3">
            {/* 로고 마크 */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--primary-500)' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>

            <div>
              <h1 className="text-[15px] font-bold leading-tight tracking-[-0.02em]"
                  style={{ color: 'var(--neutral-700)' }}>
                광고 AI 리포터
              </h1>
              <p className="text-[11px] leading-tight" style={{ color: 'var(--neutral-400)' }}>
                대시보드를 보지 말고, 대화하세요.
              </p>
            </div>
          </div>
        </header>

        {/* 헤더 높이(60px)만큼 밀어내고 남은 뷰포트를 채움 */}
        <div className="flex flex-col overflow-hidden" style={{ height: '100vh', paddingTop: '60px' }}>
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Providers>{children}</Providers>
          </main>
        </div>
      </body>
    </html>
  );
}
