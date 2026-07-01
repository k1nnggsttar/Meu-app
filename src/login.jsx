import { useState } from 'react'
import { supabase } from './lib/supabase'
import logo from './assets/logo.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleLogin = async () => {
    if (!email || !password) return
    setErro('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setErro('Email ou senha incorretos.')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: 24
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '36px 28px',
        width: '100%',
        maxWidth: 360,
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)'
      }}>
        <img src={logo} alt="Vitlog" style={{ height: 42, display: 'block', margin: '0 auto 28px', objectFit: 'contain' }} />

        <h2 style={{ fontSize: 20, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 6 }}>
          Bem-vindo
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 24 }}>
          Faça login para continuar
        </p>

        <label style={labelStyle}>Email</label>
        <input
          placeholder="seu@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ ...inputStyle, marginBottom: 14 }}
        />

        <label style={labelStyle}>Senha</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ ...inputStyle, marginBottom: erro ? 10 : 20 }}
        />

        {erro && (
          <p style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', marginBottom: 14 }}>{erro}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: 14, background: '#2563eb', color: 'white',
            border: 'none', borderRadius: 12, fontSize: 15, fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
            transition: 'opacity 0.15s'
          }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: '600',
  color: '#475569',
  marginBottom: 6
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  fontSize: 14,
  color: '#334155',
  outline: 'none',
  boxSizing: 'border-box',
  display: 'block'
}
