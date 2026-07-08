import logo from './assets/logo.png'
import Notificacoes from './Notificacoes'
import Fotos from './Fotos'

export default function Header({ setPage }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      background: 'white',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 100,
      boxSizing: 'border-box'
    }}>
      <img
        src={logo}
        alt="Vitlog"
        onClick={() => setPage('home')}
        style={{ height: 54, objectFit: 'contain', marginLeft: -8, cursor: 'pointer' }}
      />

      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <Notificacoes />
        <Fotos onClick={() => setPage('fotos')} />
      </div>
    </div>
  )
}
