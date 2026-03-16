# Create Issues Skill

Brainstorm new ideas with the user, then push them directly to GitHub as labelled issues in the Backlog column of the HealthTracker Project board. No intermediate file — ideas go straight from conversation to GitHub.

## When to invoke

Invoke this skill automatically whenever the user:
- Says "brainstorm", "idea dump", "what could I add", or similar
- Asks for suggestions on what to improve or build next
- Wants to explore possibilities without committing to implementation
- Says "create github issues", "sync issues", "push to board", "sync roadmap", or "create project board"
- Asks to track future plans or backlog items on GitHub

Also invoked explicitly via `/create-issues`.

## Step 1 — Orient

Before asking anything, read both of these silently:
- `CLAUDE.md` — understand the current app architecture, components, and patterns
- Fetch existing open GitHub issues to know what's already tracked (for duplicate detection and informed suggestions):
  ```
  gh issue list --repo c-raug/HealthTracker --state open --limit 100 --json title,number
  ```

Use this context to ask informed follow-up questions and to avoid proposing ideas that are already issues.

## Step 2 — Opening question

Ask the user what areas they want to brainstorm ideas for. Use `AskUserQuestion` with multi-select options covering:

> "What areas of the app do you want to brainstorm ideas for?"

Options: Weight tracking, Nutrition & meals, Activity logging, Settings & goals, UI/UX & animations, Data & backup, Something else

## Step 3 — Drill into each area

For each area or idea the user raises, use `AskUserQuestion` to ask targeted follow-up questions:

- **UX behavior**: What does the user see/tap/experience? What changes?
- **Scope**: Is this a small polish, a new component, or a major new capability?
- **Priority**: Is this something they want soon, eventually, or just someday?
- **Edge cases**: What happens in empty/zero/cancel states?

Keep the tone exploratory — it's fine to capture a half-formed idea. The goal is breadth, not depth.

Suggest ideas proactively when relevant. If the user mentions the Weight tab, you might ask: "Would you want to see a body measurements tracker alongside weight?" Use your knowledge of the app (from Step 1) to make relevant suggestions they may not have thought of.

Accumulate all ideas internally as a list — do NOT write anything to `future_plans.md` or any file.

## Step 4 — Ask if done

After covering the areas the user selected, use `AskUserQuestion`:

> "Are you done brainstorming, or would you like to explore more areas?"

Options: **Yes, I'm done — create the issues** | **Keep going**

- If **Keep going** → return to Step 2.
- If **Yes, I'm done** → proceed to Step 5.

## Step 5 — Ensure labels exist

Check existing labels:
```
gh label list --repo c-raug/HealthTracker --limit 100
```

For each missing label, create it:
```
gh label create "short-term" --repo c-raug/HealthTracker --color "0E8A16" --description "Lower-complexity improvements that add meaningful daily-use value"
gh label create "medium-term" --repo c-raug/HealthTracker --color "0075CA" --description "New components or state changes — moderate design and dev effort"
gh label create "long-term" --repo c-raug/HealthTracker --color "D93F0B" --description "Large infrastructure, external APIs, or major new flows"
gh label create "enhancement" --repo c-raug/HealthTracker --color "A2EEEF" --description "New feature or request"
```

Only run `gh label create` for labels not already present.

## Step 6 — Create GitHub issues directly

For each accumulated idea that is NOT already an open issue (case-insensitive title match against the list fetched in Step 1):

Assign a priority tier:
- **Short-Term** — a few file changes, low risk, adds daily value
- **Medium-Term** — new component or state changes, moderate effort
- **Long-Term** — new infrastructure, external APIs, or major new flows

Construct the issue body:

```
## Goal

{One sentence describing what this adds or fixes.}

## Details

{UX behavior bullets — what the user sees/taps/experiences, edge cases, empty states}

## Technical Notes

{Affected files or new components, new state fields or reducer actions if known}

---

_Tier: {short-term | medium-term | long-term}_
```

Create the issue:
```
gh issue create \
  --repo c-raug/HealthTracker \
  --title "{Idea Title}" \
  --body "{body constructed above}" \
  --label "enhancement" \
  --label "{short-term | medium-term | long-term}"
```

Capture the URL returned by each `gh issue create` call. Record skipped duplicates separately.

## Step 7 — Add to project board and set Backlog status

For each newly created issue URL, add it to the HealthTracker Project:
```
gh project item-add 3 --owner c-raug --url {issue-url}
```

The output includes the item ID. Use it to set the Status to **Backlog**:
```
gh project item-edit \
  --id {item-id} \
  --project-id PVT_kwHODcEpUs4BRrsp \
  --field-id PVTSSF_lAHODcEpUs4BRrspzg_cIC4 \
  --single-select-option-id f75ad846
```

(These IDs are stable for the HealthTracker Project board.)

## Step 8 — Report to user

After all issues are processed, report a clear summary:

- **Created** — count + list of titles with their GitHub URLs and assigned tier
- **Skipped as duplicates** — count + list of titles
- **Project board** — https://github.com/users/c-raug/projects/3

Example format:

> **Issues Created**
>
> **Created (3):**
> - Dark Mode Toggle [short-term] — https://github.com/c-raug/HealthTracker/issues/47
> - Body Measurements Tracker [medium-term] — https://github.com/c-raug/HealthTracker/issues/48
> - Apple Health Sync [long-term] — https://github.com/c-raug/HealthTracker/issues/49
>
> **Skipped as duplicates (1):**
> - Water Tracking
>
> **Project board:** https://github.com/users/c-raug/projects/3
