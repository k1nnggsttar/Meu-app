import { Bell, Camera } from 'lucide-react'
import logo from './assets/logo.png'

export default function Header() {
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
      <img src={logo} alt="Vitlog" style={{ height: 54, objectFit: 'contain', marginLeft: -8 }} />

      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div className="icon-hover" style={{ position: 'relative' }}>
          <Bell size={22} color="#64748b" />
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#ef4444', color: 'white',
            borderRadius: 999, fontSize: 9, width: 15, height: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700'
          }}>1</span>
        </div>
        <div className="icon-hover" style={{ position: 'relative' }}>
          <Camera size={22} color="#64748b" />
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#ef4444', color: 'white',
            borderRadius: 999, fontSize: 9, width: 15, height: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700'
          }}>1</span>
        </div>
      </div>
    </div>
  )
}

