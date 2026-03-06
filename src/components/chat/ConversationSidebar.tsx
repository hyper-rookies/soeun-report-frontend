'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { conversationService } from '@/services';
import apiClient from '@/lib/axiosInstance';
import { getAccessToken } from '@/lib/auth';
import { useChatStore } from '@/store';
import { ConversationSummary } from '@/types/chat';
import { API_ENDPOINTS } from '@/utils/constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / 60_000);
  const hr  = Math.floor(diff / 3_600_000);
  const day = Math.floor(diff / 86_400_000);
  if (min < 1)  return '방금 전';
  if (min < 60) return `${min}분 전`;
  if (hr  < 24) return `${hr}시간 전`;
  if (day < 7)  return `${day}일 전`;
  return new Date(timestamp).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

type Group = { label: string; items: ConversationSummary[] };

function groupConversations(convs: ConversationSummary[]): Group[] {
  if (!Array.isArray(convs)) return [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today     = todayStart.getTime();
  const yesterday = today - 86_400_000;
  const weekAgo   = today - 7  * 86_400_000;
  const monthAgo  = today - 30 * 86_400_000;

  const buckets: Record<string, ConversationSummary[]> = {
    '오늘': [], '어제': [], '이번 주': [], '이번 달': [], '이전': [],
  };
  for (const c of convs) {
    const t = c.updatedAt;
    if      (t >= today)     buckets['오늘'].push(c);
    else if (t >= yesterday) buckets['어제'].push(c);
    else if (t >= weekAgo)   buckets['이번 주'].push(c);
    else if (t >= monthAgo)  buckets['이번 달'].push(c);
    else                     buckets['이전'].push(c);
  }
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

// ─── Progress helpers ──────────────────────────────────────────────────────────

const PHASES = [
  { until: 10_000, label: '📡 데이터 조회 중...' },
  { until: 25_000, label: '🤖 AI 분석 중...' },
  { until: 45_000, label: '📝 리포트 작성 중...' },
  { until: Infinity, label: '🔄 마무리 중...' },
] as const;

function getPhaseLabel(elapsed: number): string {
  return PHASES.find((p) => elapsed < p.until)?.label ?? '🔄 마무리 중...';
}

function calcProgress(elapsed: number): number {
  if (elapsed < 45_000) return (elapsed / 45_000) * 80;
  return Math.min(95, 80 + ((elapsed - 45_000) / 30_000) * 15);
}

type GenStatus = 'idle' | 'running' | 'done' | 'error';

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({
  icon, label, active, onClick, collapsed,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  collapsed?: boolean;
}) {
  return (
    <div className="relative group w-full flex justify-center">
      <button
        onClick={onClick}
        // 🍎 h-10(40px)를 명시적으로 주어 접히든 펼치든 높이가 절대 변하지 않도록 고정!
        className={`flex items-center rounded-lg text-[13px] font-medium transition-colors h-10 ${
          collapsed ? 'justify-center w-10 mx-auto' : 'px-3 w-full gap-2.5'
        }`}
        style={{
          background: active ? 'var(--neutral-100)' : 'transparent',
          color: 'var(--neutral-600)',
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseOver={(e) => { if (!active) e.currentTarget.style.background = 'var(--neutral-50)'; }}
        onMouseOut={(e)  => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        <span className="shrink-0 flex items-center justify-center w-5 h-5" style={{ color: 'var(--neutral-400)' }}>
          {icon}
        </span>
        {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      </button>

      {/* 디자인 시스템 툴팁 */}
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-4 py-3 bg-[var(--white)] text-[var(--neutral-600)] text-[13px] font-normal leading-relaxed rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[2100] shadow-[var(--shadow-lg)] border border-[var(--border-default)] pointer-events-none whitespace-nowrap">
          {label}
        </div>
      )}
    </div>
  );
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
  const router            = useRouter();
  const conversations     = useChatStore((s) => s.conversations);
  const setConversations  = useChatStore((s) => s.setConversations);
  const removeConversation = useChatStore((s) => s.removeConversation);
  
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);

  const [loading,      setLoading]      = useState(false);
  const [reports,      setReports]      = useState<Record<string, unknown>[]>([]);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [loadingShareId, setLoadingShareId] = useState<string | null>(null);
  const [copiedId,     setCopiedId]     = useState<string | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const fetchCountRef = useRef(0);
  const tokenCacheRef = useRef<Record<string, string>>({});

  const [reportOpen,   setReportOpen]   = useState(false); 
  const [searchQuery,  setSearchQuery]  = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [genStatus,     setGenStatus]     = useState<GenStatus>('idle');
  const [genProgress,   setGenProgress]   = useState(0);
  const [genPhase,      setGenPhase]      = useState('');
  const [genError,      setGenError]      = useState('');
  const [genErrorType,  setGenErrorType]  = useState<'network' | 'timeout' | 'general'>('general');
  const [genSuccessMsg, setGenSuccessMsg] = useState(false);
  const genStartRef   = useRef(0);
  const genTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReports = async () => {
    const token = getAccessToken();
    const res = await fetch(
      `/api/chat/reports`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    return (data.data || []) as Record<string, unknown>[];
  };

  useEffect(() => {
    const fetchId = ++fetchCountRef.current;
    setLoading(true);
    Promise.all([
      conversationService.listConversations().catch(() => [] as ConversationSummary[]),
      fetchReports().catch(() => [] as Record<string, unknown>[]),
    ]).then(([convData, reportData]) => {
      if (fetchId !== fetchCountRef.current) return;
      setConversations(convData);
      setReports(reportData);
    }).finally(() => {
      if (fetchId === fetchCountRef.current) setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (genStatus === 'running') {
      genStartRef.current = Date.now();
      genTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - genStartRef.current;
        setGenProgress(calcProgress(elapsed));
        setGenPhase(getPhaseLabel(elapsed));
      }, 200);
    } else {
      if (genTimerRef.current) { clearInterval(genTimerRef.current); genTimerRef.current = null; }
    }
    return () => { if (genTimerRef.current) clearInterval(genTimerRef.current); };
  }, [genStatus]);

  const chatConvs = conversations;
  const filteredChats = searchQuery.trim()
    ? chatConvs.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatConvs;

  const getShareToken = async (id: string): Promise<string> => {
    if (tokenCacheRef.current[id]) return tokenCacheRef.current[id];
    const res = await apiClient.post<Record<string, unknown>>(API_ENDPOINTS.SHARE.CREATE(id));
    const d   = (res.data?.data ?? res.data) as Record<string, unknown>;
    const tok = String(d?.shareToken ?? d?.token ?? '');
    tokenCacheRef.current[id] = tok;
    return tok;
  };

  const handleNew = async () => { await onNewConversation(); };
  const handleSelect = (id: string) => { router.push(`/chat/${id}`); };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await conversationService.deleteConversation(id);
      removeConversation(id);
      if (id === currentConversationId) router.push('/');
    } catch (err) {
      console.error('[Sidebar] 삭제 실패:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerateReport = async () => {
    if (genStatus === 'running') return;
    setSidebarOpen(true);
    setReportOpen(true);
    setGenStatus('running');
    setGenProgress(0);
    setGenPhase(getPhaseLabel(0));
    setGenError('');
    setGenSuccessMsg(false);

    try {
      const token      = getAccessToken();
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 300_000);

      const res = await fetch('/api/report/generate', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json() as { success?: boolean; data?: { shareToken?: string }; error?: string; message?: string; };

      if (!res.ok || data.success === false) {
        setGenStatus('error');
        setGenErrorType('general');
        setGenError(data.message ?? data.error ?? '생성에 실패했습니다.');
        return;
      }

      setGenProgress(100);
      const newReports = await fetchReports().catch(() => null);
      if (newReports) setReports(newReports);

      setTimeout(() => {
        setGenStatus('done');
        setGenSuccessMsg(true);
        setTimeout(() => { setGenStatus('idle'); setGenSuccessMsg(false); }, 3000);
      }, 1000);
    } catch (err) {
      setGenStatus('error');
      setGenErrorType('general');
      setGenError('생성에 실패했습니다.');
    }
  };

  const groups = groupConversations(filteredChats);
  const isGenerating = genStatus === 'running';

  const todayStr     = new Date().toISOString().slice(0, 10);
  const todayCompact = todayStr.replace(/-/g, '');

  return (
    <aside
      aria-label="대화 목록"
      className="shrink-0 flex flex-col bg-[var(--white)] border-r border-[var(--neutral-100)] relative"
      style={{
        width: isOpen ? '280px' : '68px',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        overflow: 'visible',
      }}
    >
      {/* ── Header (햄버거 메뉴) ── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: isOpen ? 'space-between' : 'center',
        padding: isOpen ? '16px 12px' : '16px 0',
        height: '60px',
      }}>
        <button
          onClick={() => setSidebarOpen(!isOpen)}
          className="flex items-center justify-center rounded-full transition-colors text-[var(--neutral-500)] hover:bg-[var(--neutral-100)]"
          style={{ width: '40px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer' }}
          aria-label="메뉴 토글"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* ── Nav 영역 (순서 재배치 및 간격 확보) ── */}
      <div className="flex flex-col gap-3" style={{ flexShrink: 0, padding: isOpen ? '16px 12px' : '16px 0' }}>

        {/* 1. 검색창 */}
        {!isOpen ? (
          <NavItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            label="검색"
            onClick={() => setSidebarOpen(true)}
            collapsed={true}
          />
        ) : (
          <div className="flex-1 flex items-center gap-2"
            style={{
              padding: '0 12px', height: '40px', borderRadius: '999px',
              background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)',
            }}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--neutral-400)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="대화 검색..."
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: 'var(--neutral-700)', width: '100%' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ color: 'var(--neutral-400)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* 2. 새 채팅 */}
        <NavItem
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          }
          label="새 채팅"
          onClick={handleNew}
          collapsed={!isOpen}
        />

        {/* 3. 주간 리포트 토글 행 */}
        <div className="relative group flex justify-center w-full">
          <button
            onClick={() => {
              if (!isOpen) { setSidebarOpen(true); setReportOpen(true); }
              else setReportOpen((v) => !v);
            }}
            className={`flex items-center rounded-lg text-[13px] font-medium transition-colors h-10 ${
              !isOpen ? 'justify-center w-10 mx-auto' : 'px-3 w-full gap-2.5'
            }`}
            style={{ background: 'transparent', color: 'var(--neutral-600)', border: 'none', cursor: 'pointer' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--neutral-50)')}
            onMouseOut={(e)  => (e.currentTarget.style.background = 'transparent')}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--neutral-400)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {isOpen && (
              <>
                <span className="flex-1 text-left truncate">주간 리포트</span>
                <svg className="w-3.5 h-3.5" style={{ color: 'var(--neutral-400)', transform: reportOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>

          {/* 주간 리포트 여유롭고 예쁜 툴팁 */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-4 py-3 bg-[var(--white)] text-[var(--neutral-600)] text-[13px] font-normal leading-relaxed rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[2100] shadow-[var(--shadow-lg)] border border-[var(--border-default)] pointer-events-none whitespace-nowrap">
            {!isOpen && <div className="font-semibold text-[var(--neutral-700)] mb-1">주간 리포트</div>}
            <span className="text-[12px] text-[var(--neutral-500)]">매주 월요일 오전 8시에 자동 생성됩니다.</span>
          </div>
        </div>

        {/* 리포트 펼침 패널 */}
        {isOpen && reportOpen && (
          <div style={{ marginLeft: '12px', paddingBottom: '4px', paddingTop: '8px' }}>
            {isGenerating && (
              <div style={{ margin: '0 0 8px', padding: '10px 12px', borderRadius: '8px', background: 'var(--neutral-50)', border: '1px solid var(--neutral-100)' }}>
                <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--neutral-600)' }}>{genPhase}</p>
                <div style={{ height: '4px', borderRadius: '4px', background: 'var(--neutral-200)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '4px', background: 'var(--primary-500)', width: `${genProgress}%`, transition: genProgress === 100 ? 'width 0.4s ease-out' : 'width 0.3s linear' }} />
                </div>
              </div>
            )}
            {genSuccessMsg && <p className="text-[12px] font-medium px-1 pb-2" style={{ color: 'var(--primary-600)' }}>✅ 리포트가 생성됐습니다.</p>}
            {loading ? (
              <div style={{ padding: '6px 4px' }}><div className="h-3 rounded animate-pulse" style={{ width: '70%', background: 'var(--neutral-100)' }} /></div>
            ) : reports.length === 0 ? (
              <p className="text-[12px] text-center py-2" style={{ color: 'var(--neutral-300)' }}>생성된 리포트가 없습니다.</p>
            ) : (
              reports.map((item) => {
                const itemId = String(item.conversationId ?? item.id ?? '');
                const dateLabel = item.createdAt ? new Date(item.createdAt as string).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : String(item.title ?? '');
                return (
                  <div key={itemId} className="flex items-center gap-1 rounded-lg" style={{ padding: '5px 4px' }}>
                    <span className="text-[12px] text-neutral-600">{dateLabel}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {isOpen && <div style={{ flexShrink: 0, height: '1px', background: 'var(--neutral-100)', margin: '0 12px 8px' }} />}

      {/* ── 대화 목록 ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-6">
        {isOpen && groups.map(({ label, items }) => (
          <div key={label} className="mb-1 mt-1">
            <p className="text-[10px] font-semibold tracking-[0.06em] uppercase" style={{ color: 'var(--neutral-300)', padding: '8px 18px 4px' }}>{label}</p>
            {items.map((conv) => {
              const active = conv.id === currentConversationId;
              return (
                <div key={conv.id} onClick={() => handleSelect(conv.id)} className="group flex items-start gap-1 cursor-pointer rounded-lg mb-px"
                  style={{ padding: '12px 18px', background: active ? 'var(--primary-50)' : 'transparent', color: active ? 'var(--primary-700)' : 'var(--neutral-500)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium leading-snug truncate">{conv.title || '새 대화'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 🍎 하단 프로필 & 설정 (사이드바 120px 높이 완벽 고정) ── */}
      <div style={{
        flexShrink: 0,
        height: '128px', // 🍎 오른쪽 인풋창과 높이를 완벽하게 일치시킴!
        boxSizing: 'border-box',
        padding: isOpen ? '0 12px' : '0',
        borderTop: '1px solid var(--neutral-100)',
        display: 'flex', flexDirection: 'column', gap: '8px', 
        justifyContent: 'center', alignItems: 'center'
      }}>
        <NavItem
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          label="설정" onClick={() => {}} collapsed={!isOpen}
        />

        <div className="relative group w-full flex justify-center">
          <button
            className={`flex items-center rounded-lg text-[13px] font-medium transition-colors h-10 ${
              !isOpen ? 'justify-center w-10 mx-auto' : 'px-3 w-full gap-2.5'
            }`}
            style={{ background: 'transparent', color: 'var(--neutral-700)', border: 'none', cursor: 'pointer' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--neutral-100)')}
            onMouseOut={(e)  => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {isOpen && <span className="flex-1 text-left truncate">내 프로필</span>}
          </button>
          
          {/* 하단 프로필 여유롭고 예쁜 툴팁 */}
          {!isOpen && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-4 py-3 bg-[var(--white)] text-[var(--neutral-600)] text-[13px] font-normal leading-relaxed rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[2100] shadow-[var(--shadow-lg)] border border-[var(--border-default)] pointer-events-none whitespace-nowrap">
              내 프로필
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ConversationSidebar;