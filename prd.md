# HealthTracker — Product Requirements

## Phase 1: Redesign /ci (Create Issues) Skill [COMPLETE]

### 1.1 — Replace brainstorm-first flow with direct issue structuring

The old /ci skill started with an open-ended brainstorm interview before creating issues. The new flow skips brainstorming — it accepts issues the user already has in mind and jumps straight to structuring each one into a well-defined ticket format.

**Changes:**
- `.claude/skills/ci/SKILL.md`: Complete rewrite — removed brainstorm interview, tier assignment, and "done brainstorming" gate. Replaced with direct "collect ideas → structure each one" flow.

### 1.2 — 3-category label system

Replaced the old single-tier label (short-term/medium-term/long-term + enhancement) with a 3-category system: Type (bug/improvement/feature), Page (weight/nutrition/activity/settings/global), and Timeline (short-term/medium-term/long-term). Every issue gets exactly 3 labels.

**Changes:**
- `.claude/skills/ci/SKILL.md`: Added Label System section with 3 category tables. Added `global` page label for cross-cutting concerns.

### 1.3 — Structured issue body format

Each issue now follows a strict format: Description (why it matters), Technical Implementation (specific files, components, reducer actions, patterns from CLAUDE.md), and Acceptance Criteria (verifiable checklist).

**Changes:**
- `.claude/skills/ci/SKILL.md`: Defined Issue Format template. Issue body uses Description → Technical Implementation → Acceptance Criteria sections.

### 1.4 — One-at-a-time approval with revision loop

Instead of batch-creating all issues, the new skill presents each structured issue individually. If rejected, asks what to change, revises, and re-presents until approved.

**Changes:**
- `.claude/skills/ci/SKILL.md`: Step 3 includes per-issue approval gate with "Approve" / "Revise" options and revision loop.

### 1.5 — Claude-suggested timeline labels

Timeline labels are now suggested by Claude based on scope/complexity, rather than requiring manual assignment. Users can override during approval.

**Changes:**
- `.claude/skills/ci/SKILL.md`: Label Assignment Rules specify Claude suggests timeline; user overrides during approval.

---

## Files Changed in Phase 1

- `.claude/skills/ci/SKILL.md` — complete rewrite with new label system, issue format, and approval flow
- `CLAUDE.md` — updated /ci skill description
