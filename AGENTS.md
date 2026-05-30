<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Documentation lives in Notion

All project documents (plans, design docs, phase write-ups, etc.) live in Notion, not in the repo. The canonical home is the **Documentation** page: https://www.notion.so/Documentation-37066661a97580aa9c96e5848d63487e

Follow the established pattern: a parent overview page per initiative, with one child page per phase/sub-document under it. For example, the CMS plan is the **Editable Site — CMS Plan** overview page with a child page per phase. When documentation changes, update the existing Notion pages rather than adding Markdown docs to the repo.

**Exception — `ONBOARDING.md`:** the project overview is deliberately dual-homed. Notion's **Project Overview** page is canonical, but a synced mirror lives at `ONBOARDING.md` in the repo so it can be imported into agent context via `@ONBOARDING.md` in `CLAUDE.md` (Notion is not auto-loaded into context). When the overview changes, update **both** the Notion page and `ONBOARDING.md`.
