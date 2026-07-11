# His Presence Church — Data Portal

Local church monthly reporting for His Presence Church International: a public submission form (guided form or CSV upload) and a passphrase-gated leadership dashboard with an approval workflow.

Built with Next.js (App Router), PostgreSQL, and Prisma. See `design_handoff_church_data_portal/README.md` for the original business-logic spec this app implements.

## Local development

1. Copy `.env.example` to `.env` and fill in real values (a local Postgres connection, an admin passphrase, and a session secret — see comments in the file).
2. Install dependencies: `npm install`
3. Apply the schema: `npx prisma migrate dev` (or `npx prisma db push` against a database that doesn't support shadow databases, e.g. a local ephemeral dev instance)
4. Seed the 9 known churches: `npm run db:seed`
5. Run the dev server: `npm run dev`

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm start` — production build and start
- `npm run db:migrate` — `prisma migrate dev`
- `npm run db:seed` — seed the Church table
- `npm run db:studio` — open Prisma Studio to browse the local database

## Deployment

See `DEPLOY.md` for step-by-step Vercel + Neon setup (both free tiers — this app is designed to run at $0/month for its expected usage of ~9 churches submitting once a month).

## Project structure

- `app/submit/` — public submission form (guided form + CSV upload), no auth
- `app/dashboard/` — passphrase-gated leadership dashboard (Overview, Trends, Approvals, Church Detail)
- `lib/` — business logic: CSV parsing, form validation, stats, date/format helpers, the Prisma data-access layer, and auth
- `prisma/schema.prisma` — database schema
- `components/` — UI components, grouped by area (`submit/`, `dashboard/`, `nav/`, `charts/`)
