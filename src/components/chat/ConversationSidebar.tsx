'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { conversationService } from '@/services';
import apiClient from '@/lib/axiosInstance';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useChatStore } from '@/store';
import { ConversationSummary } from '@/types/chat';
import { API_ENDPOINTS } from '@/utils/constants';

// ─── Sub-Components ──────────────────────────────────────────────────────────

/**
 * 🍎 공유 모달: global.css 토큰 및 Spacing 가이드를 반드시 준수
 */
/**
 * 🍎 공유 모달: 여유 있는 레이아웃 + Gemini 스타일 테마
 */
/**
 * 🍎 공유 모달: 프로젝트 테마 유지 + 여유 있는 와이드 레이아웃
 */
const ShareModal = ({ url, onClose }: { url: string; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-[28px] shadow-[var(--shadow-2xl)] border border-[var(--border-default)] w-[520px] max-w-[90vw] animate-in zoom-in-95 duration-200"
        style={{ padding: 'var(--space-2xl)' }} // 32px의 넉넉한 여백
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 우측 상단 닫기 ── */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-[var(--neutral-400)] hover:bg-[var(--neutral-50)] hover:text-[var(--neutral-700)] transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── 헤더 영역 ── */}
        <div className="mb-10">
          <h3 className="text-[22px] font-bold text-[var(--neutral-700)] mb-3">
            읽기 전용 공유 링크
          </h3>
          <p className="text-[14px] text-[var(--neutral-400)] leading-relaxed">
            로그인하지 않은 사람들도 대화 내용을 확인할 수 있어요.
          </p>
        </div>
        
        {/* ── 링크 박스 영역 ── */}
        <div 
          className="flex items-center border border-[var(--border-strong)] rounded-[20px] mb-8"
          style={{ 
            padding: '0 var(--space-sm)', // 좌우 여백만 살짝 유지
            height: '72px',              // 🍎 전체 박스 높이를 64px -> 72px로 늘려 더 여유롭게 변경
            backgroundColor: 'var(--neutral-50)' // 🎨 박스 배경색 (원하는 색상 코드로 변경 가능)
          }}
        >
          <input 
            readOnly 
            value={url} 
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-[var(--neutral-600)] truncate px-6" 
          />
          <button 
            onClick={handleCopy} 
            className="flex items-center justify-center gap-2 transition-all shadow-sm"
            style={{
              /* 🎨 버튼 색상 직접 수정 영역 */
              backgroundColor: copied ? '#35c066' : '#313131', 
              color: 'white',
              
              /* 🍎 크기 및 폰트 세밀 조정 */
              height: '52px',         // 버튼 높이를 키워 박스를 꽉 차게 보이게 함
              minWidth: '90px',      // 🍎 버튼 가로 길이를 충분히 확보하여 글자가 갇히지 않게 함
              fontSize: '13px',       // 🍎 폰트 크기를 줄여 세련된 느낌 강조
              fontWeight: 500,        // 굵게 처리하여 가독성 유지
              borderRadius: '80px',   // 박스 곡률에 맞춘 둥근 사각형
              marginRight: '8px',     // 박스 끝에서 살짝 띄움
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>완료 !</span>
              </>
            ) : (
              <span>링크 복사</span>
            )}
          </button>
        </div>

        {/* ── 하단 안내 문구 ── */}
        <div 
          className="flex gap-3 rounded-2xl" 
          style={{ 
            padding: 'var(--space-md)', 
            background: 'var(--primary-50)',
            color: 'var(--primary-700)'
          }}
        >
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-[13px] leading-relaxed">
            <p className="font-bold mb-1">링크는 30 일간 유효해요.</p>
            <p className="opacity-80">
              링크를 가진 누구나 대화 내용을 볼 수 있어요. 
            </p>
            <p className="opacity-80">
              민감한 정보가 포함되어 있다면 공유 전 다시 한번 확인해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── 소셜 아이콘 서브 컴포넌트 ──
const SocialIcon = ({ label, icon }: { label: string; icon: string }) => (
  <div className="flex flex-col items-center gap-3 cursor-pointer group">
    <div className="w-12 h-12 rounded-full bg-[#3c4043] flex items-center justify-center group-hover:bg-[#4f5358] transition-colors">
      <span className="text-[18px] font-bold text-white uppercase">{icon}</span>
    </div>
    <span className="text-[12px] text-[#9aa0a6] group-hover:text-white">{label}</span>
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    if       (t >= today)     buckets['오늘'].push(c);
    else if (t >= yesterday) buckets['어제'].push(c);
    else if (t >= weekAgo)   buckets['이번 주'].push(c);
    else if (t >= monthAgo)  buckets['이번 달'].push(c);
    else                     buckets['이전'].push(c);
  }
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

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

type Group = { label: string; items: ConversationSummary[] };
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

      {collapsed && (
        <div 
          className="absolute left-full top-1/2 -translate-y-1/2 bg-white text-[var(--neutral-700)] text-[13px] font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[2100] shadow-[var(--shadow-lg)] border border-[var(--border-default)] pointer-events-none whitespace-nowrap"
          style={{ 
            marginLeft: 'var(--space-lg)',
            paddingLeft: 'var(--space-lg)',
            paddingRight: 'var(--space-lg)',
            paddingTop: '10px',
            paddingBottom: '10px',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

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
  const pathname = usePathname();
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const removeConversation = useChatStore((s) => s.removeConversation);
  const updateConversationTitle = useChatStore((s) => s.updateConversationTitle);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  
  // 🍎 Store UI Actions
  const toastMessage = useChatStore((s) => s.toastMessage);
  const setToast = useChatStore((s) => s.setToast);

  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null); // 공유 모달용
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const fetchCountRef = useRef(0);
  const tokenCacheRef = useRef<Record<string, string>>({});

  const [reportOpen, setReportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 인라인 제목 편집
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // 리포트 연/월 필터
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStep, setPickerStep] = useState<'year' | 'month'>('year');
  const [pickerYear, setPickerYear] = useState(currentYear);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [genStatus, setGenStatus] = useState<GenStatus>('idle');
  const [genProgress, setGenProgress] = useState(0);
  const [genPhase, setGenPhase] = useState('');
  const [genError, setGenError] = useState('');
  const [genSuccessMsg, setGenSuccessMsg] = useState(false);
  const genStartRef = useRef(0);
  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const fetchReports = async () => {
    const res = await fetchWithAuth('/api/chat/reports');
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
  }, [setConversations]); 

  useEffect(() => {
    if (genStatus === 'running') {
      genStartRef.current = Date.now();
      genTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - genStartRef.current;
        setGenProgress(calcProgress(elapsed));
        setGenPhase(getPhaseLabel(elapsed));
      }, 200);
    } else if (genTimerRef.current) {
      clearInterval(genTimerRef.current);
      genTimerRef.current = null;
    }
    return () => { if (genTimerRef.current) clearInterval(genTimerRef.current); };
  }, [genStatus]);

  const chatConvs = conversations.filter((c) => !(c.title || '').includes('주간 리포트'));
  const filteredChats = searchQuery.trim()
    ? chatConvs.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatConvs;

  const getShareToken = async (id: string): Promise<string> => {
    if (tokenCacheRef.current[id]) return tokenCacheRef.current[id];
    const res = await apiClient.post<Record<string, unknown>>(API_ENDPOINTS.SHARE.CREATE(id));
    const d = (res.data?.data ?? res.data) as Record<string, unknown>;
    const tok = String(d?.shareToken ?? d?.token ?? '');
    tokenCacheRef.current[id] = tok;
    return tok;
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/auth');
  };

  const handleNew = async () => { await onNewConversation(); };
  const handleSelect = (id: string) => { router.push(`/chat/${id}`); };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(null); 
    try {
      await conversationService.deleteConversation(id);
      removeConversation(id);
      setToast('대화가 삭제되었어요.'); // 🍎 토스트 트리거
      if (id === currentConversationId) router.push('/');
    } catch (err) {
      console.error('[Sidebar] 삭제 실패:', err);
    }
  };

  const startRename = (e: React.MouseEvent, conv: ConversationSummary) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setEditingId(conv.id);
    setEditingTitle(conv.title || '새 대화');
  };

  const commitRename = async (id: string) => {
    const trimmed = editingTitle.trim();
    if (!trimmed) { setEditingId(null); return; }
    setEditingId(null);
    try {
      await conversationService.updateTitle(id, trimmed);
      updateConversationTitle(id, trimmed);
    } catch (err) {
      console.error('[Sidebar] 제목 수정 실패:', err);
    }
  };

  const cancelRename = () => { setEditingId(null); };

  const handleCopyChatLink = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(null); 
    try {
      const token = await getShareToken(id);
      if (token) {
        setShareUrl(`${window.location.origin}/shared/${token}`); // 🍎 모달 오픈
      }
    } catch (err) {
      console.error('[Sidebar] 링크 복사 실패:', err);
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
      const res = await fetchWithAuth('/api/report/generate', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        setGenStatus('error');
        setGenError(data.message || '생성에 실패했습니다.');
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
      setGenError('생성에 실패했습니다.');
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({ top: rect.top, left: rect.right + 12 });
      setOpenMenuId(id);
    }
  };

  // 리포트 연/월 필터
  const reportYears = Array.from(new Set([
    now.getFullYear(),
    ...reports.map((r) => {
      const d = r.createdAt ? new Date(String(r.createdAt)) : null;
      return d && !isNaN(d.getTime()) ? d.getFullYear() : null;
    }).filter((y): y is number => y !== null),
  ])).sort((a, b) => b - a);

  const filteredReports = reports.filter((r) => {
    const d = r.createdAt ? new Date(String(r.createdAt)) : null;
    if (!d || isNaN(d.getTime())) return false;
    return d.getFullYear() === filterYear && d.getMonth() + 1 === filterMonth;
  });

  const groups = groupConversations(filteredChats);
  const isGenerating = genStatus === 'running';

  return (
    <>
      <aside
        aria-label="대화 목록"
        className="shrink-0 flex flex-col bg-[var(--white)] border-r border-[var(--neutral-100)] relative"
        style={{
          width: isOpen ? '280px' : '68px',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          height: '100%',
          zIndex: 100,
        }}
      >
        {/* ── Header ── */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: isOpen ? 'space-between' : 'center', padding: isOpen ? '16px 12px' : '16px 0', height: '60px' }}>
          <button
            onClick={() => setSidebarOpen(!isOpen)}
            className="flex items-center justify-center rounded-full transition-colors text-[var(--neutral-500)] hover:bg-[var(--neutral-100)]"
            style={{ width: '40px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* ── Nav 영역 ── */}
        <div className="flex flex-col gap-3" style={{ flexShrink: 0, padding: isOpen ? '16px 12px' : '16px 0' }}>
          {!isOpen ? (
            <NavItem
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
              label="검색" onClick={() => setSidebarOpen(true)} collapsed={true}
            />
          ) : (
            <div className="flex items-center gap-2" style={{ padding: '0 12px', height: '40px', borderRadius: '999px', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', margin: '0 4px' }}>
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
            </div>
          )}

          <NavItem
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" /></svg>}
            label="대시보드"
            active={pathname === '/dashboard'}
            onClick={() => router.push('/dashboard')}
            collapsed={!isOpen}
          />

          <NavItem
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
            label="새 채팅" onClick={handleNew} collapsed={!isOpen}
          />

          {/* 🍎 주간 리포트 버튼 */}
          <div className="relative group flex justify-center w-full">
            <button
              onClick={() => {
                if (!isOpen) { setSidebarOpen(true); setReportOpen(true); }
                else setReportOpen((v) => !v);
              }}
              className={`flex items-center rounded-lg text-[13px] font-medium transition-colors h-10 ${!isOpen ? 'justify-center w-10 mx-auto' : 'px-3 w-full gap-2.5'}`}
              style={{ background: 'transparent', color: 'var(--neutral-600)', border: 'none', cursor: 'pointer' }}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--neutral-400)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
            
            <div 
              className="absolute left-full top-1/2 -translate-y-1/2 bg-white text-[var(--neutral-700)] text-[13px] font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[2100] shadow-[var(--shadow-lg)] border border-[var(--border-default)] pointer-events-none whitespace-nowrap"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                marginLeft: 'var(--space-lg)',
                paddingLeft: 'var(--space-md)',
                paddingRight: 'var(--space-lg)',
                paddingTop: '10px',
                paddingBottom: '10px',
              }}
            >
              <svg className="w-4 h-4 shrink-0 text-[var(--neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {!isOpen ? '주간 리포트' : '매주 월요일 8:00 자동 생성돼요.'}
              </span>
            </div>
          </div>

          {/* 🍎 리포트 펼침 패널 */}
          {isOpen && reportOpen && (
            <div style={{ paddingBottom: '4px', paddingTop: '8px' }}>
              {isGenerating && (
                <div style={{ margin: '0 8px 8px 8px', padding: '10px 12px', borderRadius: '8px', background: 'var(--neutral-50)', border: '1px solid var(--neutral-100)' }}>
                  <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--neutral-600)' }}>{genPhase}</p>
                  <div style={{ height: '4px', borderRadius: '4px', background: 'var(--neutral-200)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '4px', background: 'var(--primary-500)', width: `${genProgress}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}
              {genSuccessMsg && <p className="text-[12px] font-medium px-2 pb-2" style={{ color: 'var(--primary-600)' }}>✅ 리포트가 생성됐습니다.</p>}

              {/* 월 네비게이터 + 2단계 피커 */}
              <div style={{ position: 'relative', padding: '0 8px 8px' }}>
                {/* 네비게이터 바 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '32px' }}>
                  <button
                    onClick={() => {
                      if (filterMonth === 1) { setFilterYear((y) => y - 1); setFilterMonth(12); }
                      else setFilterMonth((m) => m - 1);
                    }}
                    style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', color: 'var(--neutral-500)' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--neutral-100)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => { setPickerOpen((v) => !v); setPickerStep('year'); setPickerYear(filterYear); }}
                    style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-700)', border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--neutral-100)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {filterYear}년 {filterMonth}월
                  </button>

                  {(() => {
                    const canGoNext = filterYear < currentYear || (filterYear === currentYear && filterMonth < currentMonth);
                    return (
                      <button
                        onClick={() => {
                          if (!canGoNext) return;
                          if (filterMonth === 12) { setFilterYear((y) => y + 1); setFilterMonth(1); }
                          else setFilterMonth((m) => m + 1);
                        }}
                        style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', borderRadius: '6px', color: canGoNext ? 'var(--neutral-500)' : 'var(--neutral-200)', cursor: canGoNext ? 'pointer' : 'default' }}
                        onMouseOver={(e) => { if (canGoNext) e.currentTarget.style.background = 'var(--neutral-100)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })()}
                </div>

                {/* 피커 팝업 */}
                {pickerOpen && (
                  <>
                    <div className="fixed inset-0 z-[190]" onClick={() => setPickerOpen(false)} />
                    <div style={{ position: 'absolute', top: '36px', left: 0, right: 0, background: 'var(--white)', border: '1px solid var(--neutral-200)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', zIndex: 200, padding: '8px' }}>
                      {pickerStep === 'year' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {reportYears.map((y) => (
                            <button
                              key={y}
                              onClick={() => { setPickerYear(y); setPickerStep('month'); }}
                              style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: y === filterYear ? 600 : 400, background: y === filterYear ? 'var(--primary-50)' : 'transparent', color: y === filterYear ? 'var(--primary-700)' : 'var(--neutral-700)' }}
                              onMouseOver={(e) => { if (y !== filterYear) e.currentTarget.style.background = 'var(--neutral-50)'; }}
                              onMouseOut={(e) => { if (y !== filterYear) e.currentTarget.style.background = 'transparent'; }}
                            >
                              {y}년
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <button
                            onClick={() => setPickerStep('year')}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', marginBottom: '6px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--neutral-600)' }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--neutral-100)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            {pickerYear}년
                          </button>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                              const isDisabled = pickerYear === currentYear && m > currentMonth;
                              const isSelected = pickerYear === filterYear && m === filterMonth;
                              return (
                                <button
                                  key={m}
                                  disabled={isDisabled}
                                  onClick={() => { if (!isDisabled) { setFilterYear(pickerYear); setFilterMonth(m); setPickerOpen(false); } }}
                                  style={{ padding: '6px 4px', borderRadius: '6px', border: 'none', cursor: isDisabled ? 'default' : 'pointer', fontSize: '12px', fontWeight: isSelected ? 600 : 400, background: isSelected ? 'var(--primary-500)' : 'transparent', color: isDisabled ? 'var(--neutral-200)' : isSelected ? 'white' : 'var(--neutral-700)', transition: 'background 0.1s' }}
                                  onMouseOver={(e) => { if (!isDisabled && !isSelected) e.currentTarget.style.background = 'var(--neutral-100)'; }}
                                  onMouseOut={(e) => { if (!isDisabled && !isSelected) e.currentTarget.style.background = 'transparent'; }}
                                >
                                  {m}월
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {loading ? (
                <div style={{ padding: '6px 12px' }}><div className="h-3 rounded animate-pulse" style={{ width: '70%', background: 'var(--neutral-100)' }} /></div>
              ) : filteredReports.length === 0 ? (
                <p className="text-[12px] text-center py-2" style={{ color: 'var(--neutral-300)' }}>해당 기간에 리포트가 없습니다.</p>
              ) : (
                filteredReports.map((item) => {
                  const id = String(item.id || item.conversationId);
                  const title = item.title ? String(item.title) : conversations.find(c => c.id === id)?.title || '주간 리포트';
                  const active = id === currentConversationId;
                  return (
                    <div
                      key={id}
                      onClick={() => router.push(`/report/${id}`)}
                      className="group flex items-center gap-2 rounded-lg cursor-pointer transition-colors mx-2"
                      style={{ padding: '8px 10px', background: active ? 'var(--primary-50)' : 'transparent', color: active ? 'var(--primary-700)' : 'var(--neutral-600)', marginBottom: '2px' }}
                      onMouseOver={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--neutral-50)'; }}
                      onMouseOut={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: active ? 'var(--primary-400)' : 'var(--neutral-400)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[12px] font-medium truncate flex-1">{title}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {isOpen && <div style={{ flexShrink: 0, height: '1px', background: 'var(--neutral-100)', margin: '0 12px 8px' }} />}

        {/* ── 대화 목록 ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-6 relative">
          {isOpen && groups.map(({ label, items }) => (
            <div key={label} className="mb-2">
              <p className="text-[10px] font-semibold tracking-[0.06em] uppercase" style={{ color: 'var(--neutral-300)', padding: '8px 18px 4px' }}>{label}</p>
              {items.map((conv) => {
                const active = conv.id === currentConversationId;
                const isMenuOpen = openMenuId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => editingId !== conv.id && handleSelect(conv.id)}
                    className="group flex items-center justify-between rounded-lg mb-px relative"
                    style={{ padding: '10px 14px 10px 18px', background: active ? 'var(--primary-50)' : 'transparent', color: active ? 'var(--primary-700)' : 'var(--neutral-500)', cursor: editingId === conv.id ? 'default' : 'pointer' }}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      {editingId === conv.id ? (
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(conv.id);
                            else if (e.key === 'Escape') cancelRename();
                          }}
                          onBlur={() => commitRename(conv.id)}
                          style={{ width: '100%', fontSize: '13px', fontWeight: 500, border: '1px solid var(--primary-300)', borderRadius: '4px', outline: 'none', padding: '1px 4px', background: 'transparent', color: 'inherit' }}
                        />
                      ) : (
                        <p className="text-[13px] font-medium leading-snug truncate">{conv.title || '새 대화'}</p>
                      )}
                    </div>

                    <div className="relative flex items-center">
                      <button
                        onClick={(e) => toggleMenu(e, conv.id)}
                        className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all ${isMenuOpen ? 'opacity-100 bg-[var(--neutral-200)] text-[var(--neutral-700)]' : 'opacity-0 group-hover:opacity-100 text-[var(--neutral-400)] hover:text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]'}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-[3000]" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
                          <div
                            className="fixed min-w-[130px] bg-white rounded-xl shadow-[var(--shadow-xl)] border border-[var(--border-default)] z-[3001] flex flex-col overflow-hidden"
                            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, padding: '8px 0', gap: '2px', animation: 'fadeIn 0.1s ease-out' }}
                          >
                            <button
                              onClick={(e) => startRename(e, conv)}
                              className="flex items-center w-full transition-colors group"
                              style={{ padding: '10px 16px', paddingLeft: '20px', gap: '12px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--neutral-50)'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <svg className="w-4 h-4 shrink-0 text-[var(--neutral-400)] group-hover:text-[var(--neutral-700)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--neutral-700)' }}>이름 바꾸기</span>
                            </button>
                            <button
                              onClick={(e) => handleCopyChatLink(e, conv.id)}
                              className="flex items-center w-full transition-colors group"
                              style={{ padding: '10px 16px', paddingLeft: '20px', gap: '12px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--neutral-50)'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <svg className="w-4 h-4 shrink-0 text-[var(--neutral-400)] group-hover:text-[var(--neutral-700)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                              </svg>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--neutral-700)' }}>공유하기</span>
                            </button>

                            <button 
                              onClick={(e) => handleDelete(e, conv.id)}
                              className="flex items-center w-full transition-colors group"
                              style={{ padding: '10px 16px', paddingLeft: '20px', gap: '12px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-50)'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <svg className="w-4 h-4 shrink-0 text-[var(--primary-400)] group-hover:text-[var(--primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--primary-600)' }}>삭제하기</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── 하단 설정 ── */}
        <div style={{ flexShrink: 0, height: '128px', padding: isOpen ? '0 12px' : '0', borderTop: '1px solid var(--neutral-100)', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
          <NavItem
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            label="설정" onClick={() => {}} collapsed={!isOpen}
          />
          {/* 내 프로필 + 로그아웃 드롭다운 (오른쪽) */}
          <div className="relative w-full flex justify-center">
            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-[3000]" onClick={() => setProfileMenuOpen(false)} />
                <div
                  className="absolute top-1/2 -translate-y-1/2 bg-white rounded-xl border border-[var(--border-default)] z-[3001] overflow-hidden"
                  style={{ left: '100%', marginLeft: '12px', minWidth: '140px', boxShadow: 'var(--shadow-xl)' }}
                >
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full transition-colors"
                    style={{ padding: '10px 16px', gap: '10px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--primary-600)', whiteSpace: 'nowrap' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-50)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    로그아웃
                  </button>
                </div>
              </>
            )}
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              className={`flex items-center rounded-lg text-[13px] font-medium transition-colors h-10 ${!isOpen ? 'justify-center w-10 mx-auto' : 'px-3 w-full gap-2.5'}`}
              style={{ background: profileMenuOpen ? 'var(--neutral-100)' : 'transparent', color: 'var(--neutral-600)', border: 'none', cursor: 'pointer' }}
              onMouseOver={(e) => { if (!profileMenuOpen) e.currentTarget.style.background = 'var(--neutral-50)'; }}
              onMouseOut={(e) => { if (!profileMenuOpen) e.currentTarget.style.background = 'transparent'; }}
            >
              <span className="shrink-0 flex items-center justify-center w-5 h-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </span>
              {isOpen && <span className="flex-1 text-left truncate">내 프로필</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* 🍎 공유 모달 */}
      {shareUrl && <ShareModal url={shareUrl} onClose={() => setShareUrl(null)} />}

      {/* 🍎 삭제 토스트 팝업 */}
      {toastMessage && (
        <div 
          className="fixed top-6 right-6 z-[6000] bg-[var(--neutral-700)] text-white flex items-center shadow-[var(--shadow-xl)] rounded-xl animate-in slide-in-from-right duration-300"
          style={{ padding: 'var(--space-md) var(--space-lg)', gap: 'var(--space-sm)' }}
        >
          <div className="w-5 h-5 rounded-full bg-[var(--green-500)] flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-[14px] font-medium">{toastMessage}</span>
        </div>
      )}
    </>
  );
};

export default ConversationSidebar;