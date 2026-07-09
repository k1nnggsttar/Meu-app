import { useState } from 'react'

const COR = '#2563eb'
const W = 280
const H = 108
const PAD_TOP = 22
const PAD_BOTTOM = 20
const PAD_X = 10
const PLOT_W = W - PAD_X * 2
const PLOT_H = H - PAD_TOP - PAD_BOTTOM
const BASE_Y = PAD_TOP + PLOT_H

export default function UltimosDiasChart({ dias }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const max = Math.max(1, ...dias.map(d => d.count))
  const n = dias.length
  const xStep = n > 1 ? PLOT_W / (n - 1) : 0

  const pontos = dias.map((d, i) => ({
    ...d,
    x: PAD_X + i * xStep,
    y: BASE_Y - (d.count / max) * PLOT_H,
  }))

  const linePath = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${pontos[n - 1].x},${BASE_Y} L${pontos[0].x},${BASE_Y} Z`
  const ultimo = pontos[n - 1]
  const total = dias.reduce((s, d) => s + d.count, 0)
  const hover = hoverIdx != null ? pontos[hoverIdx] : null

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: 0 }}>Concluídos por dia</p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{total} nos últimos 7 dias</p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block', overflow: 'visible' }}>
        <line x1={PAD_X} y1={BASE_Y} x2={W - PAD_X} y2={BASE_Y} stroke="#f1f5f9" strokeWidth="1" />

        <path d={areaPath} fill={COR} fillOpacity="0.1" stroke="none" />
        <path d={linePath} fill="none" stroke={COR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        <text
          x={ultimo.x}
          y={Math.max(10, ultimo.y - 10)}
          textAnchor="end"
          fontSize="11"
          fontWeight="700"
          fill="#1e293b"
        >
          {ultimo.count}
        </text>
        <circle cx={ultimo.x} cy={ultimo.y} r="4.5" fill={COR} stroke="white" strokeWidth="2" />

        {pontos.map((p, i) => (
          <text key={`lbl-${i}`} x={p.x} y={H - 5} textAnchor="middle" fontSize="9" fontWeight={i === n - 1 ? '700' : '400'} fill={i === n - 1 ? COR : '#94a3b8'}>
            {p.dow}
          </text>
        ))}

        {pontos.map((p, i) => (
          <circle
            key={`hit-${i}`}
            cx={p.x}
            cy={p.y}
            r="12"
            fill="transparent"
            style={{ cursor: 'pointer' }}
            tabIndex={0}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            onFocus={() => setHoverIdx(i)}
            onBlur={() => setHoverIdx(null)}
          />
        ))}
      </svg>

      {hover && (
        <div style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%`,
          transform: 'translate(-50%, calc(-100% - 10px))',
          background: '#1e293b', color: 'white', borderRadius: 6,
          padding: '5px 8px', fontSize: 11, whiteSpace: 'nowrap', zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
        }}>
          <strong>{hover.count}</strong> concluído{hover.count !== 1 ? 's' : ''} · {hover.dataLabel}
        </div>
      )}
    </div>
  )
}
