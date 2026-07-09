import { useEffect, useState } from 'react'
import { Camera } from 'lucide-react'
import { supabase } from './lib/supabase'
import { usePerfil } from './lib/perfilContext'
import { filtrarPorFilial } from './lib/filtroFilial'

const LIMPO_KEY = 'anexosLimpoEm'
export const ANEXOS_LIMPO_EVENT = 'anexos-limpo'

function contarAnexosNaoVistos(operacoes, limpoEm) {
  let total = 0
  for (const op of operacoes) {
    const fotos = Array.isArray(op.fotos) ? op.fotos : []
    for (const f of fotos) {
      const criadoEm = typeof f === 'object' ? f.criadoEm : op.created_at
      if (new Date(criadoEm || 0).getTime() > limpoEm) total++
    }
    for (const et of op.detalhes?.etapas || []) {
      for (const o of et.ocorrencias || []) {
        if (o.anexoUrl && new Date(o.criadaEm || op.created_at || 0).getTime() > limpoEm) total++
      }
    }
  }
  return total
}

export default function Fotos({ onClick }) {
  const perfil = usePerfil()
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const carregar = async () => {
      const { data } = await supabase.from('operacoes').select('fotos, detalhes, created_at, origem, destino')
      const limpoEm = Number(localStorage.getItem(LIMPO_KEY) || 0)
      setTotal(contarAnexosNaoVistos(filtrarPorFilial(data || [], perfil), limpoEm))
    }
    carregar()
    const id = setInterval(carregar, 30000)
    window.addEventListener(ANEXOS_LIMPO_EVENT, carregar)
    return () => { clearInterval(id); window.removeEventListener(ANEXOS_LIMPO_EVENT, carregar) }
  }, [perfil])

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
