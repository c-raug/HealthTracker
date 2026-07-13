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
- **Swift app:** see **Building & testing the Swift app** below.

## Building & testing the Swift app (Mac + Xcode + iPhone)

The SwiftUI code is authored on this branch by the coding agent but **compiled and run by you** in
Xcode — SwiftUI can't build in the cloud environment. Here's the whole loop.

### Prerequisites
- A **Mac** with **Xcode 16 or newer**.
- Your **iPhone on iOS 26** (the app targets iOS 26). A Simulator works for most UI, but use the real
  device for the true native feel.
- A **free Apple ID** is enough to run on your own device (personal-team signing). A paid Apple
  Developer account is only needed for TestFlight / the App Store.

### One-time setup
Follow **[`swift/XCODE_SETUP.md`](./swift/XCODE_SETUP.md)** once to create
`swift/HealthTracker.xcodeproj` (iOS 26 deployment target; bundle id `com.healthtracker.app.native`
so it installs *alongside* your current Expo app for side-by-side comparison). You only do this once —
after that, new source the agent adds is picked up automatically by Xcode 16's synchronized folders.

### The per-checkpoint loop (every phase)
1. **Pull** the latest on `claude/expo-to-swift-conversion-aromb1`: `git pull`.
2. **Open** `swift/HealthTracker.xcodeproj` in Xcode.
3. **Pick your device** in the toolbar's run-destination menu (plug the iPhone in via USB the first
   time, or use wireless once paired).
4. **Run** with **⌘R** to build & launch on the device.
5. **Verify** the checkpoint's acceptance criteria — each phase in
   [`swift/MIGRATION_ROADMAP.md`](./swift/MIGRATION_ROADMAP.md) lists exactly what to check.
6. **Report back**, especially any Xcode build errors (paste them). The agent authors Swift without a
   compiler, so the first build of a new area is the most likely to need a quick fix — then it re-pushes.

### Running the unit tests
Press **⌘U** to run `swift/HealthTrackerTests/`. From Phase 2 on this includes data-model, store, and
business-logic **parity tests** (confirming TDEE, water goal, streaks, etc. match the Expo app's
numbers). Green tests are part of each checkpoint.

### First run on your iPhone (signing & trust)
- In the target's **Signing & Capabilities**, set **Team** to your Apple ID; Xcode auto-manages the
  provisioning profile.
- The first launch shows **"Untrusted Developer"** — on the iPhone go to **Settings ▸ General ▸ VPN &
  Device Management**, tap your developer profile, **Trust** it, then relaunch.
- **Free-provisioning caveat:** apps signed with a free Apple ID stop launching after **7 days**. Just
  re-run from Xcode (**⌘R**) to re-sign. A paid Developer account removes this limit.

### Quick troubleshooting
- *"Device not eligible" / iOS too new* → update Xcode so it supports iOS 26.
- *Build error naming a Swift file* → paste it back; the agent will fix what it wrote blind.
- *App won't launch after a few days* → free-provisioning expiry; re-run **⌘R**.
