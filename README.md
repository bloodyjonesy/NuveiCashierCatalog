# Nuvei Cashier Catalog

Internal tool to display and test Nuvei hosted payment page (cashier) themes.

## Features

- **Catalog**: Grid of saved themes with screenshot thumbnails
- **Add theme**: Enter theme ID and name, load preview in iframe, save (screenshot taken server-side)
- **View / Test**: Open a theme in an iframe and run a test payment (new or returning customer)
- **Credentials**: Use demo credentials (server env) or your own (stored in browser only)

## Setup

1. Install dependencies: `npm install`
2. Install Playwright Chromium (for screenshot API): `npx playwright install chromium`
3. Copy `.env.example` to `.env.local` and optionally set:
   - `NUVEI_MERCHANT_ID`, `NUVEI_MERCHANT_SITE_ID`, `NUVEI_SECRET_KEY` for demo credentials
   - `NEXT_PUBLIC_APP_URL` for notify_url (e.g. `https://your-app.railway.app`)

## Run

- `npm run dev` — development
- `npm run build && npm run start` — production

## Deploy (Railway)

1. Connect the repo to Railway.
2. Set env vars (paste values with no trailing spaces or newlines; the app trims them automatically):
   - `NUVEI_MERCHANT_ID` — e.g. `6505371860607581795`
   - `NUVEI_MERCHANT_SITE_ID` — e.g. `217938`
   - `NUVEI_SECRET_KEY` — your secret key
   - `NEXT_PUBLIC_APP_URL` — your Railway app URL (e.g. `https://yourapp.railway.app`) for payment notify_url
3. Set the domain port to **3000** (or whatever `PORT` is set to).
4. Deploy; use the default `*.railway.app` domain.
5. Open **/test** to build a payment link from demo credentials and confirm “invalid merchant id” is resolved.

Data (themes, customers) is stored in `data/*.json` and screenshots in `public/themes/`. On Railway, the filesystem is ephemeral unless you add a volume; consider persisting `data/` and `public/themes/` if needed.
