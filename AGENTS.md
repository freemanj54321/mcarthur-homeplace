<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

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
