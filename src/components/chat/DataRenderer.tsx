import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

// 대시보드와 동일한 색상 팔레트
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6']

interface DataRendererProps {
  chartType: 'line' | 'bar' | 'pie' | 'table'
  data: any[]
}

export default function DataRenderer({ chartType, data }: DataRendererProps) {
  if (!data || data.length === 0) return null

  const keys = Object.keys(data[0])
  const labelKey = keys[0]           // 첫 번째 컬럼 = X축 또는 레이블
  const valueKeys = keys.slice(1)    // 나머지 = Y축 값들

  // ── 공통 래퍼 스타일 (대시보드 카드와 동일) ──
  const wrapperClass = "dashboard-card my-4"
  const titleClass   = "dashboard-card__title mb-4"

  // ── 커스텀 Tooltip ──
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'white',
        border: '1px solid #f0f0f0',
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontSize: '12px'
      }}>
        <p style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color, margin: '2px 0' }}>
            {p.name}: <strong>{typeof p.value === 'number'
              ? p.value.toLocaleString() : p.value}</strong>
          </p>
        ))}
      </div>
    )
  }

  // ── LINE CHART ──
  if (chartType === 'line') return (
    <div className={wrapperClass}>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey={labelKey}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false} axisLine={false} width={40}
            tickFormatter={(v) => typeof v === 'number' ? v.toLocaleString() : v} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
          {valueKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2.5}
              dot={{ r: 0 }}
              activeDot={{ r: 4, strokeWidth: 0 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  // ── BAR CHART ──
  if (chartType === 'bar') return (
    <div className={wrapperClass}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey={labelKey}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false} axisLine={false} width={40}
            tickFormatter={(v) => typeof v === 'number' ? v.toLocaleString() : v} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
          {valueKeys.map((key, i) => (
            <Bar key={key} dataKey={key}
              fill={COLORS[i % COLORS.length]}
              radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )

  // ── PIE CHART ──
  if (chartType === 'pie') {
    const total = data.reduce((sum, row) => sum + (Number(row[valueKeys[0]]) || 0), 0)
    return (
      <div className={wrapperClass}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <ResponsiveContainer width="50%" height={200}>
            <PieChart>
              <Pie data={data} dataKey={valueKeys[0]} nameKey={labelKey}
                outerRadius={80} innerRadius={50}
                strokeWidth={0} paddingAngle={3}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* 범례 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: COLORS[i % COLORS.length],
                    display: 'inline-block', flexShrink: 0
                  }}/>
                  <span style={{ fontSize: 12, color: '#4b5563' }}>
                    {row[labelKey]}
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                  {total > 0
                    ? ((Number(row[valueKeys[0]]) / total) * 100).toFixed(1) + '%'
                    : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── TABLE ──
  return (
    <div className={wrapperClass}>
      <table className="dashboard-table" style={{ marginBottom: 0 }}>
        <thead>
          <tr>
            {keys.map(k => (
              <th key={k} style={{ textAlign: k === labelKey ? 'left' : 'right' }}>
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {keys.map(k => (
                <td key={k} style={{ textAlign: k === labelKey ? 'left' : 'right' }}>
                  {typeof row[k] === 'number' ? row[k].toLocaleString() : row[k]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
