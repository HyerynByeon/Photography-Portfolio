import { useEffect, useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Gallery from './components/Gallery'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'
import AuthPanel from './components/AuthPanel'
import CheckoutResult from './components/CheckoutResult'
import { apiRequest } from './lib/api'

export default function App() {
  const [user, setUser] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [buyingPhotoId, setBuyingPhotoId] = useState(null)
  const [checkoutError, setCheckoutError] = useState('')
  const checkoutMode = new URLSearchParams(window.location.search).get('checkout')

  useEffect(() => {
    apiRequest('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch((error) => setAuthError(error.message))
      .finally(() => setAuthLoading(false))
  }, [])

  async function buyPhoto(photo) {
    if (!user) { setAuthOpen(true); return }
    setBuyingPhotoId(photo.id)
    setCheckoutError('')
    try {
      const data = await apiRequest('/api/checkout', {
        method: 'POST', body: JSON.stringify({ photoId: photo.id }),
      })
      window.location.assign(data.url)
    } catch (error) {
      setCheckoutError(error.message)
      setBuyingPhotoId(null)
    }
  }

  function backToGallery() {
    window.history.replaceState({}, '', window.location.pathname)
    window.location.reload()
  }

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
      {checkoutMode ? (
        <CheckoutResult mode={checkoutMode} user={user} onBack={backToGallery} />
      ) : (
        <main>
          {checkoutError && <p role="alert" className="px-[5%] py-3 text-sm text-red-700">{checkoutError}</p>}
          <Hero />
          <Gallery user={user} onRequireAuth={() => setAuthOpen(true)} onBuy={buyPhoto} buyingPhotoId={buyingPhotoId} />
          <About />
          <Contact />
        </main>
      )}
      <Footer />
      {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} onSuccess={(signedInUser) => { setUser(signedInUser); setAuthError('') }} />}
    </div>
  )
}
