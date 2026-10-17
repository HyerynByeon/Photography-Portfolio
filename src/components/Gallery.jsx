import { useState } from 'react'
import photographs from '../data/photographs'
import PhotoCard from './PhotoCard'

const filters = ['All', 'Nature', 'Portrait', 'Ocean', 'Events']

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [savedPhotos, setSavedPhotos] = useState([])

  const filteredPhotos =
    activeFilter === 'All'
      ? photographs
      : photographs.filter((photo) => photo.category === activeFilter)

  function toggleSaved(photoId) {
    setSavedPhotos((currentSaved) =>
      currentSaved.includes(photoId)
        ? currentSaved.filter((id) => id !== photoId)
        : [...currentSaved, photoId],
    )
  }

  return (
    <section
      id="work"
      className="mx-auto max-w-[1400px] px-[5%] py-16 sm:py-20 lg:py-24"
    >
      <div className="mb-8 sm:mb-12">
        <p className="mb-4 text-xs font-bold tracking-[0.2em] text-still-muted">
          SELECTED WORK
        </p>
        <h2 className="m-0 text-[clamp(2rem,4vw,3.5rem)] font-normal leading-tight">
          Recent photographs
        </h2>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" aria-label="Filter photographs">
        {filters.map((filter) => {
          const isActive = activeFilter === filter
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveFilter(filter)}
              className={`border px-4 py-2 text-sm transition-colors ${
                isActive
                  ? 'border-still-text bg-still-text text-still-background'
                  : 'border-still-muted/50 bg-transparent text-still-text hover:border-still-accent hover:text-still-accent'
              }`}
            >
              {filter}
            </button>
          )
        })}
      </div>

      <p className="mb-4 text-xs text-still-muted" aria-live="polite">
        Showing {filteredPhotos.length} of {photographs.length} photographs
        {savedPhotos.length > 0 && ` · ${savedPhotos.length} liked`}
      </p>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:auto-rows-[240px] sm:grid-cols-2 lg:auto-rows-[280px] lg:grid-cols-3">
        {filteredPhotos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            isSaved={savedPhotos.includes(photo.id)}
            onToggleSaved={toggleSaved}
          />
        ))}
      </div>
    </section>
  )
}
