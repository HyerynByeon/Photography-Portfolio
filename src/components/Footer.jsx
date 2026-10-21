export default function Footer() {
  return (
    <footer className="flex flex-col items-start gap-3 px-[5%] py-8 text-xs text-still-muted sm:flex-row sm:items-center sm:justify-between">
      <p className="m-0">© 2026 Still Photography</p>
      <a className="transition-colors hover:text-still-accent" href="#home">
        Back to top ↑
      </a>
    </footer>
  )
}
