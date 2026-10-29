import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'

export default function CheckoutResult({ mode, user, onBack }) {
  const [order, setOrder] = useState(null)
  const [message, setMessage] = useState(mode === 'cancelled' ? 'Checkout was cancelled. No payment was completed.' : 'Checking your payment…')
  useEffect(() => {
    if (mode !== 'success' || !user) return
    const sessionId = new URLSearchParams(window.location.search).get('session_id')
    if (!sessionId) { setMessage('The checkout session ID is missing.'); return }
    let cancelled = false
    let attempts = 0
    async function checkOrder() {
      try {
        // Resolve the order ID from the checkout session through an authenticated server endpoint.
        const data = await apiRequest(`/api/orders/by-session/${encodeURIComponent(sessionId)}`)
        if (cancelled) return
        setOrder(data.order)
        if (data.order.status === 'paid') setMessage('Payment confirmed! Your order is paid.')
        else if (attempts < 5) { attempts += 1; setMessage('Payment received by Stripe. Waiting for confirmation…'); window.setTimeout(checkOrder, 1500) }
        else setMessage('Your payment is still being confirmed. Refresh this page in a moment.')
      } catch (error) { if (!cancelled) setMessage(error.message) }
    }
    checkOrder()
    return () => { cancelled = true }
  }, [mode, user])
  return <main className="mx-auto max-w-2xl px-[5%] py-20">
    <p className="mb-4 text-xs font-bold tracking-[0.2em] text-still-muted">STILL. CHECKOUT</p>
    <h1 className="mb-5 text-3xl font-normal">{mode === 'cancelled' ? 'Checkout cancelled' : order?.status === 'paid' ? 'Thank you for your purchase' : 'Order status'}</h1>
    <p role="status" className="mb-4 text-sm">{message}</p>
    {order && <div className="mb-6 border border-still-muted/30 p-5 text-sm"><p>Order #{order.id}</p><p>Status: <strong>{order.status}</strong></p><p>Total: €{(order.totalCents / 100).toFixed(2)}</p></div>}
    {!user && <p className="mb-4 text-sm text-still-muted">Please sign in with the account used to place the order to view its status.</p>}
    <button type="button" onClick={onBack} className="border border-still-text px-4 py-2 text-sm hover:bg-still-text hover:text-still-background">Back to gallery</button>
  </main>
}
