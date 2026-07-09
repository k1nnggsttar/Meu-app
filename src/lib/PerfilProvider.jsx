import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { PerfilContext } from './perfilContext'

export function PerfilProvider({ user, children }) {
  const [dados, setDados] = useState(null)

  useEffect(() => {
    if (!user) return
    let cancelado = false
    supabase.from('perfis').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (!cancelado) setDados({ filial: data?.filial || null, isAdmin: !!data?.is_admin })
    })
    return () => { cancelado = true }
  }, [user])

  const perfil = !user
    ? { filial: null, isAdmin: false, restrito: false, loading: false }
    : !dados
      ? { filial: null, isAdmin: false, restrito: false, loading: true }
      : { filial: dados.filial, isAdmin: dados.isAdmin, restrito: !dados.isAdmin && !!dados.filial, loading: false }

  return <PerfilContext.Provider value={perfil}>{children}</PerfilContext.Provider>
}
