import { supabase } from './supabase'

export const BUCKET_FOTOS = 'operacao-fotos'

// Envia os arquivos para o Storage e devolve as URLs públicas.
// Falhas individuais (ex.: bucket ainda não criado) são ignoradas para não
// travar o cadastro — retorna só as que subiram.
export async function uploadFotosOperacao(opId, arquivos) {
  const urls = []
  for (let i = 0; i < arquivos.length; i++) {
    const file = arquivos[i]
    if (!file) continue
    const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
    const path = `${opId}/${Date.now()}-${i}.${ext}`
    const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    })
    if (error) { console.warn('Falha ao enviar foto:', error.message); continue }
    const { data } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(path)
    if (data?.publicUrl) urls.push(data.publicUrl)
  }
  return urls
}
