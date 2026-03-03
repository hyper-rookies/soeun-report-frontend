'use client';

import { useRouter } from 'next/navigation';
import { useConversation } from '@/hooks/useConversation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const { createConversation, isLoading } = useConversation();
  const [error, setError] = useState<string | null>(null);

  const handleStartConversation = async () => {
    try {
      setError(null);
      const conversation = await createConversation();

      if (conversation) {
        router.push(`/chat/${conversation.id}`);
      } else {
        setError('대화를 생성할 수 없습니다.');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '예상치 못한 오류가 발생했습니다.'
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center space-y-6">
        {/* 환영 메시지 */}
        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-gray-900">
            🎯 광고 성과 분석
          </h2>
          <p className="text-lg text-gray-600">
            자연어로 카카오, 구글 광고 데이터를 분석하세요
          </p>
        </div>

        {/* 기능 설명 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="text-3xl mb-2">💬</div>
            <h3 className="font-semibold text-gray-900">자연어 질문</h3>
            <p className="text-sm text-gray-600 mt-1">
              &quot;어제 클릭수는?&quot; 처럼 간단하게 질문하세요
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900">실시간 분석</h3>
            <p className="text-sm text-gray-600 mt-1">
              AI가 SQL을 생성하고 데이터를 조회합니다
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="text-3xl mb-2">💾</div>
            <h3 className="font-semibold text-gray-900">대화 저장</h3>
            <p className="text-sm text-gray-600 mt-1">
              모든 대화가 자동으로 저장됩니다
            </p>
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="mt-8">
          <button
            onClick={handleStartConversation}
            disabled={isLoading}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {isLoading ? '대화 생성 중...' : '🚀 새 대화 시작'}
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
