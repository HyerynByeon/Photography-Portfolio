# Assignment 4 — Stripe Checkout (test mode)

## What was added
- Photograph prices are stored in `photographs.price_cents` (default €5.00 for this demo).
- `orders` and `order_items` tables record each order and the price snapshot.
- `POST /api/checkout` requires a signed-in user and reads the price from PostgreSQL.
- `POST /api/stripe/webhook` verifies Stripe signatures against the raw request body. Only the verified `checkout.session.completed` event with `payment_status === 'paid'` marks an order as paid.
- Authenticated order lookup endpoints and a checkout result view are included.

## Setup
1. In `server`, install the Stripe SDK: `npm install` (this package now includes `stripe`).
2. Add these values to `server/.env` locally and to Render Environment Variables. Use **test-mode** values only while developing:
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...`
3. Keep `DATABASE_URL` and `SESSION_SECRET` private. Never commit `server/.env`.
4. Restart the server. `ensureSchema()` creates the new tables and adds `price_cents` to existing databases. The `schema.sql` file is also updated for review/pushing schema.
5. Make sure `CLIENT_ORIGIN` is the exact frontend URL. For local testing use `http://localhost:5173`; for Render use your Netlify URL.
6. For local webhook testing, install Stripe CLI and run: `stripe login`, then `stripe listen --forward-to localhost:4000/api/stripe/webhook`. Copy the printed `whsec_...` into `server/.env` as `STRIPE_WEBHOOK_SECRET` and restart the server.
7. Start the project with `npm run dev`. Sign in, click **Buy now**, and use test card `4242 4242 4242 4242`, any future expiry date, and any CVC.
8. The success page checks order status. A paid status appears only after the verified webhook arrives.

## Important production notes
- Use Stripe test keys for the assessment test transaction. Do not use live keys unless explicitly required and supervised.
- For deployed testing, configure a webhook endpoint in Stripe pointing to `https://YOUR-RENDER-HOST/api/stripe/webhook`, subscribe to `checkout.session.completed`, and set its signing secret as `STRIPE_WEBHOOK_SECRET` in Render.
- Frontend production builds use `VITE_API_URL`; rebuild and re-upload `dist` to Netlify after frontend changes.
- Current demo pricing is €5.00 per photograph, stored in the database. Adjust it intentionally if your instructor expects another price.
