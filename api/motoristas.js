import * as XLSX from 'xlsx'

// Link público (Qualquer pessoa com o link) do Excel de motoristas.
// Pode ser sobrescrito pela env var MOTORISTAS_XLSX_URL na Vercel.
const DEFAULT_URL = 'https://vitlogcombr-my.sharepoint.com/:x:/g/personal/jonatasarend_vitlog_com_br/IQD_XUV9XGcGQp_n1UGI7J4AARbG05vwky_7_pJ3C1SET2c?e=onmi03'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'

// Links anônimos do SharePoint precisam do "handshake" de cookies durante os
// redirecionamentos antes de liberar o download.
async function baixarXlsx(shareUrl) {
  const jar = {}
  const setCk = (h) => {
    const sc = typeof h.getSetCookie === 'function' ? h.getSetCookie() : []
    for (const c of sc) {
      const [kv] = c.split(';')
      const i = kv.indexOf('=')
      if (i > 0) jar[kv.slice(0, i).trim()] = kv.slice(i + 1).trim()
    }
  }
  const ck = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')
  const go = async (url) => {
    let cur = url
    for (let i = 0; i < 12; i++) {
      const r = await fetch(cur, { headers: { 'User-Agent': UA, Cookie: ck(), Accept: '*/*' }, redirect: 'manual' })
      setCk(r.headers)
      const loc = r.headers.get('location')
      if (r.status >= 300 && r.status < 400 && loc) { cur = new URL(loc, cur).href; continue }
      return r
    }
    throw new Error('Muitos redirecionamentos')
  }
  await go(shareUrl) // redime o link (coleta cookies)
  const sep = shareUrl.includes('?') ? '&' : '?'
  const r = await go(shareUrl + sep + 'download=1')
  if (!r.ok) throw new Error('Download falhou (status ' + r.status + ')')
  return Buffer.from(await r.arrayBuffer())
}

const DIACRIT = new RegExp('[\\u0300-\\u036f]', 'g')
const norm = (s) => String(s || '').trim().toLowerCase().normalize('NFD').replace(DIACRIT, '')
const fmtVal = (v) => {
  if (v instanceof Date && !isNaN(v)) {
    return `${String(v.getDate()).padStart(2, '0')}/${String(v.getMonth() + 1).padStart(2, '0')}/${v.getFullYear()}`
  }
  return String(v ?? '').trim()
}

export default async function handler(req, res) {
  try {
    const shareUrl = process.env.MOTORISTAS_XLSX_URL || DEFAULT_URL
    const buf = await baixarXlsx(shareUrl)
    const wb = XLSX.read(buf, { type: 'buffer', cellDates: true })
    const ws = wb.Sheets['Relação Motoristas'] || wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

    const pick = (row, ...nomes) => {
      for (const key of Object.keys(row)) {
        if (nomes.some(n => norm(key) === norm(n))) return row[key]
      }
      return ''
    }

    const motoristas = rows.map(r => ({
      matricula: fmtVal(pick(r, 'Matrícula', 'Matricula')),
      nome: fmtVal(pick(r, 'Nome')),
      admissao: fmtVal(pick(r, 'Admissão', 'Admissao')),
      cargo: fmtVal(pick(r, 'Cargo')),
      situacao: fmtVal(pick(r, 'Situação', 'Situacao')),
      filial: fmtVal(pick(r, 'Filial')),
      tipo: fmtVal(pick(r, 'Tipo')),
      dataTreinamento: fmtVal(pick(r, 'Data Treinamento')),
      manual: fmtVal(pick(r, 'Manual do Motorista', 'Manual')),
    })).filter(m => m.nome)

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600')
    res.status(200).json({ motoristas })
  } catch (e) {
    res.status(200).json({ motoristas: [], erro: e.message })
  }
}
