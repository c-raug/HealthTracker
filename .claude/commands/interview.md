# Interview & Planning Skill

You are helping the user plan updates to their HealthTracker app. Your job is to conduct a thorough interview, then update `future_plans.md` with well-described, implementation-ready idea entries.

## When to invoke

Invoke this skill automatically whenever the user mentions:
- Planning new features or updates
- Changes they want to make to the app
- Ideas for improvements
- "What should I work on next" style questions

Also invoked explicitly via `/interview`.

## Step 1 — Gather update ideas

Use the `AskUserQuestion` tool to ask the user what updates they have in mind. Frame it broadly so they can list multiple ideas:

> "What updates are you planning for the app? List as many ideas as you have — we'll flesh each one out."

## Step 2 — Interview each idea

For each idea the user provides, use `AskUserQuestion` to ask targeted follow-up questions until you have enough detail to write an unambiguous implementation spec. Ask about:

- **UX behavior**: What exactly does the user see/tap/experience? What is the before and after?
- **Edge cases**: What happens if the list is empty, the value is zero, the user cancels mid-flow?
- **Affected components**: Which screens, tabs, or components are involved?
- **Data / state changes**: Does this require new reducer actions, new state fields, or changes to AsyncStorage?
- **Constraints**: Any design token, pattern, or architectural rules from CLAUDE.md that apply?

Ask one `AskUserQuestion` call per ambiguous area. Keep drilling until you have no open questions.

## Step 3 — Write the ideas to future_plans.md

Once all ideas are fully understood, **append new ideas** to `future_plans.md` (or create the file if it doesn't exist). Do not remove existing entries — only add new ones or update entries that were directly discussed.

### future_plans.md format

```
# HealthTracker — Future Plans

[Brief intro describing the app vision and that this is a living roadmap.]

---

## Short-Term Ideas

[Low-complexity improvements that add meaningful daily value.]

---

### [Idea Title]

**Goal:** [One sentence describing what this adds or fixes.]

**UX:**
- [Bullet describing what the user sees/taps/experiences]
- [Additional UX details, edge cases, empty states]

**Technical notes:**
- [Affected files]
- [New state fields or reducer actions]
- [New utilities or components]

---

## Medium-Term Ideas

[Moderate complexity — meaningful UX lift, well-scoped.]

---

### [Idea Title]

...

---

## Long-Term Ideas

[High complexity — major new capabilities.]

---

### [Idea Title]

...
```

**Priority tiers:** Assign each idea to Short-Term, Medium-Term, or Long-Term based on scope and complexity. Short = a few files, low risk. Medium = new component or state changes. Long = new infrastructure, external APIs, or major new flows.

**One section per idea.** Be specific — reference exact component names, prop names, state variable names, and action types from the codebase where known.

## Step 4 — Confirm

After writing the file, tell the user:
- How many ideas were captured or updated
- Which priority tier each idea was placed in
- That `future_plans.md` has been saved and is ready for review
