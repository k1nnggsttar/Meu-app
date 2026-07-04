import { useState } from 'react'

// "1234,5" | "1.234,50" | "1234.5" -> 1234.5 (ou null se vazio/invalido)
function parseValor(s) {
  if (!s || !String(s).trim()) return null
  const n = parseFloat(String(s).replace(/\./g, '').replace(',', '.'))
  return isNaN(n) ? null : n
}

// mantém apenas digitos, ponto e virgula enquanto o usuario digita
function limparEntrada(s) {
  return s.replace(/[^\d.,]/g, '')
}

export default function FinalizarModal({ placa, salvando = false, onCancel, onConfirm }) {
  const [frete, setFrete] = useState('')
  const [mercadoria, setMercadoria] = useState('')

  const campo = {
    width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, color: '#1e293b', boxSizing: 'border-box',
  }
  const label = { display: 'block', fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 360, padding: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.18)' }}>
        <h3 style={{ fontSize: 17, fontWeight: '700', color: '#1e293b', margin: '0 0 6px' }}>Finalizar carregamento?</h3>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.4 }}>
          Confirme os valores antes de finalizar o carregamento da carreta {placa || '—'}.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>Valor de Frete (R$)</label>
            <input
              type="text" inputMode="decimal" placeholder="0,00" value={frete}
              onChange={e => setFrete(limparEntrada(e.target.value))} style={campo}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>Valor de Mercadoria (R$)</label>
            <input
              type="text" inputMode="decimal" placeholder="0,00" value={mercadoria}
              onChange={e => setMercadoria(limparEntrada(e.target.value))} style={campo}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" onClick={onCancel} disabled={salvando}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 14, fontWeight: '700', color: '#334155', cursor: salvando ? 'default' : 'pointer' }}>
            Não
          </button>
          <button type="button" disabled={salvando}
            onClick={() => onConfirm({ frete: parseValor(frete), mercadoria: parseValor(mercadoria) })}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: salvando ? '#86efac' : '#16a34a', fontSize: 14, fontWeight: '700', color: 'white', cursor: salvando ? 'default' : 'pointer' }}>
            {salvando ? 'Finalizando...' : 'Sim, finalizar'}
          </button>
        </div>
      </div>
    </div>
  )
}
