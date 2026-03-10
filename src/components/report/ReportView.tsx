'use client';

import { FC, ReactNode, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DataRenderer from '@/components/chat/DataRenderer';
import { ChatMessage } from '@/types/chat';
import { exportReportExcel } from '@/services/conversationService';

interface ReportViewProps {
  messages: ChatMessage[];
  title: string;
  conversationId?: string;
  expiresAt?: string;
  createdAt?: string;
}

const getReportTitle = (title: string, conversationId: string): string => {
  if (title && title !== '주간 광고 성과 리포트' && !title.startsWith('New')) {
    return title;
  }
  const match = conversationId.match(/report_(\d{4})(\d{2})(\d{2})/);
  if (!match) return title;
  const year = parseInt(match[1]);
  const month = parseInt(match[2]);
  const day = parseInt(match[3]);
  const weekOfMonth = Math.ceil(day / 7);
  return `${year}년 ${month}월 ${weekOfMonth}주차 주간 리포트`;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toNum(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function formatKRW(amount: number): string {
  return Math.round(amount).toLocaleString('ko-KR') + '원';
}

function formatNum(n: number): string {
  return n.toLocaleString('ko-KR');
}

function formatDateKR(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateShort(dateStr: string): string {
  return dateStr.replace(/-/g, '.');
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getThisWeek(): { start: string; end: string } {
  const today = new Date();
  const day = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: toDateStr(mon), end: toDateStr(sun) };
}

function getLastWeek(): { start: string; end: string } {
  const thisWeek = getThisWeek();
  const mon = new Date(thisWeek.start);
  mon.setDate(mon.getDate() - 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: toDateStr(mon), end: toDateStr(sun) };
}

function getThisMonth(): { start: string; end: string } {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start: toDateStr(start), end: toDateStr(end) };
}

interface KpiData {
  impressions: number;
  clicks: number;
  conversions: number;
  totalCost: number;
  roas: number | null;
  hasGoogle: boolean;
  hasKakao: boolean;
}

function extractKpi(allData: Record<string, unknown>[]): KpiData {
  let impressions = 0;
  let clicks = 0;
  let googleCost = 0;
  let kakaoCost = 0;
  let hasGoogle = false;
  let hasKakao = false;

  for (const row of allData) {
    if ('매체' in row) {
      // pie 데이터
      if (row['매체'] === '구글') { hasGoogle = true; googleCost += toNum(row['광고비(원)']); }
      else if (row['매체'] === '카카오') { hasKakao = true; kakaoCost += toNum(row['광고비(원)']); }
    } else if ('구글 노출' in row) {
      // table 데이터
      impressions += toNum(row['구글 노출']) + toNum(row['카카오 노출']);
      clicks += toNum(row['구글 클릭']) + toNum(row['카카오 클릭']);
    }
  }

  const totalCost = googleCost + kakaoCost;
  return { impressions, clicks, conversions: 0, totalCost, roas: null, hasGoogle, hasKakao };
}

interface TableKpiData {
  totalImpressions: number;
  totalClicks: number;
  kakaoCost: number;
  googleCost: number;
  ctr: number;
  googleClickRatio: number;
}

function extractTableKpi(tableData: Record<string, unknown>[]): TableKpiData {
  let googleImpressions = 0, kakaoImpressions = 0;
  let googleClicks = 0, kakaoClicks = 0;
  let kakaoCost = 0, googleCost = 0;

  for (const row of tableData) {
    googleImpressions += toNum(row['구글 노출']);
    kakaoImpressions += toNum(row['카카오 노출']);
    googleClicks += toNum(row['구글 클릭']);
    kakaoClicks += toNum(row['카카오 클릭']);
    googleCost += toNum(row['구글 광고비(원)']);
    kakaoCost += toNum(row['카카오 광고비(원)']);
  }

  const totalImpressions = googleImpressions + kakaoImpressions;
  const totalClicks = googleClicks + kakaoClicks;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const googleClickRatio = totalClicks > 0 ? (googleClicks / totalClicks) * 100 : 0;

  return { totalImpressions, totalClicks, kakaoCost, googleCost, ctr, googleClickRatio };
}

function extractDateRange(allData: Record<string, unknown>[]): { start: string; end: string } | null {
  const dates: string[] = [];
  for (const row of allData) {
    for (const val of Object.values(row)) {
      if (typeof val === 'string' && DATE_PATTERN.test(val)) {
        dates.push(val);
      }
    }
  }
  if (dates.length === 0) return null;
  dates.sort();
  return { start: dates[0], end: dates[dates.length - 1] };
}

function normalizeMarkdown(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/(#{1,3})([^\s#\n])/g, '$1 $2')
    .replace(/([^\n])(#{1,3} )/g, '$1\n\n$2')
    .replace(/([^\n])(- )/g, '$1\n$2')
    .replace(/([^\n])---/g, '$1\n\n---')
    .replace(/---([^\n])/g, '---\n\n$1')
    .replace(/ {2,}/g, ' ');
}

function stripIntroLine(content: string): string {
  return content.replace(/^[^\n]*(네[,，、]|안녕|구글과 카카오|광고 성과를)[^\n]*\n{1,2}/, '');
}

interface InsightSection {
  title: string;
  content: string;
}

function parseInsightSections(text: string): InsightSection[] {
  const TARGET_TITLES = ['성과 요약', '주요 인사이트', '개선 제안'];
  const sections: InsightSection[] = [];
  const lines = text.split('\n');
  let current: InsightSection | null = null;

  for (const line of lines) {
    const match = line.match(/^#{1,3}\s+(.+)/);
    if (match) {
      const title = match[1].replace(/^\d+\.\s*/, '').replace(/[\u{1F300}-\u{1FFFF}]|[\u2600-\u27FF]/gu, '').trim();
      if (TARGET_TITLES.some((t) => title.includes(t))) {
        if (current) sections.push(current);
        current = { title, content: '' };
        continue;
      }
    }
    if (current) current.content += line + '\n';
  }
  if (current) sections.push(current);
  return sections;
}

const SECTION_ICONS: Record<string, string> = {
  '성과 요약': '📊',
  '주요 인사이트': '💡',
  '개선 제안': '🎯',
};

const CHART_TITLES: Record<string, string> = {
  pie: '매체별 광고비 비중',
  line: '일별 광고비 추이',
  bar: '구글 캠페인별 성과 TOP',
  table: '일별 상세 지표',
};

const COL_LABEL_MAP: Record<string, string> = {
  cost_micros: '광고비(원)',
  impressions: '노출수',
  clicks: '클릭수',
  conversions: '전환수',
  spending: '광고비(원)',
};

const PERIOD_LABEL: Record<string, string> = {
  thisWeek: '이번 주',
  lastWeek: '지난 주',
  thisMonth: '이번 달',
};

function getSectionIcon(title: string) {
  return Object.entries(SECTION_ICONS).find(([k]) => title.includes(k))?.[1] ?? '📋';
}

function formatCellValue(col: string, val: unknown): string {
  if (col === 'cost_micros') {
    return Math.round(toNum(val) / 1_000_000).toLocaleString('ko-KR') + '원';
  }
  if (typeof val === 'string' && DATE_PATTERN.test(val)) {
    return val.replace(/-/g, '.');
  }
  if (typeof val === 'number') {
    return val.toLocaleString('ko-KR');
  }
  if (typeof val === 'string' && val !== '' && !isNaN(Number(val))) {
    return Number(val).toLocaleString('ko-KR');
  }
  return String(val ?? '');
}

function isNumericCol(col: string, data: Record<string, unknown>[]): boolean {
  if (col === 'cost_micros') return true;
  for (const row of data.slice(0, 10)) {
    const v = row[col];
    if (v !== null && v !== undefined && v !== '') {
      if (typeof v === 'string' && DATE_PATTERN.test(v)) return false;
      return typeof v === 'number' || !isNaN(Number(v));
    }
  }
  return false;
}

interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: ReactNode;
}

function KpiCard({ label, value, unit, icon }: KpiCardProps) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--neutral-100)',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <span style={{ color: 'var(--neutral-400)', display: 'flex' }}>{icon}</span>
        <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--neutral-400)' }}>{label}</p>
      </div>
      <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--neutral-700)', lineHeight: 1 }}>
        {value}
      </p>
      {unit && (
        <p style={{ fontSize: '11px', color: 'var(--neutral-400)', marginTop: '4px' }}>{unit}</p>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  border: '1px solid var(--neutral-200)',
  borderRadius: '8px',
  padding: '5px 10px',
  fontSize: '13px',
  background: 'white',
  color: 'var(--neutral-700)',
  cursor: 'pointer',
  outline: 'none',
};

type MediaFilter = 'all' | 'google' | 'kakao';
type PeriodFilter = 'all' | 'thisWeek' | 'lastWeek' | 'thisMonth';
type CategoryFilter = 'all' | 'campaign' | 'adgroup' | 'keyword';
type DeviceFilter = 'all' | 'pc' | 'mobile';

export const ReportView: FC<ReportViewProps> = ({ messages, title, conversationId = '', expiresAt, createdAt }) => {
  const reportTitle = getReportTitle(title, conversationId);
  const [insightOpen, setInsightOpen] = useState(false);

  // Filter state
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');

  // Table state
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const allData = messages.flatMap((m) => m.data ?? []);
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const chartMessages = messages.filter(
    (m) => m.role === 'assistant' && m.data && m.data.length > 0,
  );

  const dateRange = allData.length > 0 ? extractDateRange(allData) : null;

  const analysisContent = lastAssistant
    ? stripIntroLine(normalizeMarkdown(lastAssistant.content))
    : null;

  const insightSections = analysisContent ? parseInsightSections(analysisContent) : [];

  const tableMessage = messages.find((m) => m.chartType === 'table');

  // Filtered data (매체 + 기간 실제 동작) — chartType 기반 매체 판별
  const filteredData = useMemo(() => {
    let data: Record<string, unknown>[];

    if (mediaFilter === 'all') {
      data = messages.flatMap((m) => (m.data ?? []) as Record<string, unknown>[]);
    } else {
      data = messages.flatMap((m) => {
        const rows = (m.data ?? []) as Record<string, unknown>[];
        if (rows.length === 0) return [];
        const chartType = m.chartType ?? '';

        if (mediaFilter === 'google') {
          if (chartType === 'bar') return rows;
          if (chartType === 'table') {
            return rows.map((row) => ({
              날짜: row['날짜'],
              '구글 노출': row['구글 노출'],
              '구글 클릭': row['구글 클릭'],
              '구글 광고비(원)': row['구글 광고비(원)'],
            }));
          }
          if (chartType === 'pie') return rows.filter((row) => row['매체'] === '구글');
          if (chartType === 'line') return rows.map((row) => ({ 날짜: row['날짜'], '구글 광고비(원)': row['구글 광고비(원)'] }));
          return [];
        }

        if (mediaFilter === 'kakao') {
          if (chartType === 'table') {
            return rows.map((row) => ({
              날짜: row['날짜'],
              '카카오 노출': row['카카오 노출'],
              '카카오 클릭': row['카카오 클릭'],
              '카카오 광고비(원)': row['카카오 광고비(원)'],
            }));
          }
          if (chartType === 'pie') return rows.filter((row) => row['매체'] === '카카오');
          if (chartType === 'line') return rows.map((row) => ({ 날짜: row['날짜'], '카카오 광고비(원)': row['카카오 광고비(원)'] }));
          return []; // bar는 구글 전용
        }

        return rows;
      });
    }

    if (periodFilter !== 'all') {
      let range: { start: string; end: string };
      if (periodFilter === 'thisWeek') range = getThisWeek();
      else if (periodFilter === 'lastWeek') range = getLastWeek();
      else range = getThisMonth();

      data = data.filter((row) => {
        const dateVal =
          (row['날짜'] as string | undefined) ??
          (Object.values(row).find((v) => typeof v === 'string' && DATE_PATTERN.test(v as string)) as string | undefined);
        if (!dateVal) return false;
        return dateVal >= range.start && dateVal <= range.end;
      });
    }

    return data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, mediaFilter, periodFilter]);

  // KPI는 table 메시지 원본 데이터 기반으로 계산 (매체 컬럼 필터링 적용)
  const tableKpi = useMemo(() => {
    if (!tableMessage?.data?.length) return null;
    const rows = tableMessage.data as Record<string, unknown>[];

    let tableData: Record<string, unknown>[];
    if (mediaFilter === 'google') {
      tableData = rows.map((row) => ({
        날짜: row['날짜'],
        '구글 노출': row['구글 노출'],
        '구글 클릭': row['구글 클릭'],
        '구글 광고비(원)': row['구글 광고비(원)'],
      }));
    } else if (mediaFilter === 'kakao') {
      tableData = rows.map((row) => ({
        날짜: row['날짜'],
        '카카오 노출': row['카카오 노출'],
        '카카오 클릭': row['카카오 클릭'],
        '카카오 광고비(원)': row['카카오 광고비(원)'],
      }));
    } else {
      tableData = rows;
    }

    if (periodFilter !== 'all') {
      let range: { start: string; end: string };
      if (periodFilter === 'thisWeek') range = getThisWeek();
      else if (periodFilter === 'lastWeek') range = getLastWeek();
      else range = getThisMonth();
      tableData = tableData.filter((row) => {
        const dateVal = row['날짜'] as string | undefined;
        if (!dateVal) return false;
        return dateVal >= range.start && dateVal <= range.end;
      });
    }

    return extractTableKpi(tableData);
  }, [tableMessage, mediaFilter, periodFilter]);

  // Dynamic table columns
  const tableColumns = useMemo(() => {
    const keys = new Set<string>();
    filteredData.forEach((row) => Object.keys(row).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [filteredData]);

  // Searched + sorted display data
  const displayData = useMemo(() => {
    let data = filteredData;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((row) =>
        Object.entries(row).some(
          ([, v]) => typeof v === 'string' && !DATE_PATTERN.test(v) && v.toLowerCase().includes(q),
        ),
      );
    }

    if (sortCol) {
      data = [...data].sort((a, b) => {
        const av = a[sortCol];
        const bv = b[sortCol];
        const an = Number(av);
        const bn = Number(bv);
        if (!isNaN(an) && !isNaN(bn)) {
          return sortDir === 'asc' ? an - bn : bn - an;
        }
        const as = String(av ?? '');
        const bs = String(bv ?? '');
        return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
      });
    }

    return data;
  }, [filteredData, search, sortCol, sortDir]);

  const tableRows = displayData.slice(0, 200);
  const hasMore = displayData.length > 200;

  function handleSort(col: string) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  function resetFilters() {
    setMediaFilter('all');
    setPeriodFilter('all');
    setCategoryFilter('all');
    setDeviceFilter('all');
  }

  const hasActiveFilter =
    mediaFilter !== 'all' || periodFilter !== 'all' || categoryFilter !== 'all' || deviceFilter !== 'all';

  const [excelLoading, setExcelLoading] = useState(false);

  async function handleExcelSave() {
    if (!conversationId || excelLoading) return;
    setExcelLoading(true);
    try {
      const { downloadUrl, fileName } = await exportReportExcel(conversationId);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      a.click();
    } catch {
      alert('Excel 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setExcelLoading(false);
    }
  }

  return (
    <div id="report-content" className="min-h-full bg-gray-50 print:bg-white">
      {/* ── 헤더 ── */}
      <div
        className="print:shadow-none"
        style={{
          background: 'white',
          borderBottom: '1px solid var(--neutral-100)',
          boxShadow: 'var(--shadow-xs)',
          padding: '24px 32px',
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              {/* 로고 */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--primary-500)' }}
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className="text-[13px] font-medium" style={{ color: 'var(--neutral-400)' }}>
                  SE Report AI
                </span>
              </div>

              {/* 제목 */}
              <h1 className="text-[22px] font-bold mb-1" style={{ color: 'var(--neutral-700)' }}>
                {reportTitle}
              </h1>

              {dateRange && (
                <p className="text-[14px]" style={{ color: 'var(--neutral-500)' }}>
                  분석 기간&nbsp;:&nbsp;
                  <span className="font-medium">
                    {formatDateShort(dateRange.start)} ~ {formatDateShort(dateRange.end)}
                  </span>
                </p>
              )}
            </div>

            {/* 우측: 생성일/만료일 + Excel 버튼 */}
            <div className="flex flex-col items-end gap-3 shrink-0 print:items-start">
              <div className="text-right print:text-left">
                {createdAt && (
                  <p className="text-[12px]" style={{ color: 'var(--neutral-400)' }}>
                    생성일&nbsp;:&nbsp;{formatDateKR(createdAt)}
                  </p>
                )}
                {expiresAt && (
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--neutral-400)' }}>
                    만료일&nbsp;:&nbsp;{formatDateKR(expiresAt)}
                  </p>
                )}
              </div>
              <button
                onClick={handleExcelSave}
                disabled={!conversationId || excelLoading}
                className="print-hide"
                style={{
                  background: 'var(--primary-500)',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: !conversationId || excelLoading ? 'not-allowed' : 'pointer',
                  opacity: !conversationId || excelLoading ? 0.6 : 1,
                }}
              >
                {excelLoading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                      />
                    </svg>
                    생성 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Excel 저장
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 32px 64px' }}>

        {/* 필터바 */}
        {allData.length > 0 && (
          <div
            className="print-hide mb-6"
            style={{
              background: 'white',
              border: '1px solid var(--neutral-100)',
              borderRadius: '12px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            {/* 매체 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--neutral-500)', whiteSpace: 'nowrap' }}>
                매체
              </label>
              <select
                value={mediaFilter}
                onChange={(e) => setMediaFilter(e.target.value as MediaFilter)}
                style={selectStyle}
              >
                <option value="all">전체</option>
                <option value="google">구글</option>
                <option value="kakao">카카오</option>
              </select>
            </div>

            <div style={{ width: '1px', height: '20px', background: 'var(--neutral-100)' }} />

            {/* 기간 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--neutral-500)', whiteSpace: 'nowrap' }}>
                기간
              </label>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                style={selectStyle}
              >
                <option value="all">전체</option>
                <option value="thisWeek">이번 주</option>
                <option value="lastWeek">지난 주</option>
                <option value="thisMonth">이번 달</option>
              </select>
            </div>

            <div style={{ width: '1px', height: '20px', background: 'var(--neutral-100)' }} />

            {/* 카테고리 (UI only) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--neutral-500)', whiteSpace: 'nowrap' }}>
                카테고리
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                style={selectStyle}
              >
                <option value="all">전체</option>
                <option value="campaign">캠페인</option>
                <option value="adgroup">광고그룹</option>
                <option value="keyword">키워드</option>
              </select>
            </div>

            <div style={{ width: '1px', height: '20px', background: 'var(--neutral-100)' }} />

            {/* 디바이스 (UI only) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--neutral-500)', whiteSpace: 'nowrap' }}>
                디바이스
              </label>
              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value as DeviceFilter)}
                style={selectStyle}
              >
                <option value="all">전체</option>
                <option value="pc">PC</option>
                <option value="mobile">모바일</option>
              </select>
            </div>

            {/* 초기화 버튼 */}
            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                style={{
                  marginLeft: 'auto',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--neutral-500)',
                  background: 'var(--neutral-50)',
                  border: '1px solid var(--neutral-200)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                필터 초기화
              </button>
            )}
          </div>
        )}

        {/* KPI 카드 섹션 */}
        {tableKpi && (
          <section className="mb-10 print:mb-8">
            <SectionLabel>핵심 지표</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              <KpiCard
                label="총 노출수"
                value={formatNum(tableKpi.totalImpressions)}
                unit="회"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              />
              <KpiCard
                label="총 클릭수"
                value={formatNum(tableKpi.totalClicks)}
                unit="클릭"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-7 1-4 6z"/></svg>}
              />
              <KpiCard
                label="총 광고비"
                value={formatKRW(tableKpi.kakaoCost + tableKpi.googleCost)}
                unit="구글+카카오"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1M12 7v2m0 6v2"/></svg>}
              />
              <KpiCard
                label="평균 CTR"
                value={tableKpi.ctr.toFixed(2) + '%'}
                unit="클릭률"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
              />
              <KpiCard
                label="구글 클릭 비중"
                value={tableKpi.googleClickRatio.toFixed(1) + '%'}
                unit="전체 클릭 중"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>}
              />
            </div>
          </section>
        )}

        {/* 차트 섹션 */}
        {chartMessages.length > 0 && (
          <section className="mb-10 print:mb-8">
            <SectionLabel>데이터 차트</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {chartMessages.map((msg, i) => {
                const chartType = msg.chartType ?? 'table';
                const colSpan = chartType === 'pie' ? 1 : chartType === 'line' ? 2 : 3;
                const chartTitle = CHART_TITLES[chartType] ?? '';
                return (
                  <div
                    key={i}
                    style={{
                      gridColumn: `span ${colSpan}`,
                      background: 'white',
                      border: '1px solid var(--neutral-100)',
                      borderRadius: '12px',
                      padding: '20px',
                    }}
                  >
                    {chartTitle && (
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--neutral-600)',
                          marginBottom: '16px',
                        }}
                      >
                        {chartTitle}
                      </h3>
                    )}
                    <DataRenderer data={msg.data!} chartType={chartType} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* AI 분석 섹션 */}
        {analysisContent && (
          <section className="mb-8 print:mb-6 mt-10">
            <SectionLabel>AI 분석</SectionLabel>
            {insightSections.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 성과 요약: 전체 너비, 회색 배경, 파란 왼쪽 테두리 */}
                {insightSections
                  .filter((sec) => sec.title.includes('성과 요약'))
                  .map((sec, i) => (
                    <div
                      key={`summary-${i}`}
                      style={{
                        background: '#f9fafb',
                        border: '1px solid var(--neutral-100)',
                        borderLeft: '4px solid #3b82f6',
                        borderRadius: '12px',
                        padding: '20px',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'var(--neutral-700)',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>{getSectionIcon(sec.title)}</span>
                        {sec.title}
                      </h3>
                      <div style={{ fontSize: '13px', lineHeight: '1.75', color: 'var(--neutral-600)' }}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p style={{ marginBottom: '8px' }}>{children}</p>,
                            ul: ({ children }) => (
                              <ul style={{ paddingLeft: '16px', marginBottom: '8px' }}>{children}</ul>
                            ),
                            li: ({ children }) => (
                              <li style={{ marginBottom: '6px', lineHeight: '1.75' }}>{children}</li>
                            ),
                          }}
                        >
                          {sec.content.trim()}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}

                {/* 주요 인사이트 + 개선 제안: 2열 나란히 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {insightSections
                    .filter((sec) => !sec.title.includes('성과 요약'))
                    .map((sec, i) => (
                      <div
                        key={`insight-${i}`}
                        style={{
                          background: 'white',
                          border: '1px solid var(--neutral-100)',
                          borderRadius: '12px',
                          padding: '20px',
                        }}
                      >
                        <h3
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--neutral-700)',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>{getSectionIcon(sec.title)}</span>
                          {sec.title}
                        </h3>
                        <div style={{ fontSize: '13px', lineHeight: '1.75', color: 'var(--neutral-600)' }}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p style={{ marginBottom: '8px' }}>{children}</p>,
                              ul: ({ children }) => (
                                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '8px' }}>
                                  {children}
                                </ul>
                              ),
                              li: ({ children }) => (
                                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                                  <span style={{ color: 'var(--primary-500)', flexShrink: 0, fontSize: '18px', lineHeight: 1.4 }}>•</span>
                                  <span style={{ lineHeight: '1.75' }}>{children}</span>
                                </li>
                              ),
                            }}
                          >
                            {sec.content.trim()}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'white',
                  border: '1px solid var(--neutral-100)',
                  borderRadius: '12px',
                }}
              >
                <button
                  onClick={() => setInsightOpen((v) => !v)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--neutral-700)' }}>
                    AI 상세 분석
                  </span>
                  <svg
                    className="w-4 h-4"
                    style={{
                      transform: insightOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`print:block ${insightOpen ? 'block' : 'hidden'}`}
                  style={{ padding: '0 20px 20px', borderTop: '1px solid var(--neutral-100)' }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisContent}</ReactMarkdown>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 데이터 테이블 섹션 */}
        {allData.length > 0 && (
          <section className="mb-8 mt-10">
            <SectionLabel>상세 데이터</SectionLabel>
            <div
              style={{
                background: 'white',
                border: '1px solid var(--neutral-100)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              {/* 검색 입력 */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--neutral-100)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: 'var(--neutral-400)', flexShrink: 0 }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="캠페인명, 키워드 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    color: 'var(--neutral-700)',
                    background: 'transparent',
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)', display: 'flex' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* 테이블 */}
              <div style={{ overflowX: 'auto' }}>
                {tableColumns.length === 0 || filteredData.length === 0 ? (
                  <div
                    style={{
                      padding: '48px',
                      textAlign: 'center',
                      fontSize: '13px',
                      color: 'var(--neutral-400)',
                    }}
                  >
                    데이터가 없습니다
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        {tableColumns.map((col) => (
                          <th
                            key={col}
                            onClick={() => handleSort(col)}
                            style={{
                              background: 'var(--neutral-50)',
                              padding: '10px 14px',
                              fontWeight: 600,
                              fontSize: '12px',
                              color: 'var(--neutral-600)',
                              borderBottom: '1px solid var(--neutral-100)',
                              textAlign: isNumericCol(col, filteredData) ? 'right' : 'left',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              userSelect: 'none',
                            }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {COL_LABEL_MAP[col] ?? col}
                              <span style={{ color: 'var(--neutral-300)', fontSize: '10px' }}>
                                {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                              </span>
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, ri) => (
                        <tr
                          key={ri}
                          style={{ borderBottom: '1px solid var(--neutral-100)' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background = 'var(--neutral-50)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                          }}
                        >
                          {tableColumns.map((col) => (
                            <td
                              key={col}
                              style={{
                                padding: '9px 14px',
                                color: 'var(--neutral-700)',
                                textAlign: isNumericCol(col, filteredData) ? 'right' : 'left',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatCellValue(col, row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 페이지네이션 안내 */}
              {hasMore && (
                <div
                  style={{
                    padding: '10px 16px',
                    borderTop: '1px solid var(--neutral-100)',
                    fontSize: '12px',
                    color: 'var(--neutral-400)',
                    textAlign: 'center',
                  }}
                >
                  총 {displayData.length.toLocaleString('ko-KR')}건 중 200건 표시
                </div>
              )}
            </div>
          </section>
        )}

        {/* 푸터 */}
        <footer
          className="text-center text-[12px] print:mt-8"
          style={{
            color: 'var(--neutral-400)',
            borderTop: '1px solid var(--neutral-100)',
            paddingTop: '20px',
          }}
        >
          AI 리포트는 부정확할 수 있습니다. 중요한 수치는 광고 대시보드를 직접 확인하세요.
        </footer>
      </div>
    </div>
  );
};

function SectionLabel({ children }: { children: string }) {
  return (
    <h2
      className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4"
      style={{ color: 'var(--neutral-400)' }}
    >
      {children}
    </h2>
  );
}

export default ReportView;
