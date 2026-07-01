const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ALLOWED_IDS = process.env.ALLOWED_IDS
  ? process.env.ALLOWED_IDS.split(',').map(Number)
  : []

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK')

  const { message } = req.body || {}
  if (!message) return res.status(200).send('OK')

  const chatId = message.chat.id
  const userId = message.from.id
  const text = (message.text || '').trim()

  if (ALLOWED_IDS.length > 0 && !ALLOWED_IDS.includes(userId)) {
    await sendMessage(chatId, '❌ Você não tem permissão para usar este bot.')
    return res.status(200).send('OK')
  }

  if (text === '/start' || text === '/help') {
    await sendMessage(chatId,
      `🤖 *Bot Vitlog*\n\nCrie usuários para o app:\n\n` +
      `/criar email senha\n\n` +
      `Exemplo:\n/criar joao@vitlog.com.br minhasenha123\n\n` +
      `/listar — lista todos os usuários`
    )
    return res.status(200).send('OK')
  }

  if (text.startsWith('/criar ')) {
    const parts = text.split(' ')
    if (parts.length < 3) {
      await sendMessage(chatId, '❌ Use: `/criar email@exemplo.com senha123`')
      return res.status(200).send('OK')
    }

    const email = parts[1]
    const password = parts[2]

    const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ email, password, email_confirm: true })
    })

    const data = await resp.json()

    if (resp.ok) {
      await sendMessage(chatId, `✅ Usuário criado!\n📧 *${email}*\n🔑 Senha: \`${password}\``)
    } else {
      const msg = data.message || data.error_description || data.error || 'Erro desconhecido'
      await sendMessage(chatId, `❌ Erro: ${msg}`)
    }
    return res.status(200).send('OK')
  }

  if (text === '/listar') {
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=50`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    })

    const data = await resp.json()
    const users = data.users || []

    if (users.length === 0) {
      await sendMessage(chatId, 'Nenhum usuário cadastrado.')
    } else {
      const lista = users.map(u => `• ${u.email}`).join('\n')
      await sendMessage(chatId, `👥 *Usuários cadastrados:*\n\n${lista}`)
    }
    return res.status(200).send('OK')
  }

  await sendMessage(chatId, 'Use /help para ver os comandos disponíveis.')
  return res.status(200).send('OK')
}
