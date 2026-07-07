import { useEffect, useMemo, useState } from 'react'
import { Search, Image as ImageIcon, FileText, Paperclip, Download, X } from 'lucide-react'
import { supabase } from './lib/supabase'

const CATS = {
  checklist:  { label: 'Fotos checklist', desc: 'Checklist de saída e retorno',   icon: ImageIcon, cor: '#2563eb', bg: '#eff6ff' },
  traseira:   { label: 'Fotos traseira',  desc: 'Registro da traseira do veículo', icon: ImageIcon, cor: '#ea580c', bg: '#fff7ed' },
  ocorrencia: { label: 'Anexo SSW',       desc: 'Anexos das ocorrências (SSW)',   icon: Paperclip, cor: '#7c3aed', bg: '#f5f3ff' },
  documento:  { label: 'Documentos',      desc: 'Arquivos gerais da frota',       icon: FileText,  cor: '#334155', bg: '#f1f5f9' },
}

function isImagem(item) {
  if (item.tipo) return item.tipo.startsWith('image')
  return true // itens antigos (antes da categorização) eram sempre fotos
}

function fmtData(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Baixa de fato o arquivo (em vez de só abrir em nova aba). Cai para
// window.open se o fetch falhar (ex.: CORS bloqueando o bucket).
async function baixarArquivo(url, nomeSugerido) {
  try {
    const resp = await fetch(url)
    const blob = await resp.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = nomeSugerido || 'arquivo'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(blobUrl)
  } catch {
    window.open(url, '_blank')
  }
}

export default function AnexosPage() {
  const [operacoes, setOperacoes] = useState([])
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState(null)
  const [baixarAberto, setBaixarAberto] = useState(false)

  useEffect(() => { carregar() }, [])
  const carregar = async () => {
    const { data } = await supabase.from('operacoes').select('*').order('created_at', { ascending: false })
    setOperacoes(data || [])
  }

  // Unifica os itens do array `fotos` de cada operação (checklist/traseira/documento)
  // com os anexos de ocorrência já enviados (o.anexoUrl) — uma lista só de "anexos".
  const anexos = useMemo(() => {
    const lista = []
    for (const op of operacoes) {
      const fotos = Array.isArray(op.fotos) ? op.fotos : []
      for (const f of fotos) {
        if (typeof f === 'string') lista.push({ url: f, categoria: 'checklist', nome: 'Foto', tipo: '', criadoEm: op.created_at, op })
        else if (f?.url) lista.push({ ...f, op })
      }
      for (const et of op.detalhes?.etapas || []) {
        for (const o of et.ocorrencias || []) {
          if (o.anexoUrl) {
            lista.push({ url: o.anexoUrl, categoria: 'ocorrencia', nome: [o.codigo, o.descricao].filter(Boolean).join(' - ') || o.anexoNome || 'Anexo', tipo: '', criadoEm: o.criadaEm || op.created_at, op })
          }
        }
      }
    }
    return lista.sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0))
  }, [operacoes])

  const todasOcorrencias = useMemo(() =>
    operacoes.flatMap(op => (op.detalhes?.etapas || []).flatMap(et => et.ocorrencias || [])).filter(o => o.codigo || o.nf || o.descricao)
  , [operacoes])

  const ativas = operacoes.filter(op => op.status === 'ativo')
  const temTraseira = (op) => (Array.isArray(op.fotos) ? op.fotos : []).some(f => typeof f === 'object' && f.categoria === 'traseira')

  const contagemChecklist = anexos.filter(a => a.categoria === 'checklist').length
  const contagemTraseira = anexos.filter(a => a.categoria === 'traseira').length
  const traseiraPendentes = ativas.filter(op => !temTraseira(op)).length
  const anexoSswTotal = anexos.filter(a => a.categoria === 'ocorrencia').length
  const semAnexoSsw = todasOcorrencias.filter(o => !o.anexoUrl && !o.anexoNome).length

  const totalArquivos = anexos.length
  const totalImagens = anexos.filter(isImagem).length
  // Anexos que ainda faltam: caminhões ativos sem foto da traseira + ocorrências sem anexo.
  const totalPendentes = traseiraPendentes + semAnexoSsw

  const categorias = [
    { key: 'checklist', n: contagemChecklist },
    { key: 'traseira', n: contagemTraseira },
    { key: 'ocorrencia', n: anexoSswTotal },
  ]

  const q = busca.trim().toLowerCase()
  const filtrados = anexos.filter(a => {
    if (categoriaFiltro && a.categoria !== categoriaFiltro) return false
    if (!q) return true
    return [a.nome, a.op?.placaCarreta, a.op?.motorista, a.op?.destino].some(v => (v || '').toLowerCase().includes(q))
  })

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: '700', color: '#1e293b' }}>Anexos</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 0' }}>Imagens e documentos da frota</p>
        </div>
        <button onClick={() => setBaixarAberto(true)} className="btn-hover" style={{
          display: 'flex', alignItems: 'center', gap: 6, background: '#1e293b', color: 'white',
          border: 'none', borderRadius: 999, padding: '9px 16px', fontSize: 13, fontWeight: '700', cursor: 'pointer', flexShrink: 0, marginTop: 2
        }}>
          <Download size={15} /> Baixar
        </button>
      </div>

      {/* Busca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', margin: '16px 0' }}>
        <Search size={15} color="#94a3b8" />
        <input placeholder="Buscar arquivo, placa ou motorista..." value={busca} onChange={e => setBusca(e.target.value)}
          style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', flex: 1, background: 'transparent' }} />
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', background: 'white', borderRadius: 14, padding: '16px 8px', marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
        {[
          { n: totalArquivos, label: 'Arquivos', cor: '#1e293b' },
          { n: totalImagens, label: 'Imagens', cor: '#2563eb' },
          { n: totalPendentes, label: 'Pendentes', cor: '#d97706' },
        ].map((s, i) => (
          <div key={s.label} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
            <p style={{ fontSize: 24, fontWeight: '800', color: s.cor, margin: 0, lineHeight: 1 }}>{s.n}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Categorias */}
      <p style={{ fontSize: 15, fontWeight: '700', color: '#1e293b', margin: '0 0 10px' }}>Categorias</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {categorias.map((c, i) => {
          const catInfo = CATS[c.key]
          const Icon = catInfo.icon
          const ativo = categoriaFiltro === c.key
          return (
            <button key={c.key} type="button"
              onClick={() => setCategoriaFiltro(ativo ? null : c.key)}
              className="card-hover"
              style={{
                textAlign: 'left', background: 'white', borderRadius: 16, padding: 16, cursor: 'pointer',
                border: ativo ? `1.5px solid ${catInfo.cor}` : '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                gridColumn: i === categorias.length - 1 && categorias.length % 2 === 1 ? '1 / -1' : 'auto',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: catInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={catInfo.cor} />
                </div>
                <span style={{ fontSize: 22, fontWeight: '800', color: '#1e293b' }}>{c.n}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: '0 0 2px' }}>{catInfo.label}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{catInfo.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Lista */}
      <p style={{ fontSize: 15, fontWeight: '700', color: '#1e293b', margin: '0 0 10px' }}>
        {categoriaFiltro ? CATS[categoriaFiltro]?.label : 'Recentes'}
      </p>
      {filtrados.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 30 }}>Nenhum anexo encontrado.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {filtrados.map((a, i) => {
            const catInfo = CATS[a.categoria] || CATS.documento
            const Icon = catInfo.icon
            return (
              <a key={a.url + i} href={a.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', background: 'white' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isImagem(a) ? (
                      <img src={a.url} alt={a.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <Icon size={26} color={catInfo.cor} />
                    )}
                    {a.op?.placaCarreta && (
                      <span style={{ position: 'absolute', bottom: 4, left: 4, right: 4, background: 'rgba(15,23,42,0.75)', color: 'white', fontSize: 9, fontWeight: '700', padding: '2px 5px', borderRadius: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.op.placaCarreta}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 10, color: '#64748b', margin: 0, padding: '5px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.nome} · {fmtData(a.criadoEm)}
                  </p>
                </div>
              </a>
            )
          })}
        </div>
      )}

      {baixarAberto && (
        <BaixarAnexoModal anexos={anexos} onClose={() => setBaixarAberto(false)} />
      )}
    </div>
  )
}

function BaixarAnexoModal({ anexos, onClose }) {
  const [busca, setBusca] = useState('')
  const [baixandoUrl, setBaixandoUrl] = useState(null)

  const q = busca.trim().toLowerCase()
  const resultados = (q
    ? anexos.filter(a => [a.nome, a.op?.placaCarreta, a.op?.motorista].some(v => (v || '').toLowerCase().includes(q)))
    : anexos
  ).slice(0, 30)

  const handleBaixar = async (a) => {
    setBaixandoUrl(a.url)
    await baixarArquivo(a.url, a.nome)
    setBaixandoUrl(null)
  }

  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 460, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 16, fontWeight: '700', color: '#1e293b' }}>Baixar anexo</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', background: '#f8fafc' }}>
            <Search size={15} color="#94a3b8" />
            <input autoFocus placeholder="Buscar arquivo, placa ou motorista..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, color: '#1e293b', background: 'transparent' }} />
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '10px 8px' }}>
          {resultados.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '24px 12px', margin: 0 }}>Nenhum anexo encontrado.</p>
          ) : resultados.map((a, i) => {
            const catInfo = CATS[a.categoria] || CATS.documento
            const Icon = catInfo.icon
            return (
              <div key={a.url + i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8 }} className="row-hover">
                <div style={{ width: 34, height: 34, borderRadius: 8, background: catInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {isImagem(a) ? <img src={a.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon size={16} color={catInfo.cor} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: '600', color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{a.op?.placaCarreta || a.op?.motorista || '—'} · {catInfo.label}</p>
                </div>
                <button type="button" onClick={() => handleBaixar(a)} disabled={baixandoUrl === a.url}
                  style={{ flexShrink: 0, background: '#eff6ff', border: 'none', borderRadius: 999, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: baixandoUrl === a.url ? 'default' : 'pointer' }}>
                  <Download size={14} color="#2563eb" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
