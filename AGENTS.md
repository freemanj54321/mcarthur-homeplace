<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

If `node_modules/` is missing, run `npm install` first. The docs mirror nextjs.org: grep `node_modules/next/dist/docs/01-app/` (API reference is under `03-api-reference/`) for the API before using it. Known rename: `middleware.ts` is deprecated in favor of `proxy.ts` (see `03-file-conventions/proxy.md`).

# Commands

| Task | Command | Notes |
|---|---|---|
| Dev server | `npm run dev` | Needs `.env.local` (see ONBOARDING.md) |
| Lint | `npm run lint` | |
| Type check | `npx tsc --noEmit` | |
| Unit tests + coverage gate | `npm run test:coverage` | Mocked Firestore; no `.env.local` needed |
| E2E | `npm run test:e2e` | Firebase emulators (needs Java 21+) + Playwright |
| Build | `npm run build` | Needs the `NEXT_PUBLIC_FIREBASE_*` env vars |

# Definition of done

Before saying a change is complete, run `npm run lint`, `npx tsc --noEmit`, and `npm run test:coverage`: the same gate CI runs in `.github/workflows/pr-checks.yml`. Report failures verbatim; don't summarize a red run as green.

# Git and deploy

**Pushing to `master` deploys to production** (Firebase App Hosting builds from `master` automatically). Never push to `master` directly:

* Branch per issue: `mca-<n>-<short-slug>` (e.g. `mca-41-firestore-indexes`); use `chore/<slug>` for work with no issue.
* Commits: `type(scope): summary (MCA-XX)`, e.g. `feat(firestore): declare required composite indexes (MCA-41)`.
* Open a PR to `master`; CI must pass before merge.
* The `/ship` skill runs this whole flow (checks → branch → commit → PR). Prefer it to doing the steps by hand.

# Claude Code configuration

* `.claude/settings.json` (committed) holds the shared permissions and hooks. Personal or machine-specific approvals go in `.claude/settings.local.json` (gitignored), never in the shared file.
* A PostToolUse hook runs eslint on every file you edit; fix what it reports before moving on.
* Rationale, history, and open follow-ups: Notion **Claude Code Setup** (https://www.notion.so/3e666661a975812fae76fe98b31d3b5d).

# Documentation lives in Notion

All project documents (plans, design docs, phase write-ups, etc.) live in Notion, not in the repo. The canonical home is the **Documentation** page: https://www.notion.so/Documentation-37066661a97580aa9c96e5848d63487e

Follow the established pattern: a parent overview page per initiative, with one child page per phase/sub-document under it. For example, the CMS plan is the **Editable Site — CMS Plan** overview page with a child page per phase. When documentation changes, update the existing Notion pages rather than adding Markdown docs to the repo.

**Exception — `ONBOARDING.md`:** the project overview is deliberately dual-homed. Notion's **Project Overview** page is canonical, but a synced mirror lives at `ONBOARDING.md` in the repo so it can be imported into agent context via `@ONBOARDING.md` in `CLAUDE.md` (Notion is not auto-loaded into context). When the overview changes, update **both** the Notion page and `ONBOARDING.md`.

# Tests ship with the code

New or changed code includes its own tests **in the same PR** — do not defer coverage to a separate testing effort. Co-locate test files next to the module under test: `*.test.ts` for logic (Vitest `node` project) and `*.test.tsx` for components (Vitest `jsdom` project); both are discovered under `src/**`.

The **Test Coverage & QA** project (and issue MCA-33) is reserved for backfilling tests for pre-existing untested modules, E2E, and the coverage harness — not for new code's tests. The coverage gate in `vitest.config.ts` is a **ratchet floor**: when a change raises real coverage, raise the floor to just under the new actuals so it can't regress.

# Code is commented for status, not narration

Every file should be legible on its own about what's finished and what isn't — a reviewer shouldn't have to cross-reference Linear or chat history to know. In code you write or touch:

* Mark incomplete, stubbed, or deferred work inline with `TODO(MCA-XX)` referencing the relevant issue, at the specific line/block it applies to.
* Mark work that's finished but easy to mistake for a stub (scaffolding, fixtures, config) with a short `DONE` note so it isn't re-litigated.
* Comment the WHY for anything non-obvious — a constraint, an invariant, a workaround — not the WHAT (well-named code already says that).

This doesn't mean comment every line; it means don't leave silent gaps. If a module is genuinely finished and unsurprising, it doesn't need a status comment at all.
