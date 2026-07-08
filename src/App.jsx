import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import Login from "./login"
import Dashboard from "./Dashboard"
import Carregamento from "./Carregamento"
import Pracas from "./Pracas"
import Cadastros from "./Cadastros"
import Concluidos from "./Concluidos"
import AnexosPage from "./AnexosPage"
import Header from "./Header"
import BottomNav from "./BottomNav"
import Sidebar from "./Sidebar"
import useIsDesktop from "./hooks/useIsDesktop"

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('home')
  const isDesktop = useIsDesktop()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', color: '#94a3b8', fontSize: 14
      }}>
        Carregando...
      </div>
    )
  }

  if (!user) return <Login />

  const renderPage = () => {
    switch (page) {
      case 'home':         return <Dashboard setPage={setPage} />
      case 'carregamento': return <Carregamento />
      case 'pracas':       return <Pracas />
      case 'cadastros':    return <Cadastros />
      case 'concluidos':   return <Concluidos />
      case 'fotos':        return <AnexosPage />
      default:             return <Dashboard setPage={setPage} />
    }
  }

  if (!isDesktop) {
    return (
      <div style={{
        maxWidth: 430,
        margin: '0 auto',
        minHeight: '100vh',
        background: '#f8fafc',
        position: 'relative',
        paddingBottom: 80
      }}>
        <Header setPage={setPage} />
        <div style={{ paddingTop: 68 }}>
          {renderPage()}
        </div>
        <BottomNav page={page} setPage={setPage} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar page={page} setPage={setPage} />
      <main style={{ flex: 1, minWidth: 0, maxWidth: 1400, margin: '0 auto', padding: '32px 40px', boxSizing: 'border-box' }}>
        {renderPage()}
      </main>
    </div>
  )
}

export default App
