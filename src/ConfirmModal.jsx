import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ titulo, mensagem, confirmText = 'Confirmar', confirmColor = '#2563eb', onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 320, padding: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.18)', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 999, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <AlertTriangle size={22} color="#d97706" />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', margin: '0 0 6px' }}>{titulo}</h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.4 }}>{mensagem}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 14, fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: confirmColor, fontSize: 14, fontWeight: '600', color: 'white', cursor: 'pointer' }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
