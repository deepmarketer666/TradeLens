# TradeLens — Trading Journal

Next.js 15 + PostgreSQL (Prisma) trading journal with username/password login, in-browser
screenshot OCR, per-user data isolation, public read-only share links and CSV / PNG / PDF export.

## Deploy on Render (Blueprint — recommended)

1. Push this folder to a GitHub/GitLab repo. **Commit `package-lock.json`** (the build uses `npm ci`).
2. In Render: **New → Blueprint**, pick the repo. Render reads `render.yaml` and creates:
   - `tradelens` web service (Node, free plan, Singapore region)
   - `tradelens-db` PostgreSQL database (free plan)
3. Click **Apply**. No environment variables to fill in:
   - `DATABASE_URL` is wired from the database automatically
   - `NEXTAUTH_SECRET` is generated automatically
   - `NEXTAUTH_URL` is taken from Render's `RENDER_EXTERNAL_URL` at start-up
4. Open `https://<your-service>.onrender.com`, register, and start journaling.

The database schema is synced by `prisma db push` each time the service starts (see `scripts/start.sh`).

**Custom domain:** add the domain in Render, then set `NEXTAUTH_URL=https://your-domain.com` on the web service.

### Manual setup (without Blueprint)
- Create a Render PostgreSQL database (same region as the web service).
- Create a Web Service → Runtime **Node**
  - Build command: `npm ci --include=dev && npm run build`
  - Start command: `npm start`
  - Health check path: `/api/health`
- Environment: `DATABASE_URL` (the database's *Internal* URL), `NEXTAUTH_SECRET`
  (long random string, e.g. `openssl rand -base64 32`), `NODE_VERSION=22`.

### Free-plan notes
- Free web services sleep after ~15 min idle; the first request afterwards is slow.
- Free Render PostgreSQL databases expire after 30 days unless upgraded. Export your CSV regularly
  or upgrade the database plan.

## Local development

```bash
cp .env.example .env      # set DATABASE_URL and NEXTAUTH_SECRET
npm install
npx prisma db push
npm run dev
```

Or with Docker: `docker compose up --build` → http://localhost:3000

## Project layout

```
app/                 pages and API routes (App Router)
  api/trades         create / list / delete trades
  api/share          create / read / revoke the public link
  api/export         CSV export
  public/[token]     public read-only journal
components/          shared Metrics and TradeTable
lib/                 auth, prisma, validation, stats, OCR parser, market sessions
prisma/schema.prisma database schema
scripts/start.sh     production start (env checks, schema sync, next start)
render.yaml          Render Blueprint
```

## How sessions are calculated
Pick the timezone the screenshot's time is shown in (your local time, or your broker's server
time, often UTC+2/UTC+3). The app converts it to real time and checks which markets are open in
their own local hours (Tokyo 09–18, London 08–17, New York 08–17, Sydney 07–16), so daylight
saving is handled automatically. Overlaps show as e.g. `London / New York`.
