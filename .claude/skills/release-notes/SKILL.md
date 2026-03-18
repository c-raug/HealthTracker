---
name: release-notes
description: Release Notes Skill. Invoked automatically by /cr to compile release notes from Done items on the project board. Also usable standalone via /release-notes to preview upcoming release notes.
---

# Release Notes Skill

Fetches all issues in the "Done" column of the HealthTracker Project board, deduplicates conflicting changes, and compiles formatted markdown release notes.

## When to invoke

- Invoked automatically by `/cr` (Step 5) to generate release body text.
- Can also be invoked explicitly via `/release-notes` to preview what the next release notes would look like.

## Step 1 — Fetch Done items from project board

Run the following GitHub GraphQL query:

```
gh api graphql -f query='
{
  node(id: "'"$GH_PROJECT_BOARD_ID"'") {
    ... on ProjectV2 {
      items(first: 100) {
        nodes {
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
              closedAt
              labels(first: 5) {
                nodes { name }
              }
            }
          }
        }
      }
    }
  }
}'
```

Filter the results to items where the Status field value name = **"Done"**. Extract for each: issue number, title, body, `closedAt` (ISO timestamp), and label names.

If no Done items are found, output:

> No tracked changes found in the Done column — release notes will be a placeholder.

And return the string: `"No tracked changes for this release."`

## Step 2 — Sort by closedAt descending

Sort all Done items by `closedAt` timestamp, newest first. Items with a null `closedAt` go to the end.

## Step 3 — Group and deduplicate related items

Working through the sorted list (newest first), identify groups of issues that relate to the same feature or change. Use a two-phase process:

### Phase A — Group related issues

Group issues together when **any** of the following signals are present:

1. **Title/component match**: very similar titles, or both titles mention the same named component (e.g. `WaterTracker`, `CalorieRing`, `Settings`, `WeeklyIntakeGraph`, `PortionSelector`, etc.)

2. **Body text similarity**: the issue bodies describe the same user-facing outcome. Flag as related if ≥2 of the following overlap between two issues: same noun subject (the thing being changed), same verb action (what is happening to it), same UI element or screen affected.

3. **Sequential iteration**: one issue clearly iterates on or rewrites what another introduced. Look for iteration signals in the title or body: words like "redesign", "rework", "v2", "improve", "update", "overhaul", "refactor", "replace", or "redo" applied to the same subject as an earlier issue. Also flag if issue B's body explicitly references a feature that issue A introduced (e.g. "the water tracker added in #42" or "builds on the step counter").

Issues with clearly distinct subjects are never grouped, even if they share a common word like "Settings" used in a different context.

### Phase B — Collapse each group into one bullet

For each group of ≥2 related issues:
- **Keep only the most recently closed issue** as the canonical entry — its title and framing represent the current state of the feature, since it may have overwritten or superseded what came before.
- **Discard all older issues in the group silently** — do not list them anywhere in the output.

For singleton issues (not grouped with anything), keep as-is.

## Step 4 — Categorise items

For each remaining issue, assign it to one category:

- **✨ New Features** — issue has label `enhancement`, `feature`, or the title/body uses language like "add", "new", "introduce", "support for"
- **🐛 Bug Fixes** — issue has label `bug`, `fix`, or the title/body uses language like "fix", "correct", "resolve", "broken", "crash", "error"
- **🔧 Improvements** — everything else (refactors, UI polish, performance, settings changes, dependency updates)

## Step 5 — Format the release notes

Produce a markdown string in this format (omit any section that has zero items):

```
## What's New

### ✨ New Features
- <concise one-line summary> (#<number>)

### 🐛 Bug Fixes
- <concise one-line summary> (#<number>)

### 🔧 Improvements
- <concise one-line summary> (#<number>)
```

Guidelines for each bullet:
- Use the issue title as the summary, lightly reworded to read naturally as a changelog entry if needed.
- Keep each bullet to one line.
- Always append `(#<number>)` at the end.
- Order bullets within each section by `closedAt` descending (newest first).

## Step 6 — Output

When invoked standalone (not from `/cr`), display the compiled notes to the user as a formatted preview and stop.

When invoked from `/cr`, return the compiled notes string for use in the next steps of that skill.
