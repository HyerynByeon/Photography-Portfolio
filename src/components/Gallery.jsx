import { useEffect, useState } from 'react'
import PhotoCard from './PhotoCard'
import { apiRequest } from '../lib/api'

const filters = ['All', 'Nature', 'Portrait', 'Ocean', 'Events']

export default function Gallery({ user, onRequireAuth }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [photos, setPhotos] = useState([])
  const [likedPhotos, setLikedPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    apiRequest('/api/photos')
      .then((data) => { if (active) setPhotos(data) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    if (!user) {
      setLikedPhotos([])
      return () => { active = false }
    }
    apiRequest('/api/likes')
      .then((data) => { if (active) setLikedPhotos(data.photoIds) })
      .catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [user])

  const filteredPhotos = activeFilter === 'All'
    ? photos
    : photos.filter((photo) => photo.category === activeFilter)

  async function toggleLiked(photoId) {
    if (!user) {
      onRequireAuth()
      return
    }
    const shouldLike = !likedPhotos.includes(photoId)
    setLikedPhotos((current) => shouldLike ? [...current, photoId] : current.filter((id) => id !== photoId))
    try {
      await apiRequest(`/api/likes/${photoId}`, {
        method: 'PUT',
        body: JSON.stringify({ liked: shouldLike }),
      })
    } catch (requestError) {
      setLikedPhotos((current) => shouldLike ? current.filter((id) => id !== photoId) : [...current, photoId])
      setError(requestError.message)
    }
  }

  return (
    <section id="work" className="mx-auto max-w-[1400px] px-[5%] py-16 sm:py-20 lg:py-24">
      <div className="mb-8 sm:mb-12">
        <p className="mb-4 text-xs font-bold tracking-[0.2em] text-still-muted">SELECTED WORK</p>
        <h2 className="m-0 text-[clamp(2rem,4vw,3.5rem)] font-normal leading-tight">Recent photographs</h2>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" aria-label="Filter photographs">
        {filters.map((filter) => {
          const isActive = activeFilter === filter
          return <button key={filter} type="button" aria-pressed={isActive} onClick={() => setActiveFilter(filter)} className={`border px-4 py-2 text-sm transition-colors ${isActive ? 'border-still-text bg-still-text text-still-background' : 'border-still-muted/50 bg-transparent text-still-text hover:border-still-accent hover:text-still-accent'}`}>{filter}</button>
        })}
      </div>

      <p className="mb-4 text-xs text-still-muted" aria-live="polite">
        {loading ? 'Loading photographs…' : `Showing ${filteredPhotos.length} of ${photos.length} photographs`}
        {user && likedPhotos.length > 0 && ` · ${likedPhotos.length} liked`}
      </p>
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error} — check that the API server is running and the database is seeded.</p>}
      {!loading && !error && photos.length === 0 && <p className="py-8 text-still-muted">No photographs found. Run the database seed script.</p>}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:auto-rows-[240px] sm:grid-cols-2 lg:auto-rows-[280px] lg:grid-cols-3">
        {filteredPhotos.map((photo) => <PhotoCard key={photo.id} photo={photo} isSaved={likedPhotos.includes(photo.id)} onToggleSaved={toggleLiked} />)}
      </div>
    </section>
  )
}
