import dotenv from 'dotenv'
import pg from 'pg'
dotenv.config()
const { Pool } = pg
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing in server/.env')
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})
const photos = [
  { id: 1, title: 'Mountain Solitude', category: 'Nature', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', alt: 'Person standing in a mountain landscape', size: 'large' },
  { id: 2, title: 'Quiet Portrait', category: 'Portrait', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', alt: 'Woman wearing a neutral outfit', size: 'normal' },
  { id: 3, title: 'Forest Mountains', category: 'Nature', image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80', alt: 'Mountain landscape surrounded by trees', size: 'normal' },
  { id: 4, title: 'Ocean Movement', category: 'Ocean', image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80', alt: 'Ocean waves under a cloudy sky', size: 'tall' },
  { id: 5, title: 'Live in the Moment', category: 'Events', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80', alt: 'Crowd at a live music event', size: 'normal' },
  { id: 6, title: 'Blue Horizon', category: 'Ocean', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Blue ocean and sandy beach', size: 'normal' },
  { id: 7, title: 'Morning Light', category: 'Nature', image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80', alt: 'Sunlight shining through a forest', size: 'wide' },
]
try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS photographs (
      id INTEGER PRIMARY KEY,
      title VARCHAR(120) NOT NULL,
      category VARCHAR(40) NOT NULL,
      image TEXT NOT NULL,
      alt TEXT NOT NULL,
      size VARCHAR(20) NOT NULL DEFAULT 'normal'
    );
  `)
  for (const photo of photos) {
    await pool.query(
      `INSERT INTO photographs (id, title, category, image, alt, size)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category,
       image = EXCLUDED.image, alt = EXCLUDED.alt, size = EXCLUDED.size`,
      [photo.id, photo.title, photo.category, photo.image, photo.alt, photo.size],
    )
  }
  console.log(`Seeded ${photos.length} photographs.`)
} finally {
  await pool.end()
}
