import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCircle2, Truck } from 'lucide-react'
import { supabase } from './lib/supabase'

function tempoRelativo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  const d = Math.floor(h / 24)
  return `${d} d`
}

// Notificações são derivadas das operações: cada operação gera um evento de
// "iniciado" (no created_at) e, se concluída, um de "finalizado".
function derivarNotificacoes(operacoes) {
  const lista = []
  for (const op of operacoes) {
    const sub = [op.placaCarreta, op.motorista || op.destino].filter(Boolean).join(' • ')
    lista.push({ id: `${op.id}:start`, tipo: 'iniciado', sub, ts: op.created_at })
    if (op.status === 'concluido') {
      lista.push({ id: `${op.id}:end`, tipo: 'finalizado', sub, ts: op.finalizado_at || op.updated_at || op.created_at })
    }
  }
  return lista.sort((a, b) => new Date(b.ts) - new Date(a.ts))
}

export default function Notificacoes() {
  const [aberto, setAberto] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [limpoEm, setLimpoEm] = useState(() => Number(localStorage.getItem('notifLimpoEm') || 0))
  const ref = useRef(null)

  const carregar = async () => {
    const { data } = await supabase.from('operacoes').select('*').order('created_at', { ascending: false })
    setNotifs(derivarNotificacoes(data || []))
  }

  useEffect(() => {
    carregar()
    const id = setInterval(carregar, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!aberto) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [aberto])

  const visiveis = notifs.filter(n => new Date(n.ts).getTime() > limpoEm)
  const naoLidas = visiveis.length

  const limpar = () => {
    const agora = Date.now()
    localStorage.setItem('notifLimpoEm', String(agora))
    setLimpoEm(agora)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="icon-hover" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setAberto(a => !a)}>
        <Bell size={22} color="#64748b" />
        {naoLidas > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#ef4444', color: 'white', borderRadius: 999,
            fontSize: 9, minWidth: 15, height: 15, padding: '0 3px', boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700'
          }}>{naoLidas > 9 ? '9+' : naoLidas}</span>
        )}
      </div>

      {aberto && (
        <div style={{
          position: 'absolute', top: 34, right: -6, width: 300,
          background: 'white', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          border: '1px solid #f1f5f9', zIndex: 300, overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 14, fontWeight: '700', color: '#1e293b' }}>Notificações</span>
            <button type="button" onClick={limpar} disabled={visiveis.length === 0}
              style={{ border: 'none', background: 'none', color: visiveis.length === 0 ? '#cbd5e1' : '#2563eb', fontSize: 13, fontWeight: '600', cursor: visiveis.length === 0 ? 'default' : 'pointer', padding: 0 }}>
              Limpar
            </button>
          </div>

          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {visiveis.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '28px 16px', margin: 0 }}>Sem notificações</p>
            ) : (
              visiveis.map(n => {
                const fin = n.tipo === 'finalizado'
                return (
                  <div key={n.id} style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 999, background: fin ? '#f0fdf4' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {fin ? <CheckCircle2 size={17} color="#16a34a" /> : <Truck size={16} color="#2563eb" />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: '700', color: '#1e293b' }}>
                        {fin ? 'Carregamento finalizado' : 'Carregamento iniciado'}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.sub}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94a3b8' }}>{tempoRelativo(n.ts)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
