# W. T. McArthur Historic Homeplace — Project Overview

> Last Updated: 2026-05-18

---

## Mission

> *"The mission is to engage the public in the stories of the W. T. McArthur historic homeplace and farm (Historic Homeplace) and how it represents a historic period in Southern American agriculture. We are dedicated to telling the authentic history of the Historic Homeplace, based on current information and from all perspectives, honoring the families and stories of all that lived and worked on the farm."*

The **W. T. McArthur Historic Homeplace, Inc.** is a nonprofit heritage foundation operating a 19th-century farm restoration site. This website is the public-facing presence of that foundation — telling its stories, showcasing restoration projects, announcing events, and receiving donations.

---

## What This App Is

A **content-forward public website** for a nonprofit historic foundation. The primary goals are:

1. **Storytelling** — Present the history and ongoing restoration of the farm from all perspectives
2. **Project showcase** — Document each structure being restored (Main House, Cooper Conner House, Cemetery, Smokehouse)
3. **Community engagement** — Promote upcoming events, accept volunteer interest, and solicit donations
4. **Foundation transparency** — Board members, partners, and timeline of milestones

This is not an app with heavy user interaction. It is closer to a digital brochure + photo gallery with a donation channel.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | See `AGENTS.md` — this version has breaking changes from prior Next.js |
| Language | TypeScript 5 (strict) | Path alias `@/*` → `src/*` |
| React | 19.2 | Server Components where possible |
| Styling | CSS custom properties (global) | No CSS-in-JS, no Tailwind — hand-crafted design system |
| Database | Cloud Firestore | Photos only; content is hardcoded for now |
| Storage | Firebase Storage | Images served from `mcarthur-tour.firebasestorage.app` |
| Auth | Firebase Auth (imported, unused) | Reserved for future admin dashboard |
| Hosting | Firebase App Hosting (Cloud Run) | 0–2 instances, 512 MB, 80 concurrent connections |
| CI/CD | GitHub Actions | Lint → type check → build → Firebase rollout |

---

## Architecture

### File Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout — wraps in ClientShell
│   ├── page.tsx            # Home page
│   ├── about/page.tsx
│   ├── projects/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── stories/page.tsx
│   ├── visit/page.tsx
│   └── donate/page.tsx
├── components/
│   ├── (ui)                # Header, Footer, BrandMark, ClientShell, TweaksPanel, etc.
│   ├── home/               # Hero variants, MissionSection, ProjectsTeaser, etc.
│   ├── projects/           # ProjectsList, ProjectDetailPage
│   ├── donate/             # DonateForm
│   └── about/              # AboutDonateStrip
├── context/
│   └── TweaksContext.tsx   # Design-mode toggle state
├── data/
│   └── content.ts          # All hardcoded content (projects, news, events, board)
└── lib/
    ├── firebase.ts         # Firebase init — exports db, storage
    └── photos.ts           # Firestore queries for photo collections
```

### Data Flow

```
Hardcoded content (data/content.ts)
    └── imported directly into page components

Firestore `photos` collection
    └── queried via lib/photos.ts
        ├── getProjectPhotos(slug) — photos for a specific project
        └── getFeaturedPhotos()   — homepage/featured use
```

No API routes. No server actions. No backend middleware. The app is fully client-rendered except where Next.js handles SSR automatically.

---

## Design System

The design system lives entirely in [src/app/globals.css](src/app/globals.css) (~720 lines). It is **not Tailwind** — all utility comes from CSS custom properties on the root element.

### Color Palette (Clan MacArthur Tartan)

| Token | Value | Role |
|---|---|---|
| `--tartan-green` | `#1F4A2E` | Primary brand color |
| `--tartan-gold` | `#D4A017` | Accent / calls to action |
| `--tartan-navy` | `#1B2A4E` | Emphasis text |
| `--tartan-parch` | `#F4EDE0` | Default background (parchment) |
| `--tartan-ink` | `#14110D` | Body text |

### Typography Pairs

Three pairs, switchable via `data-typepair` attribute. The default is **Type A**.

| Pair | Display | Body | Feel |
|---|---|---|---|
| A (default) | Fraunces | Inter | Warm editorial |
| B | Playfair Display | Work Sans | Classical magazine |
| C | Cormorant Garamond | Manrope | Refined modern |

All fonts loaded via Google Fonts. Script accent: **Caveat** (handwritten).

### Modes

- **Day** (default): Parchment background, dark ink text
- **Dark**: Deep `--tartan-green` background, cream text

Mode and tartan intensity (subtle / medium / bold) are set as `data-*` attributes on `<html>` by `TweaksContext`.

---

## Key Architectural Decisions

### 1. Content is hardcoded — intentionally

All projects, news items, events, board members, and milestones live in [src/data/content.ts](src/data/content.ts). This is a deliberate choice for the current phase: no CMS complexity, no Firestore reads for text content, no API latency. When the foundation needs to update content, a developer edits the file and deploys.

**This will change** when an admin dashboard is built. At that point content will move to Firestore and `content.ts` becomes a fallback or is removed.

### 2. TweaksPanel is a temporary design tool

The [TweaksPanel](src/components/TweaksPanel.tsx) and [TweaksContext](src/context/TweaksContext.tsx) expose live controls for switching hero variants, color modes, typography pairs, and tartan intensity. This exists to let stakeholders explore design options without code changes.

**It is not a permanent user-facing feature.** Once the design is locked, TweaksPanel and TweaksContext will be removed and the chosen values will be hardcoded into the CSS defaults.

### 3. Firebase is the only backend

Firestore handles photo metadata; Firebase Storage serves images; Firebase App Hosting runs the Next.js app. There is no separate API server, no Postgres, no Redis. This keeps infrastructure minimal for a small nonprofit.

### 4. No authentication yet

Firebase Auth is initialized but unused. It is reserved for the future admin dashboard, where board members will be able to upload photos, add news items, and manage events without a developer.

---

## Firestore Schema

### `photos` collection

| Field | Type | Description |
|---|---|---|
| `filename` | string | Original filename |
| `storagePath` | string | Path in Firebase Storage bucket |
| `downloadUrl` | string | Public CDN URL |
| `caption` | string | Display caption |
| `altText` | string | Accessibility alt text |
| `project` | string | Matches project `slug` in `content.ts` |
| `category` | string | e.g. `"exterior"`, `"interior"`, `"progress"` |
| `featured` | boolean | Whether to show on home/featured sections |
| `order` | number | Sort order within a project/category |
| `dateTaken` | timestamp | When the photo was taken |
| `uploadedAt` | timestamp | Server timestamp of upload |

---

## Current Content (as of last update)

**Projects (4):**
- The Main House (1893–1898, Folk Victorian, ~1,400 sq ft)
- The Cooper Conner House (c. 1908, Vernacular cottage)
- The Family Cemetery (1897+, burial ground)
- The Smokehouse & Outbuildings (c. 1912, log construction)

**Board Members (6):** see `content.ts` — `boardMembers` array

**Partner Organizations (5):** see `content.ts` — `partners` array

**Timeline Milestones (7):** 1893 → 2026

---

## Planned Features (Roadmap)

| Feature | Status | Notes |
|---|---|---|
| Photo galleries | In progress | Firestore queries exist; UI gallery component needed |
| Donation backend | Planned | Stripe integration for `DonateForm` component |
| Admin dashboard | Planned | Auth-gated CMS for board members to manage content |
| Event registration | Not started | Likely form + email notification |

---

## CI/CD & Deployment

### Deployment Model

**Firebase App Hosting deploys natively from GitHub** — no CI step triggers the rollout. When `master` is pushed, Firebase's GitHub connection (configured in the Firebase Console → App Hosting → backend settings) detects the push and creates a new rollout automatically.

GitHub Actions runs **only as a CI gate** (lint, type check, build). It does not deploy.

### Pipelines

| Workflow | Trigger | Steps |
|---|---|---|
| `deploy.yml` | Push to `master` | Lint → TypeCheck → Build (verification only) |
| `pr-checks.yml` | Pull request to `master` | Lint → TypeCheck → Build |

> The file is still named `deploy.yml` for historical reasons but no longer deploys — Firebase handles that side natively.

### Firebase App Hosting Config (`apphosting.yaml`)

- 1 CPU, 512 MB memory
- Min 0 instances (scales to zero), max 2
- 80 concurrent connections
- All `NEXT_PUBLIC_FIREBASE_*` env vars stored in Google Secret Manager

### Secrets Required (GitHub → Settings → Secrets)

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

> `FIREBASE_SERVICE_ACCOUNT_JSON` is no longer required for deployment — Firebase deploys via its own GitHub App connection. The secret can be removed from GitHub if it isn't used elsewhere.

---

## Local Development Setup

```bash
# 1. Clone
git clone <repo-url>
cd mcarthur-homeplace

# 2. Install dependencies
npm install

# 3. Enable auto-updating git hook (updates Last Updated date in this file on commit)
git config core.hooksPath .githooks

# 4. Create .env.local with Firebase credentials
# (Get values from Firebase console → Project settings → Web app)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mcarthur-tour
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mcarthur-tour.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# 5. Run dev server
npm run dev
```

> **Note on Next.js version:** This project uses Next.js 16, which has breaking changes from prior versions. Read `node_modules/next/dist/docs/` before writing App Router code.

---

## Important Files Reference

| File | Purpose |
|---|---|
| [src/data/content.ts](src/data/content.ts) | All hardcoded site content |
| [src/lib/firebase.ts](src/lib/firebase.ts) | Firebase client initialization |
| [src/lib/photos.ts](src/lib/photos.ts) | Firestore photo queries |
| [src/app/globals.css](src/app/globals.css) | Entire design system (colors, type, spacing, modes) |
| [src/context/TweaksContext.tsx](src/context/TweaksContext.tsx) | Temporary design-switching state (to be removed) |
| [src/components/ClientShell.tsx](src/components/ClientShell.tsx) | App wrapper: Header + Footer + TweaksProvider |
| [apphosting.yaml](apphosting.yaml) | Firebase App Hosting runtime config |
| [.github/workflows/deploy.yml](.github/workflows/deploy.yml) | Production deploy pipeline |
