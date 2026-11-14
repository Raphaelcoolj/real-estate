# Arcadia

An international luxury property marketplace built with the Next.js App Router, TypeScript, Tailwind CSS, MongoDB and Mapbox GL. Arcadia pairs editorial-grade presentation with a complete operational backend: agent listing management, admin moderation, enquiries, private viewing appointments, saved properties, comparisons and role-aware dashboards.

---

## Highlights

- **Editorial storefront** — cinematic homepage, curated district collections, featured listings, agent directory and agency profiles.
- **Search that behaves like a product** — text, transaction, type, city/district, price, bedroom, bathroom and amenity filters; grid and map views; active-filter chips; shareable URLs; pagination.
- **Map view** — Mapbox GL with clustered markers, price pins rendered from canvas, popups and optional “search as I move”.
- **Property detail** — gallery with keyboard lightbox, facts and specifications, amenities, floor plans, film, neighbourhood map, agent sidebar, enquiry and viewing dialogs, reporting, similar properties and recently-viewed tracking.
- **Three dashboards**
  - Customer: saved properties, comparisons, recently viewed, enquiries, viewings, notifications, profile.
  - Agent: portfolio, create/edit listings with image uploads, enquiry replies, viewing management, analytics and verification.
  - Admin: moderation queue, agent verification, reports, member management, platform analytics.
- **Server-first mutations** — typed Server Actions with Zod validation, rate limiting and consistent `ActionResult` envelopes.
- **Authentication** — JWT session in an httpOnly cookie, bcrypt hashing, role-based route protection via the Next 16 proxy.
- **Resilient rendering** — database reads degrade gracefully when the cluster is cold or unreachable, so marketing pages still render.
- **Demo data included** — deterministic seed with agencies, agents, 24 listings across ten districts, enquiries, viewings, saves, notifications and reports.
- **Automated verification** — 39 data-contract checks and a Vitest suite for pure utilities, URL state and validation schemas.

---

## Stack

| Layer      | Choice |
| ---------- | ------ |
| Framework  | Next.js 16.4 (App Router, Turbopack, Server Actions) |
| Language   | TypeScript 5, strict |
| Styling    | Tailwind CSS 4 (`@theme` tokens), custom design system |
| Database   | MongoDB + Mongoose 9 (GeoJSON `2dsphere` index) |
| Auth       | `jose` (HS256 JWT), `bcryptjs` |
| Validation | Zod 4 |
| Maps       | Mapbox GL JS (optional token) |
| Media      | Cloudinary when configured, local `public/uploads` otherwise |
| Tests      | Vitest 5 |

---

## Requirements

- Node.js 20.9+ (22 LTS recommended)
- npm 10+
- MongoDB 7/8 running locally or a connection string to a managed cluster
- Optional: Mapbox public token for the map view; Cloudinary credentials for remote media storage

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure the environment
cp .env.example .env.local

# 3. Start MongoDB (Homebrew/Linux example)
mkdir -p ~/.local/share/arcadia-mongodb
mongod --dbpath ~/.local/share/arcadia-mongodb --fork --logpath ~/.local/share/arcadia-mongodb/mongod.log

# 4. Generate the SVG artwork used by the demo data
npm run assets

# 5. Seed and verify
npm run seed
npm run verify

# 6. Run the app
npm run dev
```

Open <http://localhost:3000>.

> **Port note.** `.env.local` in this workspace points at `mongodb://127.0.0.1:27018/arcadia` because `27017` is occupied in the development sandbox. Use whichever port your MongoDB listens on; the `.env.example` default is `27017`.

### Required environment variables

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `MONGODB_URI` | yes | MongoDB connection string |
| `AUTH_SECRET` | yes | Signs session JWTs (use 48+ random bytes) |
| `APP_URL` | production | Canonical URL for metadata and redirects |
| `AUTH_SESSION_TTL` | no | Session lifetime in seconds (default 7 days) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | no | Enables Mapbox GL in the browser |
| `MAPBOX_TOKEN` | no | Server geocoding; falls back to the public token |
| `CLOUDINARY_*` | no | Remote image uploads; local storage otherwise |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` | no | In-memory write rate limits |

Without a Mapbox token the search page falls back to a gallery and the listing map shows a graceful placeholder. All other functionality works.

---

## Demo accounts

All seeded accounts use the password **`Arcadia!2026`**.

| Role | Email |
| ---- | ----- |
| Admin | `admin@arcadia.example` |
| Agent (London) | `ava@sterling.example` |
| Agent (Lagos) | `tunde@atlantic.example` |
| Agent (Dubai) | `julian@meridian.example` |
| Customer | `chidi@example.com` |
| Customer | `emily@example.com` |

The seed also creates pending/rejected agents (`lena@sterling.example`, `sofia@atlantic.example`) so the verification queue is populated, plus pending, draft, rejected, sold and rented listings for moderation states.

### Adding authentic data

`data/listings.json` is the drop-in point for real content. Add an array of
listings, then run `npm run import` to validate and upsert them (matched by
slug). Use `npm run import -- --dry-run` to check a file without writing.
See [`data/README.md`](data/README.md) for the field reference and a complete
example. Agents must exist first — create them via `/sign-up` and approve them
in Dashboard → Verification; imported listings reference `agentEmail`.

Admins can also work from the browser at **Dashboard → Data import**:

- **Add listing with form** (`/dashboard/import/new`) — enter genuine
  inventory through the full listing form, assign it to an active agent, and
  publish immediately, send it to moderation, or save a draft.
- **JSON import** — paste or upload the same payload, or press **Generate
  sample** to fill the editor with 6–96 synthetic listings (optionally sent to
  the moderation queue), then validate or import. The same validation and
  slug-based upsert apply.

Do not run `npm run seed` after importing real content — it drops the database.

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest suite |
| `npm run assets` | Regenerate all SVG artwork in `public/images` |
| `npm run seed` | Reset and seed the demo database |
| `npm run import` | Validate and upsert authentic listings from `data/listings.json` |
| `npm run verify` | Assert seeded data contracts (39 checks) |

Recommended pre-flight before shipping:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

---

## Routes

**Public**

| Path | Purpose |
| ---- | ------- |
| `/` | Homepage: hero, featured, collections, districts, agents |
| `/properties` | Search with filters, grid/map toggle |
| `/properties/[slug]` | Listing detail |
| `/agents`, `/agents/[slug]` | Agent directory and profile |
| `/agencies/[slug]` | Agency profile |
| `/about`, `/contact` | Brand pages |
| `/sign-in`, `/sign-up` | Authentication |

**Dashboard** (role-protected)

| Path | Roles |
| ---- | ----- |
| `/dashboard` | all |
| `/dashboard/saved`, `/recent`, `/comparisons` | customer |
| `/dashboard/enquiries`, `/inspections`, `/notifications`, `/settings` | all |
| `/dashboard/listings`, `/listings/new`, `/listings/[id]/edit` | agent, admin |
| `/dashboard/analytics` | agent, admin |
| `/dashboard/moderation`, `/verification`, `/reports`, `/users` | admin |
| `/dashboard/import`, `/dashboard/import/new` | admin |

**API**

| Route | Purpose |
| ----- | ------- |
| `GET /api/health` | Liveness + database ping |
| `GET /api/geocode?q=` | Location autocomplete (Mapbox, rate-limited) |
| `GET /api/properties/viewport` | GeoJSON-ish listing payload for map bounds |
| `POST /api/media/upload` | Authenticated image upload |

---

## Architecture notes

### Server Actions

All mutations live in `actions/` and follow one pattern:

```ts
runAction(async () => {
  await limitAction("listing-create");
  const actor = await actionRole(["agent", "admin"]);
  const parsed = parseInput(propertyInputSchema, input);
  if (!parsed.success) throw fieldError(parsed);
  return createProperty(parsed.data, actor);
});
```

- `runAction` converts thrown `AppError`s into `{ ok: false, error, fields }`.
- `actionUser` / `actionRole` read the session; `limitAction` applies rate limiting.
- Client components call actions directly and surface field errors inline.

### Data access

- `lib/services/*` is the only layer that talks to Mongoose.
- Services are `server-only`, accept a `SessionUser` where authorisation is needed, and return serialisable DTOs via `lib/mappers`.
- `lib/settle.ts` wraps service calls with fallback values so a missing database does not produce a 500 on public pages.

### Rendering

- Public pages that touch the database declare `export const dynamic = "force-dynamic"`.
- View counters and recently-viewed writes run in `after()` so they never block the response.
- Only UI primitives and interactive widgets are client components.

### Security

- Sessions are HTTP-only, SameSite=Lax cookies signed with HS256; the `proxy.ts` middleware redirects unauthenticated dashboard traffic and bounces signed-in users away from auth pages.
- Passwords are hashed with bcrypt (cost 12) and `passwordHash` is `select: false`.
- Every write action validates input with Zod and checks role/ownership in the service.
- SVG uploads are rejected; media is limited to JPEG/PNG/WebP/AVIF/GIF under 8 MB.
- Admin-only actions are guarded twice: the action checks the role, and the service re-checks it.

### Map

- `components/map/property-map.tsx` owns the Mapbox instance: a clustered GeoJSON source, canvas-generated price-pill images and DOM-built popups.
- `components/map/map-explorer.tsx` keeps the rail list in sync with the map, debounces viewport fetches and offers a “Search as I move” toggle.
- Both degrade gracefully without `NEXT_PUBLIC_MAPBOX_TOKEN`.

---

## Design system

Tokens live in `app/globals.css` under `@theme`:

- **Palette** — ivory, stone, charcoal, brass, forest, rust.
- **Type** — Cormorant Garamond for display, Manrope for interface copy, fluid `--text-display|headline|title|lead` scales.
- **Utilities** — `eyebrow`, `label-caps`, `link-underline`, `container-page`, `reveal`, `fade-in`, `scrollbar-none`, `skeleton`, `shadow-soft|lift|overlay`.
- **Components** — `components/ui/*` provides button, input, badge, dialog, sheet, dropdown, tabs, toast, avatar, pagination, skeleton and section heading primitives.

---

## Testing

```bash
npm test
```

Coverage focuses on deterministic logic:

- `tests/utils.test.ts` — formatting, slugs, pagination, URL helpers.
- `tests/search-params.test.ts` — filter parsing/sanitising and round-tripping.
- `tests/validation.test.ts` — property, interaction and auth schemas.
- `tests/constants.test.ts` — taxonomy, district data and navigation integrity.

`npm run verify` complements the unit suite with database-level assertions after seeding.

---

## Deployment

1. Provision MongoDB (Atlas recommended) and set `MONGODB_URI`.
2. Generate `AUTH_SECRET` and set `APP_URL`.
3. Add a Mapbox token if you want the map, and Cloudinary credentials if you want durable uploads (local uploads do not persist on serverless platforms).
4. `npm run build` then `npm start` (or deploy to Vercel).
5. Run `npm run seed` only against demonstration environments.

---

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `Address already in use` on 27017 | Start MongoDB on another port and update `MONGODB_URI` |
| Pages render with empty sections | Database is unseeded — run `npm run seed` |
| Map shows a placeholder | Set `NEXT_PUBLIC_MAPBOX_TOKEN` and restart |
| Uploads fail in production | Configure Cloudinary or mount persistent storage for `public/uploads` |
| Session lost after restart | Ensure `AUTH_SECRET` is stable across deploys |
| Stale type errors after moving routes | `rm -rf .next && npm run typecheck` |

---

## Licence

Private demonstration project. All sample content and imagery is generated for this build.
