---
name: dependency-check
description: Dependency Check for HealthTracker. Reference before installing any package, modifying package.json, or troubleshooting Metro/npm errors. Contains all version constraints and correct install commands.
---

# Dependency Check — HealthTracker

Reference this skill before installing any package, modifying `package.json`, or
troubleshooting a Metro/npm error. It contains every version constraint, the reason
each constraint exists, and the correct install commands.

---

## Always-On Rules

Apply these on every install or package change — no exceptions:

- **Always run:** `npm install --legacy-peer-deps`
- **Always use:** `npx expo` (never bare `expo` — not reliably on PATH in Codespaces)
- **Never upgrade a single package in isolation** without reading the pinned-package
  notes below first
- **Why `--legacy-peer-deps`?** This project uses `react@19.2.0`. Many packages have
  transitive peer conflicts with `react-dom`. The `--legacy-peer-deps` flag
  bypasses those without breaking anything functional. Omitting it causes npm to either
  fail with `ERESOLVE` or silently remove correctly-installed packages.

---

## Pinned Packages — Constraints and Why

### `expo-asset` — must be `~55.0.16`

**Why:** `@expo/vector-icons@15.x` calls `setCustomSourceTransformer()` (exported from
`expo-asset`) at import time to register icon font assets. This function does not exist
in older `expo-asset` versions. Using the wrong version causes an immediate crash the
moment any icon is imported. The crash cascades into a deceptive wave of secondary
errors — "Route missing default export", "No route named (tabs) in nested children" —
that look like code bugs but are not.

**Constraint:** `~55.0.16` (tilde — must match SDK 55)

---

### `expo-linking` — must be `~55.0.14`

**Why:** `expo-router` declares `expo-linking` as a required peer dependency. The version
must match the SDK. Using a mismatched version causes `npm ERESOLVE` that blocks install.

**Constraint:** `~55.0.14` (must match SDK 55)

---

### `react-native-worklets` — must be `0.7.4`

**Why:** `react-native-reanimated@4.2.x` has a peer dependency on
`react-native-worklets`. The reanimated Babel plugin directly `require()`s
`react-native-worklets/plugin` at Metro bundle time. If this package is missing or the
wrong version, Metro fails immediately with
`Cannot find module 'react-native-worklets/plugin'`.

**Constraint:** `0.7.4` (must match reanimated 4.2.x peer requirement)

---

### `react-refresh` — must be an explicit dep at `^0.14.2`

**Why:** `babel-preset-expo` requires `react-refresh/babel` at Babel transform time.
Although `react-refresh` is a transitive dependency of `react-native` and `expo`, npm
with `--legacy-peer-deps` does not hoist it to top-level `node_modules`. Without an
explicit entry in `package.json` `dependencies` (not `devDependencies`), Metro fails
with `Cannot find module 'react-refresh/babel'`.

**Constraint:** `^0.14.2` in `dependencies` (not `devDependencies`)

---

### `@react-native-community/datetimepicker` — must be `8.6.0`

**Why:** Native date picker for iOS (spinner modal) and Android (inline calendar) used
on the Weight screen. Has a `react-dom` peer conflict. Must be installed with
`--legacy-peer-deps`.

**Constraint:** `8.6.0` (SDK 55 compatible)
**Install:** `npm install --save @react-native-community/datetimepicker@8.6.0 --legacy-peer-deps`

---

### `babel-preset-expo` — must be `~55.0.0` in devDependencies

**Why:** `babel.config.js` references `babel-preset-expo` by name. npm does not
auto-install peer dependencies. If it is absent from `package.json`, Metro fails
immediately at bundling time with `Cannot find module 'babel-preset-expo'`. The version
must match the SDK (`~55.0.0` for SDK 55).

**Constraint:** `~55.0.0` in `devDependencies`

---

### `expo-linking` (duplicate note)

See above. The key point: `expo-router` requires a matching `expo-linking`. Any older
version breaks the install entirely.

---

### `@react-native-community/slider` — install with `--legacy-peer-deps`

**Why:** Native slider control used by `PortionSelector.tsx` for the whole-number portion
adjuster. Installed at `5.1.2` which is compatible with React Native 0.83.x.

**Install if re-adding:** `npm install --save @react-native-community/slider@5.1.2 --legacy-peer-deps`

---

### `react-native-draggable-flatlist` — install with `--legacy-peer-deps`

**Why:** Has a transitive peer conflict with `react-dom@19.2.4` vs the project's
`react@19.1.0`. Already installed at `^4.0.3`.

**Install if re-adding:** `npm install --save react-native-draggable-flatlist --legacy-peer-deps`

---

### `@sentry/react-native` — install with `--legacy-peer-deps`

**Why:** Crash reporting SDK for capturing JS exceptions and native crashes in APK builds.
Installed at `~7.11.0` (SDK 55 compatible version via `npx expo install`). Uses a dynamic
`require()` in `utils/crashReporting.ts` so the app compiles and runs without a DSN
configured. The Expo plugin `@sentry/react-native/expo` is registered in `app.json` for
native crash handler setup in EAS builds.

**Constraint:** `~7.11.0` (SDK 55 compatible — use `npx expo install @sentry/react-native -- --legacy-peer-deps`)
**Install if re-adding:** `npm install --save @sentry/react-native --legacy-peer-deps`

---

## Full Dependency Table (SDK 55 working state)

| Package | Version | Type |
|---------|---------|------|
| `expo` | `~55.0.0` | dep |
| `expo-router` | `~55.0.13` | dep |
| `expo-asset` | `~55.0.16` | dep |
| `expo-blur` | `~55.0.14` | dep |
| `expo-dev-client` | `~55.0.30` | dep |
| `expo-document-picker` | `~55.0.13` | dep |
| `expo-file-system` | `~55.0.17` | dep |
| `expo-image-picker` | `~55.0.19` | dep |
| `expo-linear-gradient` | `~55.0.13` | dep |
| `expo-linking` | `~55.0.14` | dep |
| `expo-sharing` | `~55.0.18` | dep |
| `expo-status-bar` | `~55.0.5` | dep |
| `react` | `19.2.0` | dep |
| `react-native` | `0.83.6` | dep |
| `@expo/vector-icons` | `^15.0.0` | dep |
| `@react-native-async-storage/async-storage` | `2.2.0` | dep |
| `@react-native-community/datetimepicker` | `8.6.0` | dep |
| `@react-native-community/slider` | `5.1.2` | dep |
| `@sentry/react-native` | `~7.11.0` | dep |
| `react-native-chart-kit` | `^6.12.0` | dep |
| `react-native-gesture-handler` | `~2.30.0` | dep |
| `react-native-reanimated` | `4.2.1` | dep |
| `react-native-safe-area-context` | `~5.6.0` | dep |
| `react-native-screens` | `~4.23.0` | dep |
| `react-native-draggable-flatlist` | `^4.0.3` | dep |
| `react-native-svg` | `15.15.3` | dep |
| `react-native-worklets` | `0.7.4` | dep |
| `react-refresh` | `^0.14.2` | dep |
| `@babel/core` | `^7.24.0` | devDep |
| `@expo/ngrok` | `^4.1.3` | devDep |
| `@types/jest` | `^29.5.14` | devDep |
| `@types/react` | `~19.2.10` | devDep |
| `babel-preset-expo` | `~55.0.0` | devDep |
| `jest-expo` | `~55.0.0` | devDep |
| `typescript` | `~5.9.2` | devDep |

---

## Error Symptom Lookup

Use this table when you encounter an install or runtime error. Find the symptom, read
the root cause, then apply the fix — do not guess or try random version bumps.

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| `setCustomSourceTransformer is not a function` | `expo-asset` wrong version | Ensure `expo-asset` is `~55.0.16` |
| "Route missing default export" / "No route named (tabs)" | Usually the `expo-asset` crash cascading (not actual code bugs) | Fix `expo-asset` version first; don't touch route files |
| `npm ERESOLVE` on install | `expo-linking` version mismatch | Ensure `expo-linking` is `~55.0.14` |
| `Cannot find module 'react-native-worklets/plugin'` | `react-native-worklets` missing or wrong version | Ensure `react-native-worklets` is `0.7.4` |
| `Cannot find module 'react-refresh/babel'` | `react-refresh` not hoisted by `--legacy-peer-deps` | Add `react-refresh ^0.14.2` to `dependencies` explicitly |
| `Cannot find module 'babel-preset-expo'` | Missing from `devDependencies` | Add `babel-preset-expo ~55.0.0` to `devDeps`; run `npm install` |
| npm removes packages or breaks tree after install | `--legacy-peer-deps` was omitted | Re-run with `--legacy-peer-deps` |
| `ConfigError` from `npx expo@latest` | `expo` not locally installed; fell back to global latest | Run `npm install` to restore local `expo`; use `npx expo` not bare `expo` |

---

## Evaluating New Packages

Before adding any new package, check these in order:

1. **Does it have a `react-dom` peer dep?** If yes, you must use `--legacy-peer-deps` on install.
2. **Does it depend on `react-native-reanimated` or `react-native-gesture-handler`?**
   If yes, verify it supports the versions already installed (`4.2.1` and `~2.30.0`).
3. **Is it an Expo SDK package (`expo-*`)?** If yes, verify it targets SDK 55. Use
   `npx expo install <package>` to get the SDK-matched version automatically.
4. **Does it require a native module?** If yes, confirm it works with Expo dev client
   workflow. Check the Expo docs.
5. **Does it ship a Babel plugin?** If yes, add it to `babel.config.js` plugins array
   and restart Metro (`Ctrl+C` + `npm start`).

---

## History — Why These Constraints Exist

This project was originally scaffolded at SDK 52. The constraints above are the result
of the following fixes applied during the SDK 52 → 54 migration:

| Fix applied | What changed |
|------------|-------------|
| SDK 52 → 54 upgrade | All `expo-*` and `react-native-*` packages bumped to SDK 54 equivalents |
| `expo-linking` added at `~7.0.5` | Was entirely missing; added as explicit dep for expo-router peer dep |
| `expo-linking` corrected to `~8.0.11` | `~7.0.5` is SDK 53 era; `expo-router@6` requires `^8.0.11` |
| `babel-preset-expo ~54.0.0` added to devDeps | Was entirely missing; Metro cannot bundle without it |
| `expo-asset` corrected to `~12.0.12` | `~10.0.0` lacked `setCustomSourceTransformer`; caused icons crash + phantom route errors |
| All scripts switched to `npx expo` | Bare `expo` command unreliable on PATH in Codespaces |
| `react-native-worklets ^0.5.1` added as explicit dep | Required peer of `react-native-reanimated@4.1.x` Babel plugin |
| `react-refresh ^0.14.2` added as explicit dep | `--legacy-peer-deps` doesn't hoist it; `babel-preset-expo` needs it at top level |
| `@react-native-community/datetimepicker 8.4.4` added | Native date picker for consolidated Weight screen |
| `react-native-draggable-flatlist ^4.0.3` added | Drag-to-reorder for Nutrition meal categories |
| `@react-native-community/slider 4.5.5` added | Native slider control for PortionSelector component |
| `@sentry/react-native 8.7.0` added | Crash reporting SDK; dynamic require pattern means no compile-time dependency |
| `@sentry/react-native` downgraded to `~7.2.0` | `npx expo install` selects SDK 54 compatible version; 8.7.0 had peer conflicts |
| `expo-file-system ~19.0.21` added as explicit dep | Required for avatar storage in ProfileCard (lazy-loaded); SDK 54 compatible |
| `expo-image-picker ~17.0.10` added as explicit dep | Required for avatar photo picker in ProfileCard (lazy-loaded); SDK 54 compatible |
| SDK 54 → 55 migration | All `expo-*` and `react-native-*` packages bumped to SDK 55 equivalents; dev client + Xcode local-signing adopted; Expo Go retired |
| `expo-dev-client ~55.0.30` added | Replaces Expo Go for iOS debugging; enables custom native builds with Metro hot-reload |
| `react-native-worklets` bumped to `0.7.4` | Required peer of `react-native-reanimated@4.2.x` |
| `@react-native-community/datetimepicker` bumped to `8.6.0` | SDK 55 compatible version |
| `@react-native-community/slider` bumped to `5.1.2` | SDK 55 compatible version |
| `@sentry/react-native` bumped to `~7.11.0` | SDK 55 compatible version |

---

## New Architecture Quirks

These libraries are most likely to misbehave the day `newArchEnabled: true` is flipped
in `app.json`. Document here for future reference:

| Library | Risk | Notes |
|---------|------|-------|
| `react-native-draggable-flatlist` | High | Known interop friction with Fabric; long-press drag may freeze |
| `react-native-chart-kit` | Medium | Built on legacy SVG paths; needs revalidation on Fabric |
| `react-native-svg` 15.x | Low | Generally fine on Fabric but charts are the failure surface |
| `@react-native-community/datetimepicker` 8.x | Medium | Older community modules historically need a bump for full New Arch support |
| `react-native-reanimated` 4.x + `react-native-worklets` | Low | These support New Arch but pins need re-checking at flip time |
| Custom `PillTabBar` floating layout | Low | Uses absolute-positioned shadows; verify visually on Fabric |

**Plan**: flip `newArchEnabled` on its own branch, run the same smoke sweep as Step 7 of
the migration plan, fix one lib at a time.
