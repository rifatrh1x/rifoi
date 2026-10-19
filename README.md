# RIFOI — Online Shopping in Bangladesh

**Brand:** RIFOI — *For your needs Rifoi*
**Stack:** Next.js 16 (App Router) + TypeScript + PostgreSQL + Drizzle ORM + Tailwind CSS
**Currency:** Bangladeshi Taka (BDT ৳) • **Language:** English (`lang="en"`)

## Features

- Premium storefront: homepage, shop with search/filters/sort, product pages with gallery + zoom + variants
- Cart (guest), checkout with bKash / Nagad / Rocket (manual, same number 01312812139) + Cash on Delivery
- Coupon codes, delivery fees, free-shipping threshold, order tracking
- WhatsApp integration (floating button, product enquiry, order-to-WhatsApp) — number configurable in admin
- Facebook page link, Open Graph + product structured data, sitemap, robots.txt
- Contact page with saved enquiries, editable About/FAQ/Shipping/Return/Privacy/Terms pages
- Secure owner admin dashboard at `/admin` — products, images, variants, categories, banners,
  coupons, orders, shipping zones, pages, messages, settings, reports. No coding needed.

## Quick Start (Local Development)

```bash
npm install
cp .env.example .env
# edit .env → set DATABASE_URL, ADMIN_SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npx drizzle-kit push
node scripts/seed.mjs
npm run dev
```

- Store: http://localhost:3000
- Admin: http://localhost:3000/admin

### Initial Admin Login

Set in `.env` before seeding (defaults if not set):

- Email: `ADMIN_EMAIL` (default `owner@rifoi.com`)
- Password: `ADMIN_PASSWORD` (default `Rifoi@2026#Secure`)

**Change the password after first login:** Admin → Settings & Payments → Security.

## Project Structure

```
src/
  app/            Storefront + admin pages + API routes
  components/     Header, Footer, ProductCard, admin dashboard modules
  db/             schema.ts (Drizzle), index.ts (pool), seed.ts
  lib/            auth (JWT sessions), settings, store (cart/wishlist), utils
scripts/seed.mjs  Initial seed (admin, categories, settings, pages, zones, banners)
public/uploads/  Uploaded product images (created automatically)
```

## Key Commands

| Command            | Purpose                              |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Local development server             |
| `npm run build`    | Production build                     |
| `npm start`        | Run production build                 |
| `npx drizzle-kit push` | Apply schema to database         |
| `node scripts/seed.mjs` | Seed initial data (safe to re-run) |

## Environment Variables

See `.env.example`. Required: `DATABASE_URL`, `ADMIN_SESSION_SECRET` (min 32 random chars in production).

## Deployment

See **DEPLOYMENT.md** for production build, database setup, domain + HTTPS, and image-storage notes.
