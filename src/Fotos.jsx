import { useEffect, useRef, useState } from 'react'
import { Camera, ImageOff } from 'lucide-react'
import { supabase } from './lib/supabase'

export default function Fotos() {
  const [aberto, setAberto] = useState(false)
  const [fotos, setFotos] = useState([])
  const ref = useRef(null)

  const carregar = async () => {
    const { data } = await supabase.from('operacoes').select('*').order('created_at', { ascending: false })
    const lista = []
    for (const op of data || []) {
      const urls = Array.isArray(op.fotos) ? op.fotos : []
      for (const url of urls) lista.push({ url, placa: op.placaCarreta })
    }
    setFotos(lista)
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

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="icon-hover" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setAberto(a => !a)}>
        <Camera size={22} color="#64748b" />
        {fotos.length > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#ef4444', color: 'white', borderRadius: 999,
            fontSize: 9, minWidth: 15, height: 15, padding: '0 3px', boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700'
          }}>{fotos.length > 9 ? '9+' : fotos.length}</span>
        )}
      </div>

      {aberto && (
        <div style={{
          position: 'absolute', top: 34, right: -6, width: 300,
          background: 'white', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          border: '1px solid #f1f5f9', zIndex: 300, overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 14, fontWeight: '700', color: '#1e293b' }}>Fotos</span>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {fotos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 16px' }}>
                <ImageOff size={26} color="#cbd5e1" style={{ marginBottom: 8 }} />
                <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Nenhuma foto ainda</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, padding: 8 }}>
                {fotos.map((f, i) => (
                  <a key={f.url + i} href={f.url} target="_blank" rel="noreferrer" title={f.placa}>
                    <img src={f.url} alt={f.placa || ''} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
