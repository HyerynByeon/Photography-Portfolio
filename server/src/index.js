import express from 'express'
import cors from 'cors'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { pool, ensureSchema } from './db.js'

dotenv.config()
const app = express()
const PORT = Number(process.env.PORT || 4000)
const isProduction = process.env.NODE_ENV === 'production'
const clientOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is missing. Set it in server/.env or your hosting environment.')
}

app.set('trust proxy', 1)
app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests (e.g. curl) and explicitly configured frontends.
    if (!origin || clientOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('This origin is not allowed by CORS.'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '100kb' }))

const PgSession = connectPgSimple(session)
app.use(session({
  store: new PgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true }),
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
}))

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email }
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Please sign in first.' })
  next()
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.get('/api/photos', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, category, image, alt, size FROM photographs ORDER BY id ASC',
    )
    res.json(rows)
  } catch (error) { next(error) }
})

app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Name must be 2–80 characters.' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return res.status(400).json({ error: 'Enter a valid email address.' })
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' })

    const passwordHash = await bcrypt.hash(password, 12)
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash],
    )
    await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()))
    req.session.user = publicUser(rows[0])
    await new Promise((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()))
    res.status(201).json({ user: req.session.user })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' })
    next(error)
  }
})

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    const { rows } = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email])
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' })
    }
    await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()))
    req.session.user = publicUser(user)
    await new Promise((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()))
    res.json({ user: req.session.user })
  } catch (error) { next(error) }
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

app.get('/api/likes', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT photograph_id FROM user_likes WHERE user_id = $1', [req.session.user.id])
    res.json({ photoIds: rows.map((row) => row.photograph_id) })
  } catch (error) { next(error) }
})

app.put('/api/likes/:photoId', requireAuth, async (req, res, next) => {
  try {
    const photoId = Number(req.params.photoId)
    if (!Number.isInteger(photoId)) return res.status(400).json({ error: 'Invalid photo ID.' })
    const liked = Boolean(req.body.liked)
    if (liked) {
      const result = await pool.query(
        'INSERT INTO user_likes (user_id, photograph_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING photograph_id',
        [req.session.user.id, photoId],
      )
      if (!result.rowCount) {
        const exists = await pool.query('SELECT id FROM photographs WHERE id = $1', [photoId])
        if (!exists.rowCount) return res.status(404).json({ error: 'Photograph not found.' })
      }
    } else {
      await pool.query('DELETE FROM user_likes WHERE user_id = $1 AND photograph_id = $2', [req.session.user.id, photoId])
    }
    res.json({ photoId, liked })
  } catch (error) {
    if (error.code === '23503') return res.status(404).json({ error: 'Photograph not found.' })
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})

ensureSchema()
  .then(() => app.listen(PORT, () => console.log(`Still API listening on port ${PORT}`)))
  .catch((error) => {
    console.error('Could not initialize database schema:', error)
    process.exit(1)
  })
