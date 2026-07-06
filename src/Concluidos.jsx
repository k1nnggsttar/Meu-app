import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import { CheckCircle, MapPin, Eye } from 'lucide-react'
import ConcluidoDetalhesModal from "./ConcluidoDetalhesModal"

export default function Concluidos() {
  const [operacoes, setOperacoes] = useState([])
  const [verOp, setVerOp] = useState(null)

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    const { data } = await supabase
      .from("operacoes")
      .select("*")
      .eq("status", "concluido")
      .order("created_at", { ascending: false })
    setOperacoes(data || [])
  }

  const formatData = (iso) => {
    const d = new Date(iso)
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: '700', color: '#1e293b' }}>Concluídos</h2>
      <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 20px' }}>Operações finalizadas</p>

      {operacoes.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>
          Nenhuma operação concluída.
        </p>
      ) : (
        operacoes.map((op) => (
          <div key={op.id || op.placaCarreta} style={{
            background: 'white', borderRadius: 16,
            padding: 16, border: '1px solid #e2e8f0', marginBottom: 10
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Concluído</span>
              <span style={{ fontSize: 11, fontWeight: '700', color: '#16a34a' }}>100%</span>
            </div>
            <div style={{ height: 4, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: '#16a34a', borderRadius: 999 }} />
            </div>

            <button type="button" onClick={() => setVerOp(op)}
              style={{ width: '100%', marginTop: 12, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#2563eb', fontSize: 13, fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Eye size={14} /> Ver detalhes
            </button>
          </div>
        ))
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
