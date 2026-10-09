# Ember Home — Express + MongoDB + EJS Store (Backend)

A minimal, Apple-style white storefront for WED2C affiliate products — 6-product
catalog, protected admin, flash-sale countdown, real stock display, reviews module,
and policy pages.

## Stack
- **Node.js + Express** — server & routing
- **MongoDB + Mongoose** — `Product`, `Review`, and `Setting` models
- **EJS + Tailwind (CDN)** — white, minimalist, mobile-responsive views
- **Basic Auth** — protects the `/admin` area

## Quick start

```bash
cd backend
npm install
cp .env.example .env        # adjust MONGODB_URI / ADMIN_PASS
npm run seed                # optional: 6-product demo catalog
npm start                   # → http://localhost:3000
```

## Routes

| Method | Route                       | Auth | Purpose                            |
| ------ | --------------------------- | ---- | ---------------------------------- |
| GET    | `/`                         | —    | Storefront: grid, reviews, sale    |
| GET    | `/shipping` `/refunds` `/track` | — | Policy pages                       |
| GET    | `/admin`                    | ✔    | Dashboard: products/reviews/sale   |
| POST   | `/admin/add`                | ✔    | Create product                     |
| POST   | `/admin/edit/:id`           | ✔    | Update product (incl. compare-at, stock) |
| POST   | `/admin/delete/:id`         | ✔    | Delete product                     |
| POST   | `/admin/reviews/add`        | ✔    | Publish a customer review          |
| POST   | `/admin/reviews/delete/:id` | ✔    | Remove a review                    |
| POST   | `/admin/settings`           | ✔    | Flash-sale toggle + real end date  |

Default admin credentials: **admin / 351facebook** (change via `.env`).

## Product fields
`name` · `price` (sale price) · `compareAtPrice` (crossed-out price) · `imageUrl` ·
`description` · `wed2cLink` · `stock` (≤ 5 shows the "Only X left" line, 0 = Sold out)

## Conversion features — built to stay legal
- **Flash-sale countdown** points at a persisted end date in MongoDB. It does **not**
  reset on refresh; when it expires, the banner disappears on its own.
- **Compare-at prices** must be genuine former selling prices (FTC reference-pricing
  rule) — keep evidence of the old price.
- **Stock counts** are your real inventory: enter truthful numbers in `/admin`.
- **Reviews** are for real post-purchase feedback only. Fabricated reviews violate
  the FTC rule on Consumer Reviews (16 CFR §465, up to ~$51,000 per fake review) and
  PayPal/Stripe acceptable-use terms. This build deliberately has **no fake-purchase
  popups and no unearned security seals** — those get stores banned by processors.
- "Ships within 24 hours / 30-day returns / secure checkout" badges are factual
  store policies you must actually honor.
