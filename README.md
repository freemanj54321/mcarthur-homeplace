# W. T. McArthur Historic Homeplace — website

Public website and editor CMS for the **W. T. McArthur Historic Homeplace, Inc.**, a nonprofit restoring a 19th-century farm. Next.js 16 (App Router) on Firebase: Firestore, Storage, Auth and App Hosting.

| Environment | Branch | URL |
|---|---|---|
| dev | `develop` | https://dev.wtmcarthurhomeplace.org |
| uat | `uat` | https://uat.wtmcarthurhomeplace.org |
| prod | `master` | https://wtmcarthurhomeplace.org |

Each branch deploys automatically. Changes go **feature → `develop` → `uat` → `master`**, by pull request.

## Start here

- **[ONBOARDING.md](ONBOARDING.md)**: architecture, key decisions, data model, deployment and local setup. It mirrors the Notion **Project Overview**, which is canonical.
- **[AGENTS.md](AGENTS.md)**: working rules for this repo: commands, definition of done, git and deploy flow, tests with every change.
- **Notion → Documentation**: plans, design docs and runbooks (not kept in the repo).

## Local development

Needs **Node 24** (`.nvmrc`) and **npm**. Don't switch to pnpm or yarn, and never set `ignore-scripts`: the Firebase SDK's install script is part of how deployed builds get their config.

```bash
nvm use
npm ci
cp .env.example .env.local   # then fill in; see comments in the file
gcloud auth application-default login   # server-side access, no key files
npm run dev
```

Editors sign in at `/admin` with a Google account on the editor allowlist.

## Checks

| Task | Command |
|---|---|
| Lint | `npm run lint` |
| Type check | `npx tsc --noEmit` |
| Unit tests + coverage gate | `npm run test:coverage` |
| E2E (Firebase emulators, needs Java 21+) | `npm run test:e2e` |
| Build | `npm run build` |

CI (`.github/workflows/ci.yml`) runs all of these on pull requests into `develop`, `uat` and `master`.
