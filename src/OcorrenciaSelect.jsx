import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { OCORRENCIAS } from './lib/ocorrencias'

export default function OcorrenciaSelect({ value, onChange }) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!aberto) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) { setAberto(false); setBusca('') } }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [aberto])

  const sel = OCORRENCIAS.find(o => o.codigo === value) || null
  const q = busca.trim().toLowerCase()
  const filtradas = q
    ? OCORRENCIAS.filter(o => o.codigo.includes(q) || o.descricao.toLowerCase().includes(q))
    : OCORRENCIAS

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setAberto(a => !a)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', fontSize: 12, color: sel ? '#1e293b' : '#94a3b8', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sel ? `${sel.codigo} ${sel.descricao}` : '—'}
        </span>
        <ChevronDown size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
      </button>

      {aberto && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, minWidth: 240, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.15)', zIndex: 500, overflow: 'hidden' }}>
          <div style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
            <input autoFocus placeholder="Buscar código ou descrição..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ width: '100%', padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtradas.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 14, margin: 0 }}>Nenhum resultado</p>
            ) : (
              filtradas.map(o => (
                <button key={o.codigo} type="button"
                  onClick={() => { onChange(o.codigo); setAberto(false); setBusca('') }}
                  style={{ width: '100%', display: 'flex', gap: 10, padding: '8px 12px', border: 'none', background: o.codigo === value ? '#eff6ff' : 'white', cursor: 'pointer', textAlign: 'left', fontSize: 12 }}>
                  <span style={{ fontWeight: '700', color: '#1e293b', width: 20, flexShrink: 0 }}>{o.codigo}</span>
                  <span style={{ color: '#475569' }}>{o.descricao}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
