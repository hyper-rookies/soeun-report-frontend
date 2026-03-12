'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ReportView } from '@/components/report/ReportView';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { API_CONFIG, API_ENDPOINTS } from '@/utils/constants';
import { getAccessToken } from '@/lib/auth';

interface SharedMessage {
  role: string;
  content: string;
  timestamp?: number;
  data?: Record<string, unknown>[];
  structuredData?: Record<string, unknown>[];  // 하위 호환용 (기존 채팅 데이터)
  chartType?: 'line' | 'bar' | 'pie' | 'table';
}

interface SharedConversationRaw {
  messages: SharedMessage[];
  expiresAt?: string;
  createdAt?: string;
  userId?: string;
  title?: string;
  conversationId?: string;
  conversation?: {
    userId?: string;
    title?: string;
    createdAt?: string;
    conversationId?: string;
  };
}

interface SharedConversation {
  messages: ChatMessageType[];
  expiresAt?: string;
  createdAt?: string;
  title: string;
  isSystemReport: boolean;
  conversationId?: string;
}

type ErrorType = 'EXPIRED_TOKEN' | 'INVALID_TOKEN' | 'GENERIC';

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

function getCurrentUserId(): string | null {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.userId ?? null;
  } catch {
    return null;
  }
}

export default function SharedPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [data, setData] = useState<SharedConversation | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.SHARE.GET(token)}`);

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          const code = json.code as string | undefined;

          if (code === 'EXPIRED_TOKEN') {
            const payload = decodeJwtPayload(token);
            const ownerUserId = payload?.userId as string | undefined;
            const conversationId = payload?.sub as string | undefined;
            const currentUserId = getCurrentUserId();
            const isOwner = !!currentUserId && currentUserId === ownerUserId;

            if (isOwner && conversationId) {
              setRenewing(true);
              try {
                const accessToken = getAccessToken();
                const renewRes = await fetch(
                  `${API_CONFIG.BASE_URL}${API_ENDPOINTS.SHARE.CREATE(conversationId)}`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    },
                  }
                );
                if (renewRes.ok) {
                  const renewJson = await renewRes.json();
                  const newToken = renewJson.data?.token ?? renewJson.token;
                  if (newToken) {
                    router.replace(`/shared/${newToken}`);
                    return;
                  }
                }
              } catch {
                // 갱신 실패 → 만료 에러 페이지로 fallback
              }
              setRenewing(false);
            }

            setErrorType('EXPIRED_TOKEN');
          } else if (code === 'INVALID_TOKEN') {
            setErrorType('INVALID_TOKEN');
          } else {
            setErrorType('GENERIC');
          }
          return;
        }

        const json = await res.json();
        const raw = (json.data ?? json) as SharedConversationRaw;

        const messages: ChatMessageType[] = raw.messages.map((msg) => {
          // 백엔드 MessageItem은 "data" 필드명 사용
          // 기존 채팅 공유는 "structuredData" 필드명 사용 → 둘 다 지원
          const chartData = msg.data ?? msg.structuredData;
          return {
            role: msg.role as ChatMessageType['role'],
            content: msg.content,
            timestamp: msg.timestamp ?? 0,
            ...(chartData?.length ? { data: chartData } : {}),
            ...(msg.chartType ? { chartType: msg.chartType } : {}),
          };
        });

        const conversationId = raw.conversation?.conversationId ?? raw.conversationId;
        const userId = raw.conversation?.userId ?? raw.userId ?? '';
        const title = raw.conversation?.title ?? raw.title ?? '';
        const createdAt = raw.conversation?.createdAt ?? raw.createdAt;
        const isSystemReport =
          userId === 'system' ||
          title.includes('주간 리포트') ||
          title.includes('주간 자동 리포트') ||
          (typeof conversationId === 'string' && conversationId.startsWith('report_'));

        setData({ messages, expiresAt: raw.expiresAt, createdAt, title, isSystemReport, conversationId });
      } catch {
        setErrorType('GENERIC');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  // 리포트 모드: 자체 레이아웃 전체 교체
  if (!loading && !errorType && data?.isSystemReport) {
    return (
      <div className="h-full overflow-y-auto">
        <ReportView
          messages={data.messages}
          title={data.title}
          expiresAt={data.expiresAt}
          createdAt={data.createdAt}
          conversationId={data.conversationId}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--neutral-50)' }}>
      {/* 상단 배너 */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--white)',
          borderBottom: '1px solid var(--neutral-100)',
          boxShadow: 'var(--shadow-xs)',
          padding: '0 24px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="flex items-center gap-3">
          {/* 링크 아이콘 */}
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: 'var(--neutral-400)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-[13px] font-medium" style={{ color: 'var(--neutral-600)' }}>
            공유된 대화
          </span>
          {data?.expiresAt && (
            <span
              className="text-[12px]"
              style={{
                color: 'var(--neutral-400)',
                background: 'var(--neutral-50)',
                border: '1px solid var(--neutral-100)',
                borderRadius: '4px',
                padding: '2px 8px',
              }}
            >
              만료일: {formatExpiry(data.expiresAt)}
            </span>
          )}
        </div>

        <button
          onClick={() => router.push('/')}
          className="cds-btn cds-btn--md"
          style={{
            background: 'var(--primary-500)',
            color: 'white',
            border: 'none',
          }}
        >
          AI 리포트 시스템으로 이동
        </button>
      </div>

      {/* 메시지 목록 */}
      <div
        style={{
          maxWidth: '768px',
          margin: '0 auto',
          padding: '32px 24px 64px',
        }}
      >
        {(loading || renewing) && (
          <div
            className="flex justify-center py-20 text-[14px]"
            style={{ color: 'var(--neutral-400)' }}
          >
            {renewing ? '새 링크를 생성하는 중...' : '불러오는 중...'}
          </div>
        )}

        {!loading && !renewing && errorType === 'EXPIRED_TOKEN' && (
          <div className="flex flex-col items-center py-20 gap-3">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: 'var(--neutral-300)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[15px] font-medium" style={{ color: 'var(--neutral-700)' }}>
              이 링크는 만료되었어요.
            </p>
            <p className="text-[13px]" style={{ color: 'var(--neutral-400)' }}>
              공유 링크의 유효 기간이 지났어요.
            </p>
            <button
              onClick={() => router.push('/')}
              className="cds-btn cds-btn--md"
              style={{
                background: 'var(--primary-500)',
                color: 'white',
                border: 'none',
                marginTop: '8px',
              }}
            >
              홈으로 이동하기
            </button>
          </div>
        )}

        {!loading && !renewing && errorType === 'INVALID_TOKEN' && (
          <div className="flex flex-col items-center py-20 gap-3">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: 'var(--neutral-300)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p className="text-[15px] font-medium" style={{ color: 'var(--neutral-700)' }}>
              존재하지 않는 링크입니다
            </p>
            <p className="text-[13px]" style={{ color: 'var(--neutral-400)' }}>
              링크가 올바른지 확인해주세요.
            </p>
            <button
              onClick={() => router.push('/')}
              className="cds-btn cds-btn--md"
              style={{
                background: 'var(--primary-500)',
                color: 'white',
                border: 'none',
                marginTop: '8px',
              }}
            >
              홈으로 이동
            </button>
          </div>
        )}

        {!loading && !renewing && errorType === 'GENERIC' && (
          <div className="flex flex-col items-center py-20 gap-3">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: 'var(--neutral-300)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-[15px]" style={{ color: 'var(--neutral-500)' }}>
              공유 링크를 불러올 수 없습니다.
            </p>
            <button
              onClick={() => router.push('/')}
              className="cds-btn cds-btn--md"
              style={{
                background: 'var(--primary-500)',
                color: 'white',
                border: 'none',
                marginTop: '8px',
              }}
            >
              홈으로 이동
            </button>
          </div>
        )}

        {!loading && !renewing && !errorType && data?.messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} isStreaming={false} />
        ))}
      </div>
    </div>
  );
}