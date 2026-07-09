export function filtrarPorFilial(operacoes, perfil) {
  if (!perfil?.restrito) return operacoes
  return operacoes.filter(op => op.origem === perfil.filial || op.destino === perfil.filial)
}
