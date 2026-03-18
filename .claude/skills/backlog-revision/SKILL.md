---
name: backlog-revision
description: Backlog Revision Skill. Invoke automatically when the user says "revise a ticket", "edit a backlog issue", "update a backlog item", or wants to refine an issue in the Backlog column of the project board.
---

# Backlog Revision Skill

Fetches all issues from the Backlog column of the HealthTracker Project board, lets the user pick one, shows a rundown, then iteratively refines the body in plain English until the user is happy — then saves it back to GitHub.

## When to invoke

Invoke this skill automatically whenever the user:
- Says "revise a ticket", "edit a backlog issue", "update a backlog item", or similar
- Wants to refine, rewrite, or improve the description of a Backlog issue
- Asks to "tighten up" or "rework" an issue on the board

Also invoked explicitly via `/backlog-revision`.

## Step 1 — Fetch Backlog issues

Use the GitHub GraphQL API to get all items with Status = "Backlog" from the HealthTracker Project:

```
GH_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

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

Filter to items where the Status field value name = **"Backlog"**. Extract: issue number, title, body, and URL for each.

If there are no Backlog issues, tell the user and stop.

## Step 2 — Let the user pick a ticket

Present the Backlog issues using `AskUserQuestion` with a single-select dropdown. Format each option as:

- **label**: `#<number> — <title>`
- **description**: First 120 characters of the issue body (trimmed), or "(no description)" if empty.

Example question:
> "Which Backlog ticket would you like to revise?"

Record the selected issue number, title, and full body.

## Step 3 — Show the rundown

Display the selected issue clearly to the user before any editing begins:

```
## #<number> — <title>

<full body>
```

Then ask:
> "What would you like to change about this issue?"

Wait for the user's response describing the changes they want.

## Step 4 — Iterative editing loop

This is the core revision loop. Repeat until the user signals they are done:

1. **Receive** the user's plain-English description of what to change (e.g. "make the acceptance criteria more specific", "add a technical notes section", "rewrite the goal sentence to be clearer").
2. **Rewrite** the issue body incorporating the requested changes. Keep all existing sections and structure intact unless the user explicitly asks to remove or restructure them. Use the standard issue body format from the `/ci` skill where applicable:
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
3. **Show** the full revised body to the user:
   ```
   ## Updated body:

   <revised body>
   ```
   Then ask: "Does this look right, or what else would you like to change?"

4. **Listen** for one of:
   - **More changes**: user describes another edit → loop back to step 1
   - **Approval**: user says something like "looks good", "save it", "done", "perfect", "that's it", "ship it" → proceed to Step 5

Do NOT save anything until the user explicitly signals approval.

## Step 5 — Save to GitHub

Once the user approves, update the issue body on GitHub:

```
gh issue edit <number> \
  --repo "$GH_REPO" \
  --body "<approved body>"
```

Use a heredoc or properly escaped string to preserve newlines and formatting.

## Step 6 — Confirm to user

After the edit succeeds, report back:

> **Saved!** Issue #<number> — "<title>" has been updated on GitHub.
> <url>

If the `gh issue edit` command fails, show the error and ask the user how they'd like to proceed.
