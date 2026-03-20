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

## Step 1 — Fetch Prioritized issues

Use the GitHub GraphQL API to get all items with Status = "Prioritized" from the HealthTracker Project:

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
          content {
            ... on Issue {
              number
              title
              body
              url
            }
          }
        }
      }
    }
  }
}'
```

Filter the results to items where the Status field value name = **"Prioritized"**. For each, extract: issue number, title, body (contains Goal, Details, Technical Notes), and URL.

If there are no Prioritized issues, report this to the user and stop.

## Step 2 — Orient

Read `CLAUDE.md` silently before touching any code. Understand the app architecture, design patterns, existing components, and conventions that must be followed.

## Step 3 — Implement each ticket

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

4. **Check the style guide for UI changes.** If the ticket involves any UI change (colors, spacing, typography, shadows, icons, buttons, modals, cards, or component styling), read `.claude/documentation/style_guide.md` before implementing. Follow every design token, component pattern, and fixed color rule documented there. After implementing, if the change introduces a new UI element, pattern, or token usage that is not yet covered by the style guide, add it to the appropriate section in `.claude/documentation/style_guide.md`.

5. **Implement the change** following all patterns in `CLAUDE.md` (design tokens, date strings, makeStyles, etc.).

6. **Verify against Acceptance Criteria.** After implementing, walk through every acceptance criterion in the issue checklist. For each criterion:
   - Confirm the code change directly satisfies it
   - If a criterion requires UI behavior, verify the logic is in place
   - If a criterion is NOT met, continue implementing until it is

   Do not move to the next ticket until every acceptance criterion is addressed.

**Do not commit between tickets** — accumulate all changes across the full set.

If a ticket is too ambiguous or requires information not present in the issue, skip it and note it in the final report. Do not block on unclear tickets.

## Step 4 — Invoke /push-changes

After all tickets have been implemented (or attempted), invoke the `/push-changes` skill. It will:
- Update `CLAUDE.md` if new components, patterns, or reducer actions were introduced
- Create a new sub-branch (`claude/<description>-<id>`)
- Commit all changes with a descriptive message
- Push to GitHub

## Step 5 — Report

After `/push-changes` completes, summarize:

- **Implemented** — for each ticket, list:
  - Title + issue number
  - Acceptance criteria checklist with pass/fail status for each criterion
  - Any notes on implementation decisions
- **Skipped** — list of any tickets that were skipped, with a brief reason for each
- **Branch** — the branch name created and pushed by `/push-changes`
