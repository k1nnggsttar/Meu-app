import { useId, useState } from 'react'

const COR_FRETE = '#16a34a'
const COR_MERC = '#2563eb'
const W = 600
const H = 200
const PAD_TOP = 30
const PAD_BOTTOM = 22
const PAD_LEFT = 60
const PAD_RIGHT = 14
const PLOT_W = W - PAD_LEFT - PAD_RIGHT
const PLOT_H = H - PAD_TOP - PAD_BOTTOM
const BASE_Y = PAD_TOP + PLOT_H

function niceCeil(v) {
  if (v <= 0) return 1
  const exp = Math.floor(Math.log10(v))
  const base = Math.pow(10, exp)
  const norm = v / base
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10
  return niceNorm * base
}

function fmtCompacto(v) {
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
  if (v >= 1e3) return `R$ ${(v / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`
  return `R$ ${Math.round(v).toLocaleString('pt-BR')}`
}

function fmtBRL(v) {
  return `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Catmull-Rom -> Bézier, pra desenhar a linha com curvas suaves em vez de segmentos retos.
function smoothPath(pts) {
  if (pts.length < 2) return ''
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

export default function FreteMercadoriaChart({ dias }) {
  const gid = useId()
  const [hoverIdx, setHoverIdx] = useState(null)
  const n = dias.length
  const rawMax = Math.max(1, ...dias.map(d => d.frete), ...dias.map(d => d.mercadoria))
  const max = niceCeil(rawMax)
  const xStep = n > 1 ? PLOT_W / (n - 1) : 0

  const pontos = dias.map((d, i) => ({
    ...d,
    x: PAD_LEFT + i * xStep,
    yFrete: BASE_Y - (d.frete / max) * PLOT_H,
    yMerc: BASE_Y - (d.mercadoria / max) * PLOT_H,
  }))

  const pontosFrete = pontos.map(p => ({ x: p.x, y: p.yFrete }))
  const pontosMerc = pontos.map(p => ({ x: p.x, y: p.yMerc }))
  const lineFrete = smoothPath(pontosFrete)
  const lineMerc = smoothPath(pontosMerc)
  const areaFrete = `${lineFrete} L${pontos[n - 1].x},${BASE_Y} L${pontos[0].x},${BASE_Y} Z`
  const areaMerc = `${lineMerc} L${pontos[n - 1].x},${BASE_Y} L${pontos[0].x},${BASE_Y} Z`

  const ultimo = pontos[n - 1]
  const totalFrete = dias.reduce((s, d) => s + d.frete, 0)
  const totalMerc = dias.reduce((s, d) => s + d.mercadoria, 0)
  const hover = hoverIdx != null ? pontos[hoverIdx] : null
  const hitW = n > 1 ? PLOT_W / n : PLOT_W
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => f * max)

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: 0 }}>Frete e mercadoria</p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Últimos 15 dias</p>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 2, background: COR_FRETE, borderRadius: 999 }} />
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>Frete</span>
            <span style={{ fontSize: 14, color: '#1e293b', fontWeight: '800' }}>{fmtCompacto(totalFrete)}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 2, background: COR_MERC, borderRadius: 999 }} />
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>Mercadoria</span>
            <span style={{ fontSize: 14, color: '#1e293b', fontWeight: '800' }}>{fmtCompacto(totalMerc)}</span>
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`${gid}-frete`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COR_FRETE} stopOpacity="0.22" />
            <stop offset="100%" stopColor={COR_FRETE} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${gid}-merc`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COR_MERC} stopOpacity="0.22" />
            <stop offset="100%" stopColor={COR_MERC} stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => {
          const y = BASE_Y - (t / max) * PLOT_H
          return (
            <g key={`tick-${i}`}>
              <line x1={PAD_LEFT} y1={y} x2={W - PAD_RIGHT} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={PAD_LEFT - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{fmtCompacto(t)}</text>
            </g>
          )
        })}

        <path d={areaMerc} fill={`url(#${gid}-merc)`} stroke="none" />
        <path d={areaFrete} fill={`url(#${gid}-frete)`} stroke="none" />

        <path d={lineMerc} fill="none" stroke={COR_MERC} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={lineFrete} fill="none" stroke={COR_FRETE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={ultimo.x} cy={ultimo.yMerc} r="4.5" fill={COR_MERC} stroke="white" strokeWidth="2" />
        <circle cx={ultimo.x} cy={ultimo.yFrete} r="4.5" fill={COR_FRETE} stroke="white" strokeWidth="2" />

        {pontos.map((p, i) => (
          i % 3 === 0 || i === n - 1 ? (
            <text key={`lbl-${i}`} x={p.x} y={H - 4} textAnchor="middle" fontSize="9" fontWeight={i === n - 1 ? '700' : '400'} fill={i === n - 1 ? '#1e293b' : '#94a3b8'}>
              {p.label}
            </text>
          ) : null
        ))}

        {hover && (
          <line x1={hover.x} y1={PAD_TOP} x2={hover.x} y2={BASE_Y} stroke="#cbd5e1" strokeWidth="1" />
        )}

        {pontos.map((p, i) => (
          <rect
            key={`hit-${i}`}
            x={p.x - hitW / 2}
            y={PAD_TOP}
            width={hitW}
            height={PLOT_H}
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
          left: `${Math.min(88, Math.max(16, (hover.x / W) * 100))}%`, top: 34,
          transform: 'translateX(-50%)',
          background: '#1e293b', color: 'white', borderRadius: 8,
          padding: '8px 10px', fontSize: 11, whiteSpace: 'nowrap', zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
        }}>
          <div style={{ fontWeight: '700', marginBottom: 4 }}>{hover.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 2, background: COR_FRETE, borderRadius: 999 }} />
            Frete <strong>{fmtBRL(hover.frete)}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 2, background: COR_MERC, borderRadius: 999 }} />
            Mercadoria <strong>{fmtBRL(hover.mercadoria)}</strong>
          </div>
        </div>
      )}
    </div>
  )
}
