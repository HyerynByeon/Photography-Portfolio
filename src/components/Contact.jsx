import { useState } from 'react'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
  }

  return (
    <section
      id="contact"
      className="grid min-w-0 grid-cols-1 gap-10 bg-still-surface px-[5%] py-20 sm:gap-12 sm:py-24 md:grid-cols-2 lg:gap-20 lg:py-28"
    >
      <div>
        <p className="mb-5 text-xs font-bold tracking-[0.2em] text-still-muted">
          GET IN TOUCH
        </p>
        <h2 className="mt-0 mb-0 text-[clamp(2.5rem,5vw,5rem)] font-normal leading-none">
          Let's create
          <br />
          something together.
        </h2>
      </div>

      <form className="w-full max-w-[600px] min-w-0" onSubmit={handleSubmit}>
        <div className="mb-6 flex min-w-0 flex-col">
          <label htmlFor="name" className="mb-2 text-sm font-bold">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Your name"
            required
            className="w-full min-w-0 border border-still-muted bg-still-background p-4 text-still-text outline-none focus:border-still-accent"
          />
        </div>

        <div className="mb-6 flex min-w-0 flex-col">
          <label htmlFor="email" className="mb-2 text-sm font-bold">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="your@email.com"
            required
            className="w-full min-w-0 border border-still-muted bg-still-background p-4 text-still-text outline-none focus:border-still-accent"
          />
        </div>

        <div className="mb-6 flex min-w-0 flex-col">
          <label htmlFor="message" className="mb-2 text-sm font-bold">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            placeholder="Tell me about your project..."
            required
            className="w-full min-w-0 resize-y border border-still-muted bg-still-background p-4 text-still-text outline-none focus:border-still-accent"
          />
        </div>

        <button
          type="submit"
          className="inline-block border border-still-text px-6 py-3.5 text-still-text transition-colors hover:bg-still-text hover:text-still-background"
        >
          Send message
        </button>

        {submitted && (
          <p className="mt-4 text-sm text-still-text" role="status">
            Thanks for reaching out! This demo form does not send an email yet.
          </p>
        )}
      </form>
    </section>
  )
}
