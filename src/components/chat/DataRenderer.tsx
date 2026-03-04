'use client';

import { FC, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DataRendererProps {
  data: Record<string, unknown>[];
}

const CHART_COLORS = ['#ec1d31', '#f87171', '#fca5a5'];

/** unknown → number 안전 변환 (NaN → 0) */
const toNumber = (v: unknown): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

/** Y축 눈금 축약 포맷 */
const formatYAxis = (value: unknown): string => {
  const num = toNumber(value);
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}억`;
  if (num >= 1_000_000)   return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)       return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString('ko-KR');
};

/** YYYY-MM-DD 날짜 패턴 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 컬럼이 숫자 값인지 판별.
 * - 날짜 형식(YYYY-MM-DD) 포함 시 → false
 * - null/빈값 제외 후 모두 숫자로 파싱 가능 → true
 *   (서버가 숫자를 string으로 내려보내는 경우도 처리)
 */
function isNumericColumn(col: string, data: Record<string, unknown>[]): boolean {
  const values = data.map((row) => row[col]);
  if (values.some((v) => DATE_PATTERN.test(String(v)))) return false;
  const nonEmpty = values.filter((v) => v !== '' && v !== null && v !== undefined);
  return nonEmpty.length > 0 && nonEmpty.every((v) => !isNaN(Number(v)));
}

export const DataRenderer: FC<DataRendererProps> = ({ data }) => {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const columns = useMemo(() => (data.length ? Object.keys(data[0]) : []), [data]);

  const { stringCols, numericCols } = useMemo(() => {
    const stringCols: string[] = [];
    const numericCols: string[] = [];
    for (const col of columns) {
      if (isNumericColumn(col, data)) numericCols.push(col);
      else stringCols.push(col);
    }
    return { stringCols, numericCols };
  }, [columns, data]);

  // X축: 날짜 컬럼 우선 → 첫 번째 비숫자 컬럼 → fallback
  const xKey =
    columns.find((col) => data[0] && DATE_PATTERN.test(String(data[0][col]))) ??
    stringCols[0] ??
    columns[0];

  // 차트 표시 조건:
  // - xKey 제외 숫자 컬럼 1~2개 (Bar 너무 많으면 표가 나음)
  // - 전체 컬럼 4개 이하 (5개 이상이면 표만)
  // - 데이터 1행 이상
  const chartBarCols = numericCols.filter((c) => c !== xKey);
  const useChart =
    chartBarCols.length >= 1 &&
    chartBarCols.length <= 2 &&
    columns.length <= 4 &&
    data.length >= 1;

  /**
   * 바로 쓸 차트 컬럼과 표 표시 여부.
   * 단위 차이가 100배 초과이면 첫 번째 컬럼만 차트에 표시하고 표도 같이 보임.
   */
  const { colsToChart, showTable } = useMemo(() => {
    if (!useChart) {
      return { colsToChart: chartBarCols, showTable: true };
    }
    if (chartBarCols.length < 2) {
      return { colsToChart: chartBarCols, showTable: false };
    }
    const maxValues = chartBarCols.map((col) =>
      Math.max(...data.map((r) => toNumber(r[col])))
    );
    const minVal = Math.min(...maxValues.filter((v) => v > 0));
    const ratio = minVal > 0 ? Math.max(...maxValues) / minVal : 1;
    if (ratio > 100) {
      return { colsToChart: [chartBarCols[0]], showTable: true };
    }
    return { colsToChart: chartBarCols, showTable: false };
  }, [useChart, chartBarCols, data]);

  const sortedData = useMemo(() => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const av = (a[sortCol] as number) ?? 0;
      const bv = (b[sortCol] as number) ?? 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [data, sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (!numericCols.includes(col)) return;
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  if (!data.length || !columns.length) return null;

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* ── 바 차트 ── */}
      {useChart && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 20, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-100)" />
            <XAxis
              dataKey={xKey}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={60}
              tick={{ fontSize: 11, fill: 'var(--neutral-500)' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--neutral-500)' }}
              tickFormatter={formatYAxis}
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid var(--neutral-100)',
                borderRadius: 8,
                fontSize: 13,
              }}
              formatter={(value: unknown) => [
                toNumber(value).toLocaleString('ko-KR'),
                '',
              ]}
            />
            {colsToChart.length > 1 && (
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            )}
            {colsToChart.map((col, i) => (
              <Bar
                key={col}
                dataKey={col}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* ── 정렬 가능 표 ── */}
      {(!useChart || showTable) && (
        <div
          className="overflow-x-auto"
          style={{ border: '1px solid var(--neutral-100)', borderRadius: 8 }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--neutral-50)' }}>
                {columns.map((col) => {
                  const sortable = numericCols.includes(col);
                  return (
                    <th
                      key={col}
                      className="font-semibold whitespace-nowrap"
                      style={{
                        padding: '8px 12px',
                        textAlign: sortable ? 'right' : 'left',
                        borderBottom: '2px solid var(--neutral-200)',
                        color: 'var(--neutral-500)',
                        fontSize: '12px',
                        cursor: sortable ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                      onClick={() => handleSort(col)}
                    >
                      {col}
                      {sortCol === col && (
                        <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, i) => (
                <tr
                  key={i}
                  style={{ background: i % 2 === 0 ? 'white' : 'var(--neutral-50)' }}
                >
                  {columns.map((col) => {
                    const numeric = numericCols.includes(col);
                    const val = row[col];
                    return (
                      <td
                        key={col}
                        style={{
                          padding: '8px 12px',
                          textAlign: numeric ? 'right' : 'left',
                          borderBottom: '1px solid var(--neutral-100)',
                          color: 'var(--neutral-600)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {numeric
                          ? toNumber(val).toLocaleString('ko-KR')
                          : String(val ?? '')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataRenderer;
