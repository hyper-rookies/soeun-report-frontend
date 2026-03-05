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

function formatReportDate(conv: ConversationSummary): string {
  const match = conv.title.match(/(\d{8})$/);
  if (match) {
    const d = match[1];
    return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
  }
  if (conv.createdAt) {
    return new Date(conv.createdAt).toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  }
  return conv.title;
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
  icon, label, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium"
      style={{
        padding: '8px 12px',
        background: active ? 'var(--neutral-100)' : 'transparent',
        color: 'var(--neutral-600)',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.1s',
      }}
      onMouseOver={(e) => { if (!active) e.currentTarget.style.background = 'var(--neutral-50)'; }}
      onMouseOut={(e)  => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ color: 'var(--neutral-400)', display: 'flex' }}>{icon}</span>
      {label}
    </button>
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

  // ── list state ────────────────────────────────────────────────────────────
  const [loading,      setLoading]      = useState(false);
  const [reports,      setReports]      = useState<Record<string, unknown>[]>([]);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [loadingShareId, setLoadingShareId] = useState<string | null>(null);
  const [copiedId,     setCopiedId]     = useState<string | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const fetchCountRef = useRef(0);
  const tokenCacheRef = useRef<Record<string, string>>({});

  // ── nav state ─────────────────────────────────────────────────────────────
  const [reportOpen,   setReportOpen]   = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── generation state ──────────────────────────────────────────────────────
  const [genStatus,     setGenStatus]     = useState<GenStatus>('idle');
  const [genProgress,   setGenProgress]   = useState(0);
  const [genPhase,      setGenPhase]      = useState('');
  const [genError,      setGenError]      = useState('');
  const [genErrorType,  setGenErrorType]  = useState<'network' | 'timeout' | 'general'>('general');
  const [genSuccessMsg, setGenSuccessMsg] = useState(false);
  const genStartRef   = useRef(0);
  const genTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── fetch list ────────────────────────────────────────────────────────────
  const fetchReports = async () => {
    const token = getAccessToken();
    const res = await fetch(
      `/api/chat/reports`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    console.log('[리포트 목록]', data);
    return (data.data || []) as Record<string, unknown>[];
  };

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  // ── search focus ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchActive) setTimeout(() => searchInputRef.current?.focus(), 50);
    else setSearchQuery('');
  }, [searchActive]);

  // ── progress timer ────────────────────────────────────────────────────────
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

  // ── filters ───────────────────────────────────────────────────────────────
  const chatConvs = conversations;
  const filteredChats = searchQuery.trim()
    ? chatConvs.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatConvs;

  // ── share token ───────────────────────────────────────────────────────────
  const getShareToken = async (id: string): Promise<string> => {
    if (tokenCacheRef.current[id]) return tokenCacheRef.current[id];
    const res = await apiClient.post<Record<string, unknown>>(API_ENDPOINTS.SHARE.CREATE(id));
    const d   = (res.data?.data ?? res.data) as Record<string, unknown>;
    const tok = String(d?.shareToken ?? d?.token ?? '');
    tokenCacheRef.current[id] = tok;
    return tok;
  };

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleNew = async () => { await onNewConversation(); onClose(); };

  const handleSelect = (id: string) => { router.push(`/chat/${id}`); onClose(); };

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

  const handleViewReport = async (id: string) => {
    setLoadingShareId(id);
    try {
      const token = await getShareToken(id);
      if (token) window.open(`/shared/${token}`, '_blank');
      else { router.push(`/chat/${id}`); onClose(); }
    } catch {
      router.push(`/chat/${id}`); onClose();
    } finally {
      setLoadingShareId(null);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLoadingShareId(id);
    try {
      const token = await getShareToken(id);
      if (token) {
        await navigator.clipboard.writeText(`${window.location.origin}/shared/${token}`);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error('[Sidebar] 링크 복사 실패:', err);
    } finally {
      setLoadingShareId(null);
    }
  };

  const handleGenerateReport = async () => {
    if (genStatus === 'running') return;
    setReportOpen(true);
    setGenStatus('running');
    setGenProgress(0);
    setGenPhase(getPhaseLabel(0));
    setGenError('');
    setGenSuccessMsg(false);

    try {
      const token      = getAccessToken();
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 300_000); // 5분

      const res = await fetch('/api/report/generate', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json() as {
        success?: boolean;
        data?: { shareToken?: string };
        error?: string;
        message?: string;
      };
      console.log('[생성 응답 전체]', data);
      console.log('[success]', data.success);
      console.log('[shareToken]', data.data?.shareToken);

      if (!res.ok || data.success === false) {
        setGenStatus('error');
        setGenErrorType('general');
        setGenError(data.message ?? data.error ?? '생성에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      // 성공: 프로그레스 100% + 리포트 목록 재조회
      setGenProgress(100);

      const newReports = await fetchReports().catch(() => null);
      if (newReports) setReports(newReports);

      // 신규 항목 하이라이트
      const allReports = newReports ?? reports;
      const newest = [...allReports].sort((a, b) => {
        const aTs = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
        const bTs = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
        return bTs - aTs;
      })[0];
      if (newest) {
        setNewlyAddedId(String(newest.conversationId ?? newest.id ?? ''));
        setTimeout(() => setNewlyAddedId(null), 2500);
      }

      setTimeout(() => {
        setGenStatus('done');
        setGenSuccessMsg(true);
        setTimeout(() => {
          setGenStatus('idle');
          setGenSuccessMsg(false);
        }, 3000);
      }, 1000);
    } catch (err) {
      console.error('[Sidebar] 리포트 생성 실패:', err);
      setGenStatus('error');
      if (err instanceof Error && err.name === 'AbortError') {
        setGenErrorType('timeout');
        setGenError('리포트 생성에 시간이 걸리고 있습니다. 잠시 후 목록을 확인해주세요.');
        // 타임아웃은 백엔드에서 실제로 생성 중일 수 있으므로 자동으로만 닫기
        setTimeout(() => setGenStatus('idle'), 6000);
      } else if (err instanceof TypeError) {
        setGenErrorType('network');
        setGenError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        setTimeout(() => setGenStatus('idle'), 5000);
      } else {
        setGenErrorType('general');
        setGenError('리포트 생성에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const groups = groupConversations(filteredChats);
  const isGenerating = genStatus === 'running';

  // ── today report check ────────────────────────────────────────────────────
  const todayStr     = new Date().toISOString().slice(0, 10); // "2026-03-05"
  const todayCompact = todayStr.replace(/-/g, '');            // "20260305"
  const hasTodayReport = reports.some(
    (r) =>
      r.conversationId === `report_${todayCompact}` ||
      (r.createdAt && String(r.createdAt).startsWith(todayStr)),
  );

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        aria-hidden
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 2040,
          background: 'rgba(0,0,0,0.25)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s ease-in-out',
        }}
      />

      {/* ── Sidebar panel ── */}
      <aside
        aria-label="대화 목록"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 2050,
          width: '280px', display: 'flex', flexDirection: 'column',
          background: 'var(--white)',
          borderRight: '1px solid var(--neutral-100)',
          boxShadow: isOpen ? 'var(--shadow-2xl)' : 'none',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease-in-out',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          paddingInline: '20px 12px', height: '60px',
          borderBottom: '1px solid var(--neutral-100)',
        }}>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ background: 'var(--primary-500)' }}>
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[14px] font-bold tracking-[-0.02em]" style={{ color: 'var(--neutral-700)' }}>
              SE Report
            </span>
          </div>
          <button onClick={onClose} aria-label="닫기" className="cds-btn cds-btn--icon cds-btn--ghost">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Nav 영역 ── */}
        <div style={{ flexShrink: 0, padding: '8px 12px' }}>

          {/* 새 채팅 */}
          <NavItem
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            }
            label="새 채팅"
            onClick={handleNew}
          />

          {/* 검색 */}
          <NavItem
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            label="검색"
            active={searchActive}
            onClick={() => setSearchActive((v) => !v)}
          />

          {/* 검색 입력창 */}
          {searchActive && (
            <div style={{ padding: '4px 4px 2px' }}>
              <div className="flex items-center gap-2"
                style={{
                  padding: '6px 10px', borderRadius: '8px',
                  background: 'var(--neutral-50)',
                  border: '1px solid var(--neutral-200)',
                }}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{ color: 'var(--neutral-400)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setSearchActive(false)}
                  placeholder="대화 검색..."
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                    fontSize: '13px', color: 'var(--neutral-700)',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ color: 'var(--neutral-400)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 주간 리포트 토글 행 */}
          <button
            onClick={() => setReportOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium"
            style={{
              padding: '8px 12px', background: 'transparent',
              color: 'var(--neutral-600)', border: 'none', cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--neutral-50)')}
            onMouseOut={(e)  => (e.currentTarget.style.background = 'transparent')}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              style={{ color: 'var(--neutral-400)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="flex-1">주간 리포트</span>
            <svg
              className="w-3.5 h-3.5"
              style={{
                color: 'var(--neutral-400)',
                transform: reportOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.15s',
              }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* 리포트 펼침 패널 */}
          {reportOpen && (
            <div style={{ marginLeft: '8px', paddingBottom: '4px' }}>

              {/* 안내 문구 */}
              <p className="text-[10px] px-1 pt-0.5 pb-2" style={{ color: 'var(--neutral-400)' }}>
                매주 월요일 오전 8시에 자동 생성됩니다.
              </p>

              {/* 빈 목록일 때만 생성 버튼 */}
              {!loading && reports.length === 0 && !isGenerating && (
                <button
                  onClick={handleGenerateReport}
                  className="w-full flex items-center justify-center gap-1.5 text-[12px] font-medium rounded-lg"
                  style={{
                    padding: '7px 10px',
                    margin: '0 0 6px',
                    background: 'var(--primary-50)',
                    color: 'var(--primary-600)',
                    border: '1px solid var(--primary-200)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  지금 생성하기
                </button>
              )}

              {/* ── 진행 상태 표시 (생성 중) ── */}
              {isGenerating && (
                <div style={{
                  margin: '0 0 8px', padding: '10px 12px', borderRadius: '8px',
                  background: 'var(--neutral-50)', border: '1px solid var(--neutral-100)',
                }}>
                  <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--neutral-600)' }}>
                    {genPhase}
                  </p>
                  <div style={{ height: '4px', borderRadius: '4px', background: 'var(--neutral-200)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px', background: 'var(--primary-500)',
                      width: `${genProgress}%`,
                      transition: genProgress === 100 ? 'width 0.4s ease-out' : 'width 0.3s linear',
                    }} />
                  </div>
                  <p className="text-[10px] mt-1.5 text-right" style={{ color: 'var(--neutral-400)' }}>
                    {Math.round(genProgress)}% · 약 30~60초 소요
                  </p>
                </div>
              )}

              {/* ── 완료 메시지 ── */}
              {genSuccessMsg && (
                <p className="text-[12px] font-medium px-1 pb-2" style={{ color: 'var(--primary-600)' }}>
                  ✅ 리포트가 생성됐습니다. 아래 목록에서 확인하세요.
                </p>
              )}

              {/* ── 오류 메시지 ── */}
              {genStatus === 'error' && (
                <div style={{
                  margin: '0 0 8px', padding: '10px 12px', borderRadius: '8px',
                  background: '#fff5f5', border: '1px solid #fed7d7',
                }}>
                  <p className="text-[12px] font-medium" style={{
                    color: '#9b2c2c', marginBottom: genErrorType === 'general' ? '8px' : '0',
                  }}>
                    {genError}
                  </p>
                  {genErrorType === 'general' && (
                    <button
                      onClick={handleGenerateReport}
                      className="text-[12px] font-medium rounded-md"
                      style={{ padding: '4px 12px', background: '#9b2c2c', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                      다시 시도
                    </button>
                  )}
                </div>
              )}

              {/* ── 리포트 목록 ── */}
              {loading ? (
                <div style={{ padding: '6px 4px' }}>
                  <div className="h-3 rounded animate-pulse" style={{ width: '70%', background: 'var(--neutral-100)' }} />
                </div>
              ) : reports.length === 0 ? (
                <p className="text-[12px] text-center py-2" style={{ color: 'var(--neutral-300)' }}>
                  생성된 리포트가 없습니다.
                </p>
              ) : (
                reports.map((item) => {
                  const itemId     = String(item.conversationId ?? item.id ?? '');
                  const shareToken = String(item.shareToken ?? '');
                  const dateLabel  = item.createdAt
                    ? new Date(item.createdAt as string).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                      })
                    : String(item.title ?? '');
                  const isLoadingShare = loadingShareId === itemId;
                  const isCopied      = copiedId === itemId;
                  const isNewItem     = newlyAddedId === itemId;
                  const isTodayItem   =
                    itemId === `report_${todayCompact}` ||
                    (item.createdAt && String(item.createdAt).startsWith(todayStr));

                  const handleView = () => {
                    if (shareToken) window.open(`/shared/${shareToken}`, '_blank');
                  };

                  const handleCopy = async (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (!shareToken) return;
                    setLoadingShareId(itemId);
                    try {
                      await navigator.clipboard.writeText(`${window.location.origin}/shared/${shareToken}`);
                      setCopiedId(itemId);
                      setTimeout(() => setCopiedId(null), 2000);
                    } catch (err) {
                      console.error('[Sidebar] 링크 복사 실패:', err);
                    } finally {
                      setLoadingShareId(null);
                    }
                  };

                  return (
                    <div
                      key={itemId || String(item.createdAt)}
                      className="group relative flex items-center gap-1 rounded-lg"
                      style={{
                        padding: '5px 4px',
                        background: (isNewItem || isTodayItem) ? 'var(--primary-50)' : 'transparent',
                        border: (isTodayItem && !isNewItem) ? '1px solid var(--primary-100)' : '1px solid transparent',
                        transition: 'background 0.4s',
                      }}
                    >
                      {/* 날짜 + ↗ 보기 */}
                      <button
                        onClick={handleView}
                        disabled={isLoadingShare || !shareToken}
                        className="flex-1 text-left flex items-center gap-1.5 min-w-0"
                        style={{
                          background: 'none', border: 'none',
                          cursor: (isLoadingShare || !shareToken) ? 'not-allowed' : 'pointer',
                          padding: 0,
                        }}
                      >
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          style={{ color: (isNewItem || isTodayItem) ? 'var(--primary-400)' : 'var(--neutral-300)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[12px] truncate" style={{
                          color: (isNewItem || isTodayItem) ? 'var(--primary-700)' : 'var(--neutral-600)',
                          fontWeight: (isNewItem || isTodayItem) ? 600 : 400,
                        }}>
                          {dateLabel}
                        </span>
                        <svg className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          style={{ color: 'var(--primary-400)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>

                      {/* 🔗 링크 복사 */}
                      <button
                        onClick={handleCopy}
                        disabled={isLoadingShare || !shareToken}
                        aria-label="링크 복사"
                        title={isCopied ? '복사됨!' : '링크 복사'}
                        className="shrink-0 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          width: '22px', height: '22px',
                          background: isCopied ? 'var(--primary-50)' : 'transparent',
                          border: 'none',
                          cursor: (isLoadingShare || !shareToken) ? 'not-allowed' : 'pointer',
                          color: isCopied ? 'var(--primary-500)' : 'var(--neutral-300)',
                        }}
                        onMouseOver={(e) => { if (!isCopied) e.currentTarget.style.color = 'var(--primary-500)'; }}
                        onMouseOut={(e)  => { if (!isCopied) e.currentTarget.style.color = 'var(--neutral-300)'; }}
                      >
                        {isCopied ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        )}
                      </button>

                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ── 구분선 ── */}
        <div style={{ flexShrink: 0, height: '1px', background: 'var(--neutral-100)', margin: '0 12px 4px' }} />

        {/* ── 대화 목록 ── */}
        <div className="flex-1 overflow-y-auto px-2 pb-6">
          {loading ? (
            <div className="flex flex-col gap-1 px-2 pt-2">
              {[100, 75, 90].map((w) => (
                <div key={w} style={{ padding: '12px 18px' }}>
                  <div className="h-3 rounded animate-pulse mb-1.5"
                    style={{ width: `${w}%`, background: 'var(--neutral-100)' }} />
                  <div className="h-2 rounded animate-pulse w-16" style={{ background: 'var(--neutral-100)' }} />
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="text-[13px] text-center pt-8" style={{ color: 'var(--neutral-300)' }}>
              {searchQuery ? '검색 결과가 없습니다.' : '새로운 채팅을 시작해보세요.'}
            </p>
          ) : (
            groups.map(({ label, items }) => (
              <div key={label} className="mb-1 mt-1">
                <p className="text-[10px] font-semibold tracking-[0.06em] uppercase"
                  style={{ color: 'var(--neutral-300)', padding: '8px 18px 4px' }}>
                  {label}
                </p>
                {items.map((conv) => {
                  const active    = conv.id === currentConversationId;
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
                        borderLeft: active ? '2px solid var(--primary-500)' : '2px solid transparent',
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

                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        aria-label="대화 삭제"
                        disabled={isDeleting}
                        className="shrink-0 w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 mt-0.5 transition-opacity"
                        style={{
                          color: 'var(--neutral-300)',
                          cursor: isDeleting ? 'not-allowed' : 'pointer',
                          border: 'none', background: 'transparent',
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
