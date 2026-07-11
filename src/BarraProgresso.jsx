const COR_TRACK = '#e2e8f0'

export default function BarraProgresso({ pct, cor = '#2563eb', altura = 6, mostrarLabel = true }) {
  const valor = Math.max(0, Math.min(100, Math.round(pct || 0)))
  return (
    <div>
      <div style={{ height: altura, background: COR_TRACK, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${valor}%`, height: '100%', background: cor, borderRadius: 999, transition: 'width 0.4s ease' }} />
      </div>
      {mostrarLabel && (
        <div style={{ textAlign: 'right', fontSize: 12, fontWeight: '800', color: cor, marginTop: 4 }}>
          {valor}%
        </div>
      )}
    </div>
  )
}
