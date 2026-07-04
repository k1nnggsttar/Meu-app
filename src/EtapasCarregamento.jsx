import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, Lock, Paperclip } from 'lucide-react'
import truckImg from './assets/truck.jpg'
import OcorrenciaSelect from './OcorrenciaSelect'
import { getOcorrencia } from './lib/ocorrencias'

const TRUCK_TOTAL_M = 15
const CORES = ['#16a34a', '#2563eb', '#d97706', '#db2777', '#7c3aed', '#0891b2']
const OPCOES_METROS = Array.from({ length: TRUCK_TOTAL_M * 2 }, (_, i) => (i + 1) / 2)

// Posição do baú dentro da imagem do caminhão (% da imagem inteira)
const BAU = { left: 22.63, top: 14.56, width: 74.63, height: 45.92 }
const TRUCK_ASPECT = 625 / 1600

const THS = { padding: '6px 8px', textAlign: 'left', fontSize: 10, fontWeight: '700', color: '#64748b', borderBottom: '1px solid #e2e8f0' }

function fmtMetros(n) {
  return String(n).replace('.', ',') + ' m'
}

function novoId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `etapa-${Math.random().toString(36).slice(2)}`
}

export default function EtapasCarregamento({ pracasDisponiveis = [], onResumoChange, onEtapasChange, initialEtapas }) {
  const [etapas, setEtapas] = useState(() => Array.isArray(initialEtapas) ? initialEtapas : [])

  useEffect(() => {
    onEtapasChange?.(etapas)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapas])

  const update = (id, patch) => setEtapas(e => e.map(et => et.id === id ? { ...et, ...patch } : et))
  const remove = (id) => setEtapas(e => e.filter(et => et.id !== id))

  const addEtapa = () => {
    setEtapas(e => [...e, { id: novoId(), pracas: [], metros: 0.5, volumes: '', ocorrencias: [], fechada: false }])
  }

  const togglePraca = (id, codigo) => {
    setEtapas(e => {
      const usadaOutra = e.some(et => et.id !== id && (et.pracas || []).includes(codigo))
      return e.map(et => {
        if (et.id !== id) return et
        const tem = et.pracas.includes(codigo)
        if (!tem && usadaOutra) return et // praça já está em outra etapa — não adiciona
        return { ...et, pracas: tem ? et.pracas.filter(c => c !== codigo) : [...et.pracas, codigo] }
      })
    })
  }

  const addOcorrencia = (etapaId) => {
    setEtapas(e => e.map(et => et.id === etapaId
      ? { ...et, ocorrencias: [...(et.ocorrencias || []), { id: novoId(), nf: '', codigo: '', descricao: '', anexo: null, ssw: false, criadaEm: new Date().toISOString() }] }
      : et))
  }
  const updateOcorrencia = (etapaId, ocorrId, patch) => {
    setEtapas(e => e.map(et => et.id === etapaId
      ? { ...et, ocorrencias: (et.ocorrencias || []).map(o => o.id === ocorrId ? { ...o, ...patch } : o) }
      : et))
  }
  const removeOcorrencia = (etapaId, ocorrId) => {
    setEtapas(e => e.map(et => et.id === etapaId
      ? { ...et, ocorrencias: (et.ocorrencias || []).filter(o => o.id !== ocorrId) }
      : et))
  }
  const sswPendentes = (et) => (et.ocorrencias || []).filter(o => !o.ssw).length
  const anexoPendentes = (et) => (et.ocorrencias || []).filter(o => !o.anexo).length
  const ocorrPendentes = (et) => (et.ocorrencias || []).filter(o => !o.ssw || !o.anexo).length

  const totalMetros = etapas.reduce((s, et) => s + (Number(et.metros) || 0), 0)
  const restamM = Math.max(0, TRUCK_TOTAL_M - totalMetros)
  const pctCarga = TRUCK_TOTAL_M > 0 ? Math.min(100, Math.round((totalMetros / TRUCK_TOTAL_M) * 100)) : 0

  useEffect(() => {
    onResumoChange?.({ metros: totalMetros, pct: pctCarga })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalMetros, pctCarga])

  const etapasFechadas = etapas.filter(et => et.fechada)
  const metrosComposicao = etapasFechadas.reduce((s, et) => s + (Number(et.metros) || 0), 0)
  const volumesComposicao = etapasFechadas.reduce((s, et) => s + (Number(et.volumes) || 0), 0)
  const pctComposicao = TRUCK_TOTAL_M > 0 ? Math.min(100, Math.round((metrosComposicao / TRUCK_TOTAL_M) * 100)) : 0
  const restamComposicao = Math.max(0, TRUCK_TOTAL_M - metrosComposicao)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 13, fontWeight: '700', color: '#1d4ed8', margin: 0 }}>Etapas de carregamento</p>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Restam <strong style={{ color: '#334155' }}>{fmtMetros(restamM)}</strong></span>
      </div>

      {etapas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
          {etapas.map((et, i) => {
            if (et.fechada) {
              return (
                <div key={et.id} style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: '700', color: '#166534' }}>ETAPA {i + 1}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: '700', color: '#16a34a' }}>
                        <Lock size={10} /> FECHADA
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Edit2 size={14} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => update(et.id, { fechada: false })} />
                      <Trash2 size={14} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => remove(et.id)} />
                    </div>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: '600', color: '#64748b', margin: '0 0 6px' }}>Praças desta etapa</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {et.pracas.map(c => (
                      <span key={c} style={{ background: '#1d4ed8', color: 'white', fontSize: 11, fontWeight: '700', padding: '4px 10px', borderRadius: 999 }}>{c}</span>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 5 }}>Metros (máx {TRUCK_TOTAL_M} m)</label>
                      <div style={{ padding: '9px 12px', border: '1px solid #dcfce7', borderRadius: 6, fontSize: 13, background: 'white', color: '#334155' }}>{fmtMetros(et.metros)}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 5 }}>Volumes</label>
                      <div style={{ padding: '9px 12px', border: '1px solid #dcfce7', borderRadius: 6, fontSize: 13, background: 'white', color: '#334155' }}>{et.volumes || 0}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: '600', color: '#64748b', margin: '0 0 6px' }}>📋 Ocorrências</p>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={THS}>NF</th><th style={THS}>OCORR.</th><th style={THS}>DESCRIÇÃO</th><th style={THS}>ANX</th><th style={THS}>SSW</th>
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
                                <td style={{ padding: '6px 8px', textAlign: 'center' }}>{(o.anexo || o.anexoNome) ? '📎' : '—'}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'center' }}>{o.ssw ? <Check size={13} color="#16a34a" /> : '—'}</td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            }

            return (
              <div key={et.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: '700', color: '#1e293b' }}>ETAPA {i + 1}</span>
                  <Trash2 size={14} color="#cbd5e1" style={{ cursor: 'pointer' }} onClick={() => remove(et.id)} />
                </div>
                <p style={{ fontSize: 11, fontWeight: '600', color: '#64748b', margin: '0 0 6px' }}>Praças desta etapa</p>
                {pracasDisponiveis.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 12px' }}>Adicione praças em "Praças carregadas" acima para atribuí-las a uma etapa.</p>
                ) : (() => {
                  const usadasOutras = new Set(etapas.filter(x => x.id !== et.id).flatMap(x => x.pracas || []))
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {pracasDisponiveis.map(c => {
                        const sel = et.pracas.includes(c)
                        const bloqueada = !sel && usadasOutras.has(c)
                        return (
                          <button key={c} type="button" disabled={bloqueada}
                            onClick={() => togglePraca(et.id, c)}
                            title={bloqueada ? 'Já usada em outra etapa' : ''}
                            style={{
                              background: sel ? '#1d4ed8' : bloqueada ? '#f8fafc' : '#f1f5f9',
                              color: sel ? 'white' : bloqueada ? '#cbd5e1' : '#94a3b8',
                              fontSize: 11, fontWeight: '700', padding: '5px 12px', borderRadius: 999,
                              border: bloqueada ? '1px dashed #e2e8f0' : 'none',
                              cursor: bloqueada ? 'not-allowed' : 'pointer',
                              textDecoration: bloqueada ? 'line-through' : 'none'
                            }}>
                            {c}
                          </button>
                        )
                      })}
                    </div>
                  )
                })()}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  {(() => {
                    const usadoOutras = totalMetros - (Number(et.metros) || 0)
                    const maxDisp = Math.max(0, TRUCK_TOTAL_M - usadoOutras)
                    const opcoes = OPCOES_METROS.filter(n => n <= maxDisp + 1e-9 || n === Number(et.metros))
                    return (
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 5 }}>Metros (máx {fmtMetros(maxDisp)})</label>
                        <select value={et.metros} onChange={e => update(et.id, { metros: Number(e.target.value) })}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, background: 'white', boxSizing: 'border-box' }}>
                          {opcoes.map(n => <option key={n} value={n}>{fmtMetros(n)}</option>)}
                        </select>
                      </div>
                    )
                  })()}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 5 }}>Volumes</label>
                    <input type="number" min="0" value={et.volumes} onChange={e => update(et.id, { volumes: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                </div>
                {/* Ocorrências */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, margin: '4px 0 6px', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: 11, fontWeight: '600', color: '#64748b', margin: 0 }}>📋 Ocorrências</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {sswPendentes(et) > 0 && (
                      <span style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>{sswPendentes(et)} pendente(s) SSW</span>
                    )}
                    {anexoPendentes(et) > 0 && (
                      <span style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>{anexoPendentes(et)} sem anexo</span>
                    )}
                  </div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'auto', marginBottom: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 380 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={THS}>NF</th><th style={THS}>OCORR.</th><th style={THS}>DESCRIÇÃO</th>
                        <th style={{ ...THS, textAlign: 'center' }}>ANX</th><th style={{ ...THS, textAlign: 'center' }}>SSW</th><th style={THS}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(et.ocorrencias || []).length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 10, color: '#94a3b8' }}>Sem ocorrências</td></tr>
                      ) : (
                        et.ocorrencias.map(o => (
                          <tr key={o.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: 4, minWidth: 70 }}>
                              <input value={o.nf} onChange={e => updateOcorrencia(et.id, o.id, { nf: e.target.value })}
                                style={{ width: '100%', padding: '6px 7px', border: '1px solid #e2e8f0', borderRadius: 5, fontSize: 11, boxSizing: 'border-box' }} />
                            </td>
                            <td style={{ padding: 4, minWidth: 130 }}>
                              <OcorrenciaSelect value={o.codigo} onChange={cod => {
                                const oc = getOcorrencia(cod)
                                updateOcorrencia(et.id, o.id, { codigo: cod, descricao: oc ? oc.descricao : o.descricao })
                              }} />
                            </td>
                            <td style={{ padding: 4, minWidth: 120 }}>
                              <input value={o.descricao} onChange={e => updateOcorrencia(et.id, o.id, { descricao: e.target.value })}
                                style={{ width: '100%', padding: '6px 7px', border: '1px solid #e2e8f0', borderRadius: 5, fontSize: 11, boxSizing: 'border-box' }} />
                            </td>
                            <td style={{ padding: 4, textAlign: 'center' }}>
                              <label style={{ cursor: 'pointer', display: 'inline-flex' }} title={o.anexo ? o.anexo.name : 'Anexar'}>
                                <Paperclip size={15} color={o.anexo ? '#16a34a' : '#94a3b8'} />
                                <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                                  onChange={e => { const f = e.target.files?.[0]; if (f) updateOcorrencia(et.id, o.id, { anexo: f }) }} />
                              </label>
                            </td>
                            <td style={{ padding: 4, textAlign: 'center' }}>
                              <input type="checkbox" checked={o.ssw} onChange={e => updateOcorrencia(et.id, o.id, { ssw: e.target.checked })}
                                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#16a34a' }} />
                            </td>
                            <td style={{ padding: 4, textAlign: 'center' }}>
                              <Trash2 size={13} color="#cbd5e1" style={{ cursor: 'pointer' }} onClick={() => removeOcorrencia(et.id, o.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={() => addOcorrencia(et.id)}
                  style={{ width: '100%', padding: 8, border: '1px dashed #cbd5e1', borderRadius: 8, background: 'transparent', color: '#2563eb', fontSize: 12, fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                  <Plus size={13} /> Adicionar ocorrência
                </button>

                {(() => {
                  const semPraca = et.pracas.length === 0
                  const ssw = sswPendentes(et)
                  const anx = anexoPendentes(et)
                  const pend = ocorrPendentes(et)
                  const bloqueado = semPraca || pend > 0
                  const motivos = []
                  if (ssw > 0) motivos.push(`${ssw} SSW`)
                  if (anx > 0) motivos.push(`${anx} anexo`)
                  return (
                    <button type="button" disabled={bloqueado} onClick={() => update(et.id, { fechada: true })}
                      style={{ width: '100%', padding: 10, border: 'none', borderRadius: 8, background: bloqueado ? '#e2e8f0' : '#16a34a', color: bloqueado ? '#94a3b8' : 'white', fontSize: 13, fontWeight: '700', cursor: bloqueado ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      title={pend > 0 ? 'Marque o SSW e anexe o arquivo de cada ocorrência antes de fechar a etapa' : semPraca ? 'Selecione ao menos uma praça' : ''}>
                      <Lock size={14} /> {pend > 0 ? `Fechar etapa (${motivos.join(' + ')} pendente)` : 'Fechar etapa'}
                    </button>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}

      <button type="button" onClick={addEtapa} style={{ width: '100%', padding: 10, border: '1.5px dashed #93c5fd', borderRadius: 8, background: 'transparent', color: '#2563eb', fontSize: 13, fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
        <Plus size={14} /> Nova etapa
      </button>

      {/* Composição da carga */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: '700', color: '#1e293b', letterSpacing: 0.5 }}>COMPOSIÇÃO DA CARGA</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{fmtMetros(metrosComposicao)} / {TRUCK_TOTAL_M} m</span>
            <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: 10, fontWeight: '700', padding: '2px 7px', borderRadius: 999 }}>{pctComposicao}%</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>· {volumesComposicao} vol</span>
          </div>
        </div>
        <div style={{ padding: '12px 16px', background: '#f8fafc' }}>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 10px', textAlign: 'center' }}>Composição da carga — {TRUCK_TOTAL_M} metros</p>
          <div style={{ position: 'relative', width: '100%', paddingTop: `${TRUCK_ASPECT * 100}%` }}>
            <img src={truckImg} alt="Caminhão" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
            <div style={{
              position: 'absolute',
              left: `${BAU.left}%`, top: `${BAU.top}%`, width: `${BAU.width}%`, height: `${BAU.height}%`,
              display: 'flex', overflow: 'hidden', borderRadius: 2
            }}>
              {metrosComposicao === 0 ? (
                <div style={{ width: '100%', height: '100%', background: 'rgba(226,232,240,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: '700', background: 'rgba(255,255,255,0.8)', padding: '2px 8px', borderRadius: 4 }}>Sem carga</span>
                </div>
              ) : (
                <>
                  {etapasFechadas.filter(et => et.metros > 0).map((et, i) => (
                    <div key={et.id} style={{ width: `${(Number(et.metros) / TRUCK_TOTAL_M) * 100}%`, background: CORES[i % CORES.length], display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid white', minWidth: 2 }}>
                      <span style={{ fontSize: 9, color: 'white', fontWeight: '700', textAlign: 'center', lineHeight: 1.3, padding: 2 }}>
                        {fmtMetros(et.metros)}{et.pracas.length > 0 && <><br />{et.pracas.join('/')}</>}
                      </span>
                    </div>
                  ))}
                  {restamComposicao > 0 && (
                    <div style={{ flex: 1, background: 'rgba(226,232,240,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, color: '#64748b', fontWeight: '600', textAlign: 'center' }}>{fmtMetros(restamComposicao)} vazio</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
