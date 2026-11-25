import { formatDate } from '../lib/stats'

interface Point {
  date: string
  value: number
}

export function LineChart({ data, unit, height = 160 }: { data: Point[]; unit: string; height?: number }) {
  if (data.length === 0) return <div className="py-8 text-center text-sm text-white/40">Пока нет данных</div>
  const W = 320
  const H = height
  const pad = { l: 36, r: 12, t: 14, b: 24 }
  const t = data.map((d) => Date.parse(d.date.slice(0, 10)))
  const v = data.map((d) => d.value)
  const tMin = Math.min(...t)
  const tMax = Math.max(...t)
  let vMin = Math.min(...v)
  let vMax = Math.max(...v)
  if (vMax - vMin < 1) {
    vMin -= 1
    vMax += 1
  }
  const x = (ti: number) => (tMax === tMin ? (pad.l + W - pad.r) / 2 : pad.l + ((ti - tMin) / (tMax - tMin)) * (W - pad.l - pad.r))
  const y = (vi: number) => pad.t + (1 - (vi - vMin) / (vMax - vMin)) * (H - pad.t - pad.b)
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(t[i]).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ')
  const ticks = [vMin, (vMin + vMax) / 2, vMax]
  const last = data[data.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`График, последнее значение ${last.value} ${unit}`}>
      {ticks.map((tv) => (
        <g key={tv}>
          <line x1={pad.l} x2={W - pad.r} y1={y(tv)} y2={y(tv)} stroke="rgba(255,255,255,0.07)" />
          <text x={pad.l - 6} y={y(tv) + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.45)">
            {Math.round(tv * 10) / 10}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={x(t[i])} cy={y(d.value)} r={i === data.length - 1 ? 4 : 2.5} fill="var(--color-accent)" />
      ))}
      <text x={pad.l} y={H - 6} fontSize="10" fill="rgba(255,255,255,0.45)">
        {formatDate(data[0].date)}
      </text>
      <text x={W - pad.r} y={H - 6} fontSize="10" textAnchor="end" fill="rgba(255,255,255,0.45)">
        {formatDate(last.date)}
      </text>
    </svg>
  )
}
