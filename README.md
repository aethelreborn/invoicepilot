# InvoicePilot

Invoice follow-up for freelancers. You enter an invoice, the app sends the reminders
you would otherwise put off, and the sequence stops when the invoice is paid.

## What it does

- Five-step reminder sequence: three days before the due date, on the due date, then
  at 3, 7, and 14 days overdue. Offsets and tone are editable.
- Per-client tone: friendly, firm, or final.
- Reminders stop when you mark an invoice paid.
- AR aging dashboard: outstanding, overdue, paid this month, average days to pay.
- A public page per invoice. The client can claim payment; only you can mark it paid.
- CSV import and export, client records, multi-currency (INR default, plus USD, EUR, GBP, AED, SGD, AUD, CAD, NZD).
- Account data export and deletion from settings.
- Client payments: UPI QR (manual confirmation), Razorpay, Stripe, YouPI, or a custom
  signed webhook. A signed webhook or the freelancer's confirmation closes the invoice.
- Admin panel for users, invoice payments, and platform subscription approvals.
- Platform subscription billing collected by UPI (Starter, ₹799/month).

InvoicePilot never holds invoice money. Each freelancer connects their own payout
account; the platform only collects its own subscription fee.

## Stack

- Next.js 16.4 (App Router) + React 19 + Tailwind CSS 4 + TypeScript
- Supabase for Postgres, row-level security, and email/password auth
- Resend for reminder delivery (optional; bring your own key per user; without a key the
  app produces a copy-to-clipboard draft)
- Cloudflare Workers + `@opennextjs/cloudflare` for hosting (Cloudflare Pages is
  deprecated for Next.js). Vercel, Render, and Railway also work.
- Razorpay, Stripe, and YouPI are reached through `fetch` plus signed webhooks; no SDKs.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

With `NEXT_PUBLIC_SUPABASE_URL` empty or set to the placeholder value, the app runs in
demo mode: any email and password signs in, and data lives in memory until the server
restarts. Set a real Supabase URL and anon key to leave demo mode.

### Database

Run the files in `supabase/migrations/` in order in the Supabase SQL editor
(`0001_init.sql`, then `0002_public_pay.sql`, then `0003_payments.sql`). They create the
tables, indexes, row-level security policies, the token-scoped functions the public pay
page uses, and the rate-limit and audit tables.

### Environment

See `.env.example`. The required values are `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. `SUPABASE_SERVICE_ROLE_KEY` is needed for the cron job,
rate limiting, and admin routes. `SECRETS_KEY` (base64, 32 bytes) encrypts stored
provider credentials; generate one with `openssl rand -base64 32`. `PLATFORM_UPI_ID` and
`PLATFORM_UPI_NAME` configure the platform's own UPI account for Starter subscriptions.
`NEXT_PUBLIC_APP_URL` is the public origin used in emails, the sitemap, and auth
redirects; leave it empty on Vercel to fall back to the deployment URL, and set it once
a custom domain is attached.

## Reminders

`GET /api/cron/reminders` walks invoices that are sent, viewed, or overdue, finds the
next step whose offset has passed, and records or sends it.

Authentication: set `CRON_SECRET` and call the route with either
`Authorization: Bearer $CRON_SECRET` (what Vercel sends automatically) or
`?secret=$CRON_SECRET` (useful for Render, Railway, or a manual curl). If `CRON_SECRET`
is unset, the route is open, so set it in production.

`vercel.json` schedules the route daily at 09:00 UTC.

## Build

```bash
npm run build
npm start
```

The build script passes `--webpack` because Turbopack's native bindings are broken on
some Windows installs. Remove the flag if your machine builds with Turbopack.

## Deploy

Vercel: import the repository, add the environment variables, and deploy. The cron in
`vercel.json` starts after the first production deploy.

Render and Railway: `render.yaml` and `railway.json` contain the same build and start
commands. Add the environment variables in the dashboard.

## Billing

Starter is ₹799/month, collected by UPI to the platform account configured in
`PLATFORM_UPI_ID`. A user requests an upgrade, scans the QR, submits the UTR, and an
admin approves it in `/admin`, which flips the user's plan to Starter. Razorpay/Stripe
checkout for the platform's own subscription is not wired; UPI is used while the
product is small.

## Security

- Disposable-email domains are blocked at signup (a seeded list plus an MX check).
- Rate limits live in Postgres and hold across serverless instances.
- Provider credentials are encrypted with AES-256-GCM using `SECRETS_KEY` and are
  never returned to the browser.
- Webhooks verify HMAC-SHA256 over the raw body with a replay window; `settle_payment`
  rejects amount or currency mismatches and is idempotent.

## Project layout

```
src/
  app/
    (marketing)/   landing, features, pricing, privacy, terms
    (app)/         dashboard, invoices, clients, settings, billing, admin
    (auth)/        login, signup
    api/           REST routes, cron, CSV import, payments, webhooks, billing
    pay/[token]/   public invoice page
  components/
  lib/
supabase/migrations/
```

## Status

Working locally in demo mode. Not yet verified against a live Supabase project, Resend,
Razorpay, Stripe, or a production domain. Run migrations 0001–0003 before testing
against a real database. Password reset and invoice PDF export are not built. The public
pay page reads and claims invoices through the SQL functions in `0002_public_pay.sql`
and `0003_payments.sql`.

## License

All rights reserved. This is a commercial product, not an open-source project.
