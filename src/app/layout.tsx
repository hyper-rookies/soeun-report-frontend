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
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* 헤더 */}
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                🤖 SE Report
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                AI와 함께 광고 성과를 분석하세요
              </p>
            </div>
          </header>

          {/* 메인 콘텐츠 */}
          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
