# Create GitHub Issues Skill

Reads `future_plans.md`, parses all planned ideas across all three tiers, and syncs them to GitHub as labelled issues on a "HealthTracker Roadmap" project board. Safe to run multiple times — existing issues are never duplicated. Creates the project board and required labels automatically if they don't exist yet.

## When to invoke

Invoke this skill automatically whenever the user:
- Says "create github issues", "sync issues", "push issues to github", "push to board", "sync roadmap", or "create project board"
- Asks to track future plans or backlog items on GitHub
- Wants to set up or update the project board from `future_plans.md`

Also invoked explicitly via `/create-github-issues`.

## Step 1 — Read and parse future_plans.md

Read `future_plans.md` silently. The file uses `### Title` headings inside three `##` tier sections:

- `## Short-Term Ideas` → tier label: `short-term`
- `## Medium-Term Ideas` → tier label: `medium-term`
- `## Long-Term Ideas` → tier label: `long-term`

For each idea (identified by a `###` heading), extract:
- **Title** — the `###` heading text
- **Goal** — the `**Goal:**` field value
- **UX** — full `**UX:**` bullet list (may also include sub-bullets or numbered lists)
- **Technical notes** — full `**Technical notes:**` section (may also include sub-sections like `**Goal calculation:**`)
- **Tier** — which `##` section it belongs to

Build an internal list of all ideas before proceeding. Include any content between `**Goal:**` and `**Technical notes:**` headings in the UX/detail section of the issue body.

## Step 2 — Ensure labels exist

Check existing labels:
```
gh label list --repo c-raug/HealthTracker --limit 100
```

For each missing label, create it:

```
gh label create "short-term" --repo c-raug/HealthTracker --color "0E8A16" --description "Lower-complexity improvements that add meaningful daily-use value"
```
```
gh label create "medium-term" --repo c-raug/HealthTracker --color "0075CA" --description "New components or state changes — moderate design and dev effort"
```
```
gh label create "long-term" --repo c-raug/HealthTracker --color "D93F0B" --description "Large infrastructure, external APIs, or major new flows"
```
```
gh label create "enhancement" --repo c-raug/HealthTracker --color "A2EEEF" --description "New feature or request"
```

Only run the `gh label create` command for labels that are not already present in the list output.

## Step 3 — Check for existing open issues

Fetch all open issues to use for duplicate detection:
```
gh issue list --repo c-raug/HealthTracker --state open --limit 100 --json title
```

Store the list of existing issue titles. An idea is a duplicate if its title exactly matches an existing title (case-insensitive comparison). Duplicate ideas are skipped in Step 5 — do not create a second issue.

## Step 4 — Check for or create the GitHub project

List projects owned by `c-raug`:
```
gh project list --owner c-raug --limit 50
```

If a project named **"HealthTracker Roadmap"** already exists, note its project number and mark it as pre-existing.

If it does not exist, create it:
```
gh project create --owner c-raug --title "HealthTracker Roadmap"
```

Capture the project number from the command output. This number is required in Step 6 to add issues to the board.

## Step 5 — Create issues for new ideas

For each idea that is NOT already tracked by an open issue (from Step 3), construct the issue body using this format:

```
## Goal

{Goal text}

## Details

{All content between **Goal:** and **Technical notes:** — UX bullets, sub-lists, design direction, etc.}

## Technical Notes

{Technical notes content — file paths, new utilities, modified components, new actions, etc.}

---

_Auto-generated from `future_plans.md` — tier: {short-term | medium-term | long-term}_
```

Then create the issue:
```
gh issue create \
  --repo c-raug/HealthTracker \
  --title "{Idea Title}" \
  --body "{body constructed above}" \
  --label "enhancement" \
  --label "{short-term | medium-term | long-term}"
```

Capture the URL returned by each `gh issue create` call. Store the URL alongside the title for use in Step 6 and the final report. Record skipped duplicates in a separate list.

## Step 6 — Add new issues to the project board

For each issue URL captured in Step 5, add it to the project:
```
gh project item-add {project-number} --owner c-raug --url {issue-url}
```

Run once per newly created issue. Do not attempt to add skipped (duplicate) issues.

## Step 7 — Report to user

After all issues are processed, report a clear summary:

- **Created** — count + list of titles with their GitHub URLs
- **Skipped as duplicates** — count + list of titles
- **Project board** — full URL in the format `https://github.com/users/c-raug/projects/{project-number}`, noting whether it was newly created or already existed
- **Labels created** — list any labels that were newly created (omit if all already existed)

Example format:

> **GitHub Issues Sync Complete**
>
> **Created (5):**
> - Water Tracking — https://github.com/c-raug/HealthTracker/issues/34
> - Streak Tracking — https://github.com/c-raug/HealthTracker/issues/35
> - ...
>
> **Skipped as duplicates (3):**
> - UI Refresh + Animations
> - ...
>
> **Project board:** https://github.com/users/c-raug/projects/1 _(newly created)_
>
> **Labels created:** `short-term`, `medium-term`, `long-term`
