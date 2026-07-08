---
name: revise-in-review
description: Revise In Review Skill. Invoke automatically when the user says "revise in review", "revise the in review tickets", "rework in review issues", "the last attempt didn't work", or wants to revise issues in the In Review column of the project board whose previous implementation failed.
---

# Revise In Review Skill

Loops through every issue in the **In Review** column of the HealthTracker Project board. For each issue, interviews the user about what the previous implementation got wrong and how it should actually behave, then rewrites the ticket body to clearly document (a) what the last attempt did, (b) why it failed, and (c) what must be done now. Each revised body is shown for approval and saved back to GitHub before moving on to the next issue.

## When to invoke

Invoke this skill automatically whenever the user:
- Says "revise in review", "revise the in review tickets", "rework the in review issues", or similar
- Says something like "the last attempt didn't work", "the previous implementation is broken", "re-scope the failed tickets"
- Wants to refine or rewrite the description of one or more issues currently in the **In Review** column because the prior attempt was incorrect or incomplete

Also invoked explicitly via `/revise-in-review`.

## Step 1 — Fetch In Review issues

Use the GitHub GraphQL API to get all items with Status = "In Review" from the HealthTracker Project:

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

Filter to items where the Status field value name = **"In Review"**. Extract: issue number, title, body, and URL for each.

If there are no In Review issues, tell the user and stop.

Otherwise, tell the user how many In Review issues will be revised (e.g. "Found 3 issues in the In Review column. Let's go through them one at a time.") and proceed to Step 2 for the first issue.

## Step 2 — Show the current rundown for the next issue

For the current issue in the loop, display it clearly to the user:

```
## Issue <i> of <n>: #<number> — <title>

<full existing body>
```

## Step 3 — Structured interview about the failed attempt

Use `AskUserQuestion` **as many times as needed** (one or multiple questions per call, multiple rounds if necessary) to fully understand what needs to change. Do NOT batch all questions into a single giant call if it would sacrifice clarity — use follow-up rounds when earlier answers open up new questions.

### Round 1 — What went wrong

At minimum, the first round must cover these two questions (combine them into a single `AskUserQuestion` call with multiple questions when possible):

1. **"What about the previous implementation failed or is incorrect?"**
   - Give 2–4 plausible options drawn from the current issue's Technical Implementation or Acceptance Criteria sections (e.g. "The scroll didn't go far enough", "The save button disappeared", "It crashed on Android", etc.).
   - The user can always pick "Other" to describe the failure in their own words.

2. **"How should it actually behave or function now?"**
   - Give 2–4 plausible target behaviors (e.g. "Scroll input to top of visible area", "Use a keyboard-aware library", "Different UX entirely", etc.).
   - Again, "Other" is always available for free-text.

### Round 2+ — Clarify the gaps

Based on the Round 1 answers, ask follow-up `AskUserQuestion` rounds to nail down any remaining ambiguity. Examples of what to probe:
- Which platforms are affected (iOS / Android / both)?
- Should existing pieces of the prior implementation be kept, replaced, or removed?
- Any new UX details (selection behavior, auto-focus, keyboard dismissal, etc.)?
- Should a new dependency be added, or stay within existing patterns?
- Any new acceptance criteria the user wants locked in?

Keep asking until you are confident you understand:
- **What was attempted** (facts from the existing body + user's description of the prior attempt)
- **Why it failed** (user's description of what's wrong with it)
- **What the new correct behavior must be**
- **The concrete technical direction** to take on the next attempt

Only stop the interview once you have a complete picture. Do NOT guess — if anything is unclear, ask another round.

## Step 4 — Draft the revised body

Rewrite the issue body. The revised body MUST follow this structure:

```
## Description
{2–4 sentences describing the problem and why it still needs to be solved.}

## Previous Attempt
{What was implemented last time — reference specific files, components, props, or patterns from the existing body and from what the user told you. Be concrete.}

## Why It Failed
{A clear, specific explanation of what went wrong with the previous attempt, directly based on the user's answers in the interview. Do not be vague — name the exact symptom (e.g. "input still scrolled only partially into view, leaving the bottom half covered by the keyboard").}

## What Must Be Done Now
{Concrete technical direction for the new attempt. Reference specific files, components, reducer actions, state fields, props, and patterns from CLAUDE.md. Explicitly call out which parts of the previous attempt should be kept, replaced, or removed.}

## Acceptance Criteria
{Bulleted checklist of what "done" looks like. Include criteria that directly verify the previous failure mode has been fixed.}
```

Requirements for the revised body:
- **Always** include all five sections above, in that order.
- The `Previous Attempt` and `Why It Failed` sections are the whole point of this skill — they must be present and specific, not generic.
- Preserve any useful technical detail from the original body inside `Previous Attempt`.
- Reference real files and components (use Read / Grep first if you need to confirm current code state before writing technical details).

## Step 5 — Iterative approval loop

Show the full revised body to the user:

```
## Updated body:

<revised body>
```

Then ask: "Does this look right, or what else would you like to change?"

Listen for one of:
- **More changes**: user describes another edit → update the revised body and re-display, loop until approved. You may use `AskUserQuestion` again mid-loop if a requested change is itself ambiguous.
- **Approval**: user says something like "looks good", "save it", "done", "perfect", "that's it", "ship it" → proceed to Step 6.

Do NOT save anything until the user explicitly signals approval.

## Step 6 — Save to GitHub

Once the user approves, update the issue body on GitHub using a heredoc to preserve formatting:

```
gh issue edit <number> \
  --repo "$GH_REPO" \
  --body "$(cat <<'EOF'
<approved body>
EOF
)"
```

After the edit succeeds, report back:

> **Saved!** Issue #<number> — "<title>" has been updated on GitHub.
> <url>

If the `gh issue edit` command fails, show the error and ask the user how they'd like to proceed — do not move on to the next issue until the save is confirmed (or the user explicitly tells you to skip this one).

## Step 7 — Advance to the next issue

After a successful save (or an explicit skip), automatically advance to the next In Review issue in the list and loop back to **Step 2**. Do NOT ask the user "want to do another one?" between issues — the skill's job is to walk the entire In Review column in one pass.

When there are no more In Review issues left:

> **All done!** Revised <n> issue(s) in the In Review column.

Then stop.

## Notes

- Do NOT move any issues between columns. This skill only rewrites bodies — the In Review status is left untouched so the tickets can be re-implemented via `/cp` or similar.
- Do NOT implement any code changes during this skill — it is a pure ticket-revision flow.
- If the user aborts mid-loop (e.g. says "stop", "that's enough", "cancel"), stop gracefully and report how many issues were revised vs skipped.
