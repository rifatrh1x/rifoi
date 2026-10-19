# RIFOI — Deployment Guide

You do **not** need a domain or paid hosting to develop and test. Deploy when ready using the steps below.

## 1. Choose Hosting

Any host that supports **Next.js + PostgreSQL** works, for example:

- **VPS (recommended for full control):** Hetzner, DigitalOcean, Contabo — run Next.js with `npm start` behind Caddy/Nginx.
- **Managed Next.js:** Vercel / Netlify + managed Postgres (Neon, Supabase, Railway).
- **Bangladesh-friendly:** any VPS + Cloudflare for DNS/CDN works well with bKash/Nagad/Rocket manual payments (no gateway server needed).

## 2. Environment Variables (Production)

Copy `.env.example` to `.env` (or set in your host's dashboard):

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/rifoi_db
ADMIN_SESSION_SECRET=<generate 32+ random characters, e.g. openssl rand -hex 32>
NEXT_PUBLIC_SITE_URL=https://www.your-domain.com
ADMIN_EMAIL=owner@rifoi.com
ADMIN_PASSWORD=<strong unique password>
```

Never commit `.env`. Never put secrets in `NEXT_PUBLIC_*` variables.

## 3. Database Setup

```bash
npm install
npx drizzle-kit push        # creates all tables
node scripts/seed.mjs       # creates admin user, categories, settings, pages
```

`seed.mjs` is idempotent (safe to re-run; it never overwrites existing data).

## 4. Production Build & Start

```bash
npm run build
npm start                   # serves on port 3000
```

With a process manager:

```bash
npm install -g pm2
pm2 start npm --name rifoi -- start
pm2 save
```

## 5. Domain + HTTPS

1. Buy your domain (e.g. from Namecheap/Cloudflare/national registrars).
2. Point DNS `A` record → your server IP (or CNAME → your Vercel/Netlify site).
3. Enable HTTPS:
   - **Caddy (easiest):** automatic HTTPS — `reverse_proxy localhost:3000`.
   - **Nginx:** use Certbot (`certbot --nginx -d your-domain.com`).
   - **Vercel/Netlify/Cloudflare:** HTTPS is automatic.
4. Set `NEXT_PUBLIC_SITE_URL=https://your-domain.com` and redeploy/restart.

## 6. Image Uploads

Product images upload to `public/uploads/` on the server and are served directly.
This works on VPS and single-server hosting. If you later move to serverless/ephemeral
hosting (Vercel), migrate uploads to object storage (S3/R2/Supabase Storage) by swapping
`src/app/api/admin/upload/route.ts` — the rest of the app already stores plain image URLs.

**Back up** the `public/uploads/` folder and the PostgreSQL database regularly.

## 7. After Going Live

1. Log in at `https://your-domain.com/admin` and **change the admin password**.
2. Upload your **official RIFOI logo** (Admin → Settings → Homepage & Brand).
3. Verify WhatsApp number, Facebook URL, payment numbers and instructions.
4. Add your real products, photos, prices and stock; publish categories.
5. Place a test order and confirm the WhatsApp + tracking flow.
6. `ADMIN_PASSWORD` in `.env` is only used by the seed script — changing the password
   in the dashboard does not require touching `.env` again.

## 8. Security Notes

- Admin sessions are HTTP-only signed cookies (7-day expiry), login is rate-limited.
- All admin APIs verify the session server-side.
- Checkout validates price/stock server-side; manual payments stay **Pending Verification**
  until you verify them in your own mobile-money account.
- Keep Node.js, Next.js and Postgres updated; restrict database access to localhost/VPC.
