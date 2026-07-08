# Token Budget Analysis: `/cp` Workflow

An analysis of where tokens are spent during a typical `/cp` (Complete Prioritized Tickets) session, and ranked optimizations for reducing cost without losing effectiveness.

---

## Major Token Consumers (Ranked by Impact)

### 1. `CLAUDE.md` as system-reminder — Largest recurring cost

Every turn in the conversation, `CLAUDE.md` is injected wholesale as a `# claudeMd` block inside the system-reminder. That file documents every component, every pattern, every action, every modal, and every tab. It likely runs **15,000–25,000+ tokens** and is paid for on *every single turn* of a session — the initial `/cp` turn, the `/update-docs` turn, the `/push-changes` turn, and any board-management turns.

This is the single highest-leverage place to optimize:
- **Option A**: Trim rarely-needed detail (per-pixel layout specs, exhaustive field lists)
- **Option B**: Split into a short index (always loaded) + topic files (loaded on demand via skill instructions)
- **Option C**: Accept the cost as the price of correctness and focus elsewhere

### 2. `/update-docs` reading large files it didn't need to change

The update-docs skill reads **all four** documentation targets in full:
- `README.md` (~430 lines)
- `.claude/documentation/style_guide.md` (~1,090 lines)
- `CLAUDE.md` (again, even though it's already in context from the system-reminder)
- All skill `SKILL.md` files

In a typical `/cp` run touching 1–2 components, only a few lines of `CLAUDE.md` need updating. The skill pays full read cost for every doc even when 95%+ is already correct.

**Optimization**: Add a grep/diff step before full reads — identify changed symbols and only read sections that reference them.

### 3. Project board GraphQL response — 73KB one-shot dump

The board query fetches all 50 project items with their full field values and complete issue bodies. Even though the response is saved to a file, the tool result preview + parse step both consume tokens. A two-step approach would help:
1. First query: item IDs + Status field only (small response)
2. Second query: fetch bodies only for the Prioritized items

Or use a server-side filter if the GitHub GraphQL API supports it for project fields.

### 4. Three skill `SKILL.md` files loaded sequentially

`/cp`, `/update-docs`, and `/push-changes` each load their full `SKILL.md` as part of the `Skill` tool invocation. These are detailed multi-step instructions (~500–1,500 tokens each). They're paid once per invocation, not per turn, but they do accumulate in context.

**Optimization**: Trim skill files to remove examples and rationale text — keep only the imperative steps.

### 5. Tool result round-trips

Every `Bash`, `Read`, and `Edit` call produces a tool result that enters the context window. The `git log`, `ls -R`, and `grep` outputs from the `/update-docs` audit phase add up across multiple parallel calls.

---

## Optimization Table (Ranked by ROI)

| Optimization | Estimated Savings | Difficulty |
|---|---|---|
| Trim or split `CLAUDE.md` (loaded every turn) | 30–50% of total session cost | Medium |
| Make `/update-docs` grep before full-reading | 10–20% per `/cp` run | Low |
| Filter project board GraphQL to Prioritized-only | 5–10% per `/cp` run | Low |
| Trim skill `SKILL.md` files to imperative steps only | 2–5% per invocation | Low |
| Merge `/update-docs` step into `/cp` (avoid handoff overhead) | 2–5% | Medium |

---

## Key Takeaway

The dominant cost by far is **`CLAUDE.md` being loaded on every turn**. Reducing it by 40% would save more tokens than all other optimizations combined. Everything else is a secondary optimization.
