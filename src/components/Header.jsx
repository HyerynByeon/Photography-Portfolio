const navLinks = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-still-surface bg-still-background px-[5%] py-5 sm:py-6">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-[1400px] items-center justify-between gap-4"
      >
        <a
          href="#home"
          className="shrink-0 text-xl font-bold tracking-[0.15em] sm:text-[1.4rem]"
        >
          STILL.
        </a>

        <ul className="m-0 flex list-none items-center gap-3 p-0 sm:gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                className="text-xs transition-colors hover:text-still-accent sm:text-sm"
                href={link.href}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
