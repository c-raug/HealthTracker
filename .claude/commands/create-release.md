# Create Release Skill

Creates a versioned Git tag on `main` and pushes it to GitHub, which triggers the `release-android.yml` GitHub Actions pipeline. That pipeline builds an APK via EAS and attaches it to a GitHub Release automatically.

## When to invoke

Only invoked explicitly via `/create-release`. Do NOT invoke this skill automatically.

## Step 1 — Get the version number

Use `AskUserQuestion` to ask the user what version to release:

> "What version tag should this release use? (e.g. v1.0.1, v1.1.0, v2.0.0)"

Free-text input. Validate that the response matches the pattern `v<major>.<minor>.<patch>` — if not, ask again.

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
git tag --list "<version>"
```

If the tag already exists locally or remotely, tell the user and stop:
> "Tag `<version>` already exists. Choose a different version number."

## Step 4 — Compile release notes

Invoke `/release-notes` to fetch all Done items from the project board and compile them into formatted markdown release notes. This runs silently — do not show intermediate output from the release-notes skill.

Once the notes are compiled, display them to the user:

> **Here are the release notes compiled from your Done column:**
>
> ```
> <compiled notes>
> ```

Use `AskUserQuestion` with options: **Use these notes** | **Edit before continuing** | **Skip (use generic message)**

- If **Edit before continuing**: ask the user to provide their edited notes as free-text input, then use that text as the release notes.
- If **Skip**: set release notes to `"Release <version>"`.

Store the final release notes string for use in Step 6.

## Step 5 — Confirm before tagging

Use `AskUserQuestion` to confirm:

> "Ready to create and push tag `<version>` to `main`. This will:
> - Create an annotated git tag
> - Push the tag to GitHub (triggers the APK build pipeline)
> - Create a GitHub Release with the compiled release notes
>
> Proceed?"

Options: **Yes, create the release** | **Cancel**

If Cancel, stop.

## Step 6 — Create tag, push, and create GitHub Release

Create an annotated tag:
```
git tag -a <version> -m "Release <version>"
```

Push the tag to origin:
```
git push origin <version>
```

**Retry policy for push:** If push fails due to a network error, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s). Do NOT retry on 403 errors — report them to the user instead.

After a successful tag push, create the GitHub Release with the compiled notes:
```
gh release create <version> \
  --title "HealthTracker <version>" \
  --notes "<release-notes-string>" \
  --verify-tag
```

**If the release already exists** (gh exits with an error containing "already exists"), update the notes instead:
```
gh release edit <version> --notes "<release-notes-string>"
```

**Retry policy for gh release create/edit:** Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s) on network errors only.

## Step 7 — Report

After a successful push and release creation, report:

> **Release `<version>` kicked off!**
>
> The tag has been pushed to GitHub. The `Android APK Release` workflow is now running and will:
> 1. Build an APK via EAS (preview profile, ~10–20 min)
> 2. Attach it to the GitHub Release named **"HealthTracker `<version>`"** (already created with your release notes)
>
> Monitor the build:
> - **Actions:** `https://github.com/c-raug/HealthTracker/actions`
> - **Releases:** `https://github.com/c-raug/HealthTracker/releases`
>
> Once complete, the APK will be downloadable directly from the Releases page.
