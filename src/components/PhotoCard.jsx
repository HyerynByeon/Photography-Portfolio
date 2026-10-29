
import SaveToggle from './SaveToggle'

const sizeClasses = {
  large: 'sm:col-span-2 sm:row-span-2',
  tall: 'sm:row-span-2',
  wide: 'sm:col-span-2',
  normal: '',
}

export default function PhotoCard({
  photo,
  isSaved,
  onToggleSaved,
  onBuy,
  buying,
}) {
  return (
    <figure
      className={`m-0 flex min-w-0 flex-col overflow-hidden ${
        sizeClasses[photo.size] || ''
      }`}
    >
      <div className="group relative h-[280px] min-h-0 overflow-hidden bg-still-surface sm:h-auto sm:min-h-0 sm:flex-1">
        <img
          src={photo.image}
          alt={photo.alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        <SaveToggle
          checked={isSaved}
          onChange={() => onToggleSaved(photo.id)}
        />
      </div>

      <figcaption className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-still-background py-3">
        <div className="min-w-0">
          <span className="block truncate text-sm">
            {photo.title}
          </span>

          <span className="text-xs text-still-muted">
            {photo.category} · €
            {(Number(photo.price_cents ?? 0) / 100).toFixed(2)}
          </span>
        </div>

        <button
          type="button"
          disabled={buying}
          onClick={() => onBuy(photo)}
          className="shrink-0 border border-still-text px-3 py-2 text-xs transition hover:bg-still-text hover:text-still-background disabled:opacity-50"
        >
          {buying ? 'Loading…' : 'Buy now'}
        </button>
      </figcaption>
    </figure>
  )
}