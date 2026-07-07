import { useEffect, useState } from 'react'
import { Camera } from 'lucide-react'
import { supabase } from './lib/supabase'

export default function Fotos({ onClick }) {
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const carregar = async () => {
      const { data } = await supabase.from('operacoes').select('fotos')
      const soma = (data || []).reduce((s, op) => s + (Array.isArray(op.fotos) ? op.fotos.length : 0), 0)
      setTotal(soma)
    }
    carregar()
    const id = setInterval(carregar, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="icon-hover" style={{ position: 'relative', cursor: 'pointer' }} onClick={onClick}>
      <Camera size={22} color="#64748b" />
      {total > 0 && (
        <span style={{
          position: 'absolute', top: -5, right: -5,
          background: '#ef4444', color: 'white', borderRadius: 999,
          fontSize: 9, minWidth: 15, height: 15, padding: '0 3px', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700'
        }}>{total > 9 ? '9+' : total}</span>
      )}
    </div>
  )
}
