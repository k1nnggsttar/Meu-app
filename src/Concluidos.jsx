import { useCallback, useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import { CheckCircle, MapPin, Eye, Search } from 'lucide-react'
import { getNomeFilial } from "./lib/filiais"
import ConcluidoDetalhesModal from "./ConcluidoDetalhesModal"
import useIsDesktop from "./hooks/useIsDesktop"
import { usePerfil } from "./lib/perfilContext"
import { filtrarPorFilial } from "./lib/filtroFilial"
import BarraProgresso from "./BarraProgresso"

export default function Concluidos() {
  const isDesktop = useIsDesktop()
  const perfil = usePerfil()
  const [operacoes, setOperacoes] = useState([])
  const [verOp, setVerOp] = useState(null)
  const [busca, setBusca] = useState('')
  const [filtroDest, setFiltroDest] = useState('')

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from("operacoes")
      .select("*")
      .eq("status", "concluido")
      .order("created_at", { ascending: false })
    setOperacoes(filtrarPorFilial(data || [], perfil))
  }, [perfil])

  useEffect(() => {
    carregar()
  }, [carregar])

  const formatData = (iso) => {
    const d = new Date(iso)
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const destinos = [...new Set(operacoes.map(o => o.destino).filter(Boolean))].sort()
  const q = busca.trim().toLowerCase()
  const filtradas = operacoes.filter(op => {
    if (filtroDest && op.destino !== filtroDest) return false
    if (!q) return true
    return [op.placaCarreta, op.motorista, op.destino, op.origem].some(v => (v || '').toLowerCase().includes(q))
  })

  return (
    <div style={{ padding: isDesktop ? 0 : '20px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: '700', color: '#1e293b' }}>Concluídos</h2>
      <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>Operações finalizadas</p>

      {operacoes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', flex: isDesktop ? '1 1 320px' : undefined }}>
            <Search size={15} color="#94a3b8" />
            <input
              placeholder="Pesquisar placa, motorista, destino..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', flex: 1, background: 'transparent' }}
            />
          </div>
          <select
            value={filtroDest}
            onChange={e => setFiltroDest(e.target.value)}
            style={{ width: isDesktop ? 260 : '100%', flexShrink: 0, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: filtroDest ? '#334155' : '#94a3b8', background: 'white', boxSizing: 'border-box' }}
          >
            <option value="">Todos os destinatários</option>
            {destinos.map(d => (
              <option key={d} value={d}>{d} · {getNomeFilial(d)}</option>
            ))}
          </select>
        </div>
      )}

      {operacoes.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>
          Nenhuma operação concluída.
        </p>
      ) : filtradas.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>
          Nenhum resultado para o filtro.
        </p>
      ) : (
        <div style={isDesktop ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 } : undefined}>
        {filtradas.map((op) => (
          <div key={op.id || op.placaCarreta} style={{
            background: 'white', borderRadius: 16,
            padding: 16, border: '1px solid #e2e8f0', marginBottom: isDesktop ? 0 : 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <CheckCircle size={15} color="#16a34a" />
                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: 15 }}>{op.placaCarreta}</span>
                <span style={badge('#dbeafe', '#2563eb')}>CARREGAMENTO</span>
                {op.tipoFrota && (
                  <span style={badge(op.tipoFrota === 'FROTA' ? '#dcfce7' : '#fef3c7', op.tipoFrota === 'FROTA' ? '#16a34a' : '#d97706')}>
                    {op.tipoFrota.toUpperCase()}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {formatData(op.created_at)}
              </span>
            </div>

            {/* Frete e mercadoria (se existirem na tabela) */}
            {(op.frete || op.mercadoria) && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {op.frete && (
                  <span style={{ ...badge('#f0fdf4', '#16a34a'), fontSize: 11, padding: '3px 10px' }}>
                    Frete R$ {Number(op.frete).toLocaleString('pt-BR')}
                  </span>
                )}
                {op.mercadoria && (
                  <span style={{ ...badge('#eff6ff', '#2563eb'), fontSize: 11, padding: '3px 10px' }}>
                    Mercadoria R$ {Number(op.mercadoria).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            )}

            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              🚛 Motorista: {op.motorista}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
              <MapPin size={12} color="#94a3b8" />
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {op.origem ? `${op.origem} | ` : ''}{op.destino}
              </span>
            </div>

            {/* Barra 100% verde */}
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Concluído</span>
            <BarraProgresso pct={100} cor="#16a34a" />

            <button type="button" onClick={() => setVerOp(op)}
              style={{ width: '100%', marginTop: 12, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#2563eb', fontSize: 13, fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Eye size={14} /> Ver detalhes
            </button>
          </div>
        ))}
        </div>
      )}

      {verOp && <ConcluidoDetalhesModal op={verOp} onClose={() => setVerOp(null)} />}
    </div>
  )
}

const badge = (bg, color) => ({
  background: bg,
  color,
  fontSize: 9,
  fontWeight: '700',
  padding: '2px 7px',
  borderRadius: 999,
  letterSpacing: 0.3
})
