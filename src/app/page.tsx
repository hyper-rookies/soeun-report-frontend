'use client';

import { useRouter } from 'next/navigation';
// import { useConversation } from '@/hooks/useConversation'; // 주석 해제하여 사용
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  // const { createConversation, isLoading } = useConversation();
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center w-full max-w-3xl space-y-10">
        
        {/* 환영 메시지 */}
        <div className="space-y-3">
          <h2 className="text-[22px] font-bold text-[var(--text-ink)] tracking-[-0.02em]">
            광고 성과 분석
          </h2>
          <p className="text-[14px] text-[var(--text-dim)]">
            자연어로 카카오, 구글 광고 데이터를 분석하세요
          </p>
        </div>

        {/* 기능 설명 카드: 그림자 제거, border-only 전략 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-[var(--surface-elevated)] rounded-[8px] border border-[var(--border-default)] text-left">
            <h3 className="text-[14px] font-semibold text-[var(--text-ink)] tracking-[-0.01em]">자연어 질문</h3>
            <p className="text-[13px] text-[var(--text-soft)] mt-2 leading-[1.5]">
              "어제 클릭수는?" 처럼 간단하게 질문하세요.
            </p>
          </div>

          <div className="p-5 bg-[var(--surface-elevated)] rounded-[8px] border border-[var(--border-default)] text-left">
            <h3 className="text-[14px] font-semibold text-[var(--text-ink)] tracking-[-0.01em]">실시간 분석</h3>
            <p className="text-[13px] text-[var(--text-soft)] mt-2 leading-[1.5]">
              AI가 SQL을 생성하고 데이터를 바로 조회합니다.
            </p>
          </div>

          <div className="p-5 bg-[var(--surface-elevated)] rounded-[8px] border border-[var(--border-default)] text-left">
            <h3 className="text-[14px] font-semibold text-[var(--text-ink)] tracking-[-0.01em]">대화 저장</h3>
            <p className="text-[13px] text-[var(--text-soft)] mt-2 leading-[1.5]">
              모든 분석 기록과 대화가 자동으로 저장됩니다.
            </p>
          </div>
        </div>

        {/* CTA 버튼: Accent 컬러 및 단단한 radius(6px) 적용 */}
        <div>
          <button
            onClick={handleStartConversation}
            disabled={isLoading}
            className={`px-6 py-3 rounded-[6px] text-[14px] font-semibold transition-colors ${
              isLoading
                ? 'bg-[var(--surface-well)] text-[var(--text-ghost)] cursor-not-allowed border border-[var(--border-faint)]'
                : 'bg-[var(--accent-default)] text-[var(--accent-text)] hover:bg-[var(--accent-dark)] active:bg-[var(--accent-deeper)]'
            }`}
          >
            {isLoading ? '대화 생성 중...' : '새 대화 시작'}
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 bg-[hsl(0,70%,96%)] border border-[hsl(0,72%,52%)] rounded-[6px]">
            <p className="text-[hsl(0,72%,40%)] text-[13px] font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}