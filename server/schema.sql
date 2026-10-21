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
  size VARCHAR(20) NOT NULL DEFAULT 'normal'
);

CREATE TABLE IF NOT EXISTS user_likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photograph_id INTEGER NOT NULL REFERENCES photographs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, photograph_id)
);
-- connect-pg-simple creates the user_sessions table for persistent login sessions.
