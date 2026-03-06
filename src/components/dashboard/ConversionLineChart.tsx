'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ConversionLineData } from '@/types/dashboard';

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-md rounded-lg px-3 py-2 text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((item, i) => (
        <p key={i} className="text-gray-600">
          {item.name}: {item.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

interface Props {
  data: ConversionLineData[];
}

export default function ConversionLineChart({ data }: Props) {
  const [showConversions, setShowConversions] = useState(true);
  const [showClicks, setShowClicks] = useState(true);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-xs text-gray-400">데이터가 없습니다</span>
      </div>
    );
  }

  const hasClicks = data.some((d) => d.clicks !== undefined);

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <span className="dashboard-card__title" style={{ marginBottom: 0 }}>최근 7일 전환 추이</span>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConversions(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
              showConversions
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                : 'bg-gray-50 text-gray-400 border-gray-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: '#6366f1' }} />
            전환수
          </button>
          {hasClicks && (
            <button
              onClick={() => setShowClicks(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                showClicks
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
              클릭수
            </button>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
          {showConversions && (
            <Line
              type="monotone"
              dataKey="conversions"
              name="전환수"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}
          {hasClicks && showClicks && (
            <Line
              type="monotone"
              dataKey="clicks"
              name="클릭수"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
