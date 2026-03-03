'use client';

import { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { conversationService } from '@/services';
import { Conversation } from '@/types/chat';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getConversationTitle(conv: Conversation): string {
  const firstUserMsg = conv.messages?.find((m) => m.role === 'user');
  if (firstUserMsg?.content) {
    const text = firstUserMsg.content.trim();
    return text.length > 36 ? text.slice(0, 36) + '…' : text;
  }
  return '새 대화';
}

function getRelativeTime(timestamp: number): string {
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

type Group = { label: string; items: Conversation[] };

function groupConversations(convs: Conversation[]): Group[] {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = todayStart.getTime();
  const yesterday = today - 86_400_000;
  const weekAgo = today - 7 * 86_400_000;
  const monthAgo = today - 30 * 86_400_000;

  const buckets: Record<string, Conversation[]> = {
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    conversationService
      .listConversations()
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleSelect = (id: string) => {
    router.push(`/chat/${id}`);
    onClose();
  };

  const handleNew = async () => {
    await onNewConversation();
    onClose();
  };

  const groups = groupConversations(conversations);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className={[
          'fixed inset-0 z-40 bg-black/20 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        aria-label="대화 목록"
        className={[
          'fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col',
          'bg-[var(--surface-elevated)] border-r border-[var(--border-default)]',
          'transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Sidebar header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[var(--border-faint)]">
          <span className="text-[15px] font-bold text-[var(--text-ink)] tracking-[-0.02em]">
            AI 리포트
          </span>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-soft)] hover:text-[var(--text-ink)] hover:bg-[var(--surface-well)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New conversation button */}
        <div className="shrink-0 px-4 py-3">
          <button
            onClick={handleNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-[13px] font-medium text-[var(--text-ink)] border border-[var(--border-default)] hover:bg-[var(--surface-well)] transition-colors"
          >
            <svg className="w-4 h-4 text-[var(--text-soft)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            새로운 분석
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-6">
          {loading ? (
            <div className="flex flex-col gap-2 px-2 pt-2">
              {[100, 80, 90].map((w) => (
                <div key={w} className="py-2.5 px-3">
                  <div
                    className="h-3 rounded-sm bg-[var(--border-default)] animate-pulse mb-1.5"
                    style={{ width: `${w}%` }}
                  />
                  <div className="h-2 rounded-sm bg-[var(--border-faint)] animate-pulse w-16" />
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="px-4 pt-6 text-[13px] text-[var(--text-ghost)] text-center">
              대화 기록이 없습니다
            </p>
          ) : (
            groups.map(({ label, items }) => (
              <div key={label} className="mb-2 mt-1">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-ghost)] tracking-[0.06em] uppercase">
                  {label}
                </p>
                {items.map((conv) => {
                  const active = conv.id === currentConversationId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelect(conv.id)}
                      className={[
                        'w-full text-left px-3 py-2.5 rounded-md mb-px transition-colors',
                        active
                          ? 'bg-[var(--surface-ai)] text-[var(--text-ink)]'
                          : 'text-[var(--text-dim)] hover:bg-[var(--surface-well)] hover:text-[var(--text-ink)]',
                      ].join(' ')}
                    >
                      <p className="text-[13px] font-medium leading-snug truncate">
                        {getConversationTitle(conv)}
                      </p>
                      <p className="text-[11px] text-[var(--text-ghost)] mt-0.5">
                        {getRelativeTime(conv.updatedAt)}
                      </p>
                    </button>
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
