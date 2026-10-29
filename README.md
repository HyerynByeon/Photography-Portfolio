# Still Photography — Assignment 3

React + Tailwind client, Express API, PostgreSQL database, persistent cookie sessions, signup/login, and user-specific likes.

https://photography-portfolio-assignment3.netlify.app/

## Folder structure

- `src/`: React frontend (Vite + Tailwind)
- `server/src/index.js`: Express routes, authentication and session setup
- `server/src/db.js`: PostgreSQL pool and database schema
- `server/scripts/seed.js`: inserts the seven original portfolio photographs into PostgreSQL
- `server/schema.sql`: human-readable database schema

## 1. Requirements

Install Node.js LTS. Create a free PostgreSQL database, for example at Neon, and copy its connection string.

## 2. Configure local environment

In the project root, create `.env` by copying `.env.example`. Set `VITE_API_URL=http://localhost:4000`.

In `server/`, copy `.env.example` to `.env`, then set:

- `DATABASE_URL`: your PostgreSQL connection string
- `SESSION_SECRET`: a long random secret; do not commit it
- `CLIENT_ORIGIN=http://localhost:5173`
- `NODE_ENV=development`

The root and server `.env` files are ignored by Git. Never put secrets in `VITE_*` variables; those are public in a frontend build.

## 3. Install and seed the database

Terminal 1, from the project root:

```bash
npm install
```

Terminal 2, from the `server` directory:

```bash
npm install
npm run seed
npm run dev
```

The API should run at `http://localhost:4000`. Test `http://localhost:4000/api/health` and `http://localhost:4000/api/photos`.

Terminal 3, from the project root:

```bash
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`).

## API routes

- `GET /api/health`: health check
- `GET /api/photos`: photographs from PostgreSQL as JSON
- `POST /api/auth/signup`: creates an account and starts a session
- `POST /api/auth/login`: verifies password and starts a session
- `GET /api/auth/me`: returns the current signed-in user (also used after refresh)
- `POST /api/auth/logout`: destroys the session
- `GET /api/likes`: returns the signed-in user's liked photo IDs
- `PUT /api/likes/:photoId`: add/remove a like (`{ "liked": true }` or false)

Passwords are hashed with bcrypt. Session records are stored in PostgreSQL by `connect-pg-simple`, not only in server memory.

## Database schema in plain English

- `users`: one row per account; the password is stored as a bcrypt hash, never plain text.
- `photographs`: the seven portfolio images and their titles/categories/alt text/layout sizes.
- `user_likes`: join table linking a user to a photograph; the combined primary key prevents duplicate likes.
- `user_sessions`: created/managed by `connect-pg-simple`; stores login sessions in PostgreSQL so they survive page refreshes and server restarts.

## Deployment overview

1. Push this project to your existing Assignment 2 GitHub repository. Do not create a new repository.
2. Create a Railway service for the `server` directory. Set `DATABASE_URL`, `SESSION_SECRET`, `CLIENT_ORIGIN` (your Vercel URL), and `NODE_ENV=production`. Railway's `PORT` is provided automatically. Run `npm install` in the server directory and start command `npm start`.
3. Create a Vercel project from the same repository, with the project root set to the repository root. Add `VITE_API_URL` set to the Railway public URL (no trailing slash), then deploy.
4. Update Railway's `CLIENT_ORIGIN` to the exact Vercel origin (for example `https://your-site.vercel.app`), redeploy/restart the API, and run the seed script once against the production database (`npm run seed` from `server`).
5. In Railway, make sure the server uses the same production `DATABASE_URL` as the seed script. Test the live `/api/health`, `/api/photos`, signup, refresh, sign-out and sign-in.
6. Confirm `git status --ignored` shows `.env` files ignored. Never commit `.env` values or post them in screenshots.

If your frontend and API are on different hosts, the browser must allow the API's cross-site session cookie. This project sets `SameSite=None; Secure` in production and enables credentialed CORS for the exact configured frontend origin. Use HTTPS for both deployed URLs.
