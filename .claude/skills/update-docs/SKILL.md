---
name: update-docs
description: Update Documentation Skill. Invoke when the user says "update docs", "sync documentation", "refresh docs", or wants to ensure all documentation reflects the current codebase state.
---

# Update Documentation Skill

Audits the entire codebase against all documentation files, identifies gaps and outdated information, then updates everything to match the current state. Covers CLAUDE.md, README.md, style guide, and all skill files.

## When to invoke

Invoke this skill automatically whenever the user:
- Says "update docs", "sync documentation", "refresh docs", "update documentation", or similar
- Asks to ensure documentation is up-to-date after a batch of changes
- Mentions that docs haven't been updated in a while

Also invoked explicitly via `/update-docs`.

## Step 1 — Audit the codebase (read-only)

Gather the current ground truth from the codebase. Run all of the following in parallel:

### 1a — Recent changes
- `git log --oneline -50` to see recent commits
- `git tag` to see version tags
- `app.json` → current `expo.version`

### 1b — Current file structure
- `ls -R app/ components/ utils/ storage/ context/ constants/ types/` to see all source files
- Note any new files not present in documentation

### 1c — State management
- Read `context/AppContext.tsx` — extract all action type strings from the reducer
- Read `types/index.ts` — extract all interface definitions and their fields

### 1d — Navigation and tabs
- Read `app/(tabs)/_layout.tsx` — current tab names, icons, and configuration
- Read `app/_layout.tsx` — all modal routes and root layout wrappers

### 1e — Current documentation
- Read `CLAUDE.md` (full file)
- Read `README.md` (full file)
- Read `.claude/documentation/style_guide.md` (full file)
- Read all `.claude/skills/*/SKILL.md` files

## Step 2 — Diff documentation against codebase

Compare each documentation file against the ground truth gathered in Step 1. Build a list of gaps for each file:

### CLAUDE.md — check for:
- **Actions list**: every action type in the reducer must appear in the `Actions` bullet
- **Architecture section**: tab names, modal routes, state shape, persistence details
- **Component Notes**: every component in `components/` should have a note if it has non-trivial behavior
- **Key Patterns**: any new patterns introduced since last update
- **Runtime Requirements**: any new wrappers, providers, or compatibility rules
- **Skills section**: must list every skill in `.claude/skills/`

### README.md — check for:
- **Features section**: each tab's description must match current behavior (not stale from an older version)
- **Project structure tree**: must list every file in `app/`, `components/`, `utils/`, `storage/`, `context/`, `constants/`, `types/`
- **Data model**: every interface and field in `types/index.ts` must be reflected
- **Tech stack table**: must list all major dependencies
- **Setup instructions**: must still be accurate

### Style guide — check for:
- **Fixed color rules**: must match what the code actually uses (verify against component source if uncertain)
- **Component patterns**: any new UI patterns not yet documented
- **File reference table**: must list all relevant component files

### Skill files — check for:
- **Format consistency**: all skills should use the same issue body format (Description / Technical Implementation / Acceptance Criteria)
- **Label accuracy**: page labels, column names, and other references must match current app terminology
- **Tool references**: any tools or commands referenced must still be valid

## Step 3 — Present the audit summary

Before making any changes, present a concise summary to the user:

> **Documentation Audit Results**
>
> **CLAUDE.md** — {N} gaps found
> - {brief description of each gap}
>
> **README.md** — {N} gaps found
> - {brief description of each gap}
>
> **Style guide** — {N} gaps found
> - {brief description of each gap}
>
> **Skills** — {N} gaps found
> - {brief description of each gap}
>
> **No changes needed** (if applicable for any file)

Then ask: "Ready to apply all updates?"

If the user says yes (or doesn't object), proceed. If the user wants to skip certain files or changes, respect that.

## Step 4 — Apply updates

Update each file with the identified gaps. Follow these rules:

- **Be precise** — only change what is actually wrong or missing. Do not rewrite sections that are already accurate.
- **Preserve style** — match the existing formatting, heading levels, and bullet conventions of each file.
- **Don't remove content** — unless it describes something that no longer exists in the codebase (e.g., a deleted component or removed feature).
- **Add, don't duplicate** — if information already exists in one place, don't add it again elsewhere.

### Update order:
1. `CLAUDE.md` (architecture reference — most critical)
2. `README.md` (public-facing)
3. `.claude/documentation/style_guide.md` (UI reference)
4. `.claude/skills/*/SKILL.md` (skill files, only if needed)

## Step 5 — Commit and push

After all updates are applied:

1. Stage only the documentation files that were changed:
   ```
   git add CLAUDE.md README.md .claude/documentation/style_guide.md .claude/skills/*/SKILL.md
   ```
   (Only include files that actually changed.)

2. Commit with a descriptive message:
   ```
   git commit -m "Update documentation to reflect current codebase state"
   ```

3. Push to the current branch:
   ```
   git push -u origin <current-branch>
   ```

   **Retry policy:** If push fails due to a network error, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s).

## Step 6 — Report

After pushing, report to the user:

> **Documentation updated and pushed.**
>
> **Files changed:**
> - `CLAUDE.md` — {summary of changes}
> - `README.md` — {summary of changes}
> - (etc.)
>
> **No changes needed:**
> - {list any files that were already up-to-date}
>
> Commit: `<commit-hash>`
> Branch: `<branch-name>`
