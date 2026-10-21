export default function SaveToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="absolute right-3 top-3 rounded-full bg-still-background/95 px-3 py-2 text-xs text-still-text shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-still-accent"
    >
      {checked ? '♥ Liked' : '♡ Like'}
    </button>
  )
}
