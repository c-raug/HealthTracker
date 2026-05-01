---
name: cp
description: Complete Prioritized Tickets Skill. Invoke automatically when the user says "work on prioritized", "complete the board", "do the prioritized tickets", "ship the prioritized items", or asks to work through the backlog.
---

# Complete Prioritized Tickets Skill

Reads all open issues in the "Prioritized" column of the HealthTracker Project board, implements each one, then calls `/push-changes` to commit and push all changes on a new branch.

## When to invoke

Invoke this skill automatically whenever the user:
- Says "work on prioritized", "complete the board", "do the prioritized tickets", "ship the prioritized items", or similar
- Asks Claude to start working through the backlog or project board

Also invoked explicitly via `/cp`.

## Step 1 — Fetch Prioritized issues (two-pass)

To avoid pulling all 50 issue bodies just to filter, run two queries:

**Pass 1** — fetch only IDs + Status field (small response):

```
gh api graphql -f query='
{
  node(id: "'"$GH_PROJECT_BOARD_ID"'") {
    ... on ProjectV2 {
      items(first: 50) {
        nodes {
          id
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2SingleSelectField { name } }
              }
            }
          }
          content { ... on Issue { number } }
        }
      }
    }
  }
}'
```

Locally filter to items whose Status = **"Prioritized"** and collect their issue numbers.

**Pass 2** — fetch bodies only for the Prioritized issue numbers via `gh issue view <number> --json number,title,body,url` (parallelize across all Prioritized numbers in a single tool-call batch).

If there are no Prioritized issues, report this to the user and stop.

## Step 2 — Implement each ticket

CLAUDE.md is already in context (injected every turn) — do NOT re-read it. The `/cp` skill should rely on the in-context project instructions for architecture, patterns, and conventions.

For component-specific detail (props, layout specs, dispatched actions), read `.claude/documentation/component-notes.md` on demand — only when a ticket touches a component listed in the CLAUDE.md Component Notes index. Use grep + targeted offset/limit reads, not a full-file read.

Work through each Prioritized issue **one at a time**:

1. **Parse the issue body** to extract:
   - **Description** — the problem, motivation, and what this adds
   - **Technical Implementation** — specific files, components, state changes, and patterns to follow
   - **Acceptance Criteria** — the checklist of what "done" looks like

2. **Scope strictly to the issue.** Only make changes described in the Technical Implementation section. Do NOT:
   - Refactor surrounding code that isn't mentioned in the issue
   - Add features, improvements, or "nice-to-haves" beyond what the issue asks for
   - Fix unrelated bugs you happen to notice
   - Add comments, docstrings, or type annotations to code you didn't change
   - Create abstractions or utilities beyond what the issue requires

3. **Read before writing.** Read all files listed in Technical Implementation before editing any of them.

4. **Check the style guide ONLY for UI changes.** If — and only if — the ticket involves a UI change (colors, spacing, typography, shadows, icons, buttons, modals, cards, or component styling), read `.claude/documentation/style_guide.md`. Skip this read for pure logic, state, data, or non-visual tickets. After implementing a UI change that introduces a new pattern not yet documented, add it to the style guide.

5. **Implement the change** following the patterns already in your context (design tokens, date strings, makeStyles, etc. from CLAUDE.md).

6. **Verify against Acceptance Criteria.** After implementing, walk through every acceptance criterion in the issue checklist. For each criterion:
   - Confirm the code change directly satisfies it
   - If a criterion requires UI behavior, verify the logic is in place
   - If a criterion is NOT met, continue implementing until it is

   Do not move to the next ticket until every acceptance criterion is addressed.

**Do not commit between tickets** — accumulate all changes across the full set.

If a ticket is too ambiguous or requires information not present in the issue, skip it and note it in the final report. Do not block on unclear tickets.

## Step 4 — Invoke /update-docs

After all tickets have been implemented (or attempted), invoke the `/update-docs` skill to audit and sync all documentation against the current codebase. This ensures CLAUDE.md, README.md, the style guide, and skill files all reflect the changes just made. Skip the audit summary confirmation — apply updates directly since the changes are known.

## Step 5 — Invoke /push-changes

After `/update-docs` completes, invoke the `/push-changes` skill. It will:
- Create a new sub-branch (`claude/<description>-<id>`)
- Commit all changes with a descriptive message
- Push to GitHub

## Step 6 — Move completed issues to In Review

After `/push-changes` completes, move each **successfully implemented** issue to the **"In Review"** column on the project board. Do NOT move skipped issues.

For each completed issue, look up its project item ID and update the Status field:

```bash
GH_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

# Get the issue's node ID
NODE_ID=$(gh api repos/$GH_REPO/issues/{number} --jq .node_id)

# Find the item ID on the project board
ITEM_ID=$(gh api graphql -f query='
{
  node(id: "'"$GH_PROJECT_BOARD_ID"'") {
    ... on ProjectV2 {
      items(first: 100) {
        nodes {
          id
          content { ... on Issue { number } }
        }
      }
    }
  }
}' --jq '.data.node.items.nodes[] | select(.content.number == {number}) | .id')

# Move to In Review
gh api graphql -f query='mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "'"$GH_PROJECT_BOARD_ID"'",
    itemId: "'"$ITEM_ID"'",
    fieldId: "'"$GH_PROJECT_FIELD_ID"'",
    value: { singleSelectOptionId: "'"$GH_PROJECT_IN_REVIEW_OPTION_ID"'" }
  }) { projectV2Item { id } }
}'
```

Read `GH_PROJECT_BOARD_ID`, `GH_PROJECT_FIELD_ID`, and `GH_PROJECT_IN_REVIEW_OPTION_ID` from environment variables.

## Step 7 — Report

After all moves complete, summarize:

- **Implemented** — for each ticket, list:
  - Title + issue number
  - Acceptance criteria checklist with pass/fail status for each criterion
  - Any notes on implementation decisions
  - Moved to **In Review** ✓
- **Skipped** — list of any tickets that were skipped, with a brief reason for each
- **Branch** — the branch name created and pushed by `/push-changes`
