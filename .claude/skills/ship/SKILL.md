---
name: ship
description: Pre-PR gate for this repo. Runs the same checks as CI, ratchets the coverage floor, checks tests and TODO(MCA-XX) markers, syncs ONBOARDING.md and Notion, then commits and opens a PR. Use when the user says ship it, open a PR, ready for review, or wrap this up.
---

# Ship

Take the current working-tree change from "done coding" to "PR open", enforcing the rules in `AGENTS.md`. Stop and report at the first failing step; don't paper over a red check.

## 1. Branch

- If on `develop`, `uat`, or `master`, create a branch from `origin/develop` first. Each of those branches deploys to its environment, and all work starts from `develop` (AGENTS.md → Git and deploy).
  - Issue work: `mca-<n>-<short-slug>` (ask for the MCA number if it isn't obvious from the conversation or diff).
  - No issue: `chore/<short-slug>`.

## 2. Tests ship with the code

- List changed source files: `git diff --name-only origin/develop...HEAD` plus uncommitted changes (`git status --short`).
- For each changed `src/**/*.ts(x)` module (excluding tests, `*.d.ts`, and pure config), check a co-located `*.test.ts` / `*.test.tsx` exists and was added or updated in this change.
- Missing tests for new or changed logic are a blocker: write them before continuing, or ask the user if the omission is deliberate.

## 3. Run the CI gate

Run these in order; stop on the first failure and show the output verbatim:

```bash
npm run lint
npx tsc --noEmit
npm run test:coverage
npm run build   # needs .env.local; if it's absent, say the build was skipped rather than implying it passed
```

## 4. Ratchet the coverage floor

Compare the coverage summary from step 3 to `thresholds` in `vitest.config.ts`. If any actual exceeds its floor by 1 point or more, raise that floor to `floor(actual) - 1` and include the change in this PR. Never lower a floor.

## 5. Status comments

Scan the diff (`git diff origin/develop...HEAD` plus uncommitted changes) for stubs, placeholders, `throw new Error('not implemented')`, or bare `TODO`/`FIXME` without an issue reference. Each needs `TODO(MCA-XX)` at the exact line. Scaffolding or fixtures that look unfinished but aren't get a short `DONE` note.

## 6. Docs

If the change adds or moves routes, modules listed in the file tree, collections, CI steps, or changes a phase's status:

- Update `ONBOARDING.md` (file tree, data flow, phases, Important Files).
- Update the Notion **Project Overview** page to match (https://www.notion.so/37066661a975815e994acfb3e3d2d276). Both copies must agree.

Other design docs belong in Notion under **Documentation**, not in the repo.

## 7. Commit, push, PR

- Commit: `type(scope): summary (MCA-XX)`, e.g. `feat(firestore): declare required composite indexes (MCA-41)`. End with the attribution trailer from the current session's instructions.
- Ask before `git push -u origin <branch>`. Never push to `develop`, `uat`, or `master`; never force-push.
- `gh pr create --base develop` with:
  - Title: same as the commit subject for single-commit PRs.
  - Body: what changed and why, how it was verified (the step 3 results), and any skipped steps (e.g. build without `.env.local`). End with the attribution line from the current session's instructions.
- If `gh` isn't installed or authenticated, stop after the push and give the user the compare URL: `https://github.com/freemanj54321/mcarthur-homeplace/compare/<branch>?expand=1`.
- Report the PR URL.

## 8. Promotion (separate from shipping)

`/ship` ends at the PR into `develop`. Promotion happens later, as its own PRs, once `develop` has been checked on dev:

- `gh pr create --base uat --head develop`, then, once uat is verified, `gh pr create --base master --head uat`.
- CI gates each promotion. **Ask the user before merging into `master`**: that deploys production.
- Never back-merge `master` into `develop`.

