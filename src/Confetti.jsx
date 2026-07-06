import { useEffect, useMemo } from 'react'

const CORES = ['#f43f5e', '#f59e0b', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6']

export default function Confetti({ pieces = 130, duration = 2800, onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(t)
  }, [duration, onDone])

  const items = useMemo(() => Array.from({ length: pieces }, (_, i) => ({
    i,
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    dur: 1.8 + Math.random() * 1.4,
    w: 6 + Math.random() * 8,
    h: 8 + Math.random() * 8,
    cor: CORES[Math.floor(Math.random() * CORES.length)],
    drift: (Math.random() * 2 - 1) * 160,
    rot: (Math.random() * 2 - 1) * 900,
    round: Math.random() > 0.55,
  })), [pieces])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 9999 }}>
      {items.map(p => (
        <div key={p.i} style={{
          position: 'absolute', top: '-24px', left: `${p.left}%`,
          width: p.w, height: p.h, background: p.cor,
          borderRadius: p.round ? '50%' : '2px',
          ['--drift']: `${p.drift}px`, ['--rot']: `${p.rot}deg`,
          animation: `confettiFall ${p.dur}s cubic-bezier(0.3,0.6,0.7,1) ${p.delay}s forwards`,
        }} />
      ))}
      <div style={{
        position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)',
        animation: 'confettiMsg 2.6s ease-out forwards', textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, lineHeight: 1 }}>🎉</div>
        <div style={{ marginTop: 8, background: 'white', color: '#16a34a', fontWeight: 800, fontSize: 18, padding: '8px 18px', borderRadius: 999, boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }}>
          Parabéns!
        </div>
      </div>
    </div>
  )
}
