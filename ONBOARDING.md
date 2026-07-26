# W. T. McArthur Historic Homeplace — Project Overview

> **Canonical copy lives in Notion** ([Project Overview](https://www.notion.so/37066661a975815e994acfb3e3d2d276), under Documentation). This file is a synced local mirror, imported into agent context via `@ONBOARDING.md` in `CLAUDE.md`. When the overview changes, update **both** this file and the Notion page.

> Last Updated: 2026-07-26

---

## Mission

> *"The mission is to engage the public in the stories of the W. T. McArthur historic homeplace and farm (Historic Homeplace) and how it represents a historic period in Southern American agriculture. We are dedicated to telling the authentic history of the Historic Homeplace, based on current information and from all perspectives, honoring the families and stories of all that lived and worked on the farm."*

The **W. T. McArthur Historic Homeplace, Inc.** is a nonprofit heritage foundation operating a 19th-century farm restoration site in the American South. This website is the public-facing presence of that foundation — telling its stories, showcasing the property, announcing events, and receiving donations.

---

## What This App Is

A **content-forward public website** with a **Firestore-backed admin CMS** for editors. Two distinct surfaces:

1. **Public site** — storytelling, property showcase, events, donations
2. **Admin dashboard** (`/admin`) — authenticated CMS for board members/editors to manage navigation, footer, and pages without touching code

All site content is now Firestore-backed and editable from `/admin` — admin-created pages (`pages` collection) and the structured collections (`projects`, `news`, `events`, `milestones`, `boardMembers`, `partners`), plus navigation and footer. There is no longer a hardcoded `content.ts`.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | See `AGENTS.md` — this version has breaking changes from prior Next.js |
| Language | TypeScript 5 (strict) | Path alias `@/*` → `src/*` |
| React | 19.2 | Server Components for data-fetching; Client Components for interaction |
| Styling | CSS custom properties (global) | No CSS-in-JS, no Tailwind — hand-crafted design system in `globals.css` |
| Validation | Zod | CMS schemas (sections, nav, pages) |
| Database | Cloud Firestore | Photos, navigation config, CMS pages |
| Storage | Firebase Storage | Images served from `mcarthur-tour.firebasestorage.app` |
| Auth | Firebase Auth (Google provider) | Active — used for editor/admin sign-in |
| Admin SDK | firebase-admin | Server-only; requires `FIREBASE_SERVICE_ACCOUNT_JSON` (skipped in emulator mode) |
| Hosting | Firebase App Hosting (Cloud Run) | 0–2 instances, 512 MB, 80 concurrent connections |
| Testing | Vitest (node + jsdom) · Playwright + Firebase Emulator Suite | Unit/component under `src/**`, E2E under `e2e/`; coverage ratchet gate |
| CI/CD | GitHub Actions | Lint → type check → test → build (Firebase deploys natively) |

---

## Architecture

### File Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout — fetches nav, wraps in ClientShell
│   ├── page.tsx                   # Home page
│   ├── about/page.tsx
│   ├── what-to-see/               # Property listings (was "projects")
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── stories/page.tsx
│   ├── visit/page.tsx
│   ├── donate/page.tsx
│   └── admin/                     # Auth-gated CMS dashboard
│       ├── layout.tsx             # Requires active session; redirects to /admin/login
│       ├── page.tsx               # Dashboard home
│       ├── login/                 # Google sign-in page
│       ├── navigation/            # Edit primary nav + footer nav
│       ├── pages/                 # List, create, edit, publish CMS pages
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/page.tsx
│       └── preview/[...slug]/     # Draft preview before publish
├── components/
│   ├── ui/                        # Header, Footer, BrandMark, ClientShell, TweaksPanel, etc.
│   ├── home/                      # Hero variants, MissionSection, ProjectsTeaser, etc.
│   ├── projects/                  # ProjectsList, ProjectDetailPage
│   ├── donate/                    # DonateForm
│   └── about/                     # AboutDonateStrip
├── context/
│   └── TweaksContext.tsx          # Temporary design-switching state
├── lib/
│   ├── firebase.ts                # Client-side Firebase init (+ opt-in emulator wiring)
│   ├── firebase-admin.ts          # Server-side Admin SDK (Auth, Firestore, Storage)
│   ├── photos.ts                  # Firestore photo queries (client SDK)
│   ├── auth/
│   │   ├── server.ts              # Session verification (server components / actions)
│   │   └── client.ts              # Firebase Auth helpers (sign in, sign out)
│   ├── content-schema/            # Framework-agnostic content CONTRACT (see decision 6)
│   │   ├── index.ts               # Barrel — import everything from '@/lib/content-schema'
│   │   ├── version.ts             # CONTENT_SCHEMA_VERSION
│   │   ├── doc.ts                 # StoredDoc / PublicDoc / Status envelope types
│   │   ├── sections.ts            # Zod schemas for all page section types
│   │   ├── media.ts               # ContentImage + slug schema
│   │   ├── sanitize.ts            # HTML sanitization for rich-text sections
│   │   ├── structuredFields.ts    # Client-safe field specs driving the admin forms
│   │   └── collections/           # Per-collection Zod schemas + inferred types
│   └── cms/                       # Firebase-BOUND data access (server-only)
│       ├── navigation.ts          # Nav config CRUD — Firestore `navigation` collection
│       ├── pages.ts               # Page CRUD — Firestore `pages` collection
│       ├── collectionStore.ts     # Generic publish-model store factory
│       ├── photosAdmin.ts         # Photo metadata CRUD (Admin SDK)
│       └── projects.ts / news.ts / events.ts / milestones.ts / board.ts / partners.ts
│                                  # Store INSTANCES only — schemas live in content-schema/
└── test/                          # Vitest harness: in-memory Firestore + firebase-admin mock

e2e/                               # Playwright specs (run against the Firebase Emulator Suite)
scripts/                           # seed-editor / seed-pages / seed-structured / seed-emulator
firestore.indexes.json             # Composite index declarations (deployed per environment)
playwright.config.ts               # E2E config — emulator-backed, project `demo-mcarthur`
```

### Data Flow

```
Navigation (Header/Footer)
    ├── Firestore `navigation` collection (primary, footer docs)
    │   └── fetched at request time by server components in layout.tsx
    └── Falls back to hardcoded defaults in navigation.ts if Firestore unavailable

Structured content (projects, news, events, milestones, board, partners)
    └── Firestore collections via lib/cms/<collection>.ts (createCollectionStore)
        ├── listPublished() / getPublishedBySlug() → public pages (server components)
        └── list() / getById() → /admin/structured editor
        Each doc has a draft/published status + publishedSnapshot, like pages.

CMS Pages (admin-created)
    └── Firestore `pages` collection
        ├── getPublishedPage(slug) → public [slug] route
        └── getPageById(id) → admin editor

Photos
    └── Firestore `photos` collection → queried via lib/photos.ts
        ├── getProjectPhotos(slug)
        └── getFeaturedPhotos()
```

### Navigation Architecture

Navigation data lives in Firestore (`navigation/primary` and `navigation/footer`) with hardcoded defaults in `src/lib/cms/navigation.ts`. The `What to See` nav item uses `dynamicChildren: 'projects'` to auto-expand from the published `projects` Firestore collection at request time. Editors can modify nav structure, labels, hrefs, and add/remove items via `/admin/navigation`.

---

## Design System

The design system lives entirely in [src/app/globals.css](src/app/globals.css). It is **not Tailwind** — all utility comes from CSS custom properties on the root element.

### Color Palette (Clan MacArthur Tartan)

| Token | Value | Role |
|---|---|---|
| `--tartan-green` | `#1F4A2E` | Primary brand color |
| `--tartan-gold` | `#D4A017` | Accent / calls to action |
| `--tartan-navy` | `#1B2A4E` | Emphasis text |
| `--tartan-parch` | `#F4EDE0` | Default background (parchment) |
| `--tartan-ink` | `#14110D` | Body text |

### Typography Pairs (switchable, default is A)

| Pair | Display | Body | Feel |
|---|---|---|---|
| A (default) | Fraunces | Inter | Warm editorial |
| B | Playfair Display | Work Sans | Classical magazine |
| C | Cormorant Garamond | Manrope | Refined modern |

### Header Layout

Two-row layout:
- **Utility row** — slim band with "Plan a Visit" and gold Donate CTA
- **Main row** — left nav · centered logo (104px desktop) · right nav
- **What to See** has a hover/focus dropdown listing all 8 property pages
- Mobile: centered logo, hamburger on the right, inline submenu under What to See

---

## Key Architectural Decisions

### 1. All content is Firestore-backed

There is no hardcoded content file. Narrative pages live in the `pages` collection; structured records (projects, news, events, milestones, board, partners) live in their own collections behind a generic `createCollectionStore` factory (`src/lib/cms/collectionStore.ts`). Every structured record carries a draft/published status and a `publishedSnapshot`, just like pages, and is edited at `/admin/structured`.

### 2. TweaksPanel is a temporary design tool

[TweaksPanel](src/components/ui/TweaksPanel.tsx) and [TweaksContext](src/context/TweaksContext.tsx) expose live controls for switching hero variants, color modes, typography pairs, and tartan intensity. **Not a permanent user-facing feature.** Will be removed once the design is locked.

### 3. Firebase is the only backend

Firestore handles navigation config, CMS pages, and photo metadata. Firebase Storage serves images. Firebase Auth handles editor sign-in. Firebase App Hosting runs the Next.js app. No separate API server, no Postgres, no Redis.

### 4. Admin SDK requires a service account (except against the emulator)

Server-side CMS operations (reading/writing nav, pages, auth verification) use `firebase-admin` via `src/lib/firebase-admin.ts`. This requires `FIREBASE_SERVICE_ACCOUNT_JSON` as an env var with the full service account JSON. **Without it, the admin dashboard will not work and the CMS nav falls back to defaults.**

**Exception:** when `FIRESTORE_EMULATOR_HOST` is set, the Admin SDK connects to the Emulator Suite and initialises with a project id only — no credentials needed. This is how E2E and the seed script run. That branch must never be reachable in a deployed environment.

### 5. Navigation is CMS-editable; What to See dropdown is dynamic

The `What to See` nav item expands its dropdown from the published `projects` Firestore collection at request time (via `dynamicChildren: 'projects'` in the nav config; resolved in `src/lib/cms/navigation.ts`).

### 6. Content schema is a framework-agnostic contract

`src/lib/content-schema/` holds every Zod schema, inferred type, and the `StoredDoc`/`PublicDoc` envelope, with **zero Firebase / Next.js / React imports** — only `zod` and `isomorphic-dompurify`. `src/lib/cms/` keeps the Firebase-bound data access on top of it.

This split is deliberate: it is the single source of truth for content shape, so a planned content API and a future mobile app can consume the same contract without pulling in Firebase. `CONTENT_SCHEMA_VERSION` exists so the contract can be versioned independently of the site.

### 7. Composite indexes are declared in the repo

`firestore.indexes.json` declares the composite indexes the photo queries require (`project + order`, `featured + order`). They must be deployed to every environment. **A missing index fails silently** — the photo queries catch errors and return `[]`, so galleries render blank while the page still loads fine. `src/test/firestoreIndexes.test.ts` guards against accidental removal.

---

## Firestore Collections

### `navigation` collection

| Document | Contents |
|---|---|
| `primary` | `{ utility[], left[], right[], updatedBy, updatedAt }` — primary header nav |
| `footer` | `{ tagline, columns[], bottomLinks[], updatedBy, updatedAt }` — footer nav |

See `ResolvedPrimaryNav` / `ResolvedFooterNav` types in [src/lib/cms/navigation.ts](src/lib/cms/navigation.ts).

### `pages` collection

CMS-managed pages with draft/publish workflow.

| Field | Type | Description |
|---|---|---|
| `slug` | string | URL path (e.g. `what-to-see/main-house`) |
| `title` | string | Page title |
| `hero` | object\|null | `{ storagePath, downloadUrl, alt }` |
| `sections` | array | Ordered section blocks (see section types below) |
| `status` | `'draft'\|'published'` | |
| `publishedSnapshot` | object\|null | Frozen copy of last-published title/hero/sections |
| `publishedAt` | timestamp\|null | |
| `createdBy` / `updatedBy` | string | Firebase Auth UID |

**Section types:** `richText`, `twoColumn`, `quote`, `callout`, `image`, `gallery` — all validated by Zod schemas in [src/lib/content-schema/sections.ts](src/lib/content-schema/sections.ts).

### `photos` collection

| Field | Type | Description |
|---|---|---|
| `filename` | string | Original filename |
| `storagePath` | string | Path in Firebase Storage |
| `downloadUrl` | string | Public CDN URL |
| `caption` | string | Display caption |
| `altText` | string | Accessibility alt text |
| `project` | string | Matches What to See slug |
| `category` | string | e.g. `"exterior"`, `"interior"`, `"progress"` |
| `featured` | boolean | Show on home/featured sections |
| `order` | number | Sort order |
| `dateTaken` | timestamp | |
| `uploadedAt` | timestamp | |

---

## Current Content (as of last update)

**What to See (8 items):**
- The Main House (1893 core; expanded by 1900; Queen Anne, real historical content)
- The Cooper Conner House (c. 1908, lipsum placeholder)
- The Onion Barn (lipsum)
- The Commissary (lipsum)
- Tenant Housing (lipsum)
- The School House (lipsum)
- The Long-leaf Pines (lipsum)
- Dead River Cemetery (lipsum)

Items with lipsum are awaiting real historical content — the structure is in place.

**Board Members (6):** `boardMembers` Firestore collection (edit at `/admin/structured/boardMembers`)

**Timeline Milestones (7):** 1893 (property acquired) → 1900 (Main House complete) → … → 2026

---

## CMS Phases

| Phase | Scope | Status |
|---|---|---|
| 1 | Admin auth, dashboard shell, login | Shipped 2026-05-19 |
| 2 | Navigation editor (primary + footer) | Shipped 2026-05-19 |
| 2b | CMS pages CRUD (create, edit, publish) | Shipped 2026-05-19 |
| 3 | Migrate home/about/visit/donate/stories from content.ts to Firestore pages | Shipped 2026-05-21 |
| 4 | Migrate structured collections (projects, news, events, milestones, board, partners) to Firestore + typed admin CRUD; swap dynamic nav resolver; delete content.ts | Shipped 2026-05-29 |
| 5 | Photo upload UI in admin | Planned |
| 6 | Donation backend (Stripe) | Planned |
| 7 | Event registration | Not started |

## Current Initiatives

| Initiative | Scope | Status |
|---|---|---|
| Codebase Cleanup & Modularization | Dead-code removal, content-schema extraction, transport-agnostic read layer, security/DX fixes | In progress — content-schema extracted; read-layer refactor outstanding |
| Test Coverage & QA | Vitest harness + coverage ratchet, lib backfill, E2E, security/load testing | In progress — harness and E2E scaffold shipped; lib backfill ongoing |
| **Migrate to Foundation GCP** | Move off personal-account `mcarthur-tour` to **three foundation-owned Firebase projects** (dev/uat/prod) on App Hosting, branch-per-env promotion, versioned content API for future mobile reuse | Planned — blocked on foundation Google account + billing |

> **Migration note:** the site currently runs in the personal-account project `mcarthur-tour`. Project ids, the storage bucket, and Firestore region are hardcoded in `apphosting.yaml`, `next.config.ts`, `.firebaserc`, and both workflows. Stored image `downloadUrl` values are **absolute URLs** bound to the current bucket, so any content copy must rewrite them (`storagePath` is stored alongside and is the reliable source).

---

## CI/CD & Deployment

### Deployment Model

**Firebase App Hosting deploys natively from GitHub** — no CI step triggers the rollout. Pushes to `master` are picked up by Firebase's GitHub connection automatically.

GitHub Actions runs **only as a CI gate** (lint, type check, test, build).

### Pipelines

| Workflow | Trigger | Steps |
|---|---|---|
| `deploy.yml` | Push to `master` | Lint → TypeCheck → Test → Build (verification only — despite the name, it does not deploy) |
| `pr-checks.yml` | Pull request to `master` | Lint → TypeCheck → Test → Build |

> E2E (`npm run test:e2e`) is **not yet wired into CI** — it runs locally against the emulator only.

### Firebase App Hosting Config (`apphosting.yaml`)

- 1 CPU, 512 MB memory, 0–2 instances, 80 concurrent connections
- All env vars stored in Google Secret Manager

### Secrets Required

**GitHub Actions (Settings → Secrets):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

**Runtime (Google Secret Manager / `.env.local`):**
- All `NEXT_PUBLIC_FIREBASE_*` vars above
- `FIREBASE_SERVICE_ACCOUNT_JSON` — full service account JSON, **required for the admin CMS and navigation to work**

---

## Local Development Setup

```bash
# 1. Clone and install
git clone <repo-url> && cd mcarthur-homeplace
npm install

# 2. Enable auto-updating git hook
git config core.hooksPath .githooks

# 3. Create .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mcarthur-tour
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mcarthur-tour.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# Required for admin CMS (navigation, pages, auth verification):
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"mcarthur-tour",...}

# 4. Run dev server
npm run dev
```

> **Admin dashboard:** Visit `/admin` — sign in with a Google account that has been granted editor access in Firebase Auth.

> **Without `FIREBASE_SERVICE_ACCOUNT_JSON`:** The admin dashboard will throw. The public site will still work, but navigation will use hardcoded defaults from `src/lib/cms/navigation.ts`.

> **Next.js 16:** Has breaking changes from prior versions. Read `node_modules/next/dist/docs/` before writing App Router code.

---

## Testing

Tests ship in the **same PR** as the code they cover (see `AGENTS.md`). Co-locate `*.test.ts` (logic, Vitest `node`) and `*.test.tsx` (components, Vitest `jsdom`) next to the module under test.

| Command | What it runs |
|---|---|
| `npm test` | Full Vitest suite (node + jsdom) |
| `npm run test:coverage` | Vitest + coverage; enforces the gate in `vitest.config.ts` |
| `npm run test:e2e` | Playwright against the Firebase Emulator Suite (seeds first) |
| `npm run emulators` | Start auth/firestore/storage emulators standalone |

- **Coverage gate** is a **ratchet floor** over `src/lib/**`, not a target. When a change raises real coverage, raise the floor just under the new actuals so it can't regress.
- **E2E** runs against emulator project `demo-mcarthur` on ports 9099 (auth) / 8080 (firestore) / 9199 (storage). These ports are hardcoded in `firebase.json`, `playwright.config.ts`, and `src/lib/firebase.ts` — keep them in sync.
- **Requires Java 21+** (`firebase-tools` dependency). Without it the emulators — and therefore `test:e2e` — will not start.

### Emulator-only environment variables

Never set these in a deployed environment; they would point the app at a non-existent local emulator, and `FIRESTORE_EMULATOR_HOST` additionally makes the Admin SDK skip credentials:

- `NEXT_PUBLIC_FIREBASE_USE_EMULATOR` — `'true'` connects the client SDK to the emulator
- `NEXT_PUBLIC_FIREBASE_EMULATOR_HOST` — defaults to `127.0.0.1`
- `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` / `FIREBASE_STORAGE_EMULATOR_HOST`

---

## Important Files Reference

| File | Purpose |
|---|---|
| [src/lib/content-schema/index.ts](src/lib/content-schema/index.ts) | **Content contract** — all schemas + types, no Firebase/Next/React |
| [src/lib/content-schema/sections.ts](src/lib/content-schema/sections.ts) | Zod schemas for all page section types |
| [src/lib/content-schema/doc.ts](src/lib/content-schema/doc.ts) | `StoredDoc` / `PublicDoc` / `Status` envelope types |
| [src/lib/cms/collectionStore.ts](src/lib/cms/collectionStore.ts) | Generic store factory for structured collections (projects, news, events, milestones, board, partners) |
| [src/lib/firebase.ts](src/lib/firebase.ts) | Client-side Firebase init (+ opt-in emulator wiring) |
| [src/lib/firebase-admin.ts](src/lib/firebase-admin.ts) | Server-side Admin SDK — needs `FIREBASE_SERVICE_ACCOUNT_JSON` (except emulator mode) |
| [src/lib/cms/navigation.ts](src/lib/cms/navigation.ts) | Nav CRUD + hardcoded defaults |
| [src/lib/cms/pages.ts](src/lib/cms/pages.ts) | CMS page CRUD |
| [src/lib/auth/server.ts](src/lib/auth/server.ts) | Session verification for server components |
| [src/lib/photos.ts](src/lib/photos.ts) | Firestore photo queries |
| [src/test/](src/test/) | Vitest harness — in-memory Firestore + `firebase-admin` mock |
| [e2e/](e2e/) | Playwright specs (emulator-backed) |
| [firestore.indexes.json](firestore.indexes.json) | Composite index declarations — deploy to every environment |
| [src/app/globals.css](src/app/globals.css) | Entire design system |
| [src/app/admin/layout.tsx](src/app/admin/layout.tsx) | Admin auth guard |
| [src/context/TweaksContext.tsx](src/context/TweaksContext.tsx) | Temporary design-switching state (to be removed) |
| [apphosting.yaml](apphosting.yaml) | Firebase App Hosting runtime config |
| [vitest.config.ts](vitest.config.ts) | Test projects + coverage ratchet gate |
| [.github/workflows/deploy.yml](.github/workflows/deploy.yml) | CI gate (lint/type/test/build only — no deploy step) |
