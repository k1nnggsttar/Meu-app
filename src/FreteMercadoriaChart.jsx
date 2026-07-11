import { Truck } from 'lucide-react'

const COR_FRETE = '#16a34a'
const COR_MERC = '#2563eb'
const COR_VAZIO = '#cbd5e1'
const N_CAMINHOES = 20

function fmtCompacto(v) {
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
  if (v >= 1e3) return `R$ ${(v / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`
  return `R$ ${Math.round(v).toLocaleString('pt-BR')}`
}

export default function FreteMercadoriaChart({ dias }) {
  const totalFrete = dias.reduce((s, d) => s + d.frete, 0)
  const totalMerc = dias.reduce((s, d) => s + d.mercadoria, 0)
  const total = totalFrete + totalMerc
  const pctPorCaminhao = Math.round(100 / N_CAMINHOES)

  // Cada caminhão representa uma fatia fixa do total; garante ao menos 1 caminhão
  // pra qualquer categoria com valor > 0, senão uma fatia pequena "some" do desenho.
  let nFrete = total > 0 ? Math.round((totalFrete / total) * N_CAMINHOES) : 0
  if (totalFrete > 0 && nFrete === 0) nFrete = 1
  if (totalMerc > 0 && N_CAMINHOES - nFrete === 0) nFrete = N_CAMINHOES - 1
  nFrete = Math.min(N_CAMINHOES, Math.max(0, nFrete))
  const nMerc = N_CAMINHOES - nFrete

  const caminhoes = [
    ...Array.from({ length: nFrete }, () => ({ cor: COR_FRETE, label: 'Frete' })),
    ...Array.from({ length: nMerc }, () => ({ cor: COR_MERC, label: 'Mercadoria' })),
  ]

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: 0 }}>Pictograma de caminhões</p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
          {total > 0
            ? `Cada caminhão ≈ ${pctPorCaminhao}% do total · Últimos 15 dias`
            : 'Sem movimentação nos últimos 15 dias'}
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        {caminhoes.map((c, i) => (
          <Truck
            key={i}
            className="pictograma-icon"
            size={26}
            strokeWidth={2}
            color={total > 0 ? c.cor : COR_VAZIO}
          >
            <title>{`${c.label} · ${pctPorCaminhao}% do total`}</title>
          </Truck>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: COR_FRETE, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>Frete</span>
          <span style={{ fontSize: 14, color: '#1e293b', fontWeight: '800' }}>{fmtCompacto(totalFrete)}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: COR_MERC, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>Mercadoria</span>
          <span style={{ fontSize: 14, color: '#1e293b', fontWeight: '800' }}>{fmtCompacto(totalMerc)}</span>
        </span>
      </div>
    </div>
  )
}
