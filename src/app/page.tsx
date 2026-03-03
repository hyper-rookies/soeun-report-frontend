'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
// import { useConversation } from '@/hooks/useConversation'; // 주석 해제 후 사용

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartConversation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // const conversation = await createConversation();
      const conversation = { id: 'sample-id-123' }; // 임시
      
      if (conversation) {
        router.push(`/chat/${conversation.id}`);
      } else {
        setError('대화를 생성할 수 없습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center w-full max-w-2xl space-y-10">
        
        {/* 환영 메시지 및 기획 설명 */}
        <div className="space-y-4">
          <h2 className="text-[28px] font-bold text-[var(--text-ink)] tracking-[-0.02em]">
            카카오/구글 광고 AI 리포트
          </h2>
          
          <div className="bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-[8px] p-6 text-left space-y-3 shadow-sm mx-auto">
            <p className="text-[14px] text-[var(--text-dim)] leading-[1.6]">
              광고주의 <strong className="text-[var(--text-ink)] font-semibold">카카오 모먼트</strong> 디스플레이 광고와 <strong className="text-[var(--text-ink)] font-semibold">구글 검색광고(Google Ads)</strong> 데이터를 수집하여, 자연어 대화 인터페이스로 성과를 조회하고 분석할 수 있는 AI 리포트 시스템입니다.
            </p>
            <p className="text-[14px] text-[var(--text-dim)] leading-[1.6]">
              사용자는 복잡한 대시보드를 직접 조작하지 않고, 채팅창에 질문을 입력하면 AI가 데이터를 조회하고 차트와 표로 답변합니다.
            </p>
            <div className="pt-4 mt-2 border-t border-[var(--border-faint)]">
              <p className="text-[15px] font-bold text-[var(--accent-default)] flex items-center gap-2">
                <span className="text-[18px]">💡</span> 핵심 가치 : "대시보드를 보지 말고, 대화하세요."
              </p>
            </div>
          </div>
        </div>

        {/* CTA 버튼 */}
        <div>
          <button
            onClick={handleStartConversation}
            disabled={isLoading}
            className={`px-8 py-3.5 rounded-[6px] text-[15px] font-semibold transition-all shadow-sm ${
              isLoading
                ? 'bg-[var(--surface-well)] text-[var(--text-ghost)] cursor-not-allowed border border-[var(--border-faint)]'
                : 'bg-[var(--accent-default)] text-[var(--accent-text)] hover:bg-[var(--accent-dark)] active:bg-[var(--accent-deeper)] hover:shadow'
            }`}
          >
            {isLoading ? '대화 생성 중...' : '새로운 분석 시작하기'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-[hsl(0,70%,96%)] border border-[hsl(0,72%,52%)] rounded-[6px]">
            <p className="text-[hsl(0,72%,40%)] text-[13px] font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}