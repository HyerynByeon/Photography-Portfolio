const navLinks = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

export default function Header({ user, onSignIn, onSignOut }) {
  return (
    <header className="sticky top-0 z-50 border-b border-still-surface bg-still-background px-[5%] py-5 sm:py-6">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
        <a href="#home" className="shrink-0 text-xl font-bold tracking-[0.15em] sm:text-[1.4rem]">STILL.</a>
        <div className="flex min-w-0 items-center gap-3 sm:gap-7">
          <ul className="m-0 flex list-none items-center gap-3 p-0 sm:gap-6">
            {navLinks.map((link) => <li key={link.href}><a className="text-xs transition-colors hover:text-still-accent sm:text-sm" href={link.href}>{link.label}</a></li>)}
          </ul>
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span title={user.email} className="hidden max-w-32 truncate text-xs text-still-muted sm:inline">Hi, {user.name}</span>
              <button type="button" onClick={onSignOut} className="border border-still-text px-3 py-2 text-xs transition hover:bg-still-text hover:text-still-background sm:px-4 sm:text-sm">Sign out</button>
            </div>
          ) : (
            <button type="button" onClick={onSignIn} className="border border-still-text px-3 py-2 text-xs transition hover:bg-still-text hover:text-still-background sm:px-4 sm:text-sm">Sign in</button>
          )}
        </div>
      </nav>
    </header>
  )
}
