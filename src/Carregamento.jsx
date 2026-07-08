import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import { Search, Plus } from 'lucide-react'
import CadastrarModal from "./CadastrarModal"
import OperacaoCard from "./OperacaoCard"
import useIsDesktop from "./hooks/useIsDesktop"

export default function Carregamento() {
  const isDesktop = useIsDesktop()
  const [operacoes, setOperacoes] = useState([])
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    const { data } = await supabase
      .from("operacoes")
      .select("*")
      .eq("status", "ativo")
      .order("created_at", { ascending: false })
    setOperacoes(data || [])
  }

  const filtradas = operacoes.filter(op =>
    op.placaCarreta?.toLowerCase().includes(busca.toLowerCase()) ||
    op.motorista?.toLowerCase().includes(busca.toLowerCase()) ||
    op.destino?.toLowerCase().includes(busca.toLowerCase()) ||
    op.origem?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ padding: isDesktop ? 0 : '20px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: '700', color: '#1e293b' }}>Carregamento</h2>
      <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 20px' }}>Operações em andamento</p>

      <button
        onClick={() => setModalAberto(true)}
        style={{
          width: isDesktop ? 260 : '100%', padding: 14, border: '2px dashed #93c5fd',
          borderRadius: 12, background: '#eff6ff', color: '#2563eb',
          fontSize: 14, fontWeight: '600', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, marginBottom: 14
        }}
      >
        <Plus size={17} />
        Adicionar caminhão
      </button>

      {modalAberto && (
        <CadastrarModal
          onClose={() => setModalAberto(false)}
          onSalvo={carregar}
        />
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'white', border: '1px solid #e2e8f0',
        borderRadius: 10, padding: '10px 14px', marginBottom: 16,
        maxWidth: isDesktop ? 420 : undefined,
      }}>
        <Search size={15} color="#94a3b8" />
        <input
          placeholder="Pesquisar placa, motorista, praça..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', flex: 1, background: 'transparent' }}
        />
      </div>

      {filtradas.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>
          Nenhum carregamento em andamento.
        </p>
      ) : (
        <div style={isDesktop ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 12 } : undefined}>
          {filtradas.map(op => (
            <OperacaoCard key={op.id} op={op} onAtualizar={carregar} />
          ))}
        </div>
      )}
    </div>
  )
}
