import { useEffect, useMemo, useState } from 'react'
import { Search, Image as ImageIcon, FileText, Paperclip, Plus, X } from 'lucide-react'
import { supabase } from './lib/supabase'
import { uploadAnexos } from './lib/fotos'

const CATS = {
  checklist:  { label: 'Fotos checklist', desc: 'Checklist de saída e retorno',        icon: ImageIcon, cor: '#2563eb', bg: '#eff6ff' },
  traseira:   { label: 'Fotos traseira',  desc: 'Registro da traseira do veículo',      icon: ImageIcon, cor: '#ea580c', bg: '#fff7ed' },
  ocorrencia: { label: 'Anexo SSW',       desc: 'Comprovantes anexados às ocorrências', icon: Paperclip, cor: '#7c3aed', bg: '#f5f3ff' },
  documento:  { label: 'Documentos',      desc: 'Arquivos gerais da frota',             icon: FileText,  cor: '#334155', bg: '#f1f5f9' },
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

export default function AnexosPage() {
  const [operacoes, setOperacoes] = useState([])
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState(null)
  const [enviarAberto, setEnviarAberto] = useState(false)

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

  const contagem = {
    checklist: anexos.filter(a => a.categoria === 'checklist').length,
    traseira: anexos.filter(a => a.categoria === 'traseira').length,
    ocorrencia: todasOcorrencias.length,
    documento: anexos.filter(a => a.categoria === 'documento').length,
  }
  const avariasChecklist = anexos.filter(a => a.categoria === 'checklist' && ['Baú furado', 'Borracha danificada', 'Porta danificada'].includes(a.nome)).length
  const traseiraPendentes = ativas.filter(op => !temTraseira(op)).length
  const ocorrenciasAbertas = todasOcorrencias.filter(o => !o.ssw).length
  const anexoSswTotal = anexos.filter(a => a.categoria === 'ocorrencia').length
  const semAnexoSsw = todasOcorrencias.filter(o => !o.anexoUrl && !o.anexoNome).length

  const totalArquivos = anexos.length
  const totalImagens = anexos.filter(isImagem).length
  const totalPendentes = ocorrenciasAbertas

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
        <button onClick={() => setEnviarAberto(true)} className="btn-hover" style={{
          display: 'flex', alignItems: 'center', gap: 6, background: '#1e293b', color: 'white',
          border: 'none', borderRadius: 999, padding: '9px 16px', fontSize: 13, fontWeight: '700', cursor: 'pointer', flexShrink: 0, marginTop: 2
        }}>
          <Plus size={15} /> Enviar
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
        {[
          { key: 'checklist', n: contagem.checklist, sub: `${avariasChecklist} avaria${avariasChecklist !== 1 ? 's' : ''}`, subCor: '#dc2626' },
          { key: 'traseira', n: contagem.traseira, sub: `${traseiraPendentes} pendente${traseiraPendentes !== 1 ? 's' : ''}`, subCor: traseiraPendentes > 0 ? '#d97706' : '#16a34a' },
          { key: 'ocorrencia', n: contagem.ocorrencia, sub: `${ocorrenciasAbertas} aberta${ocorrenciasAbertas !== 1 ? 's' : ''}`, subCor: ocorrenciasAbertas > 0 ? '#16a34a' : '#94a3b8', overrideLabel: 'Ocorrências', overrideDesc: 'Sinistros e irregularidades', overrideIcon: 'alert' },
          { key: 'ocorrenciaAnexo', n: anexoSswTotal, sub: `${semAnexoSsw} sem anexo`, subCor: semAnexoSsw > 0 ? '#dc2626' : '#16a34a', overrideKey: 'ocorrencia' },
        ].map(c => {
          const catInfo = CATS[c.overrideKey || c.key] || CATS.documento
          const Icon = c.overrideIcon === 'alert' ? Paperclip : catInfo.icon
          const ativo = categoriaFiltro === (c.overrideKey || c.key)
          return (
            <button key={c.key} type="button"
              onClick={() => setCategoriaFiltro(ativo ? null : (c.overrideKey || c.key))}
              className="card-hover"
              style={{
                textAlign: 'left', background: 'white', borderRadius: 16, padding: 16, cursor: 'pointer',
                border: ativo ? `1.5px solid ${catInfo.cor}` : '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: catInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={catInfo.cor} />
                </div>
                <span style={{ fontSize: 22, fontWeight: '800', color: '#1e293b' }}>{c.n}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', margin: '0 0 2px' }}>{c.overrideLabel || catInfo.label}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px' }}>{c.overrideDesc || catInfo.desc}</p>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: '700', color: c.subCor }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: c.subCor }} /> {c.sub}
              </span>
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

      {enviarAberto && (
        <EnviarAnexoModal
          operacoes={operacoes}
          onClose={() => setEnviarAberto(false)}
          onEnviado={() => { setEnviarAberto(false); carregar() }}
        />
      )}
    </div>
  )
}

function EnviarAnexoModal({ operacoes, onClose, onEnviado }) {
  const [busca, setBusca] = useState('')
  const [opSel, setOpSel] = useState(null)
  const [arquivo, setArquivo] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const q = busca.trim().toLowerCase()
  const resultados = q
    ? operacoes.filter(op => (op.placaCarreta || '').toLowerCase().includes(q) || (op.motorista || '').toLowerCase().includes(q)).slice(0, 6)
    : operacoes.slice(0, 6)

  const enviar = async () => {
    if (!opSel || !arquivo || enviando) return
    setEnviando(true)
    setErro('')
    try {
      const enviados = await uploadAnexos(opSel.id, [{ file: arquivo, categoria: 'documento', nome: arquivo.name }])
      if (!enviados.length) throw new Error('Falha ao enviar o arquivo.')
      const existentes = Array.isArray(opSel.fotos) ? opSel.fotos : []
      const { error } = await supabase.from('operacoes').update({ fotos: [...existentes, ...enviados] }).eq('id', opSel.id)
      if (error) throw error
      onEnviado()
    } catch (e) {
      setErro(e.message || 'Não foi possível enviar o arquivo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 16, fontWeight: '700', color: '#1e293b' }}>Enviar anexo</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>Carregamento</label>
          {opSel ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: '#1e293b', fontWeight: '600' }}>{opSel.placaCarreta || opSel.motorista || 'Carregamento'}</span>
              <button type="button" onClick={() => setOpSel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 12 }}>Trocar</button>
            </div>
          ) : (
            <>
              <input placeholder="Buscar placa ou motorista..." value={busca} onChange={e => setBusca(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
              <div style={{ border: '1px solid #f1f5f9', borderRadius: 8, maxHeight: 180, overflowY: 'auto', marginBottom: 16 }}>
                {resultados.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 12, margin: 0 }}>Nenhum carregamento encontrado</p>
                ) : resultados.map(op => (
                  <button key={op.id} type="button" onClick={() => setOpSel(op)}
                    style={{ width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', borderBottom: '1px solid #f8fafc', background: 'white', cursor: 'pointer', fontSize: 13 }}>
                    <strong style={{ color: '#1e293b' }}>{op.placaCarreta || '—'}</strong>{op.motorista ? ` · ${op.motorista}` : ''}
                  </button>
                ))}
              </div>
            </>
          )}

          <label style={{ display: 'block', fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>Arquivo</label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, border: '1.5px dashed #93c5fd', borderRadius: 8, background: '#eff6ff', cursor: 'pointer', fontSize: 13, color: arquivo ? '#16a34a' : '#2563eb', fontWeight: '600' }}>
            {arquivo ? `✓ ${arquivo.name}` : 'Selecionar arquivo'}
            <input type="file" style={{ display: 'none' }} onChange={e => setArquivo(e.target.files?.[0] || null)} />
          </label>

          {erro && <p style={{ fontSize: 12, color: '#dc2626', margin: '10px 0 0' }}>{erro}</p>}
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, fontWeight: '600', color: '#334155', cursor: 'pointer' }}>Cancelar</button>
          <button type="button" onClick={enviar} disabled={!opSel || !arquivo || enviando}
            style={{ flex: 1, padding: 11, borderRadius: 8, border: 'none', background: (!opSel || !arquivo || enviando) ? '#93c5fd' : '#1e293b', fontSize: 13, fontWeight: '700', color: 'white', cursor: (!opSel || !arquivo || enviando) ? 'default' : 'pointer' }}>
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
