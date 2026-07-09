import { useState } from 'react'

const COR_FRETE = '#16a34a'
const COR_MERC = '#2563eb'
const W = 600
const H = 160
const PAD_TOP = 26
const PAD_BOTTOM = 22
const PAD_X = 12
const PLOT_W = W - PAD_X * 2
const PLOT_H = H - PAD_TOP - PAD_BOTTOM
const BASE_Y = PAD_TOP + PLOT_H

function fmtCompacto(v) {
  if (v >= 1000) return `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}K`
  return `R$ ${Math.round(v).toLocaleString('pt-BR')}`
}

function fmtBRL(v) {
  return `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function FreteMercadoriaChart({ dias }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const n = dias.length
  const max = Math.max(1, ...dias.map(d => d.frete), ...dias.map(d => d.mercadoria))
  const xStep = n > 1 ? PLOT_W / (n - 1) : 0

  const pontos = dias.map((d, i) => ({
    ...d,
    x: PAD_X + i * xStep,
    yFrete: BASE_Y - (d.frete / max) * PLOT_H,
    yMerc: BASE_Y - (d.mercadoria / max) * PLOT_H,
  }))

  const lineFrete = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.yFrete}`).join(' ')
  const lineMerc = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.yMerc}`).join(' ')
  const ultimo = pontos[n - 1]
  const totalFrete = dias.reduce((s, d) => s + d.frete, 0)
  const totalMerc = dias.reduce((s, d) => s + d.mercadoria, 0)
  const hover = hoverIdx != null ? pontos[hoverIdx] : null
  const hitW = n > 1 ? PLOT_W / n : PLOT_W

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: 0 }}>Frete e mercadoria</p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Últimos 15 dias</p>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b', fontWeight: '600' }}>
            <span style={{ width: 10, height: 2, background: COR_FRETE, borderRadius: 999 }} /> Frete · {fmtCompacto(totalFrete)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b', fontWeight: '600' }}>
            <span style={{ width: 10, height: 2, background: COR_MERC, borderRadius: 999 }} /> Mercadoria · {fmtCompacto(totalMerc)}
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block', overflow: 'visible' }}>
        <line x1={PAD_X} y1={BASE_Y} x2={W - PAD_X} y2={BASE_Y} stroke="#f1f5f9" strokeWidth="1" />

        <path d={lineFrete} fill="none" stroke={COR_FRETE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={lineMerc} fill="none" stroke={COR_MERC} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={ultimo.x} cy={ultimo.yFrete} r="4" fill={COR_FRETE} stroke="white" strokeWidth="2" />
        <circle cx={ultimo.x} cy={ultimo.yMerc} r="4" fill={COR_MERC} stroke="white" strokeWidth="2" />

        {pontos.map((p, i) => (
          i % 3 === 0 || i === n - 1 ? (
            <text key={`lbl-${i}`} x={p.x} y={H - 4} textAnchor="middle" fontSize="9" fontWeight={i === n - 1 ? '700' : '400'} fill={i === n - 1 ? '#1e293b' : '#94a3b8'}>
              {p.label}
            </text>
          ) : null
        ))}

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

        {hover && (
          <line x1={hover.x} y1={PAD_TOP} x2={hover.x} y2={BASE_Y} stroke="#cbd5e1" strokeWidth="1" />
        )}
      </svg>

      {hover && (
        <div style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${Math.min(88, Math.max(12, (hover.x / W) * 100))}%`, top: 30,
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
