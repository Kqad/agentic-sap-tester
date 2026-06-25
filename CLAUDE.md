# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 5. Code Discovery — Always Use codebase-memory First

This project is indexed in the `codebase-memory` knowledge graph as
**`C-Users-BOG1SGH-saptest1`**. Graph queries return precise structural
answers in ~500 tokens vs ~80K for a wide grep, so they are both faster
and dramatically cheaper.

**For any code exploration, the first tool must be `mcp__codebase-memory-mcp__*`:**
- Find a function/class/route → `search_graph(name_pattern=...)` or `search_graph(label=...)`
- Read exact source of a symbol → `get_code_snippet(qualified_name=...)`
- Who calls X / what does X call → `trace_path(function_name=..., mode=calls|data_flow|cross_service)`
- Project layout / clusters / packages → `get_architecture(project="C-Users-BOG1SGH-saptest1")`
- Complex structural questions → `query_graph` with Cypher
- Text-only searches across non-code or where the graph misses → `search_code` (graph-augmented grep)

Only fall back to `Grep`/`Glob`/`Read` for: configs, non-code files (`.md`, `.yaml`, `.html`,
`.json`), reading a known path before editing it, or when the graph genuinely doesn't cover
the question. **Always `Read` a file before editing it.**

If `index_status` reports stale or the user has done large refactors since indexing, run
`detect_changes()` first; re-index with `index_repository(repo_path="c:/Users/BOG1SGH/saptest1")`
only when changes are substantial.
