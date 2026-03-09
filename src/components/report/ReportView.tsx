'use client';

import { FC, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DataRenderer from '@/components/chat/DataRenderer';
import { ChatMessage } from '@/types/chat';

interface ReportViewProps {
  messages: ChatMessage[];
  title: string;
  expiresAt?: string;
  createdAt?: string;
}

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
  let conversions = 0;
  let googleCost = 0;
  let kakaoSpending = 0;
  let conversionsValue = 0;
  let hasGoogle = false;
  let hasKakao = false;

  for (const row of allData) {
    if ('cost_micros' in row) {
      hasGoogle = true;
      impressions += toNum(row.impressions ?? 0);
      clicks += toNum(row.clicks ?? row.click ?? 0);
      conversions += toNum(row.conversions ?? 0);
      googleCost += toNum(row.cost_micros ?? 0) / 1_000_000;
      conversionsValue += toNum(row.conversions_value ?? 0);
    }
    if ('spending' in row) {
      hasKakao = true;
      impressions += toNum(row.impressions ?? row.impression ?? 0);
      clicks += toNum(row.clicks ?? row.click ?? 0);
    }
    kakaoSpending += toNum(row.spending ?? 0);
  }

  const totalCost = googleCost + kakaoSpending;
  const roas =
    conversionsValue > 0 && totalCost > 0
      ? (conversionsValue / totalCost) * 100
      : null;

  return { impressions, clicks, conversions, totalCost, roas, hasGoogle, hasKakao };
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
      const title = match[1].replace(/^\d+\.\s*/, '').trim();
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

function getSectionIcon(title: string) {
  return Object.entries(SECTION_ICONS).find(([k]) => title.includes(k))?.[1] ?? '📋';
}

interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  accentColor: string;
}

function KpiCard({ label, value, unit, accentColor }: KpiCardProps) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--neutral-100)',
        borderRadius: '12px',
        padding: '16px 20px',
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--neutral-400)' }}>
        {label}
      </p>
      <p className="text-[20px] font-bold leading-none" style={{ color: 'var(--neutral-700)' }}>
        {value}
      </p>
      {unit && (
        <p className="text-[11px] mt-1" style={{ color: 'var(--neutral-400)' }}>
          {unit}
        </p>
      )}
    </div>
  );
}

export const ReportView: FC<ReportViewProps> = ({ messages, title, expiresAt, createdAt }) => {
  const [insightOpen, setInsightOpen] = useState(false);

  const allData = messages.flatMap((m) => m.data ?? []);
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const chartMessages = messages.filter(
    (m) => m.role === 'assistant' && m.data && m.data.length > 0 && m.chartType,
  );

  const kpi = allData.length > 0 ? extractKpi(allData) : null;
  const dateRange = allData.length > 0 ? extractDateRange(allData) : null;

  const analysisContent = lastAssistant
    ? stripIntroLine(normalizeMarkdown(lastAssistant.content))
    : null;

  const insightSections = analysisContent ? parseInsightSections(analysisContent) : [];

  return (
    <div className="min-h-full print:bg-white" style={{ background: 'var(--neutral-50)' }}>
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
                주간 광고 성과 리포트
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

            {/* 우측: 생성일/만료일 + PDF 버튼 */}
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
                onClick={() => window.print()}
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
                  cursor: 'pointer',
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                PDF 저장
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 32px 64px' }}>

        {/* KPI 카드 섹션 */}
        {kpi && (kpi.hasGoogle || kpi.hasKakao) && (
          <section className="mb-8 print:mb-6">
            <SectionLabel>핵심 지표</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              <KpiCard
                label="총 노출수"
                value={formatNum(kpi.impressions)}
                unit="회"
                accentColor="var(--neutral-400)"
              />
              <KpiCard
                label="총 클릭수"
                value={formatNum(kpi.clicks)}
                unit="클릭"
                accentColor="var(--primary-500)"
              />
              <KpiCard
                label="총 전환수"
                value={formatNum(kpi.conversions)}
                unit="건"
                accentColor="#10b981"
              />
              <KpiCard
                label="총 광고비"
                value={formatKRW(kpi.totalCost)}
                unit=""
                accentColor="#f59e0b"
              />
              <KpiCard
                label="ROAS"
                value={kpi.roas ? kpi.roas.toFixed(1) + '%' : '-'}
                unit={kpi.roas ? '수익률' : '데이터 없음'}
                accentColor="#8b5cf6"
              />
            </div>
          </section>
        )}

        {/* 차트 섹션 */}
        {chartMessages.length > 0 && (
          <section className="mb-8 print:mb-6">
            <SectionLabel>데이터 차트</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {chartMessages.map((msg, i) => {
                const isWide =
                  msg.chartType === 'line' ||
                  msg.chartType === 'bar' ||
                  msg.chartType === 'table';
                return (
                  <div
                    key={i}
                    style={{
                      gridColumn: isWide ? 'span 2' : 'span 1',
                      background: 'white',
                      border: '1px solid var(--neutral-100)',
                      borderRadius: '12px',
                      padding: '20px',
                    }}
                  >
                    <DataRenderer data={msg.data!} chartType={msg.chartType!} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* AI 분석 섹션 */}
        {analysisContent && (
          <section className="mb-8 print:mb-6">
            <SectionLabel>AI 분석</SectionLabel>
            {insightSections.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                {insightSections.map((sec, i) => (
                  <div
                    key={i}
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
                    <div style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--neutral-600)' }}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p style={{ marginBottom: '8px' }}>{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul style={{ paddingLeft: '16px', marginBottom: '8px' }}>
                              {children}
                            </ul>
                          ),
                          li: ({ children }) => (
                            <li style={{ marginBottom: '4px' }}>{children}</li>
                          ),
                        }}
                      >
                        {sec.content.trim()}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
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
      className="text-[12px] font-semibold uppercase tracking-widest mb-3"
      style={{ color: 'var(--neutral-400)' }}
    >
      {children}
    </h2>
  );
}

export default ReportView;
