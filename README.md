# Alpine Signal Rating (APP_FACTORY Rebuild)

Static-export Next.js lead magnet served by a custom Node server. The frontend delivers the wizard, report, and admin dashboard; the backend executes scoring, PDF generation, and notification logic via `/api` routes implemented in `server.js`.

## Quick start
```bash
npm install
npm run dev   # Next dev server
./start.sh    # Runs Next dev + server.js together
```
Frontend dev port: first free 5173–5185. Backend dev port: first free 3001–3013. Production listens on 3000.

## Build & run
```bash
npm run build    # next build && next export -> out/
npm start        # serves static out/ and APIs via server.js
```

## API endpoints
- `POST /api/wizard` — validate answers, run scoring, persist submission.
- `GET /api/submissions` — list submissions with optional filters.
- `POST /api/generate-pdf` — generate PDF report for a submission.

## Environment
Copy `.env.example` to `.env` for local dev. Runtime reads only process env via `app/config/env.js`.

Required keys: `FORM_ENDPOINT`, `SENDGRID_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`, `APP_NAME`, `PORT`.

## Deployment
- Dockerfile: multi-stage build (next export + custom server).
- docker-compose: Traefik labels, exposes 3000.
- GitHub Actions: build/push GHCR image, deploys to Hetzner.

This is a static-export app served by a custom Node server. Frontend calls backend via fetch to `/api` routes defined in `server.js`.
