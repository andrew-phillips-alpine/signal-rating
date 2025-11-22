## Architecture
- Next.js App Router (static export) in `/app`; static assets in `/public`.
- Custom Node server (`server.js`) serves `out/` and handles `/api` routes.
- Blocks:
  - `/blocks/logic/scoring.ts` — scoring + pattern detection.
  - `/blocks/logic/pdf.ts` — PDF generation orchestrator.
  - `/blocks/storage/submissions.ts` — JSON-backed submission store.
  - `/blocks/communication/error-alert.js` — shared error alert hook.
- Shared types: `app_shared/types.ts` (Zod schemas for request/response + blocks).
- Env loader: `app/config/env.js` (server-side env only).

## Routes
- `POST /api/wizard` → validate payload -> scoring block -> persist -> return scores/patterns.
- `GET /api/submissions` → read store with optional filters (cohort/sector/date).
- `POST /api/generate-pdf` → validate payload -> PDF block -> return download URL.
- Static frontend served from `out/`; SPA fallback in server.js.

## Deployment
- Dockerfile multi-stage (build -> runner). Prod port 3000.
- docker-compose with Traefik labels and env injection.
- GitHub Actions workflow builds/pushes GHCR and deploys to Hetzner.

## Design system
- Retains Alpine dark theme from `app/styles/globals.css` (navy/cyan/blue palette).
- Assets: `public/alpine-logo.png`, `public/alpine-logo-dark.png`.

## Failure modes
- API errors: caught, logged, alert via error-alert block, return 503 JSON.
- Storage I/O failure: return safe empty payload and emit alert.
- PDF generation failure: responds with 503 and logs.

## Runtime notes
- No Next.js API routes; all server logic lives in `server.js`.
- Node imports are relative (no module-alias).
- Env required: `FORM_ENDPOINT`, `SENDGRID_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`, `APP_NAME`, `PORT` (default 3000).
