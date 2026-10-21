import { useState } from 'react'
import { apiRequest } from '../lib/api'

export default function AuthPanel({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const path = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
      const result = await apiRequest(path, {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      })
      onSuccess(result.user)
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="w-full max-w-md bg-still-background p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[0.2em] text-still-muted">STILL PHOTOGRAPHY</p>
            <h2 id="auth-title" className="text-3xl font-normal">{mode === 'login' ? 'Welcome back.' : 'Create an account.'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close sign-in form" className="px-2 py-1 text-xl text-still-muted hover:text-still-text">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="mb-1 block text-sm font-bold">Name</label>
              <input id="auth-name" autoComplete="name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="w-full border border-still-muted bg-transparent p-3 outline-none focus:border-still-accent" />
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="mb-1 block text-sm font-bold">Email</label>
            <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border border-still-muted bg-transparent p-3 outline-none focus:border-still-accent" />
          </div>
          <div>
            <label htmlFor="auth-password" className="mb-1 block text-sm font-bold">Password</label>
            <input id="auth-password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-still-muted bg-transparent p-3 outline-none focus:border-still-accent" />
            <p className="mt-1 text-xs text-still-muted">Use at least 8 characters.</p>
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={busy} type="submit" className="w-full border border-still-text bg-still-text px-5 py-3 text-sm text-still-background transition hover:bg-still-accent disabled:opacity-60">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-sm text-still-muted">
          {mode === 'login' ? 'New to Still? ' : 'Already have an account? '}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }} className="font-bold text-still-text underline underline-offset-4">
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </section>
    </div>
  )
}
