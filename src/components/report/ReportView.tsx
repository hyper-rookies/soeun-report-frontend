'use client';

import { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DataRenderer } from '@/components/chat/DataRenderer';
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
  googleClicks: number;
  googleCost: number;
  kakaoImpressions: number;
  kakaoSpending: number;
  hasGoogle: boolean;
  hasKakao: boolean;
}

function extractKpi(allData: Record<string, unknown>[]): KpiData {
  let googleClicks = 0;
  let googleCostMicros = 0;
  let kakaoImpressions = 0;
  let kakaoSpending = 0;
  let hasGoogle = false;
  let hasKakao = false;

  for (const row of allData) {
    if ('cost_micros' in row) {
      hasGoogle = true;
      googleClicks += toNum(row.clicks ?? row.click ?? 0);
      googleCostMicros += toNum(row.cost_micros ?? 0);
    }
    if ('spending' in row) {
      hasKakao = true;
      kakaoImpressions += toNum(row.impressions ?? row.impression ?? 0);
      kakaoSpending += toNum(row.spending ?? 0);
    }
  }

  return {
    googleClicks,
    googleCost: googleCostMicros / 1_000_000,
    kakaoImpressions,
    kakaoSpending,
    hasGoogle,
    hasKakao,
  };
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

/** 첫 번째 문단이 인사/도입 문장이면 제거 */
function stripIntroLine(content: string): string {
  return content.replace(/^[^\n]*(네[,，、]|안녕|구글과 카카오|광고 성과를)[^\n]*\n{1,2}/, '');
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
  const allData = messages.flatMap((m) => m.data ?? []);
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const chartMessages = messages.filter(
    (m) => m.role === 'assistant' && m.data && m.data.length > 0,
  );

  const kpi = allData.length > 0 ? extractKpi(allData) : null;
  const dateRange = allData.length > 0 ? extractDateRange(allData) : null;

  const analysisContent = lastAssistant
    ? stripIntroLine(normalizeMarkdown(lastAssistant.content))
    : null;

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
                <span
                  className="text-[13px] font-medium"
                  style={{ color: 'var(--neutral-400)' }}
                >
                  SE Report AI
                </span>
              </div>

              {/* 제목 */}
              <h1
                className="text-[22px] font-bold mb-1"
                style={{ color: 'var(--neutral-700)' }}
              >
                주간 광고 성과 리포트
              </h1>

              {/* 분석 기간 — dateRange가 없으면 표시하지 않음 (생성일로 충분) */}
              {dateRange && (
                <p className="text-[14px]" style={{ color: 'var(--neutral-500)' }}>
                  분석 기간&nbsp;:&nbsp;
                  <span className="font-medium">
                    {formatDateShort(dateRange.start)} ~ {formatDateShort(dateRange.end)}
                  </span>
                </p>
              )}
            </div>

            {/* 생성일 / 만료일 */}
            <div className="text-right shrink-0 print:text-left">
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
          </div>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 32px 64px' }}>

        {/* KPI 카드 섹션 */}
        {kpi && (kpi.hasGoogle || kpi.hasKakao) && (
          <section className="mb-8 print:mb-6">
            <SectionLabel>핵심 지표</SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {kpi.hasGoogle && (
                <>
                  <KpiCard
                    label="구글 총 클릭수"
                    value={formatNum(kpi.googleClicks)}
                    unit="클릭"
                    accentColor="var(--primary-500)"
                  />
                  <KpiCard
                    label="구글 총 비용"
                    value={formatKRW(kpi.googleCost)}
                    unit=""
                    accentColor="var(--primary-500)"
                  />
                </>
              )}
              {kpi.hasKakao && (
                <>
                  <KpiCard
                    label="카카오 총 노출수"
                    value={formatNum(kpi.kakaoImpressions)}
                    unit="회"
                    accentColor="#FEE500"
                  />
                  <KpiCard
                    label="카카오 총 비용"
                    value={formatKRW(kpi.kakaoSpending)}
                    unit=""
                    accentColor="#FEE500"
                  />
                </>
              )}
            </div>
          </section>
        )}

        {/* 분석 텍스트 섹션 */}
        {analysisContent && (
          <section className="mb-8 print:mb-6">
            <SectionLabel>AI 분석</SectionLabel>
            <div
              style={{
                background: 'white',
                border: '1px solid var(--neutral-100)',
                borderRadius: '12px',
                padding: '24px 28px',
              }}
            >
              <div
                className="text-[15px] leading-[1.8] tracking-[-0.01em]"
                style={{ color: 'var(--neutral-700)' }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 mb-4 space-y-1.5">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 mb-4 space-y-1.5">{children}</ol>
                    ),
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => (
                      <strong
                        className="font-semibold"
                        style={{ color: 'var(--neutral-700)' }}
                      >
                        {children}
                      </strong>
                    ),
                    h1: ({ children }) => (
                      <h1
                        className="text-[20px] font-bold mt-8 mb-4"
                        style={{ color: 'var(--neutral-700)' }}
                      >
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2
                        className="text-[18px] font-bold mt-6 mb-3"
                        style={{ color: 'var(--neutral-700)' }}
                      >
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3
                        className="text-[16px] font-bold mt-5 mb-2"
                        style={{ color: 'var(--neutral-700)' }}
                      >
                        {children}
                      </h3>
                    ),
                    code: ({ children }) => (
                      <code
                        className="px-1.5 py-0.5 rounded text-[13.5px] font-mono"
                        style={{
                          background: 'var(--primary-50)',
                          color: 'var(--primary-600)',
                        }}
                      >
                        {children}
                      </code>
                    ),
                    table: ({ children }) => (
                      <table
                        style={{
                          borderCollapse: 'collapse',
                          width: '100%',
                          margin: '8px 0',
                          fontSize: '13px',
                        }}
                      >
                        {children}
                      </table>
                    ),
                    th: ({ children }) => (
                      <th
                        style={{
                          padding: '6px 12px',
                          background: 'var(--neutral-50)',
                          borderBottom: '2px solid var(--neutral-200)',
                          textAlign: 'left',
                          color: 'var(--neutral-500)',
                          fontWeight: 600,
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td
                        style={{
                          padding: '6px 12px',
                          borderBottom: '1px solid var(--neutral-100)',
                          color: 'var(--neutral-600)',
                          fontSize: '13px',
                        }}
                      >
                        {children}
                      </td>
                    ),
                  }}
                >
                  {analysisContent}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        )}

        {/* 차트 섹션 */}
        {chartMessages.length > 0 && (
          <section className="mb-8 print:mb-6">
            <SectionLabel>데이터 차트</SectionLabel>
            <div className="flex flex-col gap-4">
              {chartMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    background: 'white',
                    border: '1px solid var(--neutral-100)',
                    borderRadius: '12px',
                    padding: '20px',
                  }}
                >
                  <DataRenderer data={msg.data!} />
                </div>
              ))}
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
      className="text-[12px] font-semibold uppercase tracking-widest mb-3"
      style={{ color: 'var(--neutral-400)' }}
    >
      {children}
    </h2>
  );
}

export default ReportView;
