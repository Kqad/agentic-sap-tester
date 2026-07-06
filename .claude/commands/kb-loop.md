---
description: 启动 KB 自动审计 loop (每小时一次) — 跟着代码变化实时更新两份 KB (user + dev)
---

/loop 1h Audit the saptest1 project at c:/Users/BOG1SGH/saptest1 and update BOTH knowledge base files if the codebase has drifted.

There are TWO KBs, by audience:
- `server/data/studio-kb.md` — **end users of Run Center** (`/run-center.html`). Business folks who pick test cases and run them.
- `server/data/studio-kb-dev.md` — **developers using Case Studio** (`/case-studio.html`). Authors / debug / promote cases.

The chat server routes between them by `context.app` (the client sends `app: 'run-center'` or `app: 'case-studio'`).

Each KB has its own audience — never mix runner internals into the user KB, and don't dumb things down in the dev KB.

## Audit steps

1. Read both KBs to know their current structure:
   - `server/data/studio-kb.md` (currently ~326 lines, 10 sections, end-user focus)
   - `server/data/studio-kb-dev.md` (currently ~419 lines, 9 sections, developer focus)

2. Find recent activity: `git log --oneline -15` and `git status`. Note staged / unstaged changes and any commits since the most recent KB updates.

3. For each change, classify by file AND by relevance to each audience:

   **Files that mainly affect the USER KB (`studio-kb.md`):**
   - `web/run-center.html` — every change here could affect what end-users see
   - `server/api/chat.js` (chat UX visible to both audiences — update both `studio-kb.md` §4.8 + §9 AND `studio-kb-dev.md` §4.9 + §8 if it shifted)

   **Files that mainly affect the DEV KB (`studio-kb-dev.md`):**
   - `web/case-studio.html` — every change here is dev-facing
   - `server/midscene/runner.js`, `server/midscene/recovery.js`, `server/midscene/cache-*.js` — runner internals (§5 in dev KB)
   - `server/api/midscene-js.js`, `server/api/cases.js`, `server/api/generate.js` — dev-touching endpoints
   - `e2e/cases/*.json` — only if a STRUCTURAL schema change (new top-level field), not content edits

   **Files that affect BOTH:**
   - `server/data/validated-cases.json` — which cases are in the library (mention in user KB §3.6 if the list shifts meaningfully; mention promote/demote workflow in dev KB §6.3)

4. Classify each change:
   - **End-user-visible architecture** (new section / modal / search / chat capability / failure recovery / removed feature) → update user KB
   - **Dev-visible architecture** (new advanced parameter / new fast path / new entity field / new cache strategy / new recovery layer) → update dev KB
   - **Cosmetic** (CSS, button rename, color, layout, copy edit) → SKIP both
   - **Implementation detail not visible to either audience** → SKIP (e.g. internal refactor of an existing fast path that doesn't change behaviour)

5. Apply minimal in-place Edit calls — don't rewrite whole sections. Preserve each KB's structure.

6. If anything architectural changed, append a dated bullet to the relevant KB's "Recent changes" section (§10 in user KB, §9 in dev KB), newest first. Format: `- **<one-line description>** — <one sentence on why or what it replaces>`

7. **Do NOT commit.** Leave changes staged so the user reviews via `git diff server/data/studio-kb.md server/data/studio-kb-dev.md`.

8. **If nothing material drifted, do nothing.** Print "no drift" and end the cycle without touching either file.

## At end of each cycle, print

- Date / time of audit
- Commits / changes inspected
- Which KB(s) were touched (or "no changes")
- One-line per change applied, prefixed with `[user]` or `[dev]`
- Byte delta per file
- Then schedule the next cycle: no recent commits → long sleep (1800s+); just touched run-center.html or case-studio.html → short sleep (300-600s). Use judgment.
