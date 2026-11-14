# File map

Orientation guide for the Arcadia codebase. Paths are relative to the repository root.

```
.
├── app/                    Next.js App Router (routes, layouts, API handlers)
├── components/             React components grouped by domain
├── actions/                Server Actions (all mutations)
├── lib/                    Server utilities, services, validation, auth
├── models/                 Mongoose schemas
├── constants/              Palettes, taxonomy, districts, navigation
├── types/                  Shared DTOs and service contracts
├── scripts/                Asset generation, seed, import and verification
├── data/                   Authentic listing data + import instructions
├── tests/                  Vitest suites
├── public/                 Static assets, generated SVG art, uploads
├── proxy.ts                Next 16 request proxy (auth redirects)
├── next.config.ts          Image/SVG policy, server externals, Turbopack CSS
├── vitest.config.ts        `@/` alias + node test environment
├── README.md               Setup, architecture, deployment
└── FILE_MAP.md             This document
```

---

## app/

### Root

| File | Purpose |
| ---- | ------- |
| `layout.tsx` | Fonts (Cormorant Garamond + Manrope), metadata, `ToastProvider` |
| `globals.css` | Tailwind 4 `@theme` tokens, fluid type, utilities, component styles |
| `favicon.ico` | Site icon |

### Marketing group — `app/(marketing)/`

| File | Purpose |
| ---- | ------- |
| `layout.tsx` | Site header/footer shell |
| `page.tsx` | Homepage: hero, featured, collections, districts, new listings, agents, CTA |
| `properties/page.tsx` | Search results; filters, map/grid toggle, pagination |
| `properties/[slug]/page.tsx` | Listing detail; gallery, specs, amenities, plans, map, agent, similar, view tracking |
| `agents/page.tsx` | Agent directory with search/city/verification filters |
| `agents/[slug]/page.tsx` | Agent profile and active listings |
| `agencies/[slug]/page.tsx` | Agency profile and roster |
| `about/page.tsx` | Brand story and values |
| `contact/page.tsx` | Contact options and enquiry form |
| `sign-in/page.tsx` | Sign-in route + metadata |
| `sign-up/page.tsx` | Registration route (customer/agent) |

### Dashboard — `app/dashboard/`

| File | Purpose |
| ---- | ------- |
| `layout.tsx` | Auth guard + dashboard shell |
| `page.tsx` | Role-aware overview (admin/agent/customer) |
| `saved/page.tsx` | Saved properties grid |
| `comparisons/page.tsx` | Side-by-side comparison table |
| `recent/page.tsx` | Recently viewed listings |
| `enquiries/page.tsx` | Inbox with status tabs and pagination |
| `inspections/page.tsx` | Viewing requests with status tabs |
| `notifications/page.tsx` | Notification feed |
| `settings/page.tsx` | Profile, agent details, password, verification |
| `listings/page.tsx` | Agent portfolio with filters/search |
| `listings/new/page.tsx` | Create listing |
| `listings/[id]/edit/page.tsx` | Load and edit an owned listing |
| `analytics/page.tsx` | Admin platform analytics / agent performance |
| `moderation/page.tsx` | Listing moderation queue |
| `verification/page.tsx` | Agent verification queue |
| `reports/page.tsx` | Member report review |
| `users/page.tsx` | Member directory and account actions |

### API — `app/api/`

| File | Purpose |
| ---- | ------- |
| `health/route.ts` | Liveness + database ping |
| `geocode/route.ts` | Rate-limited Mapbox location autocomplete |
| `media/upload/route.ts` | Authenticated image upload (agent/admin) |
| `properties/viewport/route.ts` | Listings within map bounds, filter-aware |

---

## components/

### `components/ui/`

Reusable primitives: `button.tsx` (`buttonStyles`, `Button`, `ButtonLink`), `input.tsx` (`Input`, `Textarea`, `Select`, `Label`, `FieldError`), `badge.tsx` (`Badge`, `StatusBadge`), `dialog.tsx`, `sheet.tsx`, `dropdown.tsx`, `tabs.tsx`, `toast.tsx`, `avatar.tsx`, `pagination.tsx`, `section-heading.tsx`, `skeleton.tsx` (`Skeleton`, `EmptyState`).

### `components/layout/`

`site-header.tsx`, `header-actions.tsx` (session-aware nav), `site-footer.tsx`, `breadcrumbs.tsx`, `page-header.tsx`.

### `components/brand/`

`logo.tsx` — `Logo` and `LogoMark` wordmarks.

### `components/home/`

`hero.tsx` (search + hero image), `district-grid.tsx`, `collection-band.tsx`, `agent-strip.tsx`.

### `components/property/`

| File | Purpose |
| ---- | ------- |
| `property-card.tsx` / `property-grid.tsx` | Listing cards and grid |
| `filter-panel.tsx` / `mobile-filters.tsx` | Faceted filters |
| `search-toolbar.tsx` / `search-controls.tsx` | Sort, view toggle, map search |
| `active-filters.tsx` | Removable filter chips |
| `gallery.tsx` | Image gallery + lightbox |
| `quick-search.tsx` | Homepage search widget |
| `save-button.tsx` / `compare-button.tsx` | Engagement actions |
| `enquiry-dialog.tsx` / `inspection-dialog.tsx` | Message and viewing flows |
| `report-dialog.tsx` / `share-button.tsx` | Reporting and sharing |
| `property-details.tsx` | Spec grid and amenities list |
| `comparison-table.tsx` | Property comparison matrix |

### `components/map/`

| File | Purpose |
| ---- | ------- |
| `property-map.tsx` | Mapbox GL instance, clustered source, canvas price pins, popups, no-token fallback |
| `map-explorer.tsx` | Map + result rail sync, viewport fetching, mobile cards |

### `components/auth/`

`auth-shell.tsx` (split-screen imagery), `sign-in-form.tsx`, `sign-up-form.tsx` (role selection, agency creation).

### `components/dashboard/`

| File | Purpose |
| ---- | ------- |
| `shell.tsx` | Sidebar + mobile sheet navigation, sign out |
| `page-header.tsx` | `DashboardHeader`, `StatCard` |
| `charts.tsx` | `Sparkline`, `BarList` |
| `listing-form.tsx` | Multi-section listing editor + uploader |
| `listing-table.tsx` | Portfolio rows with availability actions |
| `enquiry-list.tsx` | Reply/triage workflow |
| `inspection-list.tsx` | Confirm/decline/reschedule/complete |
| `notification-list.tsx` | Mark read / mark all |
| `profile-forms.tsx` | Profile and password forms |
| `verification-card.tsx` | Agent verification request |
| `verification-list.tsx` | Admin verification queue |
| `moderation-list.tsx` | Approve/reject/feature moderation cards |
| `report-list.tsx` | Report review dialog |
| `user-table.tsx` | Member management table |

---

## actions/

Server Actions, all returning `ActionResult`.

| File | Actions |
| ---- | ------- |
| `helpers.ts` | `runAction`, `actionUser`, `actionRole`, `limitAction`, `fieldError` |
| `auth.actions.ts` | Sign up/in/out, profile, password, verification request |
| `property.actions.ts` | Create/update/delete listing, moderation, availability |
| `engagement.actions.ts` | Favourites, comparisons, recently viewed, views |
| `enquiry.actions.ts` | Create enquiry, update status/reply |
| `inspection.actions.ts` | Request viewing, confirm/decline/reschedule/complete |
| `notification.actions.ts` | Mark read, report creation/review |
| `admin.actions.ts` | Member moderation and role changes |

---

## lib/

| File | Purpose |
| ---- | ------- |
| `db.ts` | Cached Mongoose connection |
| `auth.ts` | bcrypt hashing, JWT session cookie, `getCurrentUser` |
| `session-core.ts` | Proxy-safe JWT sign/verify + cookie constants |
| `rbac.ts` | `requireUser`, `requireRole`, `requireAgent`, `requireAdmin` |
| `errors.ts` | `AppError`, `AuthError`, `ForbiddenError`, `NotFoundError`, messaging |
| `rate-limit.ts` | In-memory sliding-window limiter |
| `utils.ts` | `cn`, formatting, slugs, pagination, URL helpers |
| `mappers.ts` | Mongoose documents → DTOs |
| `settle.ts` | Database-read fallbacks for resilient pages |
| `search-params.ts` | Parse/serialise search filters |
| `media.ts` | Cloudinary/local image upload + validation |
| `mapbox.ts` | Geocoding, token detection, map defaults |
| `services/property.service.ts` | Search, viewport, detail, CRUD, moderation, analytics helpers |
| `services/user.service.ts` | Registration, auth, profiles, agents, agencies, admin users, verification |
| `services/engagement.service.ts` | Favourites, comparisons, recently viewed |
| `services/enquiry.service.ts` | Enquiry lifecycle |
| `services/inspection.service.ts` | Viewing lifecycle |
| `services/notification.service.ts` | Notification creation and reads |
| `services/report.service.ts` | Report creation and review |
| `services/analytics.service.ts` | Admin/agent/customer overview metrics |
| `validation/index.ts` | `parseInput`, `toFieldErrors`, FormData helpers |
| `validation/auth.ts` | Auth and profile schemas |
| `validation/property.ts` | Listing, moderation and search-filter schemas |
| `validation/interaction.ts` | Enquiry, inspection, report schemas |

---

## models/

| File | Collection |
| ---- | ---------- |
| `User.ts` | Customers, agents, admins; sparse-unique slug for agents |
| `Agency.ts` | Brokerage profiles |
| `Property.ts` | Listing core; GeoJSON point, text index, view log |
| `Enquiry.ts` | Buyer → agent messages |
| `Inspection.ts` | Viewing appointments |
| `Favourite.ts` | Saved properties |
| `Comparison.ts` | Per-user comparison set |
| `RecentlyViewed.ts` | View history (capped in services) |
| `Notification.ts` | In-app notifications |
| `Report.ts` | Trust & safety reports |
| `index.ts` | Barrel export |

---

## constants/

| File | Purpose |
| ---- | ------- |
| `index.ts` | Property types/statuses, currencies, price presets, amenity groups, enquiry/inspection statuses, slots, report reasons, notification types, limits |
| `locations.ts` | Ten curated districts with coordinates and images; `CITIES`, `districtBySlug` |
| `navigation.ts` | Marketing nav and `DASHBOARD_NAV` per role |

---

## types/

`index.ts` — `SessionUser`, `PropertySummary`, `PropertyDetail`, `EnquiryDTO`, `InspectionDTO`, `NotificationDTO`, `ReportDTO`, `Paginated`, `ActionResult`, analytics overview types and related unions.

---

## scripts/

| File | Purpose |
| ---- | ------- |
| `generate-assets.ts` | Deterministic SVG art for districts, collections, listings, agents, agencies, floor plans, placeholder |
| `seed.ts` | Reset + seed agencies, users, 24 listings, engagement, notifications, reports |
| `verify.ts` | 39 data-contract checks (volumes, listing invariants, geo queries, auth, engagement) |
| `import-listings.ts` | Validate and upsert authentic listings from `data/listings.json` (supports `--dry-run` and a custom path) |

---

## data/

| File | Purpose |
| ---- | ------- |
| `listings.json` | Editable array of authentic listings consumed by `npm run import` |
| `README.md` | Field reference, example entry and workflow for real content |

---

## tests/

| File | Covers |
| ---- | ------ |
| `utils.test.ts` | Formatting, slugs, initials, pagination, parsing, search hrefs |
| `search-params.test.ts` | Filter normalisation and URL round-tripping |
| `validation.test.ts` | Property, interaction and auth schemas |
| `constants.test.ts` | District data, taxonomy, navigation integrity |

---

## public/

```
public/
├── hero.jpg                       Editorial hero photograph
├── images/
│   ├── agencies/                  Generated monograms (sterling, meridian, atlantic)
│   ├── agents/                    Generated avatars (8)
│   ├── collections/               Apartment/villa/penthouse/townhouse art
│   ├── floorplans/                Three illustrated plans
│   ├── locations/                 Ten district scenes
│   ├── properties/                Twelve listing artworks
│   └── placeholder-property.svg   Fallback for missing media
└── uploads/                       Local uploads (git-ignored, created at runtime)
```

---

## Configuration

| File | Purpose |
| ---- | ------- |
| `next.config.ts` | `serverExternalPackages`, SVG-friendly image policy, Turbopack CSS entry |
| `tsconfig.json` | Strict TS, `@/*` path alias |
| `eslint.config.mjs` | Next core-web-vitals + TS rules |
| `vitest.config.ts` | Node environment, `@/` alias, test include pattern |
| `proxy.ts` | Route protection for `/dashboard/*`, `/sign-in`, `/sign-up` |
| `.env.example` | Documented environment template |
| `AGENTS.md` | Repository agent guidance (Next 16 docs reminder) |
