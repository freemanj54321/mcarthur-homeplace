# W. T. McArthur Historic Homeplace — Project Overview

> **Canonical copy lives in Notion** ([Project Overview](https://www.notion.so/37066661a975815e994acfb3e3d2d276), under Documentation). This file is a synced local mirror, imported into agent context via `@ONBOARDING.md` in `CLAUDE.md`. When the overview changes, update **both** this file and the Notion page.

> Last Updated: 2026-09-30

---

## Mission

> *"The mission is to engage the public in the stories of the W. T. McArthur historic homeplace and farm (Historic Homeplace) and how it represents a historic period in Southern American agriculture. We are dedicated to telling the authentic history of the Historic Homeplace, based on current information and from all perspectives, honoring the families and stories of all that lived and worked on the farm."*

The **W. T. McArthur Historic Homeplace, Inc.** is a nonprofit heritage foundation operating a 19th-century farm restoration site in the American South. This website is the public-facing presence of that foundation — telling its stories, showcasing the property, announcing events, and receiving donations.

---

## What This App Is

A **content-forward public website** with a **Firestore-backed admin CMS** for editors. Two distinct surfaces:

1. **Public site** — storytelling, property showcase, events, donations
2. **Admin dashboard** (`/admin`) — authenticated CMS for board members/editors to manage navigation, footer, pages, structured content, and photos without touching code

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
| Admin SDK | firebase-admin | Server-only; credentials from `FIREBASE_SERVICE_ACCOUNT_JSON`, App Hosting's injected config (keyless), or local ADC (see decision 4) |
| Hosting | Firebase App Hosting (Cloud Run) | One backend per env (dev/uat/prod), `us-central1`, Node 24; 0–2 instances, 512 MB, 80 concurrent connections |
| Testing | Vitest (node + jsdom) · Playwright + Firebase Emulator Suite | Unit/component under `src/**`, E2E under `e2e/`; coverage ratchet gate |
| CI/CD | GitHub Actions | Lint → type check → test → build, plus emulator E2E, on `develop`/`uat`/`master` (Firebase deploys natively) |

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
│   ├── visit/page.tsx
│   ├── donate/page.tsx            # 404 unless donations are enabled (decision 8)
│   ├── [...slug]/page.tsx         # Published CMS pages by slug (e.g. /stories)
│   ├── api/auth/session/          # Mint / clear the __session cookie
│   └── admin/                     # Auth-gated CMS dashboard
│       ├── layout.tsx             # Requires active session; redirects to /admin/login
│       ├── page.tsx               # Dashboard home
│       ├── login/                 # Google sign-in page
│       ├── navigation/            # Edit primary nav + footer nav
│       ├── pages/                 # List, create, edit, publish CMS pages
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/page.tsx
│       ├── structured/            # Typed CRUD for structured collections
│       │   ├── registry.ts        # Collection name → store + field spec
│       │   └── [collection]/      # List, new, [id] edit per collection
│       ├── photos/                # Photo library: upload, edit, categorize
│       │   ├── new/page.tsx
│       │   └── [id]/page.tsx
│       └── preview/[...slug]/     # Draft preview before publish
├── components/
│   ├── auth/                      # AuthProvider
│   ├── cms/                       # PageRenderer, SectionEditor, StructuredForm, PhotoForm, ImageUploader, RichTextField
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
│   ├── firebaseConfig.ts          # Where each SDK gets its config (explicit vs App Hosting-injected); SDK-free
│   ├── features.ts                # Per-environment feature flags (donations, decision 8)
│   ├── migration/
│   │   └── contentMigration.ts    # Pure content-copy logic (collect → copy images → rewrite URLs → reconcile), MCA-47
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
│   │   ├── navigation.ts          # Nav link / primary / footer schemas + Resolved* types
│   │   └── collections/           # Per-collection Zod schemas + inferred types (incl. photos)
│   └── cms/                       # Firebase-BOUND data access (server-only)
│       ├── navigation.ts          # Nav reads/writes, defaults, What to See resolver, donations filter
│       ├── pages.ts               # Page CRUD — `pages` collection, built on collectionStore
│       ├── collectionStore.ts     # Generic publish-model store factory (Admin SDK write path)
│       ├── collectionReader.ts    # Transport-agnostic READ layer — no firebase-admin/Next imports (MCA-26)
│       ├── firestoreReader.ts     # Minimal Firestore read-port types the reader is driven through
│       ├── photosAdmin.ts         # Photo CRUD + public gallery queries (Admin SDK)
│       ├── action-error.ts        # Error formatting for server actions
│       └── projects.ts / news.ts / events.ts / milestones.ts / board.ts / partners.ts
│                                  # Store INSTANCES only — schemas live in content-schema/
└── test/                          # Vitest harness: in-memory Firestore + firebase-admin mock

e2e/                               # Playwright specs (run against the Firebase Emulator Suite)
scripts/                           # seed-editor / seed-pages / seed-structured / seed-emulator; migrate-content (MCA-47)
src/proxy.ts                       # /admin login redirect keeping ?next= (Next 16 `proxy`, MCA-61)
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
    └── Firestore `photos` collection
        └── lib/cms/photosAdmin.ts (Admin SDK)
            ├── listPhotosByProject(slug) / listFeaturedPhotos() → public galleries
            └── listPhotos() / getPhotoById() → /admin/photos editor
        Schema + PhotoRecord type: content-schema/collections/photos.ts
```

### Navigation Architecture

Navigation data lives in Firestore (`navigation/primary` and `navigation/footer`) with hardcoded defaults in `src/lib/cms/navigation.ts`. Its shape (Zod schemas and the `Resolved*` types the Header/Footer render) is part of the content contract in `src/lib/content-schema/navigation.ts`. The `What to See` nav item uses `dynamicChildren: 'projects'` to auto-expand from the published `projects` Firestore collection at request time. Editors can modify nav structure, labels, hrefs, and add/remove items via `/admin/navigation`.

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
- **Utility row** — slim band with "Plan a Visit" and gold Donate CTA. The last utility link gets the gold CTA styling, so on prod (donations off, decision 8) "Plan a Visit" takes it.
- **Main row** — left nav · centered logo (104px desktop) · right nav
- **What to See** has a hover/focus dropdown listing the published property pages (only The Main House on prod today)
- Mobile: centered logo, hamburger on the right, inline submenu under What to See

---

## Key Architectural Decisions

### 1. All content is Firestore-backed

There is no hardcoded content file. Narrative pages live in the `pages` collection; structured records (projects, news, events, milestones, board, partners) live in their own collections behind a generic `createCollectionStore` factory (`src/lib/cms/collectionStore.ts`). Every structured record carries a draft/published status and a `publishedSnapshot`, just like pages, and is edited at `/admin/structured`.

### 2. TweaksPanel is a temporary design tool

[TweaksPanel](src/components/ui/TweaksPanel.tsx) and [TweaksContext](src/context/TweaksContext.tsx) expose live controls for switching hero variants, color modes, typography pairs, and tartan intensity. **Not a permanent user-facing feature.** Will be removed once the design is locked (MCA-24). Until then it's shown only on dev and uat: `NEXT_PUBLIC_DESIGN_TOOLS_ENABLED` is `"true"` there and `"false"` on prod, and `designToolsEnabled()` in `src/lib/features.ts` fails closed like the donations flag (MCA-91). Prod always renders the defaults (the photo hero).

### 3. Firebase is the only backend

Firestore handles navigation config, CMS pages, and photo metadata. Firebase Storage serves images. Firebase Auth handles editor sign-in. Firebase App Hosting runs the Next.js app. No separate API server, no Postgres, no Redis.

### 4. Firebase config and credentials come from the environment

Server-side CMS operations (reading/writing nav, pages, auth verification) use `firebase-admin` via `src/lib/firebase-admin.ts`. How it initializes is decided in `src/lib/firebaseConfig.ts` (MCA-44), in priority order:

1. **Emulator:** `FIRESTORE_EMULATOR_HOST` set (see the exception below).
2. **Service-account key:** `FIREBASE_SERVICE_ACCOUNT_JSON` set. This is how the current `mcarthur-tour` backend and key-based local dev run.
3. **App Hosting, keyless:** `FIREBASE_CONFIG` injected by App Hosting. No-arg init uses the backend's own service account, so no key exists. This is the plan for the foundation environments.
4. **Application Default Credentials:** local dev after `gcloud auth application-default login`.

The browser SDK (`src/lib/firebase.ts`) follows the same rule: explicit `NEXT_PUBLIC_FIREBASE_*` values win; otherwise it uses App Hosting's injected `FIREBASE_WEBAPP_CONFIG`. That works because the Firebase SDK's `postinstall` bakes the config in during `npm install`, so **stay on npm and never set `ignore-scripts`**. `next.config.ts` resolves the Storage bucket for `next/image` the same way.

**Without any credentials, the admin dashboard will not work and the CMS nav falls back to defaults.**

**Exception:** when `FIRESTORE_EMULATOR_HOST` is set, the Admin SDK connects to the Emulator Suite and initialises with a project id only — no credentials needed. This is how E2E and the seed script run. That branch must never be reachable in a deployed environment.

### 5. Navigation is CMS-editable; What to See dropdown is dynamic

The `What to See` nav item expands its dropdown from the published `projects` Firestore collection at request time (via `dynamicChildren: 'projects'` in the nav config; resolved in `src/lib/cms/navigation.ts`).

### 6. Content schema is a framework-agnostic contract

`src/lib/content-schema/` holds every Zod schema, inferred type, and the `StoredDoc`/`PublicDoc` envelope, with **zero Firebase / Next.js / React imports** — only `zod` and `isomorphic-dompurify`. `src/lib/cms/` keeps the Firebase-bound data access on top of it.

This split is deliberate: it is the single source of truth for content shape, so a planned content API and a future mobile app can consume the same contract without pulling in Firebase. `CONTENT_SCHEMA_VERSION` exists so the contract can be versioned independently of the site.

### 7. Composite indexes are declared in the repo

`firestore.indexes.json` declares the composite indexes the photo queries require (`project + order`, `featured + order`). They must be deployed to every environment. **A missing index fails silently** — the photo queries catch errors and return `[]`, so galleries render blank while the page still loads fine. `src/test/firestoreIndexes.test.ts` guards against accidental removal.

### 8. Donations are feature-flagged per environment (MCA-71)

The donation flow (`/donate`, `DonateForm`) is a **prototype** with no payment backend (Stripe is CMS Phase 6). It stays on dev and uat and is **hidden on prod** by `NEXT_PUBLIC_DONATIONS_ENABLED`: `"true"` in `apphosting.dev.yaml` and `apphosting.uat.yaml`, `"false"` in `apphosting.prod.yaml`. `donationsEnabled()` in `src/lib/features.ts` treats anything other than `"true"` as off, so the legacy backend and local builds without the value hide donations too (set it in `.env.local` to work on the form).

When off: `/donate` returns 404, the nav lookup drops every `/donate` link (the defaults and any editors add), `DonateStrip` renders nothing, and the hero and `/visit` donate buttons and the TweaksPanel "Donate CTA" control are hidden. The `donate` callout tone stays in the schema. **The flag can't catch `/donate` links typed into CMS rich text**, so the prod content migration (MCA-47 through MCA-49) must remove them.

It's a `NEXT_PUBLIC_` variable because client components read it, and App Hosting builds each backend separately (`BUILD` + `RUNTIME` availability), so each environment gets its own value baked in.

---

## Firestore Collections

### `navigation` collection

| Document | Contents |
|---|---|
| `primary` | `{ utility[], left[], right[], updatedBy, updatedAt }` — primary header nav |
| `footer` | `{ tagline, columns[], bottomLinks[], updatedBy, updatedAt }` — footer nav |

See `ResolvedPrimaryNav` / `ResolvedFooterNav` types in [src/lib/content-schema/navigation.ts](src/lib/content-schema/navigation.ts).

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

As of 2026-09-28, prod shows **only content that is ready for the public**. Placeholder records are unpublished (`draft`), not deleted, so editors can replace the text and republish (MCA-49, MCA-91).

**What to See (8 projects, 1 published on prod):**
- The Main House (1893 core; expanded by 1900; Queen Anne, real historical content): **published**
- The Cooper Conner House, The Onion Barn, The Commissary, Tenant Housing, The School House, The Long-leaf Pines, Dead River Cemetery: lorem ipsum, **unpublished on prod** until real content is written

**News (3), Events (3), Board Members (6), Partners (5):** all invented sample data, **unpublished on prod**. Their sections on the home and About pages render nothing until real entries are published (edit at `/admin/structured/…`).

**Timeline Milestones (7):** real, published. 1893 (property acquired) → 1900 (Main House complete) → … → 2026

**Pages:** `about` ("Our Story") and `stories` ("Stories & News", a short coming-soon note) are published. `/visit` asks visitors to check back for future dates while no events are published.

**Photos:** 191 legacy photos (mostly Cooper Conner House and Big House) are in the photo library as **unassigned** `archival` photos, so they appear on no public page until an editor adds captions, alt text and a project in `/admin/photos`.

**Dev and uat** still have the sample content published; only prod was cleaned.

---

## CMS Phases

| Phase | Scope | Status |
|---|---|---|
| 1 | Admin auth, dashboard shell, login | Shipped 2026-05-19 |
| 2 | Navigation editor (primary + footer) | Shipped 2026-05-19 |
| 2b | CMS pages CRUD (create, edit, publish) | Shipped 2026-05-19 |
| 3 | Migrate home/about/visit/donate/stories from content.ts to Firestore pages | Shipped 2026-05-21 |
| 4 | Migrate structured collections (projects, news, events, milestones, board, partners) to Firestore + typed admin CRUD; swap dynamic nav resolver; delete content.ts | Shipped 2026-05-29 |
| 5 | Photo upload UI in admin (`/admin/photos`: upload, edit, categorize) | Shipped 2026-06-17 |
| 6 | Donation backend (Stripe) | Planned. Prototype form (no payments) is live on dev and uat only; hidden on prod by feature flag (MCA-71, decision 8) |
| 7 | Event registration | Not started |

---

## Current Initiatives

| Initiative | Scope | Status |
|---|---|---|
| Codebase Cleanup & Modularization | Dead-code removal, content-schema extraction, transport-agnostic read layer, security/DX fixes | In progress — content-schema extracted (MCA-25); transport-agnostic read layer landed (MCA-26), unblocking the content API (MCA-53) |
| Test Coverage & QA | Vitest harness + coverage ratchet, lib backfill, E2E, security/load testing | In progress — harness and E2E scaffold shipped; lib backfill ongoing |
| **Migrate to Foundation GCP** | Move off personal-account `mcarthur-tour` to **three foundation-owned Firebase projects** (dev/uat/prod) on App Hosting, branch-per-env promotion, versioned content API for future mobile reuse | In progress — foundation Workspace, billing, nonprofit enrollment done (MCA-37). Projects `mcarthur-web-{dev,uat,prod}` (MCA-38), Firestore `nam5` + Storage `us-east1` (MCA-40), web apps (MCA-39). Deployed envs use injected config and a keyless Admin SDK, since org policy blocks keys (MCA-67, MCA-44). **All three App Hosting backends are live** (MCA-46): dev and uat on https at `dev.`/`uat.wtmcarthurhomeplace.org`; prod live on https at the apex + `www` (MCA-70). CI gates all three branches (MCA-45), with branch protection and the feature → `develop` → `uat` → `master` rule (MCA-68). Donations and the design switcher are hidden on prod (MCA-71, MCA-91). **Content copied from `mcarthur-tour` into dev, uat and prod on 2026-09-28** (MCA-48, MCA-49), including 191 legacy photos imported into the photo library as unassigned (MCA-90). On prod, placeholder content is unpublished and placeholder copy removed from the code (MCA-91). Next: sign-in + editors (MCA-51, in progress), keyless write path (MCA-88), MCA-49 sign-off, legacy decommission (MCA-59). Detail: see **Migrate to Foundation GCP** page in Notion (sibling of the Project Overview under Documentation) |
| **Website Analytics (GA4)** | Measure and report traffic with GA4: basic tracking on all envs (reported on prod only), no banner for US visitors, consent banner for EU/UK/CH only via a consent platform + Consent Mode v2, monthly board report | Planned (2026-09-27): Linear project with MCA-72 to MCA-87 (Phase 1 US basics, Phase 2 EU/UK consent, Phase 3 engagement). No environment collects data yet. Detail: see **Website Analytics — GA4 Plan** page in Notion (sibling of the Project Overview under Documentation) |

> **Migration note:** the site currently runs in the personal-account project `mcarthur-tour`. Its project id and bucket now live only in `apphosting.legacy.yaml`; `next.config.ts` and the SDK init resolve per environment (MCA-44). Stored image `downloadUrl` values are **absolute URLs** bound to the current bucket, so any content copy must rewrite them (`storagePath` is stored alongside and is the reliable source). New buckets will be `mcarthur-web-{env}.firebasestorage.app`.
>
> **Content copy (MCA-47):** `npm run migrate:content -- --from legacy --to dev` copies the nine content collections (not `editors`), copies each referenced image into the destination bucket with a fresh download token, and rewrites every `downloadUrl` and embedded rich-text URL. It also **imports every image no doc references** into the photo library (MCA-90): legacy's ~230 raw uploads, minus byte-identical duplicates (by MD5), folder markers and non-web formats (HEIC). Each one becomes an unassigned, unfeatured `archival` photo, visible in `/admin/photos` but on no public page until an editor sets its project; `--no-import-unreferenced` turns this off. It is a **dry run unless `--apply`**, `--prune` removes destination docs not in the source, and prod also needs `--confirm-prod`. After an applied run it checks that doc counts match and every image resolved. The destination uses ADC (foundation login; keys are blocked). The legacy source needs its service-account key via `SOURCE_SA_PATH`, **so keep that key until the final prod copy (MCA-49)**.

---

## CI/CD & Deployment

### Deployment Model

**Firebase App Hosting deploys natively from GitHub** — no CI step triggers the rollout. Each backend auto-rolls out when its live branch changes:

| Branch | Environment | Backend (project) | URL |
|---|---|---|---|
| `develop` | dev | `web` (`mcarthur-web-dev`) | https://dev.wtmcarthurhomeplace.org |
| `uat` | uat | `uat` (`mcarthur-web-uat`) | https://uat.wtmcarthurhomeplace.org |
| `master` | prod | `prod` (`mcarthur-web-prod`) | https://wtmcarthurhomeplace.org (+ `www`) |
| `master` | legacy | legacy backend (`mcarthur-tour`) | no traffic; decommissioned in MCA-59 |

Code promotes **up** by PR: feature → `develop` → `uat` → `master` (the rule since 2026-09-27; details in `AGENTS.md` → Git and deploy):

- Feature branches are cut from `develop` and PR'd into `develop`.
- Promotions are their own PRs: `develop` → `uat`, then `uat` → `master`, each gated by CI.
- Never PR a feature straight into `uat` or `master`, and never back-merge `master` into `develop`.

Until MCA-59, a merge to `master` deploys to both prod and legacy.

GitHub Actions runs **only as a CI gate**, on PRs into and pushes to `develop`, `uat`, and `master` (MCA-45). All work lands through PRs.

### Pipelines

| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | PR into or push to `develop` / `uat` / `master` | **Lint, type check, test, build:** lint → `tsc` → `test:coverage` → build. **E2E (emulator):** Java 21 + Chromium → `test:e2e` |

- The **build** uses the **dev** project's public web config from GitHub **repository variables** (`NEXT_PUBLIC_FIREBASE_*`, Settings → Secrets and variables → Actions → Variables). It's public by design, so not a secret, and CI has no service-account key. The donations flag follows the target branch: `"false"` for `master`, `"true"` otherwise.
- **E2E** is hermetic: pinned to the emulator project `demo-mcarthur`, never a real environment. It can't catch production-only issues such as the `downloadUrl` rewrite; that's a real-environment check (MCA-58).
- The two job names are the required checks for branch protection (MCA-68); keep them stable. Guard test: `src/test/ciWorkflow.test.ts`.

### Firebase App Hosting Config (`apphosting*.yaml`)

- `apphosting.yaml` is shared by every backend: 1 CPU, 512 MB memory, 0–2 instances, 80 concurrent connections. **No env vars.** Keep it environment-neutral.
- Each backend's **Environment** setting (backend → Settings → Environment) selects an override file, merged over the base by variable name:
  - `legacy` → `apphosting.legacy.yaml`: the live `mcarthur-tour` backend's project id, bucket, and Secret Manager references (deleted at decommission, MCA-59).
  - `dev` / `uat` / `prod` → `apphosting.{dev,uat,prod}.yaml`: the `mcarthur-web-*` foundation backends. The emulator-safety flag, plus the donations and design-tools feature flags (decisions 8 and 2); Firebase config is injected by App Hosting and the Admin SDK is keyless (decision 4). The three files must stay identical apart from comments and the per-env flags `NEXT_PUBLIC_DONATIONS_ENABLED` and `NEXT_PUBLIC_DESIGN_TOOLS_ENABLED`, both of which must be `"false"` on prod.
- App Hosting rules learned the hard way (MCA-44): a secret referenced in the base file fails the build in any project without it, and an override **can't blank** a variable (`value: ""` is rejected). Guard tests: `src/test/apphostingLegacy.test.ts`, `src/test/apphostingFoundation.test.ts`.

### Config and Secrets

**GitHub Actions (repository variables, not secrets):** the seven `NEXT_PUBLIC_FIREBASE_*` values for the **dev** project (listed in MCA-39). CI uses no secrets.

**Foundation backends (dev/uat/prod):** none. App Hosting injects the config, and the Admin SDK is keyless (decision 4).

**Legacy backend (`mcarthur-tour`, Secret Manager) / key-based `.env.local`:**
- All `NEXT_PUBLIC_FIREBASE_*` vars above
- `FIREBASE_SERVICE_ACCOUNT_JSON` — full service account JSON, **required for the admin CMS and navigation to work**

---

## Local Development Setup

```bash
# 1. Clone and install (Node 24: `.nvmrc` + package.json `engines`, MCA-64)
git clone <repo-url> && cd mcarthur-homeplace
nvm use        # or any Node 24.x
npm ci

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

# Optional: show the prototype donation flow (off unless "true"; decision 8):
NEXT_PUBLIC_DONATIONS_ENABLED=true

# Required for admin CMS (navigation, pages, auth verification):
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"mcarthur-tour",...}

# 4. Run dev server
npm run dev
```

> **Admin dashboard:** Visit `/admin` — sign in with a Google account that has been granted editor access in Firebase Auth.

> **Without `FIREBASE_SERVICE_ACCOUNT_JSON`** (and without `gcloud auth application-default login`): the admin dashboard will throw. The public site will still work, but navigation will use hardcoded defaults from `src/lib/cms/navigation.ts`.

> **Next.js 16:** Has breaking changes from prior versions. Read `node_modules/next/dist/docs/` before writing App Router code.

> **Firebase CLI:** `firebase-tools` is a devDependency — run it as `npx firebase …` (no global install needed).

> **Claude Code:** agent rules live in `AGENTS.md`; shared permissions and hooks in `.claude/settings.json` (personal approvals go in `.claude/settings.local.json`, gitignored); `/ship` runs the pre-PR gate. Background and follow-ups: Notion **Claude Code Setup**.

---

## Testing

Tests ship in the **same PR** as the code they cover (see `AGENTS.md`). Co-locate `*.test.ts` (logic, Vitest `node`) and `*.test.tsx` (components, Vitest `jsdom`) next to the module under test.

| Command | What it runs |
|---|---|
| `npm test` | Full Vitest suite (node + jsdom) |
| `npm run test:coverage` | Vitest + coverage; enforces the gate in `vitest.config.ts` |
| `npm run test:e2e` | Playwright against the Firebase Emulator Suite (seeds first) |
| `npm run emulators` | Start auth/firestore/storage emulators standalone |

- **Coverage gate** is a **ratchet floor** over `src/lib/**` plus the admin server actions and structured registry (the only write path), not a target. When a change raises real coverage, raise the floor just under the new actuals so it can't regress.
- **Unit tests** run against in-memory Firestore / Admin SDK mocks in `src/test/` — no `.env.local` or network needed.
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
| [src/lib/cms/collectionStore.ts](src/lib/cms/collectionStore.ts) | Generic store factory for structured collections (projects, news, events, milestones, board, partners) and pages |
| [src/lib/cms/collectionReader.ts](src/lib/cms/collectionReader.ts) | Transport-agnostic content read layer — what the content API (MCA-53) will reuse |
| [src/lib/firebase.ts](src/lib/firebase.ts) | Client-side Firebase init (+ opt-in emulator wiring) |
| [src/lib/firebase-admin.ts](src/lib/firebase-admin.ts) | Server-side Admin SDK — key, App Hosting keyless, emulator, or ADC (see decision 4) |
| [src/lib/firebaseConfig.ts](src/lib/firebaseConfig.ts) | Config-source decisions for both SDKs and `next.config.ts` (MCA-44) |
| [src/lib/cms/navigation.ts](src/lib/cms/navigation.ts) | Nav CRUD + hardcoded defaults |
| [src/lib/features.ts](src/lib/features.ts) | Per-environment feature flags — `donationsEnabled()` (decision 8, MCA-71) |
| [scripts/migrate-content.mjs](scripts/migrate-content.mjs) | Content copy between projects (`npm run migrate:content`); logic in `src/lib/migration/contentMigration.ts` (MCA-47) |
| [src/lib/cms/pages.ts](src/lib/cms/pages.ts) | CMS page CRUD |
| [src/lib/auth/server.ts](src/lib/auth/server.ts) | Session verification for server components |
| [src/lib/cms/photosAdmin.ts](src/lib/cms/photosAdmin.ts) | Photo library CRUD and gallery queries |
| [src/test/](src/test/) | Vitest harness — in-memory Firestore + `firebase-admin` mock |
| [e2e/](e2e/) | Playwright specs (emulator-backed) |
| [firestore.indexes.json](firestore.indexes.json) | Composite index declarations — deploy to every environment |
| [src/app/globals.css](src/app/globals.css) | Entire design system |
| [src/app/admin/layout.tsx](src/app/admin/layout.tsx) | Admin auth guard |
| [src/context/TweaksContext.tsx](src/context/TweaksContext.tsx) | Temporary design-switching state (to be removed) |
| [apphosting.yaml](apphosting.yaml) | Shared App Hosting runtime config (no env vars); per-env overrides in `apphosting.{legacy,dev,uat,prod}.yaml` |
| [vitest.config.ts](vitest.config.ts) | Test projects + coverage ratchet gate |
| [.claude/settings.json](.claude/settings.json) | Claude Code shared permissions (allow/ask/deny) + eslint PostToolUse hook |
| [.claude/skills/ship/SKILL.md](.claude/skills/ship/SKILL.md) | `/ship` — pre-PR gate: CI checks, coverage ratchet, doc sync, PR |
| [.githooks/pre-commit](.githooks/pre-commit) | Bumps ONBOARDING "Last Updated" when this file is committed (needs `core.hooksPath`) |
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | CI gate for `develop`/`uat`/`master`: lint/type/test/build + emulator E2E (no deploy step) |
