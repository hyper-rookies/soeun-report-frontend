'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { conversationService } from '@/services';
import { useChatStore } from '@/store';
import { ConversationSummary } from '@/types/chat';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / 60_000);
  const hr = Math.floor(diff / 3_600_000);
  const day = Math.floor(diff / 86_400_000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  if (hr < 24) return `${hr}시간 전`;
  if (day < 7) return `${day}일 전`;
  return new Date(timestamp).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

type Group = { label: string; items: ConversationSummary[] };

function groupConversations(convs: ConversationSummary[]): Group[] {
  if (!Array.isArray(convs)) return [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = todayStart.getTime();
  const yesterday = today - 86_400_000;
  const weekAgo = today - 7 * 86_400_000;
  const monthAgo = today - 30 * 86_400_000;

  const buckets: Record<string, ConversationSummary[]> = {
    '오늘': [],
    '어제': [],
    '이번 주': [],
    '이번 달': [],
    '이전': [],
  };

  for (const c of convs) {
    const t = c.updatedAt;
    if (t >= today) buckets['오늘'].push(c);
    else if (t >= yesterday) buckets['어제'].push(c);
    else if (t >= weekAgo) buckets['이번 주'].push(c);
    else if (t >= monthAgo) buckets['이번 달'].push(c);
    else buckets['이전'].push(c);
  }

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ConversationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentConversationId: string;
  onNewConversation: () => Promise<void>;
}

export const ConversationSidebar: FC<ConversationSidebarProps> = ({
  isOpen,
  onClose,
  currentConversationId,
  onNewConversation,
}) => {
  const router = useRouter();
  const conversations    = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const removeConversation = useChatStore((s) => s.removeConversation);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fetchCountRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;

    const fetchId = ++fetchCountRef.current;
    setLoading(true);

    conversationService
      .listConversations()
      .then((data) => {
        if (fetchId === fetchCountRef.current) setConversations(data);
      })
      .catch(() => {
        if (fetchId === fetchCountRef.current) setConversations([]);
      })
      .finally(() => {
        if (fetchId === fetchCountRef.current) setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSelect = (id: string) => {
    router.push(`/chat/${id}`);
    onClose();
  };

  const handleNew = async () => {
    await onNewConversation();
    onClose();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await conversationService.deleteConversation(id);
      removeConversation(id);
      if (id === currentConversationId) {
        router.push('/');
      }
    } catch (e) {
      console.error('[ConversationSidebar] 삭제 실패:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const groups = groupConversations(conversations);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(0,0,0,0.25)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s ease-in-out',
        }}
      />

      {/* Sidebar panel */}
      <aside
        aria-label="대화 목록"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          width: '280px',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--white)',
          borderRight: '1px solid var(--neutral-100)',
          boxShadow: isOpen ? 'var(--shadow-2xl)' : 'none',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease-in-out',
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingInlineStart: '20px',
            paddingInlineEnd: '12px',
            height: '60px',
            borderBottom: '1px solid var(--neutral-100)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ background: 'var(--primary-500)' }}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[14px] font-bold tracking-[-0.02em]" style={{ color: 'var(--neutral-700)' }}>
              AI 리포트
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="닫기"
            className="cds-btn cds-btn--icon cds-btn--ghost"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 새 대화 버튼 — button-lg 스펙 */}
        <div style={{ flexShrink: 0, padding: '16px 16px 8px' }}>
          <button
            onClick={handleNew}
            className="cds-btn cds-btn--lg w-full"
            style={{
              background: 'var(--primary-500)',
              color: 'var(--white)',
              width: '100%',
              justifyContent: 'center',
              borderRadius: '8px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--primary-450)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'var(--primary-500)')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            새 채팅
          </button>
        </div>

        {/* 대화 목록 */}
        <div className="cds-header__gnb flex-1 px-2 pb-6">
          {loading ? (
            <div className="flex flex-col gap-1 px-2 pt-2">
              {[100, 75, 90].map((w) => (
                <div key={w} style={{ padding: '12px 18px' }}>
                  <div
                    className="h-3 rounded animate-pulse mb-1.5"
                    style={{ width: `${w}%`, background: 'var(--neutral-100)' }}
                  />
                  <div className="h-2 rounded animate-pulse w-16" style={{ background: 'var(--neutral-100)' }} />
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="text-[13px] text-center pt-8" style={{ color: 'var(--neutral-300)' }}>
              새로운 채팅을 시작해보세요.
            </p>
          ) : (
            groups.map(({ label, items }) => (
              <div key={label} className="mb-1 mt-1">
                <p
                  className="text-[10px] font-semibold tracking-[0.06em] uppercase"
                  style={{
                    color: 'var(--neutral-300)',
                    padding: '8px 18px 4px',
                  }}
                >
                  {label}
                </p>
                {items.map((conv) => {
                  const active = conv.id === currentConversationId;
                  const isDeleting = deletingId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelect(conv.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelect(conv.id)}
                      className="group flex items-start gap-1 cursor-pointer rounded-lg mb-px"
                      style={{
                        padding: '12px 18px',
                        background: active ? 'var(--primary-50)' : 'transparent',
                        color: active ? 'var(--primary-700)' : 'var(--neutral-500)',
                        borderLeft: active ? `2px solid var(--primary-500)` : '2px solid transparent',
                        transition: 'background-color 0.1s, color 0.1s',
                      }}
                      onMouseOver={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'var(--neutral-50)';
                          e.currentTarget.style.color = 'var(--neutral-700)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--neutral-500)';
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium leading-snug truncate">
                          {conv.title || '새 대화'}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--neutral-300)' }}>
                          {getRelativeTime(conv.updatedAt)}
                        </p>
                      </div>

                      {/* 삭제 버튼 */}
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        aria-label="대화 삭제"
                        disabled={isDeleting}
                        className="shrink-0 w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 mt-0.5 transition-opacity"
                        style={{
                          color: 'var(--neutral-300)',
                          cursor: isDeleting ? 'not-allowed' : 'pointer',
                          border: 'none',
                          background: 'transparent',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = 'var(--primary-500)';
                          e.currentTarget.style.background = 'var(--primary-100)';
                          e.currentTarget.style.borderRadius = '4px';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = 'var(--neutral-300)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};

export default ConversationSidebar;
