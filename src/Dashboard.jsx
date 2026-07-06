import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import { Truck, Shield, Clock, CheckCircle, MapPin, Headphones, ExternalLink, AlertTriangle, Package } from 'lucide-react'
import { getNomeFilial } from "./lib/filiais"

// TODO: substituir pela URL real do Help Desk da Vitlog
const HELP_DESK_URL = 'https://vitlog.com.br'

function fmtTimer(sec) {
  if (sec < 0) sec = 0
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function fmtBRL(v) {
  return `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function totalVolumes(op) {
  return (op.detalhes?.etapas || []).reduce((s, et) => s + (Number(et.volumes) || 0), 0)
}

function statusInfo(op) {
  if (op.status === 'concluido') return { label: 'Em trânsito', dot: '#2563eb', color: '#2563eb', bg: '#eff6ff' }
  if (op.paused) return { label: 'Parado', dot: '#f59e0b', color: '#d97706', bg: '#fffbeb' }
  return { label: 'Em produção', dot: '#16a34a', color: '#16a34a', bg: '#f0fdf4' }
}

function calcProdSec(op, now) {
  const createdMs = new Date(op.created_at).getTime()
  const pausedDur = op.paused_duration || 0
  if (op.paused && op.paused_at) {
    const pausedAtMs = new Date(op.paused_at).getTime()
    return Math.max(0, Math.floor((pausedAtMs - createdMs) / 1000) - pausedDur)
  }
  const totalSec = Math.max(0, Math.floor((now - createdMs) / 1000))
  return Math.max(0, totalSec - pausedDur)
}

export default function Dashboard({ setPage }) {
  const [operacoes, setOperacoes] = useState([])
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    carregar()
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [])

  const carregar = async () => {
    const { data } = await supabase.from("operacoes").select("*")
    setOperacoes(data || [])
  }

  const ativos = operacoes.filter(op => op.status === "ativo")
  const concluidos = operacoes.filter(op => op.status === "concluido")
  const pracasAtivas = [...new Set(ativos.map(op => op.destino))].filter(Boolean)

  const avgSec = ativos.length > 0
    ? Math.floor(ativos.reduce((sum, op) => sum + calcProdSec(op, now), 0) / ativos.length)
    : null

  const pracasGrupo = ativos.reduce((acc, op) => {
    const p = op.destino || 'Sem praça'
    if (!acc[p]) acc[p] = []
    acc[p].push(op)
    return acc
  }, {})

  const T4H = 4 * 3600
  const prodList = ativos.map(op => ({ op, sec: calcProdSec(op, now) })).sort((a, b) => b.sec - a.sec)
  const acima4h = prodList.filter(x => x.sec >= T4H)

  const hoje = new Date()
  const isHoje = (iso) => {
    if (!iso) return false
    const d = new Date(iso)
    return d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()
  }
  const finalizadosHoje = concluidos.filter(op => isHoje(op.finalizado_at || op.created_at))
  const listaProducao = [
    ...prodList.map(x => ({ ...x, concluido: false })),
    ...finalizadosHoje.map(op => ({ op, sec: 0, concluido: true })),
  ]

  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: '700', color: '#1e293b' }}>Página inicial</h2>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 20px' }}>Visão geral das operações</p>

      {/* Cards 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>

        {/* Card 1: Em andamento */}
        <div className="card-hover" style={{ background: '#eff6ff', borderRadius: 16, padding: '14px 14px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ background: '#dbeafe', borderRadius: 8, padding: 6, display: 'flex' }}>
              <Truck size={15} color="#2563eb" />
            </div>
            <span style={{ fontSize: 9, fontWeight: '700', color: '#2563eb', letterSpacing: 0.5 }}>EM ANDAMENTO</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: '800', color: '#1e293b', lineHeight: 1, margin: '0 0 3px' }}>
            {ativos.length}
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 14px' }}>Carregamentos</p>
          <div style={{ height: 3, background: '#bfdbfe', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: ativos.length > 0 ? '60%' : '0%', height: '100%', background: '#2563eb' }} />
          </div>
        </div>

        {/* Card 2: Praças carregando */}
        <div className="card-hover" style={{ background: '#f0fdf4', borderRadius: 16, padding: '14px 14px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ background: '#dcfce7', borderRadius: 8, padding: 6, display: 'flex' }}>
              <Shield size={15} color="#16a34a" />
            </div>
            <span style={{ fontSize: 9, fontWeight: '700', color: '#16a34a', letterSpacing: 0.5 }}>CARREGANDO</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: '800', color: '#1e293b', lineHeight: 1, margin: '0 0 3px' }}>
            {pracasAtivas.length}
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>Praça em carregamento</p>
          {pracasAtivas.length > 0 && (
            <p style={{ fontSize: 12, fontWeight: '700', color: '#16a34a', margin: 0 }}>{pracasAtivas[0]}</p>
          )}
        </div>

        {/* Card 3: Tempo médio */}
        <div className="card-hover" style={{ background: '#fffbeb', borderRadius: 16, padding: '14px 14px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ background: '#fef3c7', borderRadius: 8, padding: 6, display: 'flex' }}>
              <Clock size={15} color="#d97706" />
            </div>
            <span style={{ fontSize: 9, fontWeight: '700', color: '#d97706', letterSpacing: 0.5 }}>TEMPO MÉDIO</span>
          </div>
          <h1 style={{ fontSize: avgSec !== null ? 28 : 34, fontWeight: '800', color: '#1e293b', lineHeight: 1, margin: '0 0 3px' }}>
            {avgSec !== null ? fmtTimer(avgSec) : '--:--'}
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Por operação</p>
        </div>

        {/* Card 4: Concluídos */}
        <div className="card-hover" style={{ background: '#f0fdf4', borderRadius: 16, padding: '14px 14px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ background: '#dcfce7', borderRadius: 8, padding: 6, display: 'flex' }}>
              <CheckCircle size={15} color="#16a34a" />
            </div>
            <span style={{ fontSize: 9, fontWeight: '700', color: '#16a34a', letterSpacing: 0.5 }}>CONCLUÍDOS</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: '800', color: '#1e293b', lineHeight: 1, margin: '0 0 3px' }}>
            {concluidos.length}
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px' }}>Finalizados hoje</p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
            {concluidos.length === 0 ? 'Nenhum até agora' : ''}
          </p>
        </div>
      </div>

      {/* Produção em andamento */}
      <div className="card-hover" style={{
        background: 'white', borderRadius: 16,
        padding: 16, marginBottom: 12,
        boxShadow: '0 2px 10px rgba(0,0,0,0.07)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: 0 }}>Produção em andamento</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0fdf4', color: '#16a34a', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, padding: '2px 7px', borderRadius: 999 }}>
                <span className="live-dot" /> AO VIVO
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Alerta acima de 4h de produção</p>
          </div>
          <button
            onClick={() => setPage('carregamento')}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap', paddingTop: 2 }}
          >
            Ver todos →
          </button>
        </div>

        {acima4h.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px', marginBottom: 6 }}>
            <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: '700', color: '#dc2626' }}>
              {acima4h.length} caminhão{acima4h.length > 1 ? '(ões)' : ''} acima de 4h de produção
            </span>
          </div>
        )}

        {listaProducao.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '12px 0 4px' }}>
            Nenhum carregamento em andamento.
          </p>
        ) : (
          listaProducao.map(({ op, sec, concluido }) => {
            const alerta = !concluido && sec >= T4H
            const st = statusInfo(op)
            const vol = totalVolumes(op)
            const valor = op.mercadoria ?? op.frete
            return (
              <div key={op.id} className="row-hover" style={{ padding: '10px 10px', borderTop: '1px solid #f1f5f9', marginTop: 6, background: alerta ? '#fef2f2' : 'transparent', borderRadius: alerta ? 8 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: 0 }}>{op.placaCarreta || '—'}</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: st.bg, color: st.color, fontSize: 10, fontWeight: '700', padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: st.dot }} /> {st.label}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {op.destino ? `${op.destino} · ${getNomeFilial(op.destino)}` : '—'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10, marginTop: 6 }}>
                  {concluido ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: '700', color: '#2563eb' }}>
                      <CheckCircle size={13} color="#2563eb" /> Finalizado
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: '700', fontFamily: 'monospace', color: alerta ? '#dc2626' : '#16a34a' }}>
                      {alerta && <AlertTriangle size={13} color="#dc2626" />}
                      {fmtTimer(sec)}
                    </div>
                  )}
                  <div style={{ textAlign: 'right' }}>
                    {(valor != null) && <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: 0 }}>{fmtBRL(valor)}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', margin: '3px 0 0' }}>
                      <Package size={13} color="#64748b" />
                      <span style={{ fontSize: 12, color: '#64748b' }}><strong style={{ color: '#1e293b', fontWeight: '700' }}>{vol}</strong> volumes</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Praças em carregamento */}
      <div className="card-hover" style={{
        background: 'white', borderRadius: 16,
        padding: 16, marginBottom: 12,
        boxShadow: '0 2px 10px rgba(0,0,0,0.07)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <MapPin size={15} color="#2563eb" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: 0 }}>Praças em carregamento</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Atualizado em tempo real</p>
            </div>
          </div>
          <button
            onClick={() => setPage('pracas')}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap', paddingTop: 2 }}
          >
            Ver tudo →
          </button>
        </div>

        {Object.keys(pracasGrupo).length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '12px 0 4px' }}>
            Nenhuma praça em carregamento.
          </p>
        ) : (
          Object.entries(pracasGrupo).map(([nome, ops]) => (
            <div key={nome} className="row-hover" style={{ padding: '10px 8px', borderTop: '1px solid #f1f5f9', marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{
                  background: '#2563eb', color: 'white',
                  fontSize: 11, fontWeight: '700', padding: '4px 8px',
                  borderRadius: 8, minWidth: 38, textAlign: 'center', flexShrink: 0
                }}>
                  {nome.slice(0, 3).toUpperCase()}
                </span>
                <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: 0, flex: 1 }}>{nome.toUpperCase()}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, flexShrink: 0 }}>
                  {ops.length} caminhão{ops.length > 1 ? 'ões' : ''}
                </p>
              </div>
              <div style={{ height: 4, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: '70%', height: '100%', background: '#2563eb', borderRadius: 999 }} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Help Desk */}
      <div className="card-hover" style={{
        background: 'white', borderRadius: 16, padding: '16px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 42, height: 42, background: '#eff6ff', borderRadius: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Headphones size={20} color="#2563eb" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', margin: '0 0 2px' }}>Help Desk</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Precisa de suporte? Abra o Help Desk da Vitlog.
            </p>
          </div>
        </div>
        <a
          href={HELP_DESK_URL}
          target="_blank"
          rel="noreferrer"
          className="btn-hover"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#2563eb', color: 'white',
            borderRadius: 999, padding: '10px 16px', fontSize: 13,
            fontWeight: '600', cursor: 'pointer', width: '100%', justifyContent: 'center',
            textDecoration: 'none', boxSizing: 'border-box',
          }}
        >
          <ExternalLink size={14} color="white" />
          Help desk Vitlog
        </a>
      </div>
    </div>
  )
}
