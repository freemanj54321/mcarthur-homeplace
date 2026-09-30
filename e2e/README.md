# E2E / UI tests (WS2 · MCA-20, completed in MCA-148)

Hermetic end-to-end tests run with **Playwright** against the app wired to the
**Firebase Emulator Suite** (Auth + Firestore + Storage). No real Firebase
project or credentials are touched — the suite uses the offline `demo-mcarthur`
project.

## Running

```bash
npm run test:e2e        # emulators:exec → seed → playwright test (headless)
npm run test:e2e:ui     # same, with the Playwright UI runner
```

`test:e2e` wraps everything in `firebase emulators:exec`, which:

1. Boots the Auth/Firestore/Storage emulators.
2. Sets `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` /
   `FIREBASE_STORAGE_EMULATOR_HOST` so the **Admin SDK** auto-connects.
3. Runs `scripts/seed-emulator.mjs` to seed fixture data (see `fixtures.ts`).
4. Runs `playwright test`, whose `webServer` boots `next dev` with
   `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true` so the **client SDK** connects to
   the same emulators (see `src/lib/firebase.ts`).

To poke at the emulators manually: `npm run emulators`.

## Layout

| File | Purpose |
|---|---|
| `../playwright.config.ts` | Playwright config + `next dev` webServer (port 3100) |
| `../scripts/seed-emulator.mjs` | Seeds the editor (with a linked Google identity), a published and a draft page, a published project and two milestones; clears photos and navigation |
| `fixtures.ts` | Fixture identifiers shared with the seed script |
| `a11y.spec.ts` | axe-core scans of key public pages + admin login; serious/critical WCAG 2.1 AA violations fail (MCA-150) |
| `auth.ts` | `signInAsEditor()`: signs in through the real "Continue with Google" button and the Auth emulator's account chooser |
| `public.spec.ts` | Public flows (home, published/draft pages, nav, donate) |
| `admin.spec.ts` | Admin flows (auth gate + `?next=`, sign-in, create/edit/publish a page, photo upload shown on its place page, nav edit, structured reorder) |

## Status

DONE (MCA-148): no `test.fixme` left. Every admin flow signs in through the
real Google button against the Auth emulator (`auth.ts`); going through the UI
also signs in the client SDK, which Storage uploads need. Tests leave unique
data (timestamped slugs, captions) so they can run in parallel.
Component-interaction logic that doesn't need a browser is also covered by jsdom
unit tests co-located with the components (`DonateForm.test.tsx`,
`NavigationEditor.test.tsx`).

## Running locally

Needs **Java 21+** (the emulators) and Chromium's system libraries. On a
normal desktop, `npx playwright install --with-deps chromium` covers the
browser side. A headless server with no fonts installed renders text at zero
size, so text assertions fail; install a basic font package (for example
`fonts-dejavu-core`).
