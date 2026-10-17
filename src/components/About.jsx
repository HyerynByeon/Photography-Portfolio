export default function About() {
  return (
    <section
      id="about"
      className="mx-auto flex max-w-[1200px] flex-col gap-5 px-[5%] py-20 sm:gap-8 sm:py-24 md:flex-row md:gap-12 lg:gap-20 lg:py-28"
    >
      <div className="md:flex-1">
        <p className="mb-4 text-xs font-bold tracking-[0.2em] text-still-muted">
          ABOUT
        </p>
      </div>
      <div className="max-w-[650px] md:flex-[2]">
        <h2 className="mt-0 mb-6 text-[clamp(2rem,4vw,3.5rem)] font-normal leading-[1.1]">
          Photography with a quiet point of view.
        </h2>
        <p className="text-base leading-relaxed text-still-muted sm:text-[1.05rem]">
          I'm a Berlin-based photographer interested in people, places, and the small details that often go unnoticed. My work focuses on natural light, honest moments, and simple compositions.
        </p>
      </div>
    </section>
  )
}
