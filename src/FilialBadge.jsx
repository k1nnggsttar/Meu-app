import { Building2 } from 'lucide-react'
import { usePerfil } from './lib/perfilContext'
import { getNomeFilial } from './lib/filiais'

export default function FilialBadge({ style }) {
  const perfil = usePerfil()
  if (perfil.loading) return null

  const texto = perfil.restrito ? `${perfil.filial} · ${getNomeFilial(perfil.filial)}` : 'Todas as filiais'

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: perfil.restrito ? '#eff6ff' : '#f1f5f9',
      color: perfil.restrito ? '#2563eb' : '#64748b',
      fontSize: 10, fontWeight: '700', padding: '3px 9px', borderRadius: 999,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      ...style,
    }}>
      <Building2 size={11} style={{ flexShrink: 0 }} />
      {texto}
    </span>
  )
}
