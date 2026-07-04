// Converte as etapas (que contêm objetos File nos anexos) em JSON seguro para
// gravar no banco. O arquivo em si não vai para o jsonb — guardamos só o nome.
export function serializarEtapas(etapas) {
  return (etapas || []).map(et => ({
    id: et.id,
    pracas: et.pracas || [],
    metros: et.metros,
    volumes: et.volumes,
    fechada: !!et.fechada,
    ocorrencias: (et.ocorrencias || []).map(o => ({
      id: o.id,
      nf: o.nf || '',
      codigo: o.codigo || '',
      descricao: o.descricao || '',
      ssw: !!o.ssw,
      anexoNome: o.anexo?.name || o.anexoNome || null,
      criadaEm: o.criadaEm || null,
    })),
  }))
}

// Monta o objeto `detalhes` gravado na operação.
export function montarDetalhes({ pracas, etapas, assEncarregado, assConferente, lacre }) {
  return {
    pracas: pracas || [],
    etapas: serializarEtapas(etapas),
    assinaturas: { encarregado: assEncarregado || '', conferente: assConferente || '' },
    lacre: lacre || '',
  }
}
