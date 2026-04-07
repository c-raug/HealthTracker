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
- **Why `--legacy-peer-deps`?** This project uses `react@19.1.0`. Many packages have
  transitive peer conflicts with `react-dom@19.2.4`. The `--legacy-peer-deps` flag
  bypasses those without breaking anything functional. Omitting it causes npm to either
  fail with `ERESOLVE` or silently remove correctly-installed packages.

---

## Pinned Packages — Constraints and Why

### `expo-asset` — must be `~12.0.12`

**Why:** `@expo/vector-icons@15.x` calls `setCustomSourceTransformer()` (exported from
`expo-asset`) at import time to register icon font assets. This function does not exist
in `expo-asset@10.x` (SDK 52 era) or `expo-asset@11.x`. Using the wrong version causes
an immediate crash the moment any icon is imported. The crash cascades into a deceptive
wave of secondary errors — "Route missing default export", "No route named (tabs) in
nested children" — that look like code bugs but are not. The tabs layout never even
reaches its `export default` because it crashes first.

**Constraint:** `~12.0.12` (tilde, not caret — do not allow a minor bump)

---

### `expo-linking` — must be `~8.0.11`

**Why:** `expo-router@6.0.x` declares `expo-linking@^8.0.11` as a required peer
dependency. `expo-linking@7.x` is the SDK 53 era version. Using `7.x` causes an
`npm ERESOLVE` that blocks `npm install` from completing at all, which means `expo`
never gets installed locally, which causes `npm run tunnel` to fall back to
`npx expo@latest` (wrong version) and fail with a `ConfigError`.

**Constraint:** `~8.0.11`

---

### `react-native-worklets` — must be `0.5.1`

**Why:** `react-native-reanimated@4.1.x` has a peer dependency on
`react-native-worklets>=0.5.0`. The reanimated Babel plugin directly `require()`s
`react-native-worklets/plugin` at Metro bundle time. If this package is missing or the
wrong version, Metro fails immediately with
`Cannot find module 'react-native-worklets/plugin'`.

**Constraint:** `^0.5.1` in `package.json` (resolves to `0.5.1`)

---

### `react-refresh` — must be an explicit dep at `^0.14.2`

**Why:** `babel-preset-expo` requires `react-refresh/babel` at Babel transform time.
Although `react-refresh` is a transitive dependency of `react-native` and `expo`, npm
with `--legacy-peer-deps` does not hoist it to top-level `node_modules`. Without an
explicit entry in `package.json` `dependencies` (not `devDependencies`), Metro fails
with `Cannot find module 'react-refresh/babel'`.

**Constraint:** `^0.14.2` in `dependencies` (not `devDependencies`)

---

### `@react-native-community/datetimepicker` — must be `8.4.4`

**Why:** Native date picker for iOS (spinner modal) and Android (inline calendar) used
on the Weight screen. Has a `react-dom` peer conflict. Must be installed with
`--legacy-peer-deps`.

**Constraint:** `8.4.4` exact
**Install:** `npm install --save @react-native-community/datetimepicker --legacy-peer-deps`

---

### `babel-preset-expo` — must be `~54.0.0` in devDependencies

**Why:** `babel.config.js` references `babel-preset-expo` by name. npm does not
auto-install peer dependencies. If it is absent from `package.json`, Metro fails
immediately at bundling time with `Cannot find module 'babel-preset-expo'`. The version
must match the SDK (`~54.0.0` for SDK 54).

**Constraint:** `~54.0.0` in `devDependencies`

---

### `expo-linking` — must be `~8.0.11`

See above. The key point: `expo-router@6` requires `expo-linking@^8`. Any `7.x` version
breaks the install entirely.

---

### `@react-native-community/slider` — install with `--legacy-peer-deps`

**Why:** Native slider control used by `PortionSelector.tsx` for the whole-number portion
adjuster. Installed at `4.5.5` which is compatible with React Native 0.81.x.

**Install if re-adding:** `npm install --save @react-native-community/slider@4.5.5 --legacy-peer-deps`

---

### `react-native-draggable-flatlist` — install with `--legacy-peer-deps`

**Why:** Has a transitive peer conflict with `react-dom@19.2.4` vs the project's
`react@19.1.0`. Already installed at `^4.0.3`.

**Install if re-adding:** `npm install --save react-native-draggable-flatlist --legacy-peer-deps`

---

### `@sentry/react-native` — install with `--legacy-peer-deps`

**Why:** Crash reporting SDK for capturing JS exceptions and native crashes in APK builds.
Installed at `~7.2.0` (downgraded from 8.7.0 — Expo SDK 54 installs a compatible version via
`npx expo install`). Uses a dynamic `require()` in `utils/crashReporting.ts` so the app
compiles and runs without a DSN configured. The Expo plugin `@sentry/react-native/expo`
is registered in `app.json` for native crash handler setup in EAS builds. No Metro config
changes are needed for SDK 54.

**Constraint:** `~7.2.0` (SDK 54 compatible — use `npx expo install @sentry/react-native -- --legacy-peer-deps`)
**Install if re-adding:** `npm install --save @sentry/react-native --legacy-peer-deps`

---

## Full Dependency Table (SDK 54 working state)

| Package | Version | Type |
|---------|---------|------|
| `expo` | `~54.0.0` | dep |
| `expo-router` | `~6.0.0` | dep |
| `expo-asset` | `~12.0.12` | dep |
| `expo-linking` | `~8.0.11` | dep |
| `expo-status-bar` | `~3.0.9` | dep |
| `expo-file-system` | `~19.0.21` | dep |
| `expo-image-picker` | `~17.0.10` | dep |
| `expo-sharing` | `~14.0.8` | dep |
| `expo-document-picker` | `~14.0.8` | dep |
| `react` | `19.1.0` | dep |
| `react-native` | `0.81.5` | dep |
| `@expo/vector-icons` | `^15.0.0` | dep |
| `@react-native-async-storage/async-storage` | `2.2.0` | dep |
| `@react-native-community/datetimepicker` | `8.4.4` | dep |
| `@react-native-community/slider` | `4.5.5` | dep |
| `@sentry/react-native` | `~7.2.0` | dep |
| `react-native-chart-kit` | `^6.12.0` | dep |
| `react-native-gesture-handler` | `~2.28.0` | dep |
| `react-native-reanimated` | `~4.1.1` | dep |
| `react-native-safe-area-context` | `~5.6.0` | dep |
| `react-native-screens` | `~4.16.0` | dep |
| `react-native-draggable-flatlist` | `^4.0.3` | dep |
| `react-native-svg` | `15.12.1` | dep |
| `react-native-worklets` | `^0.5.1` | dep |
| `react-refresh` | `^0.14.2` | dep |
| `@babel/core` | `^7.24.0` | devDep |
| `@expo/ngrok` | `^4.1.3` | devDep |
| `@types/react` | `~19.1.10` | devDep |
| `babel-preset-expo` | `~54.0.0` | devDep |
| `typescript` | `~5.9.2` | devDep |

---

## Error Symptom Lookup

Use this table when you encounter an install or runtime error. Find the symptom, read
the root cause, then apply the fix — do not guess or try random version bumps.

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| `setCustomSourceTransformer is not a function` | `expo-asset` wrong version | Ensure `expo-asset` is `~12.0.12` |
| "Route missing default export" / "No route named (tabs)" | Usually the `expo-asset` crash cascading (not actual code bugs) | Fix `expo-asset` version first; don't touch route files |
| `npm ERESOLVE` on install | `expo-linking` version mismatch | Ensure `expo-linking` is `~8.0.11` |
| `Cannot find module 'react-native-worklets/plugin'` | `react-native-worklets` missing or wrong version | Ensure `react-native-worklets` is `^0.5.1` |
| `Cannot find module 'react-refresh/babel'` | `react-refresh` not hoisted by `--legacy-peer-deps` | Add `react-refresh ^0.14.2` to `dependencies` explicitly |
| `Cannot find module 'babel-preset-expo'` | Missing from `devDependencies` | Add `babel-preset-expo ~54.0.0` to `devDeps`; run `npm install` |
| npm removes packages or breaks tree after install | `--legacy-peer-deps` was omitted | Re-run with `--legacy-peer-deps` |
| `ConfigError` from `npx expo@latest` | `expo` not locally installed; fell back to global latest | Run `npm install` to restore local `expo`; use `npx expo` not bare `expo` |

---

## Evaluating New Packages

Before adding any new package, check these in order:

1. **Does it have a `react-dom` peer dep?** If yes, you must use `--legacy-peer-deps` on install.
2. **Does it depend on `react-native-reanimated` or `react-native-gesture-handler`?**
   If yes, verify it supports the versions already installed (`~4.1.1` and `~2.28.0`).
3. **Is it an Expo SDK package (`expo-*`)?** If yes, verify it targets SDK 54. Use
   `npx expo install <package>` to get the SDK-matched version automatically.
4. **Does it require a native module?** If yes, confirm it works with Expo managed
   workflow (no ejecting). Check the Expo docs.
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
