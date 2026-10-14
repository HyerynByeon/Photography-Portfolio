# Still — Photography Portfolio (Assignment 2)

React + Vite + Tailwind CSS rebuild of the original Still Photography portfolio.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Assignment 2 checklist

- Vite + React scaffold
- Header, Hero, Gallery/main content, About, Contact, and Footer components
- Photograph data stored as an array of objects in `src/data/photographs.js`
- Tailwind CSS v4 connected through the Vite plugin; no legacy `style.css`
- Real category filter managed with `useState`
- Reusable controlled `SaveToggle` component per photograph
- Mobile-first responsive Tailwind classes
- No intended horizontal overflow
- No TypeScript or extra runtime libraries

The contact form is a front-end demo only and does not send email. Saved photos and the selected filter are kept in React state and reset on page reload.
