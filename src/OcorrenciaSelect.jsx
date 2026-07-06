import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'
import { OCORRENCIAS } from './lib/ocorrencias'

export default function OcorrenciaSelect({ value, onChange }) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!aberto) return
    setBusca('')
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    const onKey = (e) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey) }
  }, [aberto])

  const sel = OCORRENCIAS.find(o => o.codigo === value) || null
  const q = busca.trim().toLowerCase()
  const filtradas = q
    ? OCORRENCIAS.filter(o => o.codigo.includes(q) || o.descricao.toLowerCase().includes(q))
    : OCORRENCIAS

  const escolher = (codigo) => { onChange(codigo); setAberto(false) }

  return (
    <>
      <button type="button" onClick={() => setAberto(true)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', fontSize: 12, color: sel ? '#1e293b' : '#94a3b8', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sel ? `${sel.codigo} ${sel.descricao}` : 'Selecionar ocorrência'}
        </span>
        <ChevronDown size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
      </button>

      {aberto && (
        <div
          onMouseDown={(e) => { if (e.target === e.currentTarget) setAberto(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 440, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
              <span style={{ fontSize: 15, fontWeight: '700', color: '#1e293b' }}>Selecionar ocorrência</span>
              <button type="button" onClick={() => setAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            {/* Busca */}
            <div style={{ padding: '0 16px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', background: '#f8fafc' }}>
                <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                <input ref={inputRef} placeholder="Buscar por código ou descrição..." value={busca} onChange={e => setBusca(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: '#1e293b', background: 'transparent' }} />
                {busca && (
                  <button type="button" onClick={() => setBusca('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Lista */}
            <div style={{ overflowY: 'auto', borderTop: '1px solid #f1f5f9' }}>
              {filtradas.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '28px 16px', margin: 0 }}>Nenhuma ocorrência encontrada</p>
              ) : (
                filtradas.map(o => {
                  const ativo = o.codigo === value
                  return (
                    <button key={o.codigo} type="button" onClick={() => escolher(o.codigo)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: 'none', borderBottom: '1px solid #f8fafc', background: ativo ? '#eff6ff' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ fontWeight: '800', color: '#1d4ed8', fontSize: 13, width: 26, flexShrink: 0 }}>{o.codigo}</span>
                      <span style={{ color: '#334155', fontSize: 13, flex: 1 }}>{o.descricao}</span>
                      {ativo && <Check size={16} color="#2563eb" style={{ flexShrink: 0 }} />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
