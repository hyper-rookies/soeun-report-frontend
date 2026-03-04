'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12"
         style={{ background: 'var(--neutral-50)' }}>
      <div className="text-center w-full max-w-2xl" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

        {/* 타이틀 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 className="text-[28px] font-bold tracking-[-0.02em]"
              style={{ color: 'var(--neutral-700)' }}>
            카카오/구글 광고 AI 리포트
          </h2>

          {/* 설명 카드 */}
          <div
            className="text-left mx-auto w-full"
            style={{
              background: 'var(--white)',
              border: '1px solid var(--neutral-100)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--neutral-500)' }}>
              반가워요. 저는 광고주의{' '}
              <strong className="font-semibold" style={{ color: 'var(--neutral-700)' }}>카카오 키워드</strong>{' '}
              와{' '}
              <strong className="font-semibold" style={{ color: 'var(--neutral-700)' }}>구글 검색 광고(Google Ads)</strong>{' '}
              데이터를 수집하여, 자연어 대화 인터페이스로 성과를 조회하고 분석할 수 있는 AI 리포트 시스템이에요.
            </p>
            <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--neutral-500)' }}>
              복잡한 대시보드를 직접 조작하지 않고, 채팅창에 질문을 입력하면 데이터를 조회하고 차트와 표로 답변해드릴게요. 준비되셨나요?
            </p>

            <div
              style={{
                paddingTop: '16px',
                marginTop: '4px',
                borderTop: '1px solid var(--neutral-100)',
              }}
            >
              <p
                className="text-[14px] font-bold flex items-center gap-2"
                style={{ color: 'var(--primary-500)' }}
              >
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] text-white shrink-0"
                  style={{ background: 'var(--primary-500)' }}
                >
                  💡
                </span>
                대시보드를 보지 말고, 저와 대화하세요.
              </p>
            </div>
          </div>
        </div>

        {/* CTA 버튼 */}
        <div>
          <button
            onClick={() => router.push('/chat/new')}
            className="cds-btn cds-btn--primary cds-btn--lg"
            style={{ paddingLeft: '32px', paddingRight: '32px' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            대화를 시작해보세요.
          </button>
        </div>

      </div>
    </div>
  );
}
