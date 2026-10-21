import { useEffect, useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Gallery from './components/Gallery'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'
import AuthPanel from './components/AuthPanel'
import { apiRequest } from './lib/api'

export default function App() {
  const [user, setUser] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    apiRequest('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch((error) => setAuthError(error.message))
      .finally(() => setAuthLoading(false))
  }, [])

  async function signOut() {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setAuthError('')
    } catch (error) {
      setAuthError(error.message)
    }
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-still-background text-still-text">
      <Header user={user} onSignIn={() => setAuthOpen(true)} onSignOut={signOut} />
      {authError && <p role="status" className="px-[5%] py-2 text-xs text-still-muted">{authError}</p>}
      {authLoading && <p className="sr-only" aria-live="polite">Checking sign-in status…</p>}
      <main>
        <Hero />
        <Gallery user={user} onRequireAuth={() => setAuthOpen(true)} />
        <About />
        <Contact />
      </main>
      <Footer />
      {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} onSuccess={(signedInUser) => { setUser(signedInUser); setAuthError('') }} />}
    </div>
  )
}
