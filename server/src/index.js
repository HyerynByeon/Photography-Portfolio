import express from 'express'
import cors from 'cors'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import bcrypt from 'bcryptjs'
import Stripe from 'stripe'
import dotenv from 'dotenv'
import { pool, ensureSchema } from './db.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 4000)
const isProduction = process.env.NODE_ENV === 'production'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

// Diagnostic: verify which Stripe account the server key uses.
if (stripe) {
  stripe.accounts.retrieve()
    .then((account) => {
      console.log('Stripe server account ID:', account.id)
    })
    .catch((error) => {
      console.error('Could not verify Stripe account:', error.message)
    })
}

const clientOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

if (!process.env.SESSION_SECRET) {
  throw new Error(
    'SESSION_SECRET is missing. Set it in server/.env or your hosting environment.',
  )
}

app.set('trust proxy', 1)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('This origin is not allowed by CORS.'))
    },
    credentials: true,
  }),
)

// Stripe requires the exact raw request body.
// Keep this route before express.json().
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Stripe webhook is not configured.')
      return res.status(503).send('Stripe webhook is not configured.')
    }

    const signature = req.headers['stripe-signature']
    let event

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      )
    } catch (error) {
      console.error('Invalid Stripe webhook signature:', error.message)
      return res.status(400).send(`Webhook Error: ${error.message}`)
    }

    try {
      console.log('Stripe webhook event received:', event.type)

      if (event.type === 'checkout.session.completed') {
        const checkoutSession = event.data.object

        console.log('Stripe checkout session received:', {
          id: checkoutSession.id,
          payment_status: checkoutSession.payment_status,
          metadata: checkoutSession.metadata,
        })

        if (checkoutSession.payment_status === 'paid') {
          const paymentIntentId =
            typeof checkoutSession.payment_intent === 'string'
              ? checkoutSession.payment_intent
              : null

          const result = await pool.query(
            `UPDATE orders
             SET status = 'paid',
                 stripe_payment_intent_id = $1,
                 paid_at = NOW()
             WHERE stripe_checkout_session_id = $2
               AND status <> 'paid'`,
            [paymentIntentId, checkoutSession.id],
          )

          if (result.rowCount > 0) {
            console.log('SUCCESS: Order marked as paid:', {
              sessionId: checkoutSession.id,
              rowsUpdated: result.rowCount,
            })
          } else {
            console.error(
              'WARNING: No unpaid order matched this Checkout Session:',
              checkoutSession.id,
            )

            const orderCheck = await pool.query(
              `SELECT id, status, stripe_checkout_session_id
               FROM orders
               WHERE stripe_checkout_session_id = $1`,
              [checkoutSession.id],
            )

            console.log('Matching order lookup:', orderCheck.rows)
          }
        } else {
          console.log(
            'Checkout Session is not paid yet:',
            checkoutSession.id,
          )
        }
      }

      return res.json({ received: true })
    } catch (error) {
      console.error('Webhook processing failed:', error)
      return res.status(500).json({ error: 'Webhook processing failed.' })
    }
  },
)

app.use(express.json({ limit: '100kb' }))

const PgSession = connectPgSimple(session)

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    name: 'still.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
)

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email }
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Please sign in first.' })
  }

  next()
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/photos', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, category, image, alt, size, price_cents FROM photographs ORDER BY id ASC',
    )

    res.json(rows)
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({
        error: 'Name must be 2–80 characters.',
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, passwordHash],
    )

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) =>
        error ? reject(error) : resolve(),
      )
    })

    req.session.user = publicUser(rows[0])

    await new Promise((resolve, reject) => {
      req.session.save((error) => (error ? reject(error) : resolve()))
    })

    res.status(201).json({ user: req.session.user })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'An account with this email already exists.',
      })
    }

    next(error)
  }
})

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    const { rows } = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email],
    )

    const user = rows[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        error: 'Email or password is incorrect.',
      })
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) =>
        error ? reject(error) : resolve(),
      )
    })

    req.session.user = publicUser(user)

    await new Promise((resolve, reject) => {
      req.session.save((error) => (error ? reject(error) : resolve()))
    })

    res.json({ user: req.session.user })
  } catch (error) {
    next(error)
  }
})

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.session.user || null })
})

app.post('/api/auth/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error)

    res.clearCookie('still.sid', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    })

    res.json({ message: 'Signed out.' })
  })
})

app.post('/api/checkout', requireAuth, async (req, res, next) => {
  const client = await pool.connect()
  let transactionStarted = false

  try {
    if (!stripe) {
      return res.status(503).json({
        error: 'Stripe is not configured on the server yet.',
      })
    }

    const photoId = Number(req.body.photoId)

    if (!Number.isInteger(photoId) || photoId <= 0) {
      return res.status(400).json({ error: 'Choose a valid photograph.' })
    }

    const photoResult = await client.query(
      'SELECT id, title, image, price_cents FROM photographs WHERE id = $1',
      [photoId],
    )

    const photo = photoResult.rows[0]

    if (!photo) {
      return res.status(404).json({ error: 'Photograph not found.' })
    }

    const unitPrice = Number(photo.price_cents)

    if (!Number.isInteger(unitPrice) || unitPrice < 50) {
      return res.status(400).json({
        error: 'This photograph price must be at least €0.50 for Stripe Checkout.',
      })
    }

    await client.query('BEGIN')
    transactionStarted = true

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_cents, currency)
       VALUES ($1, $2, 'eur')
       RETURNING id`,
      [req.session.user.id, unitPrice],
    )

    const orderId = orderResult.rows[0].id

    await client.query(
      `INSERT INTO order_items
         (order_id, photograph_id, title, unit_price_cents, quantity)
       VALUES ($1, $2, $3, $4, 1)`,
      [orderId, photo.id, photo.title, unitPrice],
    )

    await client.query('COMMIT')
    transactionStarted = false

    const baseUrl = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
      .split(',')[0]
      .trim()

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: unitPrice,
            product_data: {
              name: photo.title,
              images: /^https?:\/\//.test(photo.image) ? [photo.image] : [],
            },
          },
        },
      ],
      metadata: {
        orderId: String(orderId),
        userId: String(req.session.user.id),
      },
      success_url: `${baseUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?checkout=cancelled`,
    })

    console.log('Checkout session created:', {
      orderId,
      sessionId: checkoutSession.id,
    })

    const saveResult = await pool.query(
      `UPDATE orders
       SET stripe_checkout_session_id = $1
       WHERE id = $2`,
      [checkoutSession.id, orderId],
    )

    console.log('Checkout session saved to order:', {
      orderId,
      sessionId: checkoutSession.id,
      rowsUpdated: saveResult.rowCount,
    })

    res.json({ url: checkoutSession.url, orderId })
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK').catch(() => {})
    }

    next(error)
  } finally {
    client.release()
  }
})

app.get(
  '/api/orders/by-session/:sessionId',
  requireAuth,
  async (req, res, next) => {
    try {
      const sessionId = String(req.params.sessionId || '')

      const { rows } = await pool.query(
        `SELECT o.id, o.status, o.currency, o.total_cents, o.created_at, o.paid_at,
                oi.title, oi.quantity, oi.unit_price_cents
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         WHERE o.stripe_checkout_session_id = $1
           AND o.user_id = $2`,
        [sessionId, req.session.user.id],
      )

      if (!rows.length) {
        return res.status(404).json({
          error: 'Order not found yet. Please wait a moment and try again.',
        })
      }

      const first = rows[0]

      res.json({
        order: {
          id: first.id,
          status: first.status,
          currency: first.currency,
          totalCents: first.total_cents,
          createdAt: first.created_at,
          paidAt: first.paid_at,
          items: rows.map((row) => ({
            title: row.title,
            quantity: row.quantity,
            unitPriceCents: row.unit_price_cents,
          })),
        },
      })
    } catch (error) {
      next(error)
    }
  },
)

app.get('/api/orders/:id', requireAuth, async (req, res, next) => {
  try {
    const orderId = Number(req.params.id)

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'Invalid order ID.' })
    }

    const { rows } = await pool.query(
      `SELECT o.id, o.status, o.currency, o.total_cents, o.created_at, o.paid_at,
              oi.title, oi.quantity, oi.unit_price_cents
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1 AND o.user_id = $2`,
      [orderId, req.session.user.id],
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Order not found.' })
    }

    const order = rows[0]

    res.json({
      order: {
        id: order.id,
        status: order.status,
        currency: order.currency,
        totalCents: order.total_cents,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        items: rows.map((row) => ({
          title: row.title,
          quantity: row.quantity,
          unitPriceCents: row.unit_price_cents,
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/likes', requireAuth, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT photograph_id FROM user_likes WHERE user_id = $1',
      [_req.session.user.id],
    )

    res.json({ photoIds: rows.map((row) => row.photograph_id) })
  } catch (error) {
    next(error)
  }
})

app.put('/api/likes/:photoId', requireAuth, async (req, res, next) => {
  try {
    const photoId = Number(req.params.photoId)

    if (!Number.isInteger(photoId)) {
      return res.status(400).json({ error: 'Invalid photo ID.' })
    }

    const liked = Boolean(req.body.liked)

    if (liked) {
      const result = await pool.query(
        `INSERT INTO user_likes (user_id, photograph_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING photograph_id`,
        [req.session.user.id, photoId],
      )

      if (!result.rowCount) {
        const exists = await pool.query(
          'SELECT id FROM photographs WHERE id = $1',
          [photoId],
        )

        if (!exists.rowCount) {
          return res.status(404).json({ error: 'Photograph not found.' })
        }
      }
    } else {
      await pool.query(
        'DELETE FROM user_likes WHERE user_id = $1 AND photograph_id = $2',
        [req.session.user.id, photoId],
      )
    }

    res.json({ photoId, liked })
  } catch (error) {
    if (error.code === '23503') {
      return res.status(404).json({ error: 'Photograph not found.' })
    }

    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})

ensureSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`Still API listening on port ${PORT}`))
  })
  .catch((error) => {
    console.error('Could not initialize database schema:', error)
    process.exit(1)
  })