import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'
import { CONFERENTES } from './lib/conferentes'

const TH = { padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: '800', color: '#475569', letterSpacing: 0.4, background: '#f8fafc', position: 'sticky', top: 0 }

export default function ConferenteSelect({ value, onChange, placeholder = 'Selecionar conferente' }) {
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

  const sel = CONFERENTES.find(c => c.codigo === value) || null
  const q = busca.trim().toLowerCase()
  const filtrados = q
    ? CONFERENTES.filter(c => c.codigo.includes(q) || c.apelido.toLowerCase().includes(q) || c.nome.toLowerCase().includes(q) || c.unidade.toLowerCase().includes(q))
    : CONFERENTES

  const escolher = (codigo) => { onChange(codigo); setAberto(false) }

  return (
    <>
      <button type="button" onClick={() => setAberto(true)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', fontSize: 13, color: sel ? '#1e293b' : '#94a3b8', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sel ? `${sel.codigo} · ${sel.apelido} — ${sel.nome}` : placeholder}
        </span>
        <ChevronDown size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
      </button>

      {aberto && (
        <div
          onMouseDown={(e) => { if (e.target === e.currentTarget) setAberto(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
              <span style={{ fontSize: 15, fontWeight: '700', color: '#1e293b' }}>Selecionar conferente</span>
              <button type="button" onClick={() => setAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '0 16px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', background: '#f8fafc' }}>
                <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                <input ref={inputRef} placeholder="Buscar por código, apelido, nome ou unidade..." value={busca} onChange={e => setBusca(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: '#1e293b', background: 'transparent' }} />
                {busca && (
                  <button type="button" onClick={() => setBusca('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ overflowY: 'auto', borderTop: '1px solid #f1f5f9' }}>
              {filtrados.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '28px 16px', margin: 0 }}>Nenhum conferente encontrado</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH}>CÓDIGO</th>
                      <th style={TH}>UNIDADE</th>
                      <th style={TH}>APELIDO</th>
                      <th style={TH}>NOME</th>
                      <th style={{ ...TH, width: 28 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map(c => {
                      const ativo = c.codigo === value
                      return (
                        <tr key={c.codigo} onClick={() => escolher(c.codigo)} className="row-hover"
                          style={{ cursor: 'pointer', background: ativo ? '#eff6ff' : 'white', borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontSize: 12, fontWeight: '800', color: '#1d4ed8' }}>{c.codigo}</td>
                          <td style={{ padding: '10px' }}><span style={{ fontSize: 10, fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '2px 7px', borderRadius: 999 }}>{c.unidade}</span></td>
                          <td style={{ padding: '10px', fontSize: 12, fontWeight: '700', color: '#334155' }}>{c.apelido}</td>
                          <td style={{ padding: '10px', fontSize: 12, color: '#64748b' }}>{c.nome}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>{ativo && <Check size={15} color="#2563eb" />}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
