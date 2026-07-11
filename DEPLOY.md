# Deploying (Vercel + Neon, both free tier — $0/month)

This app is sized for ~9 local churches submitting one report a month, plus occasional
admin review. That's comfortably within both platforms' free tiers, so no paid plan
should be needed.

## 1. Create a Neon Postgres project

1. Go to [neon.tech](https://neon.tech) and create a free account/project.
2. In the project dashboard, grab **two** connection strings:
   - The **pooled** connection string (has `-pooler` in the hostname) → this becomes `DATABASE_URL`.
   - The **direct** connection string → this becomes `DIRECT_URL`.
3. Append `&pgbouncer=true&connection_limit=1` to the pooled `DATABASE_URL`. This avoids a
   known Prisma + PgBouncer issue ("prepared statement already exists") that shows up
   under serverless connection pooling — see the note in `.env.example`.

## 2. Create the Vercel project

1. Push this repo to GitHub (or your git host of choice).
2. In Vercel, "Add New Project" → import the repo. Framework preset: Next.js (auto-detected).
3. Stay on the free **Hobby** plan.
4. Add environment variables (Project Settings → Environment Variables), for both
   Production and Preview:
   - `DATABASE_URL` — the pooled Neon connection string from step 1
   - `DIRECT_URL` — the direct Neon connection string from step 1
   - `HPCI_ADMIN_PASSPHRASE` — the real leadership passphrase (not the dev default)
   - `HPCI_SESSION_SECRET` — a random 32+ byte string, e.g. `openssl rand -base64 32`

`npm run build` already runs `prisma generate` via the `postinstall` script, so Vercel's
build step needs no extra configuration for that part.

## 3. Apply the schema to the production database

Migrations are **not** run automatically on every deploy (a failed migration mid-deploy
with no rollback tooling is riskier than a deliberate manual step). Before the first
deploy — and after any future schema change — run, from your machine:

```bash
DATABASE_URL="<neon pooled url>" DIRECT_URL="<neon direct url>" npx prisma migrate deploy
```

Then seed the 9 known churches once:

```bash
DATABASE_URL="<neon pooled url>" DIRECT_URL="<neon direct url>" npm run db:seed
```

## 4. Deploy

Push to the branch Vercel is tracking (or click Deploy in the dashboard). Once live,
visit `/submit` to confirm the form loads, and `/dashboard` to confirm the passphrase
gate works with your real `HPCI_ADMIN_PASSPHRASE`.

## Cost notes

- **Vercel Hobby**: free. This app's traffic (a handful of requests per church per month,
  plus admin browsing) is far below Hobby's limits.
- **Neon free tier**: 0.5 GB storage, autosuspend compute. Data volume here is kilobytes
  to low megabytes per year — nowhere close to the cap.
- No blob/object storage is used (CSV uploads are parsed and only the structured data is
  stored, not the raw file), and there are no background/cron jobs.
- Revisit this if the network grows from ~9 churches to dozens/hundreds — until then, $0/month.
