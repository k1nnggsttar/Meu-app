import { supabase } from './supabase'

export const BUCKET_FOTOS = 'operacao-fotos'

// Envia os arquivos e devolve um array do MESMO TAMANHO e ORDEM de `itens`,
// com `null` nas posições que falharam — para quem precisa casar cada
// resultado com sua origem (ex.: uma ocorrência específica).
async function subirItensAlinhados(opId, itens) {
  const resultado = []
  for (let i = 0; i < itens.length; i++) {
    const item = itens[i]
    if (!item?.file) { resultado.push(null); continue }
    const ext = (item.file.name?.split('.').pop() || 'jpg').toLowerCase()
    const path = `${opId}/${Date.now()}-${i}.${ext}`
    const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(path, item.file, {
      upsert: true,
      contentType: item.file.type || 'image/jpeg',
    })
    if (error) { console.warn('Falha ao enviar anexo:', error.message); resultado.push(null); continue }
    const { data } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(path)
    resultado.push(data?.publicUrl ? {
      url: data.publicUrl,
      categoria: item.categoria,
      nome: item.nome || item.file.name,
      tipo: item.file.type || '',
      criadoEm: new Date().toISOString(),
    } : null)
  }
  return resultado
}

// Envia arquivos rotulados por categoria ao Storage e devolve só os que deram
// certo (url pública + categoria + nome). itens: [{ file, categoria, nome }]
export async function uploadAnexos(opId, itens) {
  return (await subirItensAlinhados(opId, itens)).filter(Boolean)
}

// Percorre as etapas em busca de anexos de ocorrência ainda não enviados
// (File pendente em memória), envia ao Storage e devolve as etapas já com a
// URL gravada, junto dos itens para acrescentar ao array `fotos` da operação.
export async function enviarAnexosOcorrencias(opId, etapas) {
  const pendentes = []
  for (const et of etapas || []) {
    for (const o of et.ocorrencias || []) {
      if (o.anexo instanceof File) pendentes.push(o.id)
    }
  }
  if (pendentes.length === 0) return { etapas, novosAnexos: [] }

  const idsParaOcorrencia = new Map()
  const itens = []
  for (const et of etapas) {
    for (const o of et.ocorrencias || []) {
      if (o.anexo instanceof File) {
        idsParaOcorrencia.set(itens.length, o.id)
        itens.push({ file: o.anexo, categoria: 'ocorrencia', nome: [o.codigo, o.descricao].filter(Boolean).join(' - ') || o.anexo.name })
      }
    }
  }
  const enviados = await subirItensAlinhados(opId, itens)

  const urlPorOcorrencia = new Map()
  enviados.forEach((up, i) => { if (up) urlPorOcorrencia.set(idsParaOcorrencia.get(i), up.url) })

  const etapasAtualizadas = etapas.map(et => ({
    ...et,
    ocorrencias: (et.ocorrencias || []).map(o =>
      urlPorOcorrencia.has(o.id) ? { ...o, anexoUrl: urlPorOcorrencia.get(o.id) } : o
    ),
  }))

  return { etapas: etapasAtualizadas, novosAnexos: enviados.filter(Boolean) }
}
