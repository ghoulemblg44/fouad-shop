# Fouad Shop — Full Stack Clothing Store

Node.js + Express + MongoDB backend, vanilla HTML/CSS/JS storefront, and a
Shopify-style admin dashboard. This README covers setup, the new
integrations (Cloudinary image hosting), and the full API reference.

## ⚠️ Read this first: rotate your database password

Your `.env` file (with your real MongoDB Atlas username/password) was at
some point committed to git history in this project, and `package.json`
points to a public-looking GitHub repo (`ghoulemblg44/fouad-shop`). If that
repo is public, **your database credentials may already be exposed on the
internet**, independent of anything else in this project.

Do this now, not after testing everything else:
1. In MongoDB Atlas → Database Access, change the password for `ghoulemadmin`
   (or delete that user and create a new one).
2. Update `MONGO_URI` in your `.env` with the new password.
3. `.env` is in `.gitignore` so it won't be committed again — but rewriting
   git history to remove old commits is a separate, optional step if the
   repo is public (`git filter-repo` or BFG Repo-Cleaner can do this).

## What changed in this update

- **Admin dashboard** — full rewrite as a single-page app (`admin.html` +
  modular `admin/*.js`): Dashboard Home, Products, Orders, Customers,
  Statistics, Settings, all switching without a page reload. Modern
  Shopify-inspired UI (`admin.css`).
- **Products** — Cloudinary image hosting (with automatic fallback to local
  disk if not configured), sizes, stock, category, featured badge.
- **Orders** — full customer info per card, itemized breakdown, delivery
  price, colored status badges, one-click status workflow buttons.
- **Customers** — new page, aggregated from orders (no separate signup flow
  exists, so a "customer" = a distinct phone number across orders).
- **Statistics** — new page with Chart.js: daily/monthly sales, top
  products, units sold.
- **Settings** — store name, delivery price, currency, logo, banner — all
  read live by the storefront via `/api/settings`.
- **Checkout** — customers fill name/phone/wilaya/address/notes + payment
  method. The order is saved directly to MongoDB and a confirmation is
  shown on-screen — no WhatsApp redirect, no email step.
- **Search** — live search, category filter, price range, featured filter,
  newest/price sort — all on the storefront.

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values below
```

### Required
- `MONGO_URI`, `JWT_SECRET` — see `.env.example` for how to generate a secret.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`, then run `npm run seed:admin` to
  create your admin login (used at `/admin.html`).

### Optional but recommended for production

**Cloudinary** (image hosting — without this, uploaded images are wiped on
every Render redeploy):
1. Sign up free at https://cloudinary.com/users/register/free
2. Copy Cloud name / API key / API secret from your Dashboard home page
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

Start the server:
```bash
npm run dev     # nodemon, auto-restart
npm start       # plain node
```

Deploy notes for **Render**: add all the same env vars in the Render
dashboard under your service → Environment. Node 18+ is required (already
pinned in `package.json` → `engines`).

## Project structure

```
admin.html / admin.css / admin/*.js   Admin dashboard (SPA, no framework)
index.html / script.js / style.css    Storefront
product.html / product.js             Product detail page (fetches by ?product=id)

backend/
  config/            db.js (Mongo), cloudinary.js
  controllers/       products, orders, auth, dashboard, upload, settings, customers
  middleware/        auth (JWT), error handling, async wrapper, sanitize, multer upload
  models/            Product, Admin, Order, Settings
  routes/            Express routers, mounted in server.js
  seed/createAdmin.js
  server.js
```

## API Reference

All responses are JSON. Protected routes require header:
`Authorization: Bearer <token>` (token comes from `/api/auth/login`).

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | `{ username, password }` → `{ token, admin }` |
| GET | `/api/auth/me` | Protected | Current admin profile |

### Products
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/products` | Public | List products. See query params below |
| GET | `/api/products/:id` | Public | Get one product |
| POST | `/api/products` | Protected | Create product |
| PUT | `/api/products/:id` | Protected | Update product |
| DELETE | `/api/products/:id` | Protected | Delete product |

`GET /api/products` query params (all optional): `search`, `category`,
`featured` (`true`), `minPrice`, `maxPrice`, `sortBy` (`name`|`price`|`createdAt`),
`order` (`asc`|`desc`), `page`, `limit` (adding either turns the response
into `{ products, currentPage, totalPages, totalCount }` instead of a plain array).

### Orders
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/orders` | Public | Customer places an order at checkout. Saved to MongoDB only. |
| GET | `/api/orders` | Protected | List orders (`?status=`, `?search=`, `?page=`, `?limit=`) |
| GET | `/api/orders/:id` | Protected | Get one order |
| PATCH | `/api/orders/:id/status` | Protected | `{ status }` — pending / processing / shipped / delivered / cancelled |
| DELETE | `/api/orders/:id` | Protected | Delete an order |

### Customers
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/customers` | Protected | Aggregated customer list (grouped by phone), `?page=`, `?limit=` |

### Dashboard
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | Protected | Home page cards: totals, revenue, low stock, recent orders |
| GET | `/api/dashboard/statistics` | Protected | Daily/monthly sales, top products, units sold |

### Settings
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/settings` | Public | Store name, currency, delivery price, logo, banner |
| PUT | `/api/settings` | Protected | Update any of the above |

### Upload
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/upload` | Protected | `multipart/form-data`, field `image` → `{ imageUrl, provider }` |
| DELETE | `/api/upload/:publicId` | Protected | Removes a Cloudinary image (URL-encode the publicId) |

## Security features included
- Helmet (secure HTTP headers)
- CORS (configurable via `CLIENT_URL`)
- Rate limiting (general API + stricter on login)
- Custom input sanitization against NoSQL injection (see note in
  `middleware/sanitize.js` about why `express-mongo-sanitize` was avoided —
  it's incompatible with Express 5's read-only `req.query`)
- Passwords hashed with bcrypt, never returned by the API
- JWTs for admin sessions, all product-mutating and order-management routes protected
- File upload restricted by MIME type and 5MB size limit
- Server recomputes order totals from item prices — never trusts a client-sent total
- Centralized error handler that never leaks stack traces in production
