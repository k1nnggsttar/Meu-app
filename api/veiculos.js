import * as XLSX from 'xlsx'

// Link público do Excel de veículos (placas). Sobrescreva com VEICULOS_XLSX_URL na Vercel.
const DEFAULT_URL = 'https://vitlogcombr-my.sharepoint.com/:x:/g/personal/pedrolopes_vitlog_com_br/IQDmVJHlJ6AwRbJ7818VGa-jAZXvLtc689v4aDrHGJj2qMQ?e=cVfa7Y'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'

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
  await go(shareUrl)
  const sep = shareUrl.includes('?') ? '&' : '?'
  const r = await go(shareUrl + sep + 'download=1')
  if (!r.ok) throw new Error('Download falhou (status ' + r.status + ')')
  return Buffer.from(await r.arrayBuffer())
}

const DIACRIT = new RegExp('[\\u0300-\\u036f]', 'g')
const norm = (s) => String(s || '').trim().toLowerCase().normalize('NFD').replace(DIACRIT, '')

export default async function handler(req, res) {
  try {
    const shareUrl = process.env.VEICULOS_XLSX_URL || DEFAULT_URL
    const buf = await baixarXlsx(shareUrl)
    const wb = XLSX.read(buf, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

    const pick = (row, ...nomes) => {
      for (const key of Object.keys(row)) {
        if (nomes.some(n => norm(key) === norm(n))) return row[key]
      }
      return ''
    }

    const veiculos = rows.map(r => ({
      placa: String(pick(r, 'PLACA', 'Placa')).trim(),
      modelo: String(pick(r, 'MODELO', 'Modelo')).trim(),
      tipo: String(pick(r, 'TIPO', 'Tipo')).trim(),
      marca: String(pick(r, 'MARCA', 'Marca')).trim(),
      filial: String(pick(r, 'FILIAL', 'Filial')).trim(),
      ano: String(pick(r, 'ANO MODELO', 'Ano Modelo', 'Ano')).trim(),
      farma: String(pick(r, 'Farma')).trim(),
      eqMedicao: String(pick(r, 'Equipamento Medição', 'Equipamento Medicao')).trim(),
      eqResfriamento: String(pick(r, 'Equipamento Resfriamento')).trim(),
    })).filter(v => v.placa)

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600')
    res.status(200).json({ veiculos })
  } catch (e) {
    res.status(200).json({ veiculos: [], erro: e.message })
  }
}
