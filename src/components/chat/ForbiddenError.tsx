'use client';

import { useRouter } from 'next/navigation';

export default function ForbiddenError() {
  const router = useRouter();

  return (
    <div
      className="flex flex-col items-center justify-center h-full px-6"
      style={{ background: 'var(--neutral-50)' }}
    >
      {/* 아이콘 */}
      <div
        className="flex items-center justify-center w-20 h-20 rounded-full mb-6"
        style={{ background: 'var(--primary-50)' }}
      >
        <svg
          className="w-9 h-9"
          style={{ color: 'var(--primary-500)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V7.5a4.5 4.5 0 1 0-9 0v3M5.25 10.5h13.5A1.5 1.5 0 0 1 20.25 12v7.5A1.5 1.5 0 0 1 18.75 21H5.25A1.5 1.5 0 0 1 3.75 19.5V12a1.5 1.5 0 0 1 1.5-1.5Z"
          />
        </svg>
      </div>

      {/* 텍스트 */}
      <h2
        className="text-[22px] font-bold tracking-tight mb-3 text-center"
        style={{ color: 'var(--text-ink)' }}
      >
        접근 권한이 없어요
      </h2>
      <p
        className="text-[14px] leading-relaxed text-center mb-8 max-w-[300px]"
        style={{ color: 'var(--text-dim)' }}
      >
        이 대화는 다른 사용자의 것이거나
        <br />
        존재하지 않는 대화입니다.
      </p>

      {/* 구분선 */}
      <div
        className="w-full max-w-[260px] mb-8"
        style={{ height: '1px', background: 'var(--border-default)' }}
      />

      {/* 버튼 */}
      <div className="flex flex-col gap-3 w-full max-w-[260px]">
        <button
          onClick={() => router.push('/chat/new')}
          className="cds-btn--md cds-btn--primary w-full"
        >
          새 대화 시작하기
        </button>
        <button
          onClick={() => router.back()}
          className="cds-btn--md cds-btn--tertiary-gray w-full"
        >
          이전 페이지로
        </button>
      </div>
    </div>
  );
}
