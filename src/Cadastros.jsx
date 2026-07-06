import { useEffect, useState } from 'react'
import { Search, Users, Truck, ChevronRight, Clock, Download, Check } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from './lib/supabase'
import { getNomeFilial } from './lib/filiais'
import { carregarMotoristas, isMotoristaAtivo } from './lib/motoristas'

function fmtHora(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function fmtData(iso) {
  const d = new Date(iso)
  const hoje = new Date()
  const isHoje = d.toDateString() === hoje.toDateString()
  if (isHoje) return `Hoje, ${fmtHora(iso)}`
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${fmtHora(iso)}`
}

export default function Cadastros() {
  const [operacoes, setOperacoes] = useState([])
  const [motoristas, setMotoristas] = useState([])
  const [busca, setBusca] = useState('')
  const [secao, setSecao] = useState(null) // null | 'motoristas' | 'veiculos'

  useEffect(() => {
    supabase.from('operacoes').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setOperacoes(data || [])
    })
    carregarMotoristas().then(setMotoristas)
  }, [])

  const motoristasAtivosPlan = motoristas.filter(isMotoristaAtivo)

  const hoje = new Date().toDateString()

  const ativas = operacoes.filter(op => op.status === 'ativo')
  const concluidasHoje = operacoes.filter(op =>
    op.status === 'concluido' && new Date(op.created_at).toDateString() === hoje
  )
  const ativasHoje = operacoes.filter(op => new Date(op.created_at).toDateString() === hoje)

  // Motoristas únicos
  const motoristasSet = new Set()
  operacoes.forEach(op => {
    if (op.motorista) motoristasSet.add(op.motorista.trim().toLowerCase())
    if (op.aj1) motoristasSet.add(op.aj1.trim().toLowerCase())
    if (op.aj2) motoristasSet.add(op.aj2.trim().toLowerCase())
    if (op.aj3) motoristasSet.add(op.aj3.trim().toLowerCase())
  })

  const motoristasAtivos = new Set()
  ativas.forEach(op => {
    if (op.motorista) motoristasAtivos.add(op.motorista.trim().toLowerCase())
    if (op.aj1) motoristasAtivos.add(op.aj1.trim().toLowerCase())
    if (op.aj2) motoristasAtivos.add(op.aj2.trim().toLowerCase())
    if (op.aj3) motoristasAtivos.add(op.aj3.trim().toLowerCase())
  })

  const motoristasEmEspera = [...motoristasSet].filter(m => !motoristasAtivos.has(m))
  const semMotorista = ativas.filter(op => !op.motorista)

  // Veículos únicos
  const veiculosSet = new Set(operacoes.map(op => op.placaCarreta).filter(Boolean))
  const veiculosAtivos = new Set(ativas.map(op => op.placaCarreta).filter(Boolean))
  const veiculosParados = [...veiculosSet].filter(v => !veiculosAtivos.has(v))

  const totalCadastros = operacoes.length

  // Busca geral
  const termoBusca = busca.toLowerCase()
  const resultadosBusca = termoBusca
    ? operacoes.filter(op =>
        op.motorista?.toLowerCase().includes(termoBusca) ||
        op.aj1?.toLowerCase().includes(termoBusca) ||
        op.aj2?.toLowerCase().includes(termoBusca) ||
        op.aj3?.toLowerCase().includes(termoBusca) ||
        op.placaCarreta?.toLowerCase().includes(termoBusca) ||
        op.destino?.toLowerCase().includes(termoBusca)
      )
    : []

  // Lista de motoristas para sub-tela
  const listaMotoristasNomes = [...new Set(
    operacoes.flatMap(op =>
      [op.motorista, op.aj1, op.aj2, op.aj3].filter(Boolean).map(n => n.trim())
    )
  )].sort()

  // Lista de veículos para sub-tela
  const listaVeiculos = [...veiculosSet].sort().map(placa => {
    const ultimaOp = operacoes.find(op => op.placaCarreta === placa)
    const estaAtivo = veiculosAtivos.has(placa)
    return { placa, estaAtivo, destino: ultimaOp?.destino, tipo: ultimaOp?.tipoFrota }
  })

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new()

    // Aba 1: Operações
    const linhasOp = operacoes.map(op => ({
      'Placa da Carreta': op.placaCarreta || '—',
      'Motorista': op.motorista || '—',
      'Ajudante 1': op.aj1 || '—',
      'Ajudante 2': op.aj2 || '—',
      'Ajudante 3': op.aj3 || '—',
      'Arrumador': op.arrumador || '—',
      'Tipo de Frota': op.tipoFrota || '—',
      'Filial Destino': op.destino ? `${op.destino} | ${getNomeFilial(op.destino)}` : '—',
      'Filial Origem': op.origem ? `${op.origem} | ${getNomeFilial(op.origem)}` : '—',
      'Doca': op.doca || '—',
      'Status': op.status === 'ativo' ? 'Ativo' : 'Concluído',
      'Data/Hora': op.created_at ? new Date(op.created_at).toLocaleString('pt-BR') : '—',
    }))
    const wsOp = XLSX.utils.json_to_sheet(linhasOp)
    wsOp['!cols'] = [16,20,16,16,16,16,14,30,30,8,12,18].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, wsOp, 'Operações')

    // Aba 2: Motoristas (da planilha)
    const linhasMot = motoristas.map(m => ({
      'Matrícula': m.matricula,
      'Nome': m.nome,
      'Filial': m.filial,
      'Cargo': m.cargo,
      'Situação': m.situacao,
      'Tipo': m.tipo,
    }))
    const wsMot = XLSX.utils.json_to_sheet(linhasMot)
    wsMot['!cols'] = [12, 28, 10, 26, 18, 16].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, wsMot, 'Motoristas')

    // Aba 3: Veículos
    const linhasVei = listaVeiculos.map(v => ({
      'Placa': v.placa,
      'Tipo de Frota': v.tipo || '—',
      'Status Atual': v.estaAtivo ? 'Em rota' : 'Parado',
      'Último Destino': v.destino ? `${v.destino} | ${getNomeFilial(v.destino)}` : '—',
      'Total de operações': operacoes.filter(op => op.placaCarreta === v.placa).length,
    }))
    const wsVei = XLSX.utils.json_to_sheet(linhasVei)
    wsVei['!cols'] = [14, 14, 12, 30, 18].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, wsVei, 'Veículos')

    const data = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
    XLSX.writeFile(wb, `Cadastros_Frota_${data}.xlsx`)
  }

  if (secao === 'motoristas') {
    return <SubMotoristas motoristas={motoristas} onVoltar={() => setSecao(null)} />
  }

  if (secao === 'veiculos') {
    return <SubVeiculos veiculos={listaVeiculos} onVoltar={() => setSecao(null)} />
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: '700', color: '#1e293b' }}>Cadastro</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 0' }}>Gerencie os cadastros da frota</p>
        </div>
        <button
          onClick={exportarExcel}
          className="btn-hover"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#16a34a', color: 'white', border: 'none',
            borderRadius: 10, padding: '8px 14px', fontSize: 12,
            fontWeight: '700', cursor: 'pointer', flexShrink: 0, marginTop: 2
          }}
        >
          <Download size={14} color="white" />
          Excel
        </button>
      </div>
      <div style={{ marginBottom: 16 }} />

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
          {resultadosBusca.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>Nenhum resultado encontrado.</p>
          ) : (
            resultadosBusca.slice(0, 5).map(op => (
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
            ))
          )}
        </div>
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
            </div>
            <div className="card-hover" style={{
              flex: 1, background: 'white', borderRadius: 14, padding: '14px 16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.07)'
            }}>
              <p style={{ fontSize: 28, fontWeight: '800', color: '#16a34a', margin: '0 0 2px', lineHeight: 1 }}>
                +{ativasHoje.length}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Ativos de hoje</p>
            </div>
          </div>

          {/* Card Motoristas */}
          <button
            className="card-hover"
            onClick={() => setSecao('motoristas')}
            style={{
              width: '100%', background: 'white', borderRadius: 16, padding: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer',
              textAlign: 'left', marginBottom: 10, display: 'block'
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
              textAlign: 'left', marginBottom: 16, display: 'block'
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
              <StatPill cor="#16a34a" label={`${veiculosSet.size} ativos`} />
              <StatPill cor="#2563eb" label={`${veiculosAtivos.size} em rota`} />
              <StatPill cor="#ef4444" label={`${veiculosParados.length} parados`} />
            </div>
          </button>

          {/* Atividade recente */}
          <div className="card-hover" style={{
            background: 'white', borderRadius: 16, padding: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.07)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="#64748b" />
                <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: 0 }}>Atividade recente</p>
              </div>
              <span style={{ fontSize: 12, color: '#2563eb', fontWeight: '600', cursor: 'pointer' }}>Ver tudo</span>
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
                    <div>
                      <p style={{ fontSize: 13, fontWeight: '600', color: '#1e293b', margin: '0 0 2px' }}>
                        {op.placaCarreta || 'Sem placa'}{op.motorista ? ` · ${op.motorista}` : ''}
                      </p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        {op.destino ? getNomeFilial(op.destino) : '—'}
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

function SubMotoristas({ motoristas, onVoltar }) {
  const [busca, setBusca] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
  const filiais = [...new Set(motoristas.map(m => m.filial).filter(Boolean))].sort()
  const q = norm(busca.trim())
  const filtrados = motoristas.filter(m => {
    if (filtroFilial && m.filial !== filtroFilial) return false
    if (!q) return true
    return norm(m.matricula).includes(q) || norm(m.nome).includes(q)
  })

  return (
    <div style={{ padding: '20px 16px' }}>
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
        filtrados.map(m => {
          const ativo = isMotoristaAtivo(m)
          return (
            <div key={m.matricula + m.nome} className="card-hover" style={{
              background: 'white', borderRadius: 12, padding: '12px 16px',
              marginBottom: 8, border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: 12
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
        })
      )}
    </div>
  )
}

function SubVeiculos({ veiculos, onVoltar }) {
  const [busca, setBusca] = useState('')
  const filtrados = veiculos.filter(v =>
    v.placa?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ padding: '20px 16px' }}>
      <button onClick={onVoltar} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 13, fontWeight: '600', cursor: 'pointer', padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Voltar
      </button>
      <h2 style={{ fontSize: 22, fontWeight: '700', color: '#1e293b' }}>Veículos</h2>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 16px' }}>{veiculos.length} cadastrado{veiculos.length !== 1 ? 's' : ''}</p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'white', border: '1px solid #e2e8f0',
        borderRadius: 10, padding: '10px 14px', marginBottom: 16
      }}>
        <Search size={15} color="#94a3b8" />
        <input
          placeholder="Buscar placa..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', flex: 1, background: 'transparent' }}
        />
      </div>

      {filtrados.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>Nenhum veículo encontrado.</p>
      ) : (
        filtrados.map(v => (
          <div key={v.placa} className="card-hover" style={{
            background: 'white', borderRadius: 12, padding: '12px 16px',
            marginBottom: 8, border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: v.estaAtivo ? '#fff7ed' : '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Truck size={17} color={v.estaAtivo ? '#ea580c' : '#94a3b8'} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: '0 0 2px' }}>{v.placa}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                {v.tipo || '—'}{v.destino ? ` · ${getNomeFilial(v.destino)}` : ''}
              </p>
            </div>
            <span style={{
              fontSize: 10, fontWeight: '700', padding: '3px 8px', borderRadius: 999,
              background: v.estaAtivo ? '#fff7ed' : '#f1f5f9',
              color: v.estaAtivo ? '#ea580c' : '#64748b'
            }}>
              {v.estaAtivo ? 'EM ROTA' : 'PARADO'}
            </span>
          </div>
        ))
      )}
    </div>
  )
}
