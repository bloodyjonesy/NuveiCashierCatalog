# Nuvei Cashier Catalog

Internal tool to display and test Nuvei hosted payment page (cashier) themes.

## Features

- **Catalog**: Grid of saved themes with screenshot thumbnails
- **Add theme**: Enter theme ID and name, load preview in iframe, save (screenshot taken server-side)
- **View / Test**: Open a theme in an iframe and run a test payment (new or returning customer); pre-deposit DMN response (accept / decline / decline with message) is configurable on the page
- **Credentials**: Use demo credentials (server env) or your own (stored in browser only). Credentials panel shows **Integration URLs** (DMN URL, Pre-deposit DMN URL) to configure in your Nuvei account
- **DMNs**: POST `/api/dmn` receives DMNs; received notifications are shown under the iframe on View & Test. Pre-deposit: POST `/api/pre-deposit-dmn` with configurable accept/decline response

## Setup

1. Install dependencies: `npm install`
2. Install Playwright Chromium (for screenshot API): `npx playwright install chromium`
3. Copy `.env.example` to `.env.local` and set:
   - `NUVEI_MERCHANT_ID`, `NUVEI_MERCHANT_SITE_ID`, `NUVEI_SECRET_KEY` for demo (sandbox) credentials. Example sandbox: Merchant ID `6505371860607581795`, Site ID `231378`; set your sandbox Secret Key.
   - Default payment page URL is **sandbox** (`https://ppp-test.safecharge.com/ppp/purchase.do`). For production, set `NUVEI_PPP_BASE_URL` and `NEXT_PUBLIC_NUVEI_PPP_BASE_URL` to `https://secure.nuvei.com/ppp/purchase.do`.
   - `NEXT_PUBLIC_APP_URL` for notify_url (e.g. `https://your-app.railway.app`).
   - Optional: `DATABASE_URL`, `DATABASE_PRIVATE_URL`, or `DATABASE_PUBLIC_URL` for PostgreSQL theme catalog persistence (see Database below).

## Run

- `npm run dev` — development
- `npm run build && npm run start` — production

## Database (theme catalog persistence)

Themes can be stored in **PostgreSQL** so the catalog survives redeploys. Without a DB, themes are stored in `data/themes.json` (ephemeral on Railway).

- **Enable**: Set one of `DATABASE_URL`, `DATABASE_PRIVATE_URL`, or `DATABASE_PUBLIC_URL` to your Postgres connection string (e.g. on Railway, link the Postgres service and add a variable like `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`).
- **Check where data is stored**: Open **GET `/api/storage-mode`** in the browser (e.g. `https://your-app.railway.app/api/storage-mode`). It returns `mode: "database"` or `"file"` and which env vars are set (no secrets). If you see `"file"` on Railway, add the DB variable from your Postgres service and redeploy.
- **Table**: The app creates a `themes` table automatically on first use (id, theme_id, name, screenshot_path, screenshot_base64).

Customers remain in `data/customers.json`. Screenshot files go to `public/themes/` (ephemeral unless you persist them).

## Deploy (Railway)

1. Connect the repo to Railway.
2. **Screenshot API (Save theme):** If you see `libglib-2.0.so.0: cannot open shared object file`, use the **Dockerfile** for build. In Railway: Settings → Build → set builder to **Dockerfile**. The Dockerfile installs Chromium with system deps (`playwright install chromium --with-deps`) so the screenshot API works.
3. Set env vars (paste values with no trailing spaces or newlines; the app trims them automatically):
   - `NUVEI_MERCHANT_ID` — sandbox e.g. `6505371860607581795`
   - `NUVEI_MERCHANT_SITE_ID` — sandbox e.g. `231378`
   - `NUVEI_SECRET_KEY` — your sandbox secret key
   - `NEXT_PUBLIC_APP_URL` — your Railway app URL (e.g. `https://yourapp.railway.app`) for payment notify_url
   - **Theme catalog persistence:** Add a variable from your Postgres service (e.g. `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` or `DATABASE_PRIVATE_URL` = `${{Postgres.DATABASE_PRIVATE_URL}}`). Then open `/api/storage-mode` to confirm `mode` is `database`.
   - Default is **sandbox** base URL (`ppp-test.safecharge.com`). For production, set `NUVEI_PPP_BASE_URL` and `NEXT_PUBLIC_NUVEI_PPP_BASE_URL` to `https://secure.nuvei.com/ppp/purchase.do`.
4. Set the domain port to **3000** (or whatever `PORT` is set to).
5. Deploy; use the default `*.railway.app` domain.
6. Open **/test** to build a payment link from demo credentials and confirm “invalid merchant id” is resolved.
