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

If the user has NOT already supplied a list of ideas, ask what areas they want to brainstorm. Use `AskUserQuestion` with multi-select options covering:

> "What areas of the app do you want to brainstorm ideas for?"

Options: Weight tracking, Nutrition & meals, Activity logging, Settings & goals, UI/UX & animations, Data & backup, Something else

**If the user already provided a list of ideas in their message, skip this step and go directly to Step 3 for each of those ideas.**

## Step 3 — Flesh out each idea interactively

**This step is mandatory for every idea — whether the user supplied ideas upfront or they emerged during brainstorming. Never skip it.**

For each idea, use `AskUserQuestion` to ask up to 3 targeted follow-up questions before moving on. You may batch multiple questions about the same idea in a single `AskUserQuestion` call (up to 4 questions per call). Choose the most relevant from:

- **UX flow**: "Walk me through the interaction — what does the user tap, and what do they see?"
- **Problem being solved**: "What's the specific pain point this addresses?"
- **Scope / edge cases**: "What should happen in empty, cancel, or error states?"
- **Technical angle**: "Are there constraints I should know about — existing components to reuse, state changes needed, etc.?"

After gathering answers, summarize the fleshed-out idea internally before moving on to the next one.

Suggest related ideas proactively when relevant, using your knowledge of the app from Step 1. Accumulate all ideas internally — do NOT write to any file.

## Step 3b — Confirm tier per item

After all ideas are fleshed out, ask the user to assign a priority tier for each one. Use a single `AskUserQuestion` call with one question per idea (batch up to 4 questions per call; use multiple calls if there are more than 4 ideas):

```
Question: "What tier should '[Idea Title]' be?"
Options:
  - Short-term — a few file changes, low risk, adds immediate daily value
  - Medium-term — new component or state changes, moderate effort
  - Long-term — major new flow, external APIs, or large infrastructure
```

**Claude must NOT pre-select or suggest a tier.** Present all three options neutrally and record the user's choice for each idea.

## Step 4 — Ask if done brainstorming

**This step MUST happen before any issue creation (Steps 5–8).** Even if the user said "create issues" in their original message, this gate must still be asked.

Use `AskUserQuestion`:

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

Use the tier the user assigned in Step 3b. Construct the issue body using the details gathered in Step 3:

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

For each newly created issue URL, add it to the HealthTracker Project using the GraphQL API:
```
gh api graphql -f query='mutation {
  addProjectV2ItemById(input: {projectId: "PVT_kwHODcEpUs4BRrsp", contentId: "{node_id}"}) {
    item { id }
  }
}'
```

Get the issue node_id via:
```
gh api repos/c-raug/HealthTracker/issues/{number} --jq .node_id
```

Use the returned item ID to set the Status to **Backlog**:
```
gh api graphql -f query='mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PVT_kwHODcEpUs4BRrsp",
    itemId: "{item-id}",
    fieldId: "PVTSSF_lAHODcEpUs4BRrspzg_cIC4",
    value: { singleSelectOptionId: "f75ad846" }
  }) { projectV2Item { id } }
}'
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
