---
name: ci
description: Create Issues Skill. Invoke automatically when the user says "brainstorm", "idea dump", "create github issues", "sync issues", "push to board", or wants to track ideas on the GitHub project board.
---

# Create Issues Skill

Structure user ideas into well-defined GitHub issues with labels, technical context, and acceptance criteria. Each issue is reviewed and approved before creation. All created issues land in the Backlog column of the HealthTracker Project board.

## When to invoke

Invoke this skill automatically whenever the user:
- Says "brainstorm", "idea dump", "create github issues", "sync issues", "push to board"
- Wants to create or track issues on GitHub
- Asks to explore ideas and turn them into tickets

Also invoked explicitly via `/ci`.

## Label System — 3 Categories

Every issue gets exactly **3 labels**, one from each category:

### Category 1 — Type
| Label | Color | Description |
|-------|-------|-------------|
| `bug` | `#D73A4A` | Something isn't working correctly |
| `improvement` | `#A2EEEF` | Enhancement to an existing feature |
| `feature` | `#0E8A16` | Entirely new functionality |

### Category 2 — Page
| Label | Color | Description |
|-------|-------|-------------|
| `weight` | `#C5DEF5` | Weight tab or weight-related components |
| `nutrition` | `#C5DEF5` | Nutrition tab, meals, foods, water, macros |
| `activity` | `#C5DEF5` | Activity tab, exercise, steps |
| `settings` | `#C5DEF5` | Profile tab (route: settings), preferences, profile, configuration |
| `global` | `#C5DEF5` | Cross-cutting: navigation, theme, backup, layout |

### Category 3 — Timeline
| Label | Color | Description |
|-------|-------|-------------|
| `short-term` | `#0E8A16` | A few file changes, low risk, immediate value |
| `medium-term` | `#0075CA` | New component or state changes, moderate effort |
| `long-term` | `#D93F0B` | Major new flow, external APIs, or large infrastructure |

## Step 1 — Orient

Before doing anything, silently:
1. Read `CLAUDE.md` to understand the current app architecture, components, and patterns.
2. Fetch existing open issues for duplicate detection:
   ```
   GH_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
   gh issue list --repo "$GH_REPO" --state open --limit 100 --json title,number,labels
   ```

## Step 2 — Collect ideas

If the user has already provided a list of ideas in their message, skip to Step 3.

Otherwise, ask what they want to create issues for using `AskUserQuestion`:

> "What issues or ideas do you want to create? List them all — we'll structure each one."

## Step 3 — Interview & structure each issue one at a time

For each idea, invoke the `/interview` skill to conduct a thorough interview with the user. The interview skill will:
1. Use `AskUserQuestion` repeatedly to clarify all ambiguous details about the idea
2. Return a fully structured issue (title, labels, description, technical implementation, acceptance criteria)

**Do not skip the interview.** Even if the idea seems straightforward, the `/interview` skill should ask at least a confirmation question to ensure nothing is missed.

After the `/interview` skill returns the structured issue for an idea, present it to the user for approval using `AskUserQuestion`:

> Show the complete issue (title, labels, description, technical implementation, acceptance criteria) as context, then ask:

```
"Does this issue look good?"
Options:
  - "Approve — create this issue"
  - "Revise — I have changes"
```

- If **Approve**: proceed to create the issue (Step 5), then move to the next idea.
- If **Revise**: ask the user what to change, revise the issue accordingly, and present it again for approval. Repeat until approved.

## Step 4 — Ensure labels exist

Before creating any issues, check and create missing labels:

```bash
gh label list --repo "$GH_REPO" --limit 100 --json name
```

For each label from the 3-category system that doesn't exist, create it:

```bash
gh label create "{name}" --repo "$GH_REPO" --color "{color}" --description "{description}"
```

Use the colors and descriptions from the Label System tables above. Only create labels that are actually needed for the current batch of issues.

## Step 5 — Create GitHub issue

For each approved issue, construct the body using the structured format and create it:

```bash
gh issue create \
  --repo "$GH_REPO" \
  --title "{title}" \
  --body "$(cat <<'EOF'
## Description

{description}

## Technical Implementation

{technical implementation details}

## Acceptance Criteria

{acceptance criteria checklist}
EOF
)" \
  --label "{type-label}" \
  --label "{page-label}" \
  --label "{timeline-label}"
```

Capture the URL and issue number returned.

## Step 6 — Add to project board (Backlog)

For each newly created issue, add it to the HealthTracker Project board in the **Backlog** column:

```bash
NODE_ID=$(gh api repos/$GH_REPO/issues/{number} --jq .node_id)
ITEM_ID=$(gh api graphql -f query='mutation {
  addProjectV2ItemById(input: {projectId: "'"$GH_PROJECT_BOARD_ID"'", contentId: "'"$NODE_ID"'"}) {
    item { id }
  }
}' --jq .data.addProjectV2ItemById.item.id)

gh api graphql -f query='mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "'"$GH_PROJECT_BOARD_ID"'",
    itemId: "'"$ITEM_ID"'",
    fieldId: "'"$GH_PROJECT_FIELD_ID"'",
    value: { singleSelectOptionId: "'"$GH_PROJECT_BACKLOG_OPTION_ID"'" }
  }) { projectV2Item { id } }
}'
```

(Read `GH_PROJECT_BOARD_ID`, `GH_PROJECT_FIELD_ID`, and `GH_PROJECT_BACKLOG_OPTION_ID` from environment variables.)

## Step 7 — Report summary

After all issues are processed, report:

> **Issues Created ({count}):**
> - {Title} [`{type}`] [`{page}`] [`{timeline}`] — {URL}
> - ...
>
> **Skipped as duplicates ({count}):**
> - {Title} (matches #{existing_number})
>
> All issues added to **Backlog** on the project board.
