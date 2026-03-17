# Create Release Skill

Creates a versioned Git tag on `main`, pushes it to GitHub (triggers the `release-android.yml` APK build pipeline), creates a GitHub Release with compiled release notes, and archives all Done items on the project board.

## When to invoke

Only invoked explicitly via `/cr`. Do NOT invoke this skill automatically.

## Step 1 — Determine new version

Read the current version from `app.json`:
```
node -e "console.log(require('./app.json').expo.version)"
```

Use `AskUserQuestion` to ask the user what kind of release this is:

> "Current app version is `<current-version>`. What type of release is this?"

Options:
- **Major release** — bumps the middle number and resets patch (e.g. `1.2.3 → 1.3.0`)
- **Minor release** — bumps the patch number only (e.g. `1.2.3 → 1.2.4`)

Compute the new version string based on the answer:
- Major: split on `.`, increment `parts[1]`, set `parts[2] = 0`, rejoin → `<x>.<y+1>.0`
- Minor: split on `.`, increment `parts[2]`, rejoin → `<x>.<y>.<z+1>`

Use `AskUserQuestion` to confirm:

> "This will bump `<current-version>` → `<new-version>`. The tag will be `v<new-version>`. Proceed?"

Options: **Yes, use v\<new-version\>** | **Cancel**

If Cancel, stop.

Store `<new-version>` (e.g. `1.3.0`) and `<tag>` (e.g. `v1.3.0`) for use in all subsequent steps.

## Step 2 — Check current branch and git state

Check the current branch:
```
git branch --show-current
```

If not on `main`, warn the user:
> "You are currently on `<branch>`, not `main`. Releases must be tagged on `main`. Switch to main first, or merge your branch before releasing."

Use `AskUserQuestion`: **I'll switch to main first — cancel for now** | **I understand, proceed anyway (tag current branch)**

If the user cancels, stop.

Check for uncommitted changes:
```
git status --short
```

If there are uncommitted changes, warn:
> "There are uncommitted changes. These will NOT be included in the release — the tag will point to the last commit. Commit and push first with `/push-changes` if you want them included."

Use `AskUserQuestion`: **Proceed anyway** | **Cancel**

If Cancel, stop.

## Step 3 — Check the tag doesn't already exist

```
git tag --list "<tag>"
```

If the tag already exists locally or remotely, tell the user and stop:
> "Tag `<tag>` already exists. The version may have already been released."

## Step 4 — Update app.json and push the version bump

Edit `app.json`: update the `expo.version` field from `<current-version>` to `<new-version>`. The value is a plain string without a `v` prefix (e.g. `"1.3.0"`).

Stage and commit:
```
git add app.json
git commit -m "Bump version to <new-version>"
```

Push to the current branch:
```
git push origin <current-branch>
```

**Retry policy:** If push fails due to a network error, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s). On non-network failure, ask the user: **Retry** | **Cancel release** — if Cancel, stop.

## Step 5 — Compile release notes

Invoke `/release-notes` to fetch all Done items from the project board and compile them into formatted markdown release notes. Run silently — do not show intermediate output.

Once compiled, display the notes to the user:

> **Here are the release notes compiled from your Done column:**
>
> ```
> <compiled notes>
> ```

Use `AskUserQuestion`: **Use these notes** | **Edit before continuing** | **Skip (use generic message)**

- If **Edit before continuing**: ask the user to provide their edited notes as free-text, use that text as the release notes.
- If **Skip**: set release notes to `"Release <tag>"`.

Store the final release notes string for Step 7.

## Step 6 — Confirm before tagging

Use `AskUserQuestion` to confirm:

> "Ready to create and push tag `<tag>`. This will:
> - Create an annotated git tag at the current HEAD
> - Trigger the GitHub Actions APK build pipeline
> - Create a GitHub Release with the compiled release notes
> - Archive all Done items on the project board
>
> Proceed?"

Options: **Yes, create the release** | **Cancel**

If Cancel, stop.

## Step 7 — Create tag, push, and create GitHub Release

Create an annotated tag:
```
git tag -a <tag> -m "Release <tag>"
```

Push the tag to origin:
```
git push origin <tag>
```

**Retry policy for push:** Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s) on network errors. Do NOT retry on 403 — report to the user.

After a successful tag push, create the GitHub Release:
```
gh release create <tag> \
  --title "HealthTracker <tag>" \
  --notes "<release-notes-string>" \
  --verify-tag
```

If the release already exists (output contains "already exists"), update the notes instead:
```
gh release edit <tag> --notes "<release-notes-string>"
```

**Retry policy for gh release:** Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s) on network errors only.

## Step 8 — Archive Done items from project board

Fetch all project items with Status = "Done", capturing the ProjectV2Item `id` for each:

```
gh api graphql -f query='
{
  node(id: "PVT_kwHODcEpUs4BRrsp") {
    ... on ProjectV2 {
      items(first: 100) {
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
            ... on Issue { number title }
            ... on PullRequest { number title }
          }
        }
      }
    }
  }
}'
```

Filter to items where the Status field value name = `"Done"`. Collect the `id` (ProjectV2Item ID) and title for each.

For each item, run the archive mutation:
```
gh api graphql -f query='
mutation {
  archiveProjectV2Item(input: {
    projectId: "PVT_kwHODcEpUs4BRrsp"
    itemId: "<item-id>"
  }) {
    item { id }
  }
}'
```

If any individual mutation fails, log the item's title/number and continue with the remaining items — do not abort.

## Step 9 — Report

After all steps complete, report:

> **Release `<tag>` kicked off!**
>
> The tag has been pushed to GitHub. The `Android APK Release` workflow is now running and will:
> 1. Build an APK via EAS (preview profile, ~10–20 min)
> 2. Attach it to the GitHub Release **"HealthTracker `<tag>`"** (already created with your release notes)
>
> Monitor the build:
> - **Actions:** `https://github.com/c-raug/HealthTracker/actions`
> - **Releases:** `https://github.com/c-raug/HealthTracker/releases`
>
> **Archived `<N>` Done items from the project board:**
> - [list each archived item as `#<number> <title>`]
>
> Once complete, the APK will be downloadable directly from the Releases page.
