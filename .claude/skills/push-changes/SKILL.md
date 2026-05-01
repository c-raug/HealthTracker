---
name: push-changes
description: Push Changes Skill. Invoke automatically after completing any feature implementation, bug fix, refactor, or code improvement — updates docs, creates a sub-branch, commits, and pushes to GitHub.
---

# Push Changes Skill

After completing any code change, this skill updates documentation, creates a new sub-branch off the current branch, commits all changes, and pushes to GitHub.

## When to invoke

Invoke this skill automatically after completing:
- Any feature implementation
- Any bug fix
- Any refactor or code improvement

Also invoked explicitly via `/push-changes`.

## Step 1 — Update documentation (skip if already done)

If `/update-docs` was just invoked in this session (e.g. by `/cp`), skip this step entirely — docs are already current.

Otherwise, update only the docs whose content the change directly invalidates:
- `CLAUDE.md` — only if a component index entry, pattern, action, or runtime requirement changed
- `.claude/documentation/component-notes.md` — only if a component's detailed behavior, props, or dispatched actions changed
- `.claude/skills/*/SKILL.md` — only if a skill's referenced behavior changed
- `README.md` — only if public-facing setup or behavior changed

Do not re-read docs already in your context (CLAUDE.md is injected every turn).

## Step 2 — Determine current branch

Run:
```
git branch --show-current
```

Note the result as `<source-branch>`.

## Step 3 — Create a new sub-branch

Generate a branch name using this format:
```
claude/<kebab-case-description>-<6-char-random-id>
```

Where:
- `<kebab-case-description>` is a short (2-4 word) summary of what was implemented, e.g. `edit-meal-flow`, `keyboard-dismiss-fix`, `portion-selector-compact`
- `<6-char-random-id>` is a random alphanumeric string to avoid collisions

Create and switch to the branch:
```
git checkout -b claude/<description>-<id>
```

## Step 4 — Stage and commit

Stage all changes:
```
git add -A
```

Commit with a descriptive message that summarizes what was implemented:
```
git commit -m "<summary of changes>"
```

The commit message should be one clear sentence describing the change (e.g. "Add EditMealFlow component with portion editing and UPDATE_SAVED_MEAL dispatch").

## Step 5 — Push to GitHub

Push the new branch:
```
git push -u origin claude/<description>-<id>
```

**Retry policy:** If the push fails due to a network error, retry up to 4 times with exponential backoff:
- Wait 2s, retry
- Wait 4s, retry
- Wait 8s, retry
- Wait 16s, retry

Do **not** retry if the failure is a 403 (permission error) or branch naming issue — report the error to the user instead.

## Step 6 — Report to user

After a successful push, tell the user:
- The branch name that was created and pushed
- A summary of which documentation files were updated (if any)
- The commit message used
