import { useEffect, useState } from 'react'
import { Search, Users, Truck, ChevronRight, Clock } from 'lucide-react'
import { supabase } from './lib/supabase'
import { getNomeFilial } from './lib/filiais'
import { carregarMotoristas, isMotoristaAtivo } from './lib/motoristas'
import { carregarVeiculos } from './lib/veiculos'
import DetalheModal from './DetalheModal'
import useIsDesktop from './hooks/useIsDesktop'

function fmtHora(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const DIACRIT = new RegExp('[\\u0300-\\u036f]', 'g')
function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(DIACRIT, '')
}

function fmtData(iso) {
  const d = new Date(iso)
  const hoje = new Date()
  const isHoje = d.toDateString() === hoje.toDateString()
  if (isHoje) return `Hoje, ${fmtHora(iso)}`
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${fmtHora(iso)}`
}

export default function Cadastros() {
  const isDesktop = useIsDesktop()
  const [operacoes, setOperacoes] = useState([])
  const [motoristas, setMotoristas] = useState([])
  const [veiculos, setVeiculos] = useState([])
  const [busca, setBusca] = useState('')
  const [secao, setSecao] = useState(null) // null | 'motoristas' | 'veiculos'
  const [selBusca, setSelBusca] = useState(null) // { tipo: 'motorista'|'veiculo', dado }

  useEffect(() => {
    supabase.from('operacoes').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setOperacoes(data || [])
    })
    carregarMotoristas().then(setMotoristas)
    carregarVeiculos().then(setVeiculos)
  }, [])

  const motoristasAtivosPlan = motoristas.filter(isMotoristaAtivo)
  const veiculosCavalo = veiculos.filter(v => String(v.tipo).toUpperCase().includes('CAVALO'))

  const totalCadastros = motoristas.length + veiculos.length

  // Busca geral — motoristas, veículos e operações
  const q = norm(busca.trim())
  const resultadosMotoristas = q
    ? motoristas.filter(m => norm(m.matricula).includes(q) || norm(m.nome).includes(q)).slice(0, 5)
    : []
  const resultadosVeiculos = q
    ? veiculos.filter(v => norm(v.placa).includes(q) || norm(v.modelo).includes(q) || norm(v.marca).includes(q)).slice(0, 5)
    : []
  const resultadosBusca = q
    ? operacoes.filter(op =>
        norm(op.motorista).includes(q) ||
        norm(op.aj1).includes(q) ||
        norm(op.aj2).includes(q) ||
        norm(op.aj3).includes(q) ||
        norm(op.placaCarreta).includes(q) ||
        norm(op.destino).includes(q)
      ).slice(0, 5)
    : []
  const temResultados = resultadosMotoristas.length > 0 || resultadosVeiculos.length > 0 || resultadosBusca.length > 0

  if (secao === 'motoristas') {
    return <SubMotoristas motoristas={motoristas} onVoltar={() => setSecao(null)} isDesktop={isDesktop} />
  }

  if (secao === 'veiculos') {
    return <SubVeiculos veiculos={veiculos} onVoltar={() => setSecao(null)} isDesktop={isDesktop} />
  }

  return (
    <div style={{ padding: isDesktop ? 0 : '20px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: '700', color: '#1e293b' }}>Cadastro</h2>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 16px' }}>Gerencie os cadastros da frota</p>

      {/* Busca */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'white', border: '1px solid #e2e8f0',
        borderRadius: 10, padding: '10px 14px', marginBottom: 16
      }}>
        <Search size={15} color="#94a3b8" />
        <input
          placeholder="Buscar motorista ou veículo"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', flex: 1, background: 'transparent' }}
        />
      </div>

      {/* Resultados da busca */}
      {busca && (
        <div style={{ marginBottom: 16 }}>
          {!temResultados ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>Nenhum resultado encontrado.</p>
          ) : (
            <>
              {resultadosMotoristas.length > 0 && (
                <>
                  <p style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.4, margin: '0 0 8px' }}>MOTORISTAS</p>
                  {resultadosMotoristas.map(m => {
                    const ativo = isMotoristaAtivo(m)
                    return (
                      <div key={m.matricula + m.nome} className="card-hover" onClick={() => setSelBusca({ tipo: 'motorista', dado: m })} style={{
                        background: 'white', borderRadius: 12, padding: '12px 14px',
                        marginBottom: 8, border: '1px solid #e2e8f0', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: '0 0 2px' }}>
                            <span style={{ color: '#1d4ed8' }}>{m.matricula}</span> · {m.nome}
                          </p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{m.filial}{m.cargo ? ` · ${m.cargo}` : ''}</p>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: '700', padding: '3px 8px', borderRadius: 999, flexShrink: 0, background: ativo ? '#dcfce7' : '#f1f5f9', color: ativo ? '#16a34a' : '#64748b' }}>
                          {ativo ? 'TRABALHANDO' : 'INATIVO'}
                        </span>
                      </div>
                    )
                  })}
                </>
              )}

              {resultadosVeiculos.length > 0 && (
                <>
                  <p style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.4, margin: '12px 0 8px' }}>VEÍCULOS</p>
                  {resultadosVeiculos.map((v, i) => (
                    <div key={v.placa + i} className="card-hover" onClick={() => setSelBusca({ tipo: 'veiculo', dado: v })} style={{
                      background: 'white', borderRadius: 12, padding: '12px 14px',
                      marginBottom: 8, border: '1px solid #e2e8f0', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: '0 0 2px' }}>{v.placa}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{[v.marca, v.modelo].filter(Boolean).join(' ')}{v.filial ? ` · ${v.filial}` : ''}</p>
                      </div>
                      {v.tipo && <span style={{ fontSize: 10, fontWeight: '700', padding: '3px 8px', borderRadius: 999, background: '#fff7ed', color: '#ea580c', flexShrink: 0 }}>{v.tipo.toUpperCase()}</span>}
                    </div>
                  ))}
                </>
              )}

              {resultadosBusca.length > 0 && (
                <>
                  <p style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.4, margin: '12px 0 8px' }}>CARREGAMENTOS</p>
                  {resultadosBusca.map(op => (
                    <div key={op.id} className="card-hover" style={{
                      background: 'white', borderRadius: 12, padding: '12px 14px',
                      marginBottom: 8, border: '1px solid #e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: '0 0 2px' }}>
                          {op.placaCarreta || '—'} {op.motorista ? `· ${op.motorista}` : ''}
                        </p>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                          {op.destino ? getNomeFilial(op.destino) : '—'} · {fmtData(op.created_at)}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: '700', padding: '3px 8px', borderRadius: 999,
                        background: op.status === 'ativo' ? '#dcfce7' : '#f1f5f9',
                        color: op.status === 'ativo' ? '#16a34a' : '#64748b'
                      }}>
                        {op.status === 'ativo' ? 'ATIVO' : 'CONCLUÍDO'}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {selBusca?.tipo === 'motorista' && (
        <DetalheModal
          titulo={selBusca.dado.nome}
          subtitulo={`Matrícula ${selBusca.dado.matricula}`}
          badge={isMotoristaAtivo(selBusca.dado)
            ? { label: 'TRABALHANDO', cor: '#16a34a', bg: '#dcfce7' }
            : { label: (selBusca.dado.situacao || 'INATIVO').replace(/^\d+\s*-\s*/, '').toUpperCase(), cor: '#64748b', bg: '#f1f5f9' }}
          icone={<Users size={22} color="#2563eb" />}
          campos={[
            { label: 'Matrícula', valor: selBusca.dado.matricula },
            { label: 'Cargo', valor: selBusca.dado.cargo },
            { label: 'Situação', valor: selBusca.dado.situacao },
            { label: 'Filial', valor: selBusca.dado.filial },
            { label: 'Tipo', valor: selBusca.dado.tipo },
            { label: 'Admissão', valor: selBusca.dado.admissao },
            { label: 'Data de treinamento', valor: selBusca.dado.dataTreinamento },
            { label: 'Manual do motorista', valor: selBusca.dado.manual },
          ]}
          onClose={() => setSelBusca(null)}
        />
      )}

      {selBusca?.tipo === 'veiculo' && (
        <DetalheModal
          titulo={selBusca.dado.placa}
          subtitulo={[selBusca.dado.marca, selBusca.dado.modelo].filter(Boolean).join(' ')}
          badge={selBusca.dado.tipo ? { label: selBusca.dado.tipo.toUpperCase(), cor: '#ea580c', bg: '#fff7ed' } : null}
          icone={<Truck size={22} color="#ea580c" />}
          campos={[
            { label: 'Marca', valor: selBusca.dado.marca },
            { label: 'Modelo', valor: selBusca.dado.modelo },
            { label: 'Tipo', valor: selBusca.dado.tipo },
            { label: 'Ano modelo', valor: selBusca.dado.ano },
            { label: 'Filial', valor: selBusca.dado.filial },
            { label: 'Farma', valor: selBusca.dado.farma },
            { label: 'Equip. medição', valor: selBusca.dado.eqMedicao },
            { label: 'Equip. resfriamento', valor: selBusca.dado.eqResfriamento },
          ]}
          onClose={() => setSelBusca(null)}
        />
      )}

      {!busca && (
        <>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div className="card-hover" style={{
              flex: 1, background: 'white', borderRadius: 14, padding: '14px 16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.07)'
            }}>
              <p style={{ fontSize: 28, fontWeight: '800', color: '#1e293b', margin: '0 0 2px', lineHeight: 1 }}>
                {totalCadastros}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Total de cadastros</p>
              <p style={{ fontSize: 10, color: '#cbd5e1', margin: '2px 0 0' }}>{motoristas.length} motoristas · {veiculos.length} veículos</p>
            </div>
            <div className="card-hover" style={{
              flex: 1, background: 'white', borderRadius: 14, padding: '14px 16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.07)'
            }}>
              <p style={{ fontSize: 28, fontWeight: '800', color: '#16a34a', margin: '0 0 2px', lineHeight: 1 }}>
                {motoristasAtivosPlan.length}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Motoristas trabalhando</p>
            </div>
          </div>

          <div style={isDesktop ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 } : undefined}>
          {/* Card Motoristas */}
          <button
            className="card-hover"
            onClick={() => setSecao('motoristas')}
            style={{
              width: '100%', background: 'white', borderRadius: 16, padding: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer',
              textAlign: 'left', marginBottom: isDesktop ? 0 : 10, display: 'block'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, background: '#eff6ff', borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Users size={20} color="#2563eb" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', margin: '0 0 2px' }}>Motoristas</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Gerencia os motoristas da Frota</p>
                </div>
              </div>
              <ChevronRight size={18} color="#cbd5e1" />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill cor="#2563eb" label={`${motoristas.length} cadastrados`} />
              <StatPill cor="#16a34a" label={`${motoristasAtivosPlan.length} trabalhando`} />
            </div>
          </button>

          {/* Card Veículos */}
          <button
            className="card-hover"
            onClick={() => setSecao('veiculos')}
            style={{
              width: '100%', background: 'white', borderRadius: 16, padding: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer',
              textAlign: 'left', marginBottom: isDesktop ? 0 : 16, display: 'block'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, background: '#fff7ed', borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Truck size={20} color="#ea580c" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', margin: '0 0 2px' }}>Veículos</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Gerência de veículos da frota</p>
                </div>
              </div>
              <ChevronRight size={18} color="#cbd5e1" />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill cor="#2563eb" label={`${veiculos.length} cadastrados`} />
              <StatPill cor="#ea580c" label={`${veiculosCavalo.length} cavalos`} />
            </div>
          </button>
          </div>

          {/* Atividade recente */}
          <div className="card-hover" style={{
            background: 'white', borderRadius: 16, padding: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.07)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Clock size={14} color="#64748b" />
              <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: 0 }}>Atividade recente</p>
            </div>

            {operacoes.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '12px 0 4px' }}>
                Nenhuma atividade registrada.
              </p>
            ) : (
              operacoes.slice(0, 4).map(op => (
                <div key={op.id} className="row-hover" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 4px', borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: op.status === 'ativo' ? '#eff6ff' : '#f0fdf4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Truck size={15} color={op.status === 'ativo' ? '#2563eb' : '#16a34a'} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: '600', color: '#1e293b', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {op.placaCarreta || op.motorista || 'Carregamento'}
                      </p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {op.origem ? `${getNomeFilial(op.origem)} → ` : ''}{op.destino ? getNomeFilial(op.destino) : '—'}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>{fmtData(op.created_at)}</p>
                    <span style={{
                      fontSize: 10, fontWeight: '700', padding: '2px 7px', borderRadius: 999,
                      background: op.status === 'ativo' ? '#dbeafe' : '#dcfce7',
                      color: op.status === 'ativo' ? '#2563eb' : '#16a34a'
                    }}>
                      {op.status === 'ativo' ? 'ATIVO' : 'CONCLUÍDO'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatPill({ cor, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#475569', fontWeight: '500' }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: cor, flexShrink: 0 }} />
      {label}
    </span>
  )
}

function SubMotoristas({ motoristas, onVoltar, isDesktop }) {
  const [busca, setBusca] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [sel, setSel] = useState(null)
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
  const filiais = [...new Set(motoristas.map(m => m.filial).filter(Boolean))].sort()
  const q = norm(busca.trim())
  const filtrados = motoristas.filter(m => {
    if (filtroFilial && m.filial !== filtroFilial) return false
    if (!q) return true
    return norm(m.matricula).includes(q) || norm(m.nome).includes(q)
  })

  return (
    <div style={{ padding: isDesktop ? 0 : '20px 16px' }}>
      <button onClick={onVoltar} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 13, fontWeight: '600', cursor: 'pointer', padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Voltar
      </button>
      <h2 style={{ fontSize: 22, fontWeight: '700', color: '#1e293b' }}>Motoristas</h2>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 16px' }}>{motoristas.length} cadastrado{motoristas.length !== 1 ? 's' : ''} · direto da planilha</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
          <Search size={15} color="#94a3b8" />
          <input
            placeholder="Buscar matrícula ou nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', flex: 1, background: 'transparent' }}
          />
        </div>
        <select value={filtroFilial} onChange={e => setFiltroFilial(e.target.value)}
          style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 10px', fontSize: 13, color: filtroFilial ? '#334155' : '#94a3b8', background: 'white' }}>
          <option value="">Filial</option>
          {filiais.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {motoristas.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>Não foi possível carregar a planilha de motoristas.</p>
      ) : filtrados.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>Nenhum motorista encontrado.</p>
      ) : (
        <div style={isDesktop ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 } : undefined}>
        {filtrados.map(m => {
          const ativo = isMotoristaAtivo(m)
          return (
            <div key={m.matricula + m.nome} className="card-hover" onClick={() => setSel(m)} style={{
              background: 'white', borderRadius: 12, padding: '12px 16px',
              marginBottom: isDesktop ? 0 : 8, border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 999, background: ativo ? '#eff6ff' : '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontSize: 15, fontWeight: '700', color: ativo ? '#2563eb' : '#94a3b8'
              }}>
                {(m.nome || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: '600', color: '#1e293b', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#1d4ed8', fontWeight: '800' }}>{m.matricula}</span> · {m.nome}
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                  {m.filial ? `${m.filial} · ` : ''}{m.cargo || '—'}
                </p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: '700', padding: '3px 8px', borderRadius: 999, flexShrink: 0,
                background: ativo ? '#dcfce7' : '#f1f5f9',
                color: ativo ? '#16a34a' : '#64748b'
              }}>
                {ativo ? 'TRABALHANDO' : (m.situacao ? m.situacao.replace(/^\d+\s*-\s*/, '').toUpperCase() : 'INATIVO')}
              </span>
            </div>
          )
        })}
        </div>
      )}

      {sel && (
        <DetalheModal
          titulo={sel.nome}
          subtitulo={`Matrícula ${sel.matricula}`}
          badge={isMotoristaAtivo(sel)
            ? { label: 'TRABALHANDO', cor: '#16a34a', bg: '#dcfce7' }
            : { label: (sel.situacao || 'INATIVO').replace(/^\d+\s*-\s*/, '').toUpperCase(), cor: '#64748b', bg: '#f1f5f9' }}
          icone={<Users size={22} color="#2563eb" />}
          campos={[
            { label: 'Matrícula', valor: sel.matricula },
            { label: 'Cargo', valor: sel.cargo },
            { label: 'Situação', valor: sel.situacao },
            { label: 'Filial', valor: sel.filial },
            { label: 'Tipo', valor: sel.tipo },
            { label: 'Admissão', valor: sel.admissao },
            { label: 'Data de treinamento', valor: sel.dataTreinamento },
            { label: 'Manual do motorista', valor: sel.manual },
          ]}
          onClose={() => setSel(null)}
        />
      )}
    </div>
  )
}

function SubVeiculos({ veiculos, onVoltar, isDesktop }) {
  const [busca, setBusca] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [sel, setSel] = useState(null)
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
  const filiais = [...new Set(veiculos.map(v => v.filial).filter(Boolean))].sort()
  const q = norm(busca.trim())
  const filtrados = veiculos.filter(v => {
    if (filtroFilial && v.filial !== filtroFilial) return false
    if (!q) return true
    return norm(v.placa).includes(q) || norm(v.modelo).includes(q) || norm(v.marca).includes(q)
  })

  return (
    <div style={{ padding: isDesktop ? 0 : '20px 16px' }}>
      <button onClick={onVoltar} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 13, fontWeight: '600', cursor: 'pointer', padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Voltar
      </button>
      <h2 style={{ fontSize: 22, fontWeight: '700', color: '#1e293b' }}>Veículos</h2>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 16px' }}>{veiculos.length} cadastrado{veiculos.length !== 1 ? 's' : ''} · direto da planilha</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
          <Search size={15} color="#94a3b8" />
          <input
            placeholder="Buscar placa, modelo ou marca..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', flex: 1, background: 'transparent' }}
          />
        </div>
        <select value={filtroFilial} onChange={e => setFiltroFilial(e.target.value)}
          style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 10px', fontSize: 13, color: filtroFilial ? '#334155' : '#94a3b8', background: 'white' }}>
          <option value="">Filial</option>
          {filiais.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {veiculos.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>Não foi possível carregar a planilha de veículos.</p>
      ) : filtrados.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>Nenhum veículo encontrado.</p>
      ) : (
        <div style={isDesktop ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 } : undefined}>
        {filtrados.map((v, i) => (
          <div key={v.placa + i} className="card-hover" onClick={() => setSel(v)} style={{
            background: 'white', borderRadius: 12, padding: '12px 16px',
            marginBottom: isDesktop ? 0 : 8, border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: '#fff7ed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Truck size={17} color="#ea580c" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: '0 0 2px' }}>{v.placa}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {[v.marca, v.modelo].filter(Boolean).join(' ')}{v.ano ? ` · ${v.ano}` : ''}{v.filial ? ` · ${v.filial}` : ''}
              </p>
            </div>
            {v.tipo && (
              <span style={{ fontSize: 10, fontWeight: '700', padding: '3px 8px', borderRadius: 999, background: '#fff7ed', color: '#ea580c', flexShrink: 0 }}>
                {v.tipo.toUpperCase()}
              </span>
            )}
          </div>
        ))}
        </div>
      )}

      {sel && (
        <DetalheModal
          titulo={sel.placa}
          subtitulo={[sel.marca, sel.modelo].filter(Boolean).join(' ')}
          badge={sel.tipo ? { label: sel.tipo.toUpperCase(), cor: '#ea580c', bg: '#fff7ed' } : null}
          icone={<Truck size={22} color="#ea580c" />}
          campos={[
            { label: 'Marca', valor: sel.marca },
            { label: 'Modelo', valor: sel.modelo },
            { label: 'Tipo', valor: sel.tipo },
            { label: 'Ano modelo', valor: sel.ano },
            { label: 'Filial', valor: sel.filial },
            { label: 'Farma', valor: sel.farma },
            { label: 'Equip. medição', valor: sel.eqMedicao },
            { label: 'Equip. resfriamento', valor: sel.eqResfriamento },
          ]}
          onClose={() => setSel(null)}
        />
      )}
    </div>
  )
}
