import { Home, Truck, ClipboardList, CheckCircle, Camera } from 'lucide-react'
import logo from './assets/logo.png'
import Notificacoes from './Notificacoes'
import FilialBadge from './FilialBadge'

const tabs = [
  { key: 'home',         label: 'Início',       icon: Home },
  { key: 'carregamento', label: 'Carregamento', icon: Truck },
  { key: 'cadastros',    label: 'Cadastros',    icon: ClipboardList },
  { key: 'concluidos',   label: 'Concluídos',   icon: CheckCircle },
  { key: 'fotos',        label: 'Anexos',       icon: Camera },
]

export default function Sidebar({ page, setPage }) {
  return (
    <div style={{
      width: 240,
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      background: 'white',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }}>
      <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src={logo} alt="Vitlog" style={{ height: 46, objectFit: 'contain', cursor: 'pointer' }} onClick={() => setPage('home')} />
        <Notificacoes align="left" />
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <FilialBadge style={{ maxWidth: '100%' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px', flex: 1, overflowY: 'auto' }}>
        {tabs.map(({ key, label, icon: Icon }) => {
          const active = page === key
          return (
            <button
              key={key}
              onClick={() => setPage(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 12px', borderRadius: 10,
                border: 'none', background: active ? '#eff6ff' : 'transparent',
                borderLeft: `3px solid ${active ? '#2563eb' : 'transparent'}`,
                color: active ? '#2563eb' : '#64748b',
                fontSize: 14, fontWeight: active ? '700' : '600',
                cursor: 'pointer', textAlign: 'left', width: '100%', boxSizing: 'border-box',
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 1.9} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
