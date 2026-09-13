# smartaware-frontend

Next.js frontend for the SmartAWARE public website, Customer Portal and Admin
Portal.

This is a **standalone repository**. The backend (`smartaware-backend`) is a
separate repo with a separate deploy. This app talks to it purely over HTTP —
there are no shared packages and no local imports across the two repos. The
only contract is the backend's OpenAPI schema, from which this repo generates
its TypeScript client.

## Requirements

- Node.js 20+
- A running `smartaware-backend` (default `http://localhost:8000`)

## Local setup

```bash
cp .env.example .env.local
npm install
npm run gen:api        # generate the typed client from the backend schema
npm run dev            # http://localhost:3000
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint |
| `npm run gen:api` | Regenerate the API client from a running backend |
| `npm run gen:api -- ../smartaware-backend/openapi.json` | Regenerate from an exported file (no server needed) |
| `npm run gen:api:check` | Regenerate and fail if the result differs — use in CI |

## The API contract

`src/lib/api/schema.d.ts` is **generated** by `openapi-typescript` from the
backend's `/openapi.json`. Never edit it by hand.

It *is* committed, so builds and CI never require a live backend. To keep it
honest, `npm run gen:api:check` regenerates and fails on any diff — run it in
CI so a backend change the frontend hasn't absorbed breaks the build instead of
breaking production.

Endpoint modules in `src/lib/api/` derive their types from that schema rather
than declaring them (see `health.ts` for the pattern), so a backend field
rename surfaces as a TypeScript error.

## Rendering

Public pages are server-rendered per request rather than prerendered at build
time. They are assembled entirely from the API, so static generation would make
every build — CI, preview deploys, rollbacks — depend on a reachable backend and
fail outright without one. It would also delay content edits until the next
revalidation. Server rendering still delivers complete HTML to crawlers, which
is what the SEO requirement actually needs.

`npm run build` therefore does **not** require a running backend. Only
`npm run gen:api` does, and that has an offline form.

The portal and admin areas are client-rendered behind the session, since the
server has no way to know who the viewer is — the access token lives in memory
and the refresh token in an httpOnly cookie.

## Architecture notes

**The role-based UI is a convenience, not a security boundary.** Route guards
and conditional rendering exist so users aren't shown things they can't use.
Every actual permission and client-data scope is enforced by the backend. Next's
Proxy (`proxy.ts`, formerly middleware) is used only for optimistic redirects —
the Next.js docs are explicit that it is not a session or authorization layer.

**Auth.** The refresh token is an httpOnly cookie set by the backend; the
short-lived access token is held in memory only. Nothing durable goes into
`localStorage`, so an XSS bug cannot steal a lasting session. This requires the
backend's `CORS_ALLOWED_ORIGINS` to name this origin exactly, and in production
both apps must sit under one registrable domain (`app.` / `api.`).

**Content is not hardcoded.** FAQ, services, About Us copy, contact details,
form fields and wizard questions are fetched from the backend and edited in the
Admin Portal.

**Logo.** `src/components/brand/Logo.tsx` renders three variants from the
supplied artwork: `full` (wave + wordmark + tagline), `wordmark` (no tagline,
for the 64px app headers where the tagline would be unreadable) and `mark`
(the wave alone, used for the favicon).

The supplied file was an opaque JPEG. `scripts/derive-logo-assets.py`
regenerates the transparent, cropped PNGs in `public/brand/` from it —
background removal is a flood fill inward from the borders, not a global
white-to-transparent, because AWARE is drawn as outlined letters with white
fill that must survive. The untouched original is kept at
`public/brand/logo-source.jpeg`. If SmartAWARE supplies official variants
(ideally SVG), replace the files in `public/brand/`.

**Design tokens.** Brand colours and typography live in `src/styles/tokens.css`
and are exposed to Tailwind as semantic utilities (`bg-primary`, `text-muted`).
Components reference those, never raw hex values. The current palette was
sampled from the supplied logo artwork and is pending confirmation of the
official brand HEX codes.

## Next.js version

This project runs **Next.js 16**, which renames `middleware.ts` to `proxy.ts`
and makes route `params` a `Promise` that must be awaited. `AGENTS.md` (and the
docs bundled in `node_modules/next/dist/docs/`) are the authority — consult them
rather than relying on older Next.js knowledge.
