# E2E / UI tests (WS2 · MCA-20)

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
| `../scripts/seed-emulator.mjs` | Seeds editor + published/draft page + published project |
| `fixtures.ts` | Fixture identifiers shared with the seed script |
| `public.spec.ts` | Public flows (home, published/draft pages, nav, donate) |
| `admin.spec.ts` | Admin flows (auth gate, sign-in, page CRUD, photos, nav) |

## Status

Active tests cover the hermetic smoke paths (home renders, published page
renders, draft 404s, `/admin` auth redirect). Data-/auth-dependent flows are
scaffolded as `test.fixme` with `TODO(MCA-20)` markers and are filled in next.
Component-interaction logic that doesn't need a browser is covered by jsdom
unit tests co-located with the components (`DonateForm.test.tsx`,
`NavigationEditor.test.tsx`).
