import { X } from 'lucide-react'

// Modal genérico de ficha (somente leitura).
// props: titulo, subtitulo, badge {label, cor, bg}, icone (elemento), campos [{label, valor}], onClose
export default function DetalheModal({ titulo, subtitulo, badge, icone, campos = [], onClose }) {
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 420, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
          {icone && (
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {icone}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titulo}</p>
            {subtitulo && <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{subtitulo}</p>}
          </div>
          {badge && (
            <span style={{ fontSize: 10, fontWeight: '700', padding: '3px 9px', borderRadius: 999, background: badge.bg, color: badge.cor, flexShrink: 0 }}>{badge.label}</span>
          )}
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex', flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Campos */}
        <div style={{ overflowY: 'auto', padding: '8px 20px 16px' }}>
          {campos.filter(c => c && c.valor !== '' && c.valor != null).map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: '1px solid #f5f7fa' }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600', flexShrink: 0 }}>{c.label}</span>
              <span style={{ fontSize: 13, color: '#1e293b', fontWeight: '600', textAlign: 'right' }}>{c.valor}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{ width: '100%', padding: 11, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 14, fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
