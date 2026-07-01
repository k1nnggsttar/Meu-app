import { useState, useEffect } from 'react'
import { Truck, MapPin, Pause, Play, CheckCircle, Edit2, Clock, Timer } from 'lucide-react'
import { supabase } from './lib/supabase'
import { getNomeFilial } from './lib/filiais'
import EditarOperacaoModal from './EditarOperacaoModal'
import ConfirmModal from './ConfirmModal'

function fmtTimer(sec) {
  if (sec < 0) sec = 0
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function fmtData(iso) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const badge = (bg, color) => ({
  background: bg, color,
  fontSize: 9, fontWeight: '700',
  padding: '2px 7px', borderRadius: 999, letterSpacing: 0.3
})

export default function OperacaoCard({ op, onAtualizar }) {
  const [now, setNow] = useState(Date.now())
  const [isPaused, setIsPaused] = useState(op.paused || false)
  const [pausedAt, setPausedAt] = useState(op.paused_at || null)
  const [pausedDur, setPausedDur] = useState(op.paused_duration || 0)
  const [finalizando, setFinalizando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [confirmAcao, setConfirmAcao] = useState(null) // null | 'pausar' | 'retomar' | 'finalizar'

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setIsPaused(op.paused || false)
    setPausedAt(op.paused_at || null)
    setPausedDur(op.paused_duration || 0)
  }, [op.paused, op.paused_at, op.paused_duration])

  const createdMs = new Date(op.created_at).getTime()
  const totalSec = Math.max(0, Math.floor((now - createdMs) / 1000))

  let prodSec
  if (isPaused && pausedAt) {
    const pausedAtMs = new Date(pausedAt).getTime()
    prodSec = Math.max(0, Math.floor((pausedAtMs - createdMs) / 1000) - pausedDur)
  } else {
    prodSec = Math.max(0, totalSec - pausedDur)
  }

  const pausar = async () => {
    const ts = new Date().toISOString()
    setIsPaused(true)
    setPausedAt(ts)
    const { error } = await supabase.from('operacoes').update({ paused: true, paused_at: ts }).eq('id', op.id)
    if (error) { setIsPaused(false); setPausedAt(null) }
    else onAtualizar()
  }

  const retomar = async () => {
    const addPause = pausedAt ? Math.floor((Date.now() - new Date(pausedAt).getTime()) / 1000) : 0
    const newDur = pausedDur + addPause
    setIsPaused(false)
    setPausedAt(null)
    setPausedDur(newDur)
    const { error } = await supabase.from('operacoes').update({ paused: false, paused_at: null, paused_duration: newDur }).eq('id', op.id)
    if (error) { setIsPaused(true); setPausedAt(pausedAt); setPausedDur(pausedDur) }
    else onAtualizar()
  }

  const finalizar = async () => {
    setFinalizando(true)
    const { error } = await supabase.from('operacoes').update({ status: 'concluido', progresso: 100, paused: false, paused_at: null }).eq('id', op.id)
    if (error) setFinalizando(false)
    else onAtualizar()
  }

  const destNome = getNomeFilial(op.destino)
  const origNome = op.origem ? getNomeFilial(op.origem) : null

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 10, overflow: 'hidden' }}>

      <div style={{ padding: 16 }}>
        {/* Linha superior */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Truck size={16} color="#64748b" />
              <span style={{ fontWeight: '700', color: '#1e293b', fontSize: 16 }}>{op.placaCarreta || '—'}</span>
              <Edit2 size={12} color="#cbd5e1" style={{ cursor: 'pointer' }} onClick={() => setEditando(true)} />
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <span style={badge('#dbeafe', '#2563eb')}>EM CARREGAMENTO</span>
              {op.tipoFrota && (
                <span style={badge('#dbeafe', '#2563eb')}>
                  {op.tipoFrota}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 5 }}>
              <Clock size={12} color="#94a3b8" />
              <span style={{ fontSize: 11, color: '#64748b' }}>{fmtData(op.created_at)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', fontSize: 12, fontWeight: '700', color: isPaused ? '#94a3b8' : '#2563eb', marginBottom: 2 }}>
              <Timer size={12} color={isPaused ? '#94a3b8' : '#2563eb'} />
              Prod {fmtTimer(prodSec)}
            </div>
            <div style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>
              Total {fmtTimer(totalSec)}
            </div>
          </div>
        </div>

        {/* Infos */}
        {origNome && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <MapPin size={12} color="#3b82f6" />
            <span style={{ fontSize: 12, color: '#64748b' }}>Filial Remetente: {op.origem} | {origNome}</span>
          </div>
        )}
        {op.motorista && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <Truck size={12} color="#94a3b8" />
            <span style={{ fontSize: 12, color: '#64748b' }}>Motorista: {op.motorista}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: (op.doca || op.vol || op.lacre) ? 3 : 12 }}>
          <MapPin size={12} color="#ef4444" />
          <span style={{ fontSize: 12, color: '#64748b' }}>Filial Destinatário: {op.destino} | {destNome}</span>
        </div>
        {(op.doca || op.vol || op.lacre) && (
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', fontWeight: '600' }}>
            {[
              op.doca && `Doca: ${op.doca}`,
              op.vol && `Vol: ${op.vol}`,
              op.lacre && `Lacre: ${op.lacre}`,
            ].filter(Boolean).join('   ')}
          </p>
        )}

        {/* Progresso */}
        <div style={{ height: 5, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${op.progresso || 0}%`, height: '100%', background: '#2563eb', borderRadius: 999, transition: 'width 0.5s' }} />
        </div>
        <div style={{ textAlign: 'right', fontSize: 10, color: '#2563eb', fontWeight: '700', marginTop: 3 }}>
          {op.progresso || 0}%
        </div>
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={() => setConfirmAcao(isPaused ? 'retomar' : 'pausar')}
          style={{ flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', background: isPaused ? '#16a34a' : '#f59e0b', color: 'white', fontSize: 13, fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.15s' }}
        >
          {isPaused ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Play size={14} /> Retomar</span> : <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Pause size={14} /> Pausar</span>}
        </button>
        <button
          onClick={() => setConfirmAcao('finalizar')}
          disabled={finalizando}
          style={{ flex: 1, padding: '12px 0', border: 'none', borderLeft: '1px solid #f1f5f9', cursor: finalizando ? 'default' : 'pointer', background: 'white', color: finalizando ? '#94a3b8' : '#16a34a', fontSize: 13, fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <CheckCircle size={14} /> {finalizando ? 'Finalizando...' : 'Finalizar'}
        </button>
      </div>

      {editando && (
        <EditarOperacaoModal
          op={op}
          onClose={() => setEditando(false)}
          onSalvo={onAtualizar}
        />
      )}

      {confirmAcao && (
        <ConfirmModal
          titulo={
            confirmAcao === 'pausar' ? 'Pausar carregamento?' :
            confirmAcao === 'retomar' ? 'Retomar carregamento?' :
            'Finalizar carregamento?'
          }
          mensagem={
            confirmAcao === 'pausar' ? 'O cronômetro de produção será pausado para este caminhão.' :
            confirmAcao === 'retomar' ? 'O cronômetro de produção voltará a contar para este caminhão.' :
            'Essa ação marca o carregamento como concluído e não pode ser desfeita.'
          }
          confirmText={
            confirmAcao === 'pausar' ? 'Pausar' :
            confirmAcao === 'retomar' ? 'Retomar' :
            'Finalizar'
          }
          confirmColor={
            confirmAcao === 'pausar' ? '#f59e0b' :
            confirmAcao === 'retomar' ? '#16a34a' :
            '#16a34a'
          }
          onCancel={() => setConfirmAcao(null)}
          onConfirm={() => {
            const acao = confirmAcao
            setConfirmAcao(null)
            if (acao === 'pausar') pausar()
            else if (acao === 'retomar') retomar()
            else finalizar()
          }}
        />
      )}
    </div>
  )
}
