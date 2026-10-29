const heroImage =
  'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=85'

export default function Hero() {
  return (
    <section
      id="home"
      className="flex min-h-[75vh] items-center bg-cover bg-center px-[5%] py-16 text-white sm:min-h-[80vh] sm:py-24 lg:py-28"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("${heroImage}")`,
      }}
    >
      <div className="w-full max-w-[650px]">
        <p className="mb-4 text-xs font-bold tracking-[0.2em] sm:mb-5">
          PHOTOGRAPHY PORTFOLIO
        </p>
        <h1 className="mb-6 text-[clamp(3.5rem,8vw,7rem)] font-medium leading-[0.95] tracking-tight">
          Stories
          <br />
          in Stillness.
        </h1>
        <p className="mb-8 max-w-[450px] text-base leading-relaxed sm:text-[1.05rem]">
          Photography capturing people, places, and quiet moments through a natural and timeless perspective.
        </p>
        <a
          href="#work"
          className="inline-block border border-white px-6 py-3.5 text-sm transition-colors duration-200 hover:border-still-text hover:bg-still-text hover:text-still-background"
        >
          Explore the work
        </a>
      </div>
    </section>
  )
}
