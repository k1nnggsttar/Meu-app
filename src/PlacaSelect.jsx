import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'
import { carregarVeiculos } from './lib/veiculos'

const TH = { padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: '800', color: '#475569', letterSpacing: 0.4, background: '#f8fafc', position: 'sticky', top: 0 }
const norm = (s) => String(s || '').toUpperCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')

// tipos: lista de TIPO aceitos (ex.: ['CARRETA'] ou ['CAVALO','¾'])
export default function PlacaSelect({ value, onChange, tipos, placeholder = 'Selecionar placa' }) {
  const [aberto, setAberto] = useState(false)
  const [lista, setLista] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!aberto) return
    setBusca('')
    setFiltroFilial('')
    setCarregando(true)
    carregarVeiculos().then(vs => {
      const tiposNorm = tipos.map(norm)
      setLista(vs.filter(v => tiposNorm.includes(norm(v.tipo))))
      setCarregando(false)
    })
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    const onKey = (e) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey) }
  }, [aberto])

  const filiais = [...new Set(lista.map(v => v.filial).filter(Boolean))].sort()
  const q = norm(busca.trim())
  const filtrados = lista.filter(v => {
    if (filtroFilial && v.filial !== filtroFilial) return false
    if (!q) return true
    return norm(v.placa).includes(q) || norm(v.modelo).includes(q) || norm(v.marca).includes(q)
  })

  const selecionado = value ? lista.find(v => v.placa === value) : null
  const escolher = (v) => { onChange(v.placa); setAberto(false) }

  return (
    <>
      <button type="button" onClick={() => setAberto(true)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', fontSize: 13, color: value ? '#1e293b' : '#94a3b8', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value ? (selecionado ? `${selecionado.placa} · ${[selecionado.marca, selecionado.modelo].filter(Boolean).join(' ')}` : value) : placeholder}
        </span>
        <ChevronDown size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
      </button>

      {aberto && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setAberto(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
              <span style={{ fontSize: 15, fontWeight: '700', color: '#1e293b' }}>{placeholder}</span>
              <button type="button" onClick={() => setAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '0 16px 10px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', background: '#f8fafc' }}>
                <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                <input ref={inputRef} placeholder="Buscar placa, modelo ou marca..." value={busca} onChange={e => setBusca(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: '#1e293b', background: 'transparent' }} />
                {busca && <button type="button" onClick={() => setBusca('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}><X size={16} /></button>}
              </div>
              <select value={filtroFilial} onChange={e => setFiltroFilial(e.target.value)}
                style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 8px', fontSize: 13, color: filtroFilial ? '#1e293b' : '#94a3b8', background: 'white' }}>
                <option value="">Filial</option>
                {filiais.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div style={{ overflowY: 'auto', borderTop: '1px solid #f1f5f9' }}>
              {carregando ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '28px 16px', margin: 0 }}>Carregando veículos...</p>
              ) : filtrados.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '28px 16px', margin: 0 }}>
                  {lista.length === 0 ? 'Não foi possível carregar a planilha.' : 'Nenhum veículo encontrado'}
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH}>PLACA</th>
                      <th style={TH}>MARCA/MODELO</th>
                      <th style={TH}>FILIAL</th>
                      <th style={TH}>TIPO</th>
                      <th style={{ ...TH, width: 28 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((v, i) => {
                      const ativo = value === v.placa
                      return (
                        <tr key={v.placa + i} onClick={() => escolher(v)} className="row-hover"
                          style={{ cursor: 'pointer', background: ativo ? '#eff6ff' : 'white', borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontSize: 12, fontWeight: '800', color: '#1d4ed8' }}>{v.placa}</td>
                          <td style={{ padding: '10px', fontSize: 12, color: '#334155' }}>{[v.marca, v.modelo].filter(Boolean).join(' ')}</td>
                          <td style={{ padding: '10px' }}><span style={{ fontSize: 10, fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '2px 7px', borderRadius: 999 }}>{v.filial}</span></td>
                          <td style={{ padding: '10px', fontSize: 11, color: '#64748b' }}>{v.tipo}</td>
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
