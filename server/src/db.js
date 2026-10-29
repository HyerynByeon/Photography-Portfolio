import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()
const { Pool } = pg

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Copy server/.env.example to server/.env and set it.')
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS photographs (
      id INTEGER PRIMARY KEY,
      title VARCHAR(120) NOT NULL,
      category VARCHAR(40) NOT NULL,
      image TEXT NOT NULL,
      alt TEXT NOT NULL,
      size VARCHAR(20) NOT NULL DEFAULT 'normal',
      price_cents INTEGER NOT NULL DEFAULT 500 CHECK (price_cents >= 0)
    );

    ALTER TABLE photographs ADD COLUMN IF NOT EXISTS price_cents INTEGER NOT NULL DEFAULT 500;

    CREATE TABLE IF NOT EXISTS user_likes (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      photograph_id INTEGER NOT NULL REFERENCES photographs(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, photograph_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
      currency VARCHAR(3) NOT NULL DEFAULT 'eur',
      total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
      stripe_checkout_session_id TEXT UNIQUE,
      stripe_payment_intent_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      photograph_id INTEGER NOT NULL REFERENCES photographs(id),
      title VARCHAR(120) NOT NULL,
      unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
      quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0)
    );
  `)
}
