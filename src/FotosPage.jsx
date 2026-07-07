import { useEffect, useState } from 'react'
import { Search, Camera, ImageOff } from 'lucide-react'
import { supabase } from './lib/supabase'

export default function FotosPage() {
  const [operacoes, setOperacoes] = useState([])
  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    const { data } = await supabase.from('operacoes').select('*').order('created_at', { ascending: false })
    setOperacoes((data || []).filter(op => Array.isArray(op.fotos) && op.fotos.length > 0))
  }

  const termoBusca = busca.toLowerCase()
  const filtradas = operacoes.filter(op =>
    (op.placaCarreta || '').toLowerCase().includes(termoBusca) ||
    (op.motorista || '').toLowerCase().includes(termoBusca) ||
    (op.destino || '').toLowerCase().includes(termoBusca)
  )

  const totalFotos = operacoes.reduce((s, op) => s + op.fotos.length, 0)

  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: '700', color: '#1e293b' }}>Fotos</h2>
      <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 20px' }}>
        {totalFotos} foto{totalFotos !== 1 ? 's' : ''} registrada{totalFotos !== 1 ? 's' : ''}
      </p>

      {/* Busca */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'white', border: '1px solid #e2e8f0',
        borderRadius: 10, padding: '10px 14px', marginBottom: 16
      }}>
        <Search size={15} color="#94a3b8" />
        <input
          placeholder="Pesquisar placa, motorista ou destino..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', flex: 1, background: 'transparent' }}
        />
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <ImageOff size={28} color="#cbd5e1" style={{ marginBottom: 8 }} />
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
            {operacoes.length === 0 ? 'Nenhuma foto registrada ainda.' : 'Nenhum resultado encontrado.'}
          </p>
        </div>
      ) : (
        filtradas.map(op => (
          <div key={op.id} style={{
            background: 'white', borderRadius: 16,
            padding: 16, border: '1px solid #e2e8f0', marginBottom: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Camera size={15} color="#2563eb" />
              <span style={{ fontWeight: '700', color: '#1e293b', fontSize: 15 }}>
                {op.placaCarreta || op.motorista || 'Carregamento'}
              </span>
              <span style={{
                background: '#dcfce7', color: '#16a34a',
                fontSize: 10, fontWeight: '700', padding: '2px 8px',
                borderRadius: 999, marginLeft: 'auto', flexShrink: 0
              }}>
                {op.fotos.length} foto{op.fotos.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {op.fotos.map((url, i) => (
                <a key={url + i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                </a>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
