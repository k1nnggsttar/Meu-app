import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import { Search, MapPin } from 'lucide-react'

export default function Pracas() {
  const [operacoes, setOperacoes] = useState([])
  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    const { data } = await supabase
      .from("operacoes")
      .select("*")
      .eq("status", "ativo")
    setOperacoes(data || [])
  }

  // Agrupa por destino (praça)
  const praças = operacoes.reduce((acc, op) => {
    const nome = op.destino || 'Sem praça'
    if (!acc[nome]) acc[nome] = []
    acc[nome].push(op)
    return acc
  }, {})

  const praçasFiltradas = Object.entries(praças).filter(([nome]) =>
    nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: '700', color: '#1e293b' }}>Praças</h2>
      <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 20px' }}>O que está sendo carregado</p>

      {/* Busca */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'white', border: '1px solid #e2e8f0',
        borderRadius: 10, padding: '10px 14px', marginBottom: 16
      }}>
        <Search size={15} color="#94a3b8" />
        <input
          placeholder="Pesquisar praça..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            border: 'none', outline: 'none', fontSize: 13,
            color: '#334155', flex: 1, background: 'transparent'
          }}
        />
      </div>

      {/* Lista */}
      {praçasFiltradas.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>
          Nenhuma praça em carregamento.
        </p>
      ) : (
        praçasFiltradas.map(([nome, ops]) => (
          <div key={nome} style={{
            background: 'white', borderRadius: 16,
            padding: 16, border: '1px solid #e2e8f0', marginBottom: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <MapPin size={15} color="#2563eb" />
              <span style={{ fontWeight: '700', color: '#1e293b', fontSize: 15 }}>{nome}</span>
              <span style={{
                background: '#dcfce7', color: '#16a34a',
                fontSize: 10, fontWeight: '700', padding: '2px 8px',
                borderRadius: 999, marginLeft: 'auto'
              }}>
                {ops.length} {ops.length === 1 ? 'caminhão' : 'caminhões'}
              </span>
            </div>

            {ops.map((op, i) => (
              <div key={i} style={{
                borderTop: '1px solid #f1f5f9',
                paddingTop: 10, marginTop: 4,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: '600', color: '#334155', margin: 0 }}>{op.placaCarreta}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Motorista: {op.motorista}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: '700', color: '#2563eb' }}>{op.progresso || 0}%</span>
                  <div style={{ width: 60, height: 4, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ width: `${op.progresso || 0}%`, height: '100%', background: '#2563eb', borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
