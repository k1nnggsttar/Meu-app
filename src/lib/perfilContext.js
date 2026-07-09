import { createContext, useContext } from 'react'

export const PerfilContext = createContext({ filial: null, isAdmin: false, restrito: false, loading: true })

export function usePerfil() {
  return useContext(PerfilContext)
}
