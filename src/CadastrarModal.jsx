import { useState, useRef, useEffect } from "react"
import { X, Paperclip, Search, Plus, ChevronDown, Camera, Check } from 'lucide-react'
import { supabase } from "./lib/supabase"
import { uploadAnexos, enviarAnexosOcorrencias } from "./lib/fotos"
import { montarDetalhes } from "./lib/detalhes"
import { FILIAIS, FILIAIS_ROTA } from "./lib/filiais"
import EtapasCarregamento from "./EtapasCarregamento"
import ConferenteSelect from "./ConferenteSelect"
import MotoristaSelect from "./MotoristaSelect"
import PlacaSelect from "./PlacaSelect"

const CHECKLIST = [
  { id: 'bau_furado',          label: 'Baú furado',           problemAnswer: 'sim' },
  { id: 'borracha_danificada', label: 'Borracha danificada',   problemAnswer: 'sim' },
  { id: 'porta_danificada',    label: 'Porta danificada',      problemAnswer: 'sim' },
  { id: 'cordas_boas',         label: 'Cordas boas',           problemAnswer: 'nao' },
  { id: 'checklist_angelira',  label: 'Checklist Angelira',    problemAnswer: 'nao' },
  { id: 'trava_bau',           label: 'Trava do baú',          problemAnswer: 'nao' },
]


const INP = {
  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
  borderRadius: 6, fontSize: 13, color: '#334155',
  outline: 'none', boxSizing: 'border-box', background: 'white', fontFamily: 'inherit'
}
const DIS = {
  ...INP, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed'
}
const LBL = { display: 'block', fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 5 }
const SEC = { fontSize: 13, fontWeight: '700', color: '#1d4ed8', margin: '0 0 12px' }

function fmt(date) {
  if (!date) return ''
  return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}

function FilialDropdown({ value, onChange, placeholder = 'Selecione filial', opcoes = FILIAIS, multi = false, selecionados = [], onClose }) {
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setBusca(''); onClose?.() }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  const filtradas = opcoes.filter(f =>
    f.codigo.toLowerCase().includes(busca.toLowerCase()) ||
    f.nome.toLowerCase().includes(busca.toLowerCase())
  )
  const sel = opcoes.find(f => f.codigo === value)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => { const next = !o; if (!next) onClose?.(); return next })} style={{
        ...INP, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', border: `1px solid ${open ? '#2563eb' : '#e2e8f0'}`,
        color: sel ? '#1e293b' : '#94a3b8'
      }}>
        <span>{sel ? `${sel.codigo} | ${sel.nome}` : placeholder}</span>
        <ChevronDown size={14} color="#94a3b8"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 600,
          background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 220, display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Search size={13} color="#94a3b8" />
            <input autoFocus placeholder="Buscar filial..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', flex: 1, background: 'transparent' }} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtradas.length === 0
              ? <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: '12px 0', margin: 0 }}>Nenhuma encontrada</p>
              : filtradas.map(f => {
                const marcado = multi ? selecionados.includes(f.codigo) : value === f.codigo
                return (
                  <button key={f.codigo} type="button"
                    onClick={() => { onChange(f.codigo); setBusca(''); if (!multi) { setOpen(false); onClose?.() } }}
                    style={{
                      width: '100%', padding: '9px 16px', border: 'none',
                      background: marcado ? (multi ? '#f0fdf4' : '#eff6ff') : 'transparent',
                      textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', fontSize: 13
                    }}
                    onMouseEnter={e => { if (!marcado) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (!marcado) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: '#1e293b', minWidth: 36 }}>{f.codigo}</span>
                      <span style={{ color: '#64748b' }}>| {f.nome}</span>
                    </span>
                    {multi && marcado && <Check size={14} color="#16a34a" style={{ flexShrink: 0 }} />}
                  </button>
                )
              })
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default function CadastrarModal({ onClose, onSalvo }) {
  const [etapa, setEtapa] = useState(1)

  // step 1
  const [respostas, setRespostas] = useState({})
  const [fotos, setFotos] = useState({})

  // step 2
  const [tipoVeiculo, setTipoVeiculo] = useState('frota')
  const [aj1, setAj1] = useState('')
  const [aj2, setAj2] = useState('')
  const [aj3, setAj3] = useState('')
  const [arrumador, setArrumador] = useState('')
  const [equipeExtra, setEquipeExtra] = useState([])
  const [filialDest, setFilialDest] = useState('')
  const [filialOrig, setFilialOrig] = useState('')
  const [doca, setDoca] = useState('')
  const [inicio, setInicio] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')

  // segunda parte
  const [pracas, setPracas] = useState([])
  const [pracaInput, setPracaInput] = useState('')
  const etapasRef = useRef(null)
  const [assEncarregado, setAssEncarregado] = useState('')
  const [assConferente, setAssConferente] = useState('')
  const [fotoTraseira, setFotoTraseira] = useState(null)
  const [lacre, setLacre] = useState('')
  const [conferente, setConferente] = useState('')
  const [motorista, setMotorista] = useState(null)
  const [placaCarreta, setPlacaCarreta] = useState('')
  const [placaCavalo, setPlacaCavalo] = useState('')
  const [cargaPct, setCargaPct] = useState(0)
  const [etapasData, setEtapasData] = useState([])
  const [opId, setOpId] = useState(null)
  const [anexosChecklist, setAnexosChecklist] = useState([])
  const [salvandoDetalhes, setSalvandoDetalhes] = useState(false)
  const [erroDetalhes, setErroDetalhes] = useState('')

  // validações
  const checklistCompleto = CHECKLIST.every(i => respostas[i.id])
  const semFoto = CHECKLIST.some(i => respostas[i.id] === i.problemAnswer && !fotos[i.id])
  const checklistOk = checklistCompleto && !semFoto
  const formOk = tipoVeiculo && aj1.trim() && filialDest && filialOrig && doca.trim()

  const responder = (id, valor) => {
    setRespostas(r => ({ ...r, [id]: valor }))
    const item = CHECKLIST.find(i => i.id === id)
    if (valor !== item.problemAnswer) setFotos(f => { const n = { ...f }; delete n[id]; return n })
  }

  const irForm = () => { setInicio(new Date()); setEtapa(2) }

  const addPraca = (codigo) => {
    if (codigo && !pracas.includes(codigo)) {
      setPracas(p => [...p, codigo])
      setPracaInput('')
    }
  }

  const fecharPracaDropdown = () => {
    if (pracas.length > 0) {
      setTimeout(() => etapasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    }
  }

  const cadastrar = async () => {
    if (!formOk || salvando) return
    setErroSalvar('')
    setSalvando(true)
    const { data: nova, error } = await supabase.from('operacoes').insert({
      tipoFrota: tipoVeiculo === 'frota' ? 'FROTA' : 'TERCEIRO',
      destino: filialDest,
      origem: filialOrig,
      doca: parseInt(doca),
      aj1: aj1.trim() || null,
      aj2: aj2.trim() || null,
      aj3: aj3.trim() || null,
      arrumador: arrumador.trim() || null,
      motorista: motorista ? `${motorista.matricula} - ${motorista.nome}` : null,
      placaCarreta: placaCarreta.trim() || null,
      progresso: cargaPct,
      status: 'ativo',
      paused: false,
      paused_duration: 0,
    }).select().single()
    if (error) {
      setSalvando(false)
      console.error('Erro ao cadastrar:', error.message)
      setErroSalvar(error.message || error.details || 'Erro ao salvar. Tente novamente.')
      return
    }

    setOpId(nova?.id || null)

    // Envia as fotos do checklist (obrigatórias nos itens com problema) ao Storage.
    try {
      const itens = Object.entries(fotos).map(([id, file]) => {
        const item = CHECKLIST.find(c => c.id === id)
        return { file, categoria: 'checklist', nome: item?.label || id }
      })
      if (nova?.id && itens.length) {
        const enviados = await uploadAnexos(nova.id, itens)
        setAnexosChecklist(enviados)
        if (enviados.length) await supabase.from('operacoes').update({ fotos: enviados }).eq('id', nova.id)
      }
    } catch (e) {
      console.warn('Fotos do checklist não foram salvas:', e?.message)
    }

    setSalvando(false)
    onSalvo?.()
    setEtapa(3)
  }

  const salvarDetalhes = async () => {
    if (salvandoDetalhes) return
    setErroDetalhes('')
    setSalvandoDetalhes(true)

    // Sobe a foto da traseira e os anexos de ocorrência pendentes, e junta tudo
    // num único array `fotos` (checklist já enviado na etapa anterior).
    let etapasFinal = etapasData
    let anexosNovos = []
    try {
      const { etapas: etapasComUrl, novosAnexos } = await enviarAnexosOcorrencias(opId, etapasData)
      etapasFinal = etapasComUrl
      anexosNovos = novosAnexos
      if (fotoTraseira) {
        const traseira = await uploadAnexos(opId, [{ file: fotoTraseira, categoria: 'traseira', nome: 'Foto da traseira' }])
        anexosNovos = [...anexosNovos, ...traseira]
      }
    } catch (e) {
      console.warn('Anexos (traseira/ocorrências) não foram salvos:', e?.message)
    }

    const detalhes = montarDetalhes({ pracas, etapas: etapasFinal, assEncarregado, assConferente, lacre, conferente, motorista, placaCavalo })
    const fotosFinal = [...anexosChecklist, ...anexosNovos]
    const { error } = await supabase.from('operacoes').update({ detalhes, progresso: cargaPct, fotos: fotosFinal }).eq('id', opId)
    setSalvandoDetalhes(false)
    if (error) {
      console.error('Erro ao salvar detalhes:', error.message)
      setErroDetalhes('Não foi possível salvar os detalhes. Verifique se a coluna "detalhes" existe na tabela.')
      return
    }
    onSalvo?.()
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: 'white', borderRadius: 14, width: '100%', maxWidth: 660,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.18)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px 16px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
        }}>
          <h2 style={{ fontSize: 17, fontWeight: '700', color: '#1e293b', margin: 0 }}>Cadastrar carregamento</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 24px' }}>
          {etapa === 1 && (
            <>
              <div style={{ background: '#eff6ff', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>📋</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: '700', color: '#1d4ed8', margin: '0 0 3px' }}>Checklist de inspeção do veículo</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>Preencha todos os itens para liberar o cadastro. Itens com problema exigem foto.</p>
                </div>
              </div>
              {CHECKLIST.map(item => {
                const resp = respostas[item.id]
                const isProb = resp === item.problemAnswer
                return (
                  <div key={item.id} style={{ borderRadius: 10, border: `1px solid ${isProb ? '#fecaca' : '#e2e8f0'}`, background: isProb ? '#fff5f5' : 'white', padding: '14px 16px', marginBottom: 8, transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>{item.label}</span>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                        <button onClick={() => responder(item.id, 'sim')} style={{ padding: '5px 18px', borderRadius: 6, fontSize: 13, fontWeight: '600', cursor: 'pointer', border: 'none', background: resp === 'sim' ? '#16a34a' : '#f1f5f9', color: resp === 'sim' ? 'white' : '#94a3b8', transition: 'all 0.15s' }}>Sim</button>
                        <button onClick={() => responder(item.id, 'nao')} style={{ padding: '5px 18px', borderRadius: 6, fontSize: 13, fontWeight: '600', cursor: 'pointer', border: 'none', background: resp === 'nao' ? '#ef4444' : '#f1f5f9', color: resp === 'nao' ? 'white' : '#94a3b8', transition: 'all 0.15s' }}>Não</button>
                      </div>
                    </div>
                    {isProb && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '10px 14px', border: '1.5px dashed #fca5a5', borderRadius: 8, background: 'white', cursor: 'pointer', color: fotos[item.id] ? '#16a34a' : '#ef4444', fontSize: 13, fontWeight: '600' }}>
                        <Paperclip size={14} />
                        {fotos[item.id] ? `✓ ${fotos[item.id].name}` : 'Anexar foto (obrigatório)'}
                        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setFotos(prev => ({ ...prev, [item.id]: f })) }} />
                      </label>
                    )}
                  </div>
                )
              })}
            </>
          )}
          {etapa === 2 && (
            <>
              {/* Tipo do veículo */}
              <div style={{ marginBottom: 20 }}>
                <p style={SEC}>Tipo do veículo</p>
                <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  {['frota', 'terceiro'].map(t => (
                    <button key={t} type="button" onClick={() => setTipoVeiculo(t)} style={{ flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: '600', transition: 'all 0.15s', background: tipoVeiculo === t ? '#1d4ed8' : 'white', color: tipoVeiculo === t ? 'white' : '#94a3b8' }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipe */}
              <div style={{ marginBottom: 20 }}>
                <p style={SEC}>Equipe</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={LBL}>Ajudante 1</label><input style={INP} value={aj1} onChange={e => setAj1(e.target.value)} /></div>
                  <div><label style={LBL}>Ajudante 2</label><input style={INP} value={aj2} onChange={e => setAj2(e.target.value)} /></div>
                  <div><label style={LBL}>Ajudante 3</label><input style={INP} value={aj3} onChange={e => setAj3(e.target.value)} /></div>
                  <div><label style={LBL}>Arrumador</label><input style={INP} value={arrumador} onChange={e => setArrumador(e.target.value)} /></div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={LBL}>Conferente</label>
                  <ConferenteSelect value={conferente} onChange={setConferente} />
                </div>
                {equipeExtra.map((v, i) => (
                  <div key={i} style={{ marginTop: 10 }}>
                    <label style={LBL}>Equipe extra {i + 1}</label>
                    <input style={INP} value={v} onChange={e => setEquipeExtra(prev => prev.map((x, j) => j === i ? e.target.value : x))} />
                  </div>
                ))}
                <button type="button" onClick={() => setEquipeExtra(e => [...e, ''])} style={{ width: '100%', marginTop: 10, padding: 10, border: '1.5px dashed #93c5fd', borderRadius: 8, background: 'transparent', color: '#2563eb', fontSize: 13, fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Plus size={14} /> Adicionar outra equipe
                </button>
              </div>

              {/* Início */}
              <div style={{ marginBottom: 20 }}>
                <label style={LBL}>Início do carregamento <span style={{ color: '#94a3b8', fontWeight: '400' }}>(automático)</span></label>
                <input style={DIS} readOnly value={fmt(inicio)} />
              </div>

              {/* Motorista */}
              <div style={{ marginBottom: 20 }}>
                <label style={LBL}>Motorista</label>
                <MotoristaSelect value={motorista} onChange={setMotorista} />
              </div>

              {/* Placas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 6 }}>
                {tipoVeiculo === 'terceiro' ? (
                  <>
                    <div><label style={LBL}>Placa da Carreta</label><input style={INP} value={placaCarreta} onChange={e => setPlacaCarreta(e.target.value.toUpperCase())} placeholder="Ex.: ABC1D23" /></div>
                    <div><label style={LBL}>Placa do Cavalo</label><input style={INP} value={placaCavalo} onChange={e => setPlacaCavalo(e.target.value.toUpperCase())} placeholder="Ex.: ABC1D23" /></div>
                  </>
                ) : (
                  <>
                    <div><label style={LBL}>Placa da Carreta</label><PlacaSelect value={placaCarreta} onChange={setPlacaCarreta} tipos={['CARRETA']} placeholder="Selecionar carreta" /></div>
                    <div><label style={LBL}>Placa do Cavalo</label><PlacaSelect value={placaCavalo} onChange={setPlacaCavalo} tipos={['CAVALO', '¾']} placeholder="Selecionar cavalo" /></div>
                  </>
                )}
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.5 }}>
                Apenas placas de frota do ativo. Cadastro completo em breve.{' '}
                <span style={{ color: '#2563eb', cursor: 'pointer' }}>Cadastro de veículo</span>
              </p>

              {/* Filiais */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                <div>
                  <label style={LBL}>Filial Destinatária</label>
                  <FilialDropdown value={filialDest} onChange={setFilialDest} placeholder="Selecione filial" opcoes={FILIAIS_ROTA} />
                </div>
                <div>
                  <label style={LBL}>Filial Remetente</label>
                  <FilialDropdown value={filialOrig} onChange={setFilialOrig} placeholder="Filial de origem" opcoes={FILIAIS_ROTA} />
                </div>
              </div>

              {/* Doca */}
              <div style={{ marginBottom: 20 }}>
                <label style={LBL}>Nº de Doca</label>
                <input style={INP} type="number" min="1" value={doca} onChange={e => setDoca(e.target.value)} />
              </div>

              {!formOk && (
                <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', lineHeight: 1.6, margin: 0 }}>
                  Preencha os campos acima para habilitar o cadastro.
                </p>
              )}
              {erroSalvar && (
                <p style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', margin: '8px 0 0', fontWeight: '600' }}>
                  {erroSalvar}
                </p>
              )}
            </>
          )}
          {etapa === 3 && (
            <>
              {/* Banner de confirmação */}
              <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>✅</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: '700', color: '#16a34a', margin: '0 0 2px' }}>Operação cadastrada! Cronômetro iniciado.</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Preencha os detalhes abaixo ou feche para continuar depois.</p>
                </div>
              </div>

              {/* Praças carregadas */}
              <div style={{ marginBottom: 20 }}>
                <p style={SEC}>Praças carregadas</p>
                <div style={{ marginBottom: 8 }}>
                  <FilialDropdown value={pracaInput} onChange={addPraca} placeholder="Adicionar praça" multi selecionados={pracas} onClose={fecharPracaDropdown} />
                </div>
                {pracas.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {pracas.map(c => (
                      <span key={c} style={{ background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: '700', padding: '4px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {c}
                        <button type="button" onClick={() => setPracas(p => p.filter(x => x !== c))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div ref={etapasRef}>
                <EtapasCarregamento pracasDisponiveis={pracas} onResumoChange={r => setCargaPct(r.pct)} onEtapasChange={setEtapasData} />
              </div>

              {/* Assinaturas */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ ...SEC, display: 'flex', alignItems: 'center', gap: 6 }}>✍️ Assinaturas digitais</p>
                <div style={{ marginBottom: 10 }}>
                  <label style={LBL}>Assinatura do encarregado</label>
                  <textarea value={assEncarregado} onChange={e => setAssEncarregado(e.target.value)} placeholder="Nome/assinatura do encarregado" style={{ ...INP, resize: 'vertical', minHeight: 70, paddingTop: 10, lineHeight: 1.5 }} />
                </div>
                <div>
                  <label style={LBL}>Assinatura do conferente</label>
                  <textarea value={assConferente} onChange={e => setAssConferente(e.target.value)} placeholder="Nome/assinatura do conferente" style={{ ...INP, resize: 'vertical', minHeight: 70, paddingTop: 10, lineHeight: 1.5 }} />
                </div>
              </div>

              {/* Foto da traseira */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: '700', color: '#1e293b', letterSpacing: 0.5, margin: '0 0 8px' }}>FOTO DA TRASEIRA</p>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 11, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 13, color: fotoTraseira ? '#16a34a' : '#94a3b8', fontWeight: fotoTraseira ? '600' : '400' }}>
                  <Camera size={14} />
                  {fotoTraseira ? `✓ ${fotoTraseira.name}` : 'FOTO DA TRASEIRA'}
                  <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setFotoTraseira(f) }} />
                </label>
              </div>

              {/* Lacre */}
              <div style={{ marginBottom: 8 }}>
                <label style={LBL}>Lacre</label>
                <input style={INP} value={lacre} onChange={e => setLacre(e.target.value)} />
              </div>

              {erroDetalhes && (
                <p style={{ fontSize: 12, color: '#dc2626', padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', margin: '8px 0 0', fontWeight: '600' }}>
                  {erroDetalhes}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 12, flexShrink: 0 }}>
          {etapa < 3 && (
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 14, fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
              Cancelar
            </button>
          )}
          {etapa === 1 && (
            <button type="button" onClick={irForm} style={{ flex: 1, padding: 13, borderRadius: 8, border: 'none', fontSize: 14, fontWeight: '600', color: 'white', background: checklistOk ? '#2563eb' : '#bfdbfe', cursor: checklistOk ? 'pointer' : 'default', transition: 'background 0.2s' }}>
              Continuar
            </button>
          )}
          {etapa === 2 && (
            <button type="button" onClick={cadastrar} style={{ flex: 1, padding: 13, borderRadius: 8, border: 'none', fontSize: 14, fontWeight: '600', color: 'white', background: formOk && !salvando ? '#2563eb' : '#bfdbfe', cursor: formOk && !salvando ? 'pointer' : 'default', transition: 'background 0.2s' }}>
              {salvando ? 'Salvando...' : 'Cadastrar'}
            </button>
          )}
          {etapa === 3 && (
            <>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 14, fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
                Fechar
              </button>
              <button type="button" onClick={salvarDetalhes} disabled={salvandoDetalhes} style={{ flex: 2, padding: 13, borderRadius: 8, border: 'none', fontSize: 14, fontWeight: '600', color: 'white', background: salvandoDetalhes ? '#93c5fd' : '#2563eb', cursor: salvandoDetalhes ? 'default' : 'pointer' }}>
                {salvandoDetalhes ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
