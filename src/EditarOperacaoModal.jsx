import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, Plus, Camera, Search } from 'lucide-react'
import { supabase } from './lib/supabase'
import { FILIAIS, getNomeFilial } from './lib/filiais'
import ConfirmModal from './ConfirmModal'

const INP = {
  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
  borderRadius: 6, fontSize: 13, color: '#334155',
  outline: 'none', boxSizing: 'border-box', background: 'white', fontFamily: 'inherit'
}
const DIS = { ...INP, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }
const LBL = { display: 'block', fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 5 }
const SEC = { fontSize: 13, fontWeight: '700', color: '#1d4ed8', margin: '0 0 12px' }

function fmt(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function FilialDropdown({ value, onChange, placeholder = 'Selecione filial' }) {
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setBusca('') }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtradas = FILIAIS.filter(f =>
    f.codigo.toLowerCase().includes(busca.toLowerCase()) ||
    f.nome.toLowerCase().includes(busca.toLowerCase())
  )
  const sel = FILIAIS.find(f => f.codigo === value)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        ...INP, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', border: `1px solid ${open ? '#2563eb' : '#e2e8f0'}`,
        color: sel ? '#1e293b' : '#94a3b8'
      }}>
        <span>{sel ? `${sel.codigo} | ${sel.nome}` : placeholder}</span>
        <ChevronDown size={14} color="#94a3b8" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 600, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 200, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Search size={13} color="#94a3b8" />
            <input autoFocus placeholder="Buscar filial..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', flex: 1, background: 'transparent' }} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtradas.length === 0
              ? <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: '12px 0', margin: 0 }}>Nenhuma encontrada</p>
              : filtradas.map(f => (
                <button key={f.codigo} type="button"
                  onClick={() => { onChange(f.codigo); setOpen(false); setBusca('') }}
                  style={{ width: '100%', padding: '9px 16px', border: 'none', background: value === f.codigo ? '#eff6ff' : 'transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}
                >
                  <span style={{ fontWeight: '700', color: '#1e293b', minWidth: 36 }}>{f.codigo}</span>
                  <span style={{ color: '#64748b' }}>| {f.nome}</span>
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default function EditarOperacaoModal({ op, onClose, onSalvo }) {
  // Campos editáveis (existem no banco)
  const [tipoFrota, setTipoFrota] = useState(op.tipoFrota === 'FROTA' ? 'frota' : 'terceiro')
  const [destino, setDestino] = useState(op.destino || '')
  const [origem, setOrigem] = useState(op.origem || '')
  const [doca, setDoca] = useState(op.doca ? String(op.doca) : '')
  const [aj1, setAj1] = useState(op.aj1 || '')
  const [aj2, setAj2] = useState(op.aj2 || '')
  const [aj3, setAj3] = useState(op.aj3 || '')
  const [arrumador, setArrumador] = useState(op.arrumador || '')

  // Equipe extra (local)
  const [equipeExtra, setEquipeExtra] = useState([])

  // Praças carregadas (local)
  const [pracas, setPracas] = useState([])
  const [pracaInput, setPracaInput] = useState('')
  const [etapasExtras, setEtapasExtras] = useState([])
  const [etapaInput, setEtapaInput] = useState('')
  const [addingEtapa, setAddingEtapa] = useState(false)

  // Assinaturas / Foto / Lacre (local)
  const [assEncarregado, setAssEncarregado] = useState('')
  const [assConferente, setAssConferente] = useState('')
  const [fotoTraseira, setFotoTraseira] = useState(null)
  const [lacre, setLacre] = useState('')

  const [salvando, setSalvando] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmRealizar, setConfirmRealizar] = useState(false)

  const addPraca = () => {
    if (pracaInput && !pracas.includes(pracaInput)) { setPracas(p => [...p, pracaInput]); setPracaInput('') }
  }

  const addEtapa = () => {
    if (etapaInput && etapaInput !== destino && !etapasExtras.includes(etapaInput)) {
      setEtapasExtras(e => [...e, etapaInput])
    }
    setEtapaInput('')
    setAddingEtapa(false)
  }

  const salvar = async () => {
    if (salvando) return
    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('operacoes').update({
      tipoFrota: tipoFrota === 'frota' ? 'FROTA' : 'TERCEIRO',
      destino,
      origem,
      doca: doca ? parseInt(doca) : null,
      aj1: aj1.trim() || null,
      aj2: aj2.trim() || null,
      aj3: aj3.trim() || null,
      arrumador: arrumador.trim() || null,
    }).eq('id', op.id)
    setSalvando(false)
    if (error) {
      setErro(error.message || 'Erro ao salvar.')
    } else {
      onSalvo?.()
      onClose()
    }
  }

  const realizar = async () => {
    setFinalizando(true)
    const { error } = await supabase.from('operacoes').update({
      status: 'concluido',
      progresso: 100,
      paused: false,
      paused_at: null,
    }).eq('id', op.id)
    if (error) { setFinalizando(false); setErro(error.message) }
    else { onSalvo?.(); onClose() }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 660, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: '700', color: '#1e293b', margin: 0 }}>Editar carregamento</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>

          {/* Tipo do veículo */}
          <div style={{ marginBottom: 20 }}>
            <p style={SEC}>Tipo do veículo</p>
            <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              {['frota', 'terceiro'].map(t => (
                <button key={t} type="button" onClick={() => setTipoFrota(t)} style={{ flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: '600', transition: 'all 0.15s', background: tipoFrota === t ? '#1d4ed8' : 'white', color: tipoFrota === t ? 'white' : '#94a3b8' }}>
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
              <input style={DIS} readOnly placeholder="Em breve" />
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
            <input style={DIS} readOnly value={fmt(op.created_at)} />
          </div>

          {/* Motorista */}
          <div style={{ marginBottom: 20 }}>
            <label style={LBL}>Motorista</label>
            <input style={DIS} readOnly placeholder="Em breve" defaultValue={op.motorista || ''} />
          </div>

          {/* Placas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 6 }}>
            <div><label style={LBL}>Placa da Carreta</label><input style={DIS} readOnly placeholder="Em breve" defaultValue={op.placaCarreta || ''} /></div>
            <div><label style={LBL}>Placa do Cavalo</label><input style={DIS} readOnly placeholder="Em breve" /></div>
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.5 }}>
            Apenas placas de frota do ativo. Cadastro completo em breve.{' '}
            <span style={{ color: '#2563eb', cursor: 'pointer' }}>Cadastro de veículo</span>
          </p>

          {/* Filiais */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <div>
              <label style={LBL}>Filial Destinatária</label>
              <FilialDropdown value={destino} onChange={setDestino} placeholder="Selecione filial" />
            </div>
            <div>
              <label style={LBL}>Filial Remetente</label>
              <FilialDropdown value={origem} onChange={setOrigem} placeholder="Filial de origem" />
            </div>
          </div>

          {/* Doca */}
          <div style={{ marginBottom: 20 }}>
            <label style={LBL}>Nº de Doca</label>
            <input style={INP} type="number" min="1" value={doca} onChange={e => setDoca(e.target.value)} />
          </div>

          {/* Praças carregadas */}
          <div style={{ marginBottom: 20 }}>
            <p style={SEC}>Praças carregadas</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <FilialDropdown value={pracaInput} onChange={setPracaInput} placeholder="Adicionar praça" />
              </div>
              <button type="button" onClick={addPraca} style={{ width: 38, height: 38, background: '#2563eb', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plus size={18} color="white" />
              </button>
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

          {/* Etapas */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ ...SEC, margin: 0 }}>Etapas do carregamento</p>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Restam 15m</span>
            </div>

            {destino ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#eff6ff', borderRadius: 8 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#2563eb', color: 'white', fontSize: 11, fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
                  <span style={{ fontSize: 13, color: '#1e293b', fontWeight: '600' }}>{destino} | {getNomeFilial(destino)}</span>
                </div>
                {etapasExtras.map((c, i) => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#94a3b8', color: 'white', fontSize: 11, fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 2}</span>
                    <span style={{ fontSize: 13, color: '#1e293b', fontWeight: '600', flex: 1 }}>{c} | {getNomeFilial(c)}</span>
                    <button type="button" onClick={() => setEtapasExtras(e => e.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px', textAlign: 'center' }}>Selecione a filial destinatária para iniciar as etapas</p>
            )}

            {addingEtapa ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <FilialDropdown value={etapaInput} onChange={setEtapaInput} placeholder="Selecione a filial da etapa" />
                </div>
                <button type="button" onClick={addEtapa} style={{ width: 38, height: 38, background: '#2563eb', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Plus size={18} color="white" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setAddingEtapa(true)} style={{ width: '100%', padding: 10, border: '1.5px dashed #93c5fd', borderRadius: 8, background: 'transparent', color: '#2563eb', fontSize: 13, fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Plus size={14} /> Nova etapa
              </button>
            )}
          </div>

          {/* Composição da carga */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 11, fontWeight: '700', color: '#1e293b', letterSpacing: 0.5 }}>COMPOSIÇÃO DA CARGA</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>0 / 15 m</span>
                <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 10, fontWeight: '700', padding: '2px 7px', borderRadius: 999 }}>0%</span>
              </div>
            </div>
            <div style={{ padding: '12px 16px', background: '#f8fafc' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 10px', textAlign: 'center' }}>Composição da carga — 15 metros</p>
              <div style={{ height: 70, borderRadius: 6, border: '1px solid #cbd5e1', background: 'repeating-linear-gradient(-45deg, #f1f5f9, #f1f5f9 6px, #e2e8f0 6px, #e2e8f0 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600', background: 'rgba(248,250,252,0.9)', padding: '3px 10px', borderRadius: 4 }}>Sem carga</span>
              </div>
            </div>
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

          {erro && (
            <p style={{ fontSize: 12, color: '#dc2626', padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', margin: '8px 0 0', fontWeight: '600' }}>
              {erro}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 14, fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button type="button" onClick={salvar} style={{ flex: 2, padding: 13, borderRadius: 8, border: 'none', fontSize: 14, fontWeight: '600', color: 'white', background: '#2563eb', cursor: salvando ? 'default' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={() => setConfirmRealizar(true)} disabled={finalizando} style={{ flex: 2, padding: 13, borderRadius: 8, border: 'none', fontSize: 14, fontWeight: '600', color: 'white', background: '#16a34a', cursor: finalizando ? 'default' : 'pointer', opacity: finalizando ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {finalizando ? 'Realizando...' : '✓ Realizar'}
          </button>
        </div>
      </div>

      {confirmRealizar && (
        <ConfirmModal
          titulo="Finalizar carregamento?"
          mensagem="Essa ação marca o carregamento como concluído e não pode ser desfeita."
          confirmText="Finalizar"
          confirmColor="#16a34a"
          onCancel={() => setConfirmRealizar(false)}
          onConfirm={() => { setConfirmRealizar(false); realizar() }}
        />
      )}
    </div>
  )
}
