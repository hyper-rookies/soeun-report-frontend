'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MediaPieData } from '@/types/dashboard';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: { percent?: number } }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const { name, value } = payload[0];
  const percent = payload[0].payload.percent ?? 0;
  return (
    <div className="bg-white border border-gray-200 shadow-md rounded-lg px-3 py-2 text-xs">
      {name}: ₩{value.toLocaleString()} ({(percent * 100).toFixed(1)}%)
    </div>
  );
}

interface Props {
  data: MediaPieData[];
}

export default function MediaPieChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-xs text-gray-400">데이터가 없습니다</span>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-5">
        <span className="dashboard-card__title" style={{ marginBottom: 0 }}>매체별 광고비 비중</span>
        <span className="text-xs text-gray-400">{data.length}개 매체</span>
      </div>
      <div className="flex items-center gap-4 mt-2 flex-1">
        <div className="flex-1 relative">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={52}
                strokeWidth={0}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color ?? COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-xs text-gray-400">총 비용</p>
            <p className="text-sm font-bold text-gray-800">₩{total.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 min-w-[90px]">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: item.color ?? COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
              <span className="text-xs font-bold text-gray-800">
                {total > 0 ? (item.value / total * 100).toFixed(0) : '0'}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
