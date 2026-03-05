'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { conversationService } from '@/services';
import { useChatStore } from '@/store';
import { getUserNameFromToken } from '@/lib/auth';

function getGreeting(name: string): { title: string; description: string } {
  const hour = new Date().getHours();

  let title = '';
  if (hour >= 6 && hour < 12)       title = `${name}님, 좋은 아침이에요.`;
  else if (hour >= 12 && hour < 18) title = `${name}님, 활기찬 오후입니다.`;
  else if (hour >= 18 && hour < 21) title = `${name}님, 좋은 저녁이에요.`;
  else if (hour >= 21)              title = `${name}님은 무엇이든 해낼 수 있어요.`;
  else                              title = `${name}님, 아침이 찾아오고 있어요.`;

  const description =
  '오늘도 준비되셨나요?';

  return { title, description };
}

const SUGGESTED_QUESTIONS = [
  '이번 달 카카오 키워드 광고 성과를 알려줘',
  '구글 광고 캠페인별 클릭수와 전환율 비교해줘',
  '지난 주 대비 광고비 효율은 어떻게 됐어?',
];

export default function Home() {
  const router = useRouter();
  const addConversation = useChatStore((s) => s.addConversation);

  const [userName, setUserName] = useState('사용자');
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  useEffect(() => {
    setUserName(getUserNameFromToken());
  }, []);

  const { title, description } = getGreeting(userName);

  const handleQuestion = async (question: string, index: number) => {
    if (loadingIndex !== null) return;
    setLoadingIndex(index);
    try {
      const titleText = question.length > 40 ? question.slice(0, 40) + '…' : question;
      const summary = await conversationService.createConversation(titleText);
      if (!summary?.id) {
        setLoadingIndex(null);
        return;
      }
      addConversation(summary);
      router.push(`/chat/${summary.id}?preset=${encodeURIComponent(question)}`);
    } catch {
      setLoadingIndex(null);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--neutral-50)' }}
    >
      <div
        className="text-center w-full max-w-2xl"
        style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}
      >
        {/* 인삿말 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2
            className="text-[28px] font-bold tracking-[-0.02em]"
            style={{ color: 'var(--neutral-700)' }}
          >
            {title}
          </h2>
          <p
            className="text-[14px] leading-[1.7]"
            style={{ color: 'var(--neutral-500)', maxWidth: '600px', margin: '0 auto' }}
          >
            {description}
          </p>
        </div>

        {/* 추천 질문 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SUGGESTED_QUESTIONS.map((question, i) => (
            <button
              key={i}
              onClick={() => handleQuestion(question, i)}
              disabled={loadingIndex !== null}
              className="text-left w-full"
              style={{
                background: 'var(--white)',
                border: '1px solid var(--neutral-100)',
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: 'var(--shadow-xs)',
                color: 'var(--neutral-600)',
                fontSize: '14px',
                lineHeight: '1.5',
                cursor: loadingIndex !== null ? 'not-allowed' : 'pointer',
                opacity: loadingIndex !== null && loadingIndex !== i ? 0.5 : 1,
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <span>{question}</span>
              {loadingIndex === i ? (
                <span
                  className="shrink-0 w-4 h-4 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: 'var(--primary-200)',
                    borderTopColor: 'var(--primary-500)',
                  }}
                />
              ) : (
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: 'var(--neutral-400)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* 직접 입력 CTA */}
        <div>
          <button
            onClick={() => router.push('/chat/new')}
            className="cds-btn cds-btn--primary cds-btn--lg"
            style={{ paddingLeft: '32px', paddingRight: '32px' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            직접 질문하기
          </button>
        </div>
      </div>
    </div>
  );
}
