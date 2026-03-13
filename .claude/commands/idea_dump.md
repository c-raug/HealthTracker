# Idea Dump Skill

You are helping the user brainstorm and document future ideas for their HealthTracker app. Your job is to orient yourself on the current app state, conduct a wide-ranging interview across all areas of the app, and append new ideas to `future_plans.md`.

This skill is for **blue-sky thinking and backlog building** — ideas do not need to be scheduled or implementation-ready. That is what `/interview` and `prd.md` are for.

## When to invoke

Invoke this skill automatically whenever the user:
- Says "brainstorm", "idea dump", "what could I add", or similar
- Asks for suggestions on what to improve or build next
- Wants to explore possibilities without committing to implementation

Also invoked explicitly via `/idea_dump`.

## Step 1 — Orient

Before asking anything, read both of these files silently:
- `CLAUDE.md` — understand the current app architecture, components, and patterns
- `future_plans.md` — know what ideas are already documented so you don't duplicate them

Use this context to ask informed follow-up questions and to assign ideas to the right priority tier.

## Step 2 — Opening question

Ask the user what areas they want to explore. Cover the full surface area of the app:

> "What areas of the app do you want to brainstorm ideas for? We can cover any combination of: Weight tracking, Nutrition & meals, Activity logging, Settings & goals, UI/UX & animations, Data & backup, or anything else entirely."

## Step 3 — Drill into each area

For each area or idea the user raises, use `AskUserQuestion` to ask targeted follow-up questions:

- **UX behavior**: What does the user see/tap/experience? What changes?
- **Scope**: Is this a small polish, a new component, or a major new capability?
- **Priority**: Is this something they want soon, eventually, or just someday?
- **Edge cases**: What happens in empty/zero/cancel states?

Keep the tone exploratory — it's fine to capture a half-formed idea. The goal is breadth, not depth.

Suggest ideas proactively when relevant. If the user mentions the Weight tab, you might ask: "Would you want to see a body measurements tracker alongside weight?" Use your knowledge of the app (from Step 1) to make relevant suggestions they may not have thought of.

## Step 4 — Append to future_plans.md

Once you have enough detail for each idea, **append** new entries to `future_plans.md`. Never remove or modify existing entries. Skip any ideas already documented there.

Assign each idea to a priority tier:
- **Short-Term** — a few file changes, low risk, adds daily value
- **Medium-Term** — new component or state changes, moderate effort
- **Long-Term** — new infrastructure, external APIs, or major new flows

### Entry format

```
### [Idea Title]

**Goal:** [One sentence describing what this adds or fixes.]

**UX:**
- [What the user sees/taps/experiences]
- [Edge cases or empty states]

**Technical notes:**
- [Affected files or new components]
- [New state fields or reducer actions, if known]
```

Place each entry under the correct `## Short-Term Ideas`, `## Medium-Term Ideas`, or `## Long-Term Ideas` section. If a section doesn't exist yet, create it.

## Step 5 — Confirm

After writing the file, tell the user:
- How many new ideas were added
- Which priority tier each idea landed in
- That `future_plans.md` has been updated
