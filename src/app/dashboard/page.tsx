'use client';

import { useEffect, useState } from 'react'
import MediaPieChart from '@/components/dashboard/MediaPieChart';
import ConversionLineChart from '@/components/dashboard/ConversionLineChart';
import { getDashboardSummary, DashboardSummaryResponse } from '@/services/api'
import { Skeleton } from '@/components/ui/Skeleton'

const MEDIA_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];

const today = new Date();
const todayLabel = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const fetchData = () => {
    setIsError(false)
    setIsLoading(true)
    getDashboardSummary()
      .then(res => setData(res))
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-inner">
          <Skeleton className="h-16 rounded-2xl w-80" />
          <div className="dashboard-grid-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
          <div className="dashboard-grid-2">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
          <div className="dashboard-grid-2-bottom">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-sm">데이터를 불러오지 못했습니다.</p>
        <button
          onClick={fetchData}
          className="mt-3 text-xs text-indigo-500 underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  const latestDate = data.dailyConversions.length > 0
    ? data.dailyConversions[data.dailyConversions.length - 1].date.slice(0, 10).replace(/-/g, '.')
    : todayLabel;

  const mediaTotal = data.mediaShare.reduce((sum, item) => sum + item.value, 0);

  const kpiCards = [
    {
      title: '오늘 광고비',
      value: `₩${data.adCost.today.toLocaleString()}`,
      changeRate: data.adCost.todayChangeRate,
      changeLabel: '전일 대비',
    },
    {
      title: '이번 주 광고비',
      value: `₩${data.adCost.thisWeek.toLocaleString()}`,
      changeRate: data.adCost.thisWeekChangeRate,
      changeLabel: '전주 대비',
    },
    {
      title: 'ROAS',
      value: data.performanceMetrics.roas === 0 ? '측정 중' : `${data.performanceMetrics.roas}%`,
      changeRate: undefined,
      changeLabel: '이번 달 기준',
    },
    {
      title: 'CPC',
      value: `₩${data.performanceMetrics.cpc.toLocaleString()}`,
      changeRate: undefined,
      changeLabel: '이번 달 기준',
    },
    {
      title: 'CTR',
      value: `${data.performanceMetrics.ctr}%`,
      changeRate: undefined,
      changeLabel: '이번 달 기준',
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-inner">

        {/* [1] 헤더 */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-header__title">광고 성과 대시보드</h1>
            <p className="dashboard-header__subtitle">Google · Kakao 통합 성과 · 기준일: {latestDate}</p>
          </div>
          <div className="dashboard-header__badge">
            <span className="pulse-dot" />
            <span>실시간 데이터</span>
          </div>
        </div>

        {/* [2] KPI 카드 5개 */}
        <div className="dashboard-section">
          <p className="dashboard-section__label">광고비 요약</p>
          <div className="dashboard-grid-5">
            {kpiCards.map((card) => {
              const badge = (() => {
                if (card.changeRate === undefined || card.changeRate === null) return null;
                if (card.changeRate > 0) return <span className="badge-up">▲ {Math.abs(card.changeRate)}%</span>;
                if (card.changeRate < 0) return <span className="badge-down">▼ {Math.abs(card.changeRate)}%</span>;
                return null;
              })();

              return (
                <div key={card.title} className="dashboard-card">
                  <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-lg)' }}>
                    <span className="dashboard-card__label" style={{ marginBottom: 0 }}>{card.title}</span>
                    {badge}
                  </div>
                  <div className="dashboard-card__value">{card.value}</div>
                  <div className="dashboard-card__footer">{card.changeLabel}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* [3] 차트 */}
        <div className="dashboard-grid-2">
          <div className="dashboard-card">
            <MediaPieChart data={data.mediaShare} />
          </div>
          <div className="dashboard-card">
            <ConversionLineChart
              data={data.dailyConversions.map(d => ({
                date: d.date.slice(5).replace('-', '/'),
                conversions: d.conversions,
                clicks: d.clicks,
              }))}
            />
          </div>
        </div>

        {/* [4] 하단 테이블 */}
        <div className="dashboard-grid-2-bottom">

          {/* 좌: 매체별 비용 상세 */}
          <div className="dashboard-card">
            <p className="dashboard-card__title">매체별 광고비 상세</p>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>매체</th>
                  <th className="right">비용</th>
                  <th className="right">비중</th>
                </tr>
              </thead>
              <tbody>
                {data.mediaShare.map((item, i) => (
                  <tr key={item.name}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: MEDIA_COLORS[i % MEDIA_COLORS.length] }}
                        />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="right value">₩{item.value.toLocaleString()}</td>
                    <td className="right">
                      {mediaTotal > 0 ? (item.value / mediaTotal * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                ))}
                <tr className="dashboard-table__total">
                  <td>합계</td>
                  <td className="right">₩{mediaTotal.toLocaleString()}</td>
                  <td className="right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 우: 일별 전환/클릭 테이블 */}
          <div className="dashboard-card">
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-lg)' }}>
              <p className="dashboard-card__title" style={{ marginBottom: 0 }}>일별 상세 데이터</p>
              <span className="dash-chip">최근 7일</span>
            </div>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th className="right">전환수</th>
                  <th className="right">클릭수</th>
                  <th className="right">전환율</th>
                </tr>
              </thead>
              <tbody>
                {data.dailyConversions.map((d) => {
                  const convRate = d.clicks > 0 ? (d.conversions / d.clicks * 100).toFixed(2) : '0.00';
                  return (
                    <tr key={d.date}>
                      <td>{d.date.slice(5).replace('-', '/')}</td>
                      <td className="right highlight">{d.conversions.toLocaleString()}</td>
                      <td className="right">{d.clicks.toLocaleString()}</td>
                      <td className="right">
                        <span className="dash-chip">{convRate}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
