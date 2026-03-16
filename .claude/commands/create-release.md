# Create Release Skill

Kicks off an EAS APK build for the HealthTracker app using the `preview` build profile, monitors its progress, and reports the download link when complete.

## When to invoke

Only invoked explicitly via `/create-release`. Do NOT invoke this skill automatically.

## Step 1 — Confirm with user

Before starting the build, use `AskUserQuestion` to confirm:

> "This will trigger an EAS cloud build and produce a downloadable APK (preview profile). Builds typically take 10–20 minutes. Proceed?"

Options: **Yes, start the build** | **Cancel**

If the user selects Cancel, stop and report that no build was started.

## Step 2 — Check EAS CLI

Verify the EAS CLI is available:
```
npx eas --version
```

If this fails, tell the user to install it:
```
npm install -g eas-cli
```
Then stop — do not proceed until it's available.

## Step 3 — Verify git state

Check for uncommitted changes:
```
git status --short
```

If there are uncommitted changes, warn the user:
> "There are uncommitted changes in the working directory. The build will use the last committed state on the current branch. Consider committing your changes first with `/push-changes`."

Use `AskUserQuestion`: **Continue anyway** | **Cancel and commit first**

If Cancel, stop.

## Step 4 — Trigger the EAS build

Run the build using the `preview` profile (produces an APK for Android, internal distribution):
```
npx eas build --platform android --profile preview --non-interactive
```

This command will print a build URL and a build ID. Capture both.

If the command fails (e.g. not logged in), report the error to the user with the relevant EAS login command:
```
npx eas login
```

## Step 5 — Report build kicked off

Immediately after the build is submitted (do not wait for it to complete), tell the user:

> **Build started!**
>
> - **Profile:** preview (APK, internal distribution)
> - **Platform:** Android
> - **Build URL:** {url from Step 4}
> - **Project:** `com.healthtracker.app` (EAS project ID: `53a81a1a-0304-45db-82f5-a78d921278af`)
>
> The build typically takes 10–20 minutes. Visit the build URL to monitor progress and download the APK when it's ready.
>
> You can also check status at any time with:
> ```
> npx eas build:list --platform android --limit 5
> ```
