# HealthTracker

A personal health-tracking app, in the middle of a migration from React Native / Expo to a
native SwiftUI iOS app. This repository holds **both apps side by side** during the transition.

## Repository layout

| Folder | What it is | Status |
|--------|-----------|--------|
| [`expo/`](./expo) | The original Expo SDK 55 / React Native app (iOS + Android). | **Legacy** — reference implementation; will be archived after cutover. |
| [`swift/`](./swift) | The native SwiftUI rewrite for iOS 26. | **Active** — under construction. |

- Repo-level infrastructure (`.github/` CI, `.devcontainer/`) stays at the root.
- The Expo app's own project docs, skills, and config live under `expo/` (including `expo/CLAUDE.md`
  and `expo/.claude/`).

## The migration

The Swift app is a from-scratch native rewrite bringing over **100% of the Expo app's features**,
built in phases that each end in a buildable, on-device checkpoint. See:

- [`swift/MIGRATION_ROADMAP.md`](./swift/MIGRATION_ROADMAP.md) — the phased plan + progress checklist.
- [`swift/XCODE_SETUP.md`](./swift/XCODE_SETUP.md) — one-time Xcode project setup.

Existing data transfers via the Expo app's JSON backup (export from the Expo app → import in the
Swift app). Once the Swift app reaches full parity and ships, the `expo/` folder can be archived or
removed.

## Working on each app

- **Expo app:** `cd expo && npm install && npm start` (see `expo/README.md`).
- **Swift app:** open `swift/HealthTracker.xcodeproj` in Xcode 16+ and press ⌘R (see
  `swift/XCODE_SETUP.md`).
