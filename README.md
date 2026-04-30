# Giftly

Giftly is a mobile-first gift planning and wishlist MVP built with Next.js, TypeScript, Prisma, and a database-backed auth/session system.

## Local Development

Local development uses SQLite by default through `prisma/schema.prisma`.

```powershell
cd "C:\Users\kathr\Documents\Claude CoWork Files\Projects\Apps\giftly-app"
Copy-Item .env.example .env
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev -- --hostname 127.0.0.1 --port 3127
```

Open `http://127.0.0.1:3127`.

Demo login after seeding:

```txt
Email: demo@giftly.local
Password: giftly-demo-123
```

## Database Setup

Giftly uses two Prisma schemas so local SQLite can stay simple while production uses hosted Postgres.

- Local SQLite schema: `prisma/schema.prisma`
- Local SQLite migrations: `prisma/migrations`
- Production Postgres schema: `prisma-postgres/schema.prisma`
- Production Postgres migrations: `prisma-postgres/migrations`

Local commands:

```powershell
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:seed
```

Production migration command:

```powershell
npm.cmd run db:migrate:prod
```

## Vercel Deployment

Connect the GitHub repo to Vercel and keep the checked-in `vercel.json`. Vercel will run:

```txt
npm run vercel-build
```

That command generates Prisma Client from the Postgres schema before running the Next.js build.

### Required Vercel Environment Variables

Set these in Vercel Project Settings, for Production, Preview, and Development as needed:

```txt
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
AUTH_SECRET=generate-a-long-random-secret
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
APP_BASE_URL=https://your-vercel-domain.vercel.app
```

`AUTH_SECRET` should be a long random value. You can generate one locally with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### Production Database Migration

After Vercel has the production `DATABASE_URL`, run the Postgres migration once from your machine or a trusted deployment shell:

```powershell
cd "C:\Users\kathr\Documents\Claude CoWork Files\Projects\Apps\giftly-app"
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
npm.cmd run db:migrate:prod
```

Optional production seed:

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
npm.cmd run db:seed:prod
```

Only seed production if you intentionally want the demo account there.

## Recommended Hosted Postgres Options

- Vercel Postgres / Neon integration: easiest with Vercel projects.
- Neon: good free/low-cost serverless Postgres.
- Supabase Postgres: good if you may later use Supabase auth/storage.
- Railway Postgres: simple app-and-database hosting.
- Render Postgres: straightforward managed Postgres.

For Vercel serverless deployments, prefer a provider with pooled/serverless-friendly connection strings when available.

## MVP Routes

- `/` landing page
- `/login` and `/signup`
- `/dashboard` managed wishlist dashboard
- `/profiles` profile creation, profile list, profile reset, event dates, and QR sharing
- `/profiles/[slug]` profile-specific gift management
- `/u/[slug]` public wishlist view

## Current Implementation

- Email/password auth with scrypt password hashing
- HTTP-only cookie sessions backed by the database
- Profile ownership and gift permissions in the data layer
- Profile creation, managed profiles, vanity URLs, birthdays, anniversaries, and upcoming events
- Gift creation, editing, deleting, filtering, sorting, reservation toggle, and purchased toggle
- URL metadata auto-fill for gift details
- Public wishlist page filtered through the database query layer
- QR code generation and download
- Reservation placeholder
- Contribution modal placeholder

## Still Placeholder

- Live email/SMS invites
- Push/email reminders
- Real affiliate conversion
- Stripe payments and contribution ledger
- QR camera scanning
