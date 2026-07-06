import { X, MapPin, Lock, Check } from 'lucide-react'
import { getNomeFilial } from './lib/filiais'
import { getOcorrencia } from './lib/ocorrencias'

const THS = { padding: '6px 8px', textAlign: 'left', fontSize: 10, fontWeight: '700', color: '#64748b', borderBottom: '1px solid #e2e8f0' }

function fmtBRL(v) {
  if (v == null) return '—'
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtMetros(n) {
  return String(n).replace('.', ',') + ' m'
}

export default function ConcluidoDetalhesModal({ op, onClose }) {
  const det = op.detalhes || {}
  const etapas = det.etapas || []
  const pracas = det.pracas || []

  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 620, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 17, fontWeight: '700', color: '#1e293b', margin: 0 }}>{op.placaCarreta || 'Carregamento'}</h2>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4', color: '#16a34a', fontSize: 10, fontWeight: '700', padding: '3px 8px', borderRadius: 999 }}>
              <Check size={11} /> CONCLUÍDO
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body (somente leitura) */}
        <div style={{ padding: '18px 24px', overflowY: 'auto' }}>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 14px' }}>Somente visualização — carregamento finalizado.</p>

          {/* Rotas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {op.origem && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} color="#3b82f6" />
                <span style={{ fontSize: 12, color: '#64748b' }}>Remetente: {op.origem} · {getNomeFilial(op.origem)}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} color="#ef4444" />
              <span style={{ fontSize: 12, color: '#64748b' }}>Destinatário: {op.destino} · {getNomeFilial(op.destino)}</span>
            </div>
            {op.motorista && <span style={{ fontSize: 12, color: '#64748b' }}>🚛 Motorista: {op.motorista}</span>}
          </div>

          {/* Valores */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, fontWeight: '700', color: '#16a34a', margin: '0 0 3px', letterSpacing: 0.3 }}>FRETE</p>
              <p style={{ fontSize: 15, fontWeight: '700', color: '#1e293b', margin: 0 }}>{fmtBRL(op.frete)}</p>
            </div>
            <div style={{ background: '#eff6ff', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, fontWeight: '700', color: '#2563eb', margin: '0 0 3px', letterSpacing: 0.3 }}>MERCADORIA</p>
              <p style={{ fontSize: 15, fontWeight: '700', color: '#1e293b', margin: 0 }}>{fmtBRL(op.mercadoria)}</p>
            </div>
          </div>

          {/* Praças */}
          {pracas.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 11, fontWeight: '700', color: '#1e293b', margin: '0 0 8px' }}>Praças carregadas</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {pracas.map(c => (
                  <span key={c} style={{ background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: '700', padding: '4px 10px', borderRadius: 6 }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Etapas */}
          <p style={{ fontSize: 13, fontWeight: '700', color: '#1d4ed8', margin: '0 0 10px' }}>Etapas de carregamento</p>
          {etapas.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Nenhuma etapa registrada.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {etapas.map((et, i) => (
                <div key={et.id || i} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: '700', color: '#1e293b' }}>ETAPA {i + 1}</span>
                    {et.fechada && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: '700', color: '#16a34a' }}><Lock size={10} /> FECHADA</span>
                    )}
                  </div>
                  {(et.pracas || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {et.pracas.map(c => (
                        <span key={c} style={{ background: '#1d4ed8', color: 'white', fontSize: 11, fontWeight: '700', padding: '4px 10px', borderRadius: 999 }}>{c}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 3px' }}>Metros</p>
                      <p style={{ fontSize: 13, fontWeight: '600', color: '#334155', margin: 0 }}>{fmtMetros(et.metros)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 3px' }}>Volumes</p>
                      <p style={{ fontSize: 13, fontWeight: '600', color: '#334155', margin: 0 }}>{et.volumes || 0}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: '600', color: '#64748b', margin: '0 0 6px' }}>📋 Ocorrências</p>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={THS}>NF</th><th style={THS}>OCORR.</th><th style={THS}>DESCRIÇÃO</th><th style={{ ...THS, textAlign: 'center' }}>ANX</th><th style={{ ...THS, textAlign: 'center' }}>SSW</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(et.ocorrencias || []).length === 0 ? (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: 10, color: '#94a3b8' }}>Sem ocorrências</td></tr>
                        ) : (
                          et.ocorrencias.map(o => {
                            const oc = getOcorrencia(o.codigo)
                            return (
                              <tr key={o.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 8px', color: '#334155' }}>{o.nf || '—'}</td>
                                <td style={{ padding: '6px 8px', color: '#334155', fontWeight: '700' }}>{o.codigo || '—'}</td>
                                <td style={{ padding: '6px 8px', color: '#64748b' }}>{o.descricao || (oc ? oc.descricao : '—')}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'center' }}>{o.anexoNome ? '📎' : '—'}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'center' }}>{o.ssw ? <Check size={13} color="#16a34a" /> : '—'}</td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assinaturas / Lacre */}
          {(det.assinaturas?.encarregado || det.assinaturas?.conferente || det.lacre) && (
            <div style={{ marginTop: 18 }}>
              {det.assinaturas?.encarregado && <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px' }}>✍️ Encarregado: <strong style={{ color: '#334155' }}>{det.assinaturas.encarregado}</strong></p>}
              {det.assinaturas?.conferente && <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px' }}>✍️ Conferente: <strong style={{ color: '#334155' }}>{det.assinaturas.conferente}</strong></p>}
              {det.lacre && <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>🔒 Lacre: <strong style={{ color: '#334155' }}>{det.lacre}</strong></p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 14, fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
