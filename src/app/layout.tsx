import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Image from 'next/image';
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
        {/* 글로벌 헤더 — fixed 80px */}
        <header className="cds-header">
          <div className="flex items-center gap-4">
            {/* 🍎 사과 로고 크기를 헤더에 맞춰서 키움 (40x40), Next Image 컴포넌트로 변경 */}
            <Image
              src="/apple_logo.png"
              alt="로고"
              width={40}
              height={40}
              priority
              unoptimized
              style={{ borderRadius: '8px', objectFit: 'cover' }}
            />

            <div>
              {/* 타이틀 텍스트도 살짝 키움 */}
              <h1 className="text-[17px] font-bold leading-tight tracking-[-0.02em]"
                  style={{ color: 'var(--neutral-700)' }}>
                광고 AI 리포터
              </h1>
              <p className="text-[12px] leading-tight mt-0.5" style={{ color: 'var(--neutral-400)' }}>
                대시보드를 보지 말고, 대화하세요.
              </p>
            </div>
          </div>
        </header>

        {/* 헤더가 커졌으므로 paddingTop을 80px로 수정해서 뷰포트를 맞춤 */}
        <div className="flex flex-col overflow-hidden" style={{ height: '100vh', paddingTop: '80px' }}>
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Providers>{children}</Providers>
          </main>
        </div>
      </body>
    </html>
  );
}