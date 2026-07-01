import { Home, Truck, ClipboardList, CheckCircle } from 'lucide-react'

const tabs = [
  { key: 'home',         label: 'Início',      icon: Home },
  { key: 'carregamento', label: 'Carregamento', icon: Truck },
  { key: 'cadastros',    label: 'Cadastros',    icon: ClipboardList },
  { key: 'concluidos',   label: 'Concluídos',   icon: CheckCircle },
]

export default function BottomNav({ page, setPage }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      background: 'white',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      zIndex: 100,
      boxSizing: 'border-box'
    }}>
      {tabs.map(({ key, label, icon: Icon }) => {
        const active = page === key
        return (
          <button
            key={key}
            onClick={() => setPage(key)}
            style={{
              flex: 1,
              paddingBottom: 12,
              paddingTop: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              color: active ? '#2563eb' : '#94a3b8',
              position: 'relative'
            }}
          >
            {/* Indicador azul no topo */}
            <div style={{
              width: active ? 20 : 0,
              height: 3,
              background: '#2563eb',
              borderRadius: '0 0 4px 4px',
              marginBottom: 8,
              transition: 'width 0.2s ease'
            }} />
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: active ? '700' : '400' }}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
