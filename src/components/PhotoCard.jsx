import SaveToggle from './SaveToggle'

const sizeClasses = {
  large: 'sm:col-span-2 sm:row-span-2',
  tall: 'sm:row-span-2',
  wide: 'sm:col-span-2',
  normal: '',
}

export default function PhotoCard({ photo, isSaved, onToggleSaved }) {
  return (
    <figure className={`m-0 min-w-0 overflow-hidden ${sizeClasses[photo.size]}`}>
      <div className="group relative h-[280px] overflow-hidden bg-still-surface sm:h-full sm:min-h-[240px]">
        <img
          src={photo.image}
          alt={photo.alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <SaveToggle
          checked={isSaved}
          onChange={() => onToggleSaved(photo.id)}
        />
      </div>
      <figcaption className="flex items-center justify-between gap-3 py-3">
        <span className="min-w-0 truncate text-sm">{photo.title}</span>
        <span className="shrink-0 text-xs text-still-muted">
          {photo.category}
        </span>
      </figcaption>
    </figure>
  )
}
