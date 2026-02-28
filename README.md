# HealthTracker

A cross-platform mobile app (iOS & Android) built with React Native (Expo) for tracking daily weight and visualizing progress over time.

## Features

- Log your weight for any date with date navigation arrows and a native date picker
- Toggle between **Log** and **History** views within the same screen — no separate tab
- View your history as a line chart (last 30 entries) and a scrollable list
- Delete any past entry with a confirmation prompt
- Switch between **lbs** and **kg** — preference saved locally
- All data stored on-device (no accounts or internet required)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo SDK 54 (managed workflow) |
| Language | TypeScript |
| Routing | Expo Router v6 (file-based) |
| Storage | AsyncStorage (`@react-native-async-storage/async-storage`) |
| Charts | react-native-chart-kit + react-native-svg |
| State | React Context + useReducer |
| Icons | @expo/vector-icons (Ionicons) |

---

## Project Structure

```
app/
├── _layout.tsx          # Root Stack layout (wraps AppProvider, no modal routes)
└── (tabs)/
    ├── _layout.tsx      # Tab bar (Weight, Settings) + Ionicons
    ├── index.tsx        # Weight screen — Log/History toggle, date picker, chart
    └── settings.tsx     # Settings screen (unit preference)

components/
├── WeightChart.tsx      # Line chart (react-native-chart-kit), guarded for <2 points
├── WeightEntryList.tsx  # FlatList of all entries, newest first
└── WeightEntryItem.tsx  # Single entry row with delete + confirmation

context/AppContext.tsx   # Global state (entries + preferences), useReducer
storage/storage.ts       # AsyncStorage read/write helpers
types/index.ts           # WeightEntry & UserPreferences interfaces
constants/theme.ts       # Colors, Typography, Spacing, Radius tokens
utils/
├── dateUtils.ts         # getToday, formatDisplayDate, formatShortDate, addDays
└── unitConversion.ts    # lbsToKg, kgToLbs, convertWeight
```

---

## Data Model

```ts
interface WeightEntry {
  id: string;        // UUID
  date: string;      // ISO date "YYYY-MM-DD"
  weight: number;    // stored in the user's selected unit
  unit: 'lbs' | 'kg';
  createdAt: string; // ISO timestamp
}

interface UserPreferences {
  unit: 'lbs' | 'kg'; // default: 'lbs'
}
```

AsyncStorage keys: `weight_entries`, `user_preferences`

---

## Local Development (Mac)

All dependencies and scripts work identically on a local Mac — none of the Codespace fixes were environment-specific.

### Prerequisites

- **Node.js 20+** — required by Expo SDK 54. Check with `node -v`; install from [nodejs.org](https://nodejs.org/) if needed
- **Expo Go (SDK 54)** on your phone — the same app used for Codespace development
- **Xcode** (optional) — for iOS Simulator; install from the Mac App Store
- **Android Studio** (optional) — for Android Emulator; install from [developer.android.com](https://developer.android.com/studio)

### Setup

```bash
git clone <repo-url>
cd HealthTracker
npm install
```

### Running the app

```bash
npm start
```

Metro starts and shows a QR code. Then choose your target:

| Target | How |
|--------|-----|
| Physical device (Expo Go) | Scan the QR code — phone must be on the **same Wi-Fi** as your Mac |
| iOS Simulator | Press `i` in the terminal (requires Xcode installed) |
| Android Emulator | Press `a` in the terminal (requires Android Studio + emulator already running) |

> **Different network?** If your phone isn't on the same Wi-Fi as your Mac, use `npm run tunnel` instead of `npm start`. This spins up an ngrok tunnel exactly like the Codespace workflow.

### Live development (same as Codespace)

| Key | Action |
|-----|--------|
| `r` | Force full reload |
| `i` | Open iOS Simulator |
| `a` | Open Android Emulator |
| `j` | Open JS debugger |
| `c` | Show QR code again |
| `Ctrl+C` | Stop Metro |

---

## Codespace Development

This is the no-install workflow — runs entirely in the browser with no local setup required.

### How it works

**GitHub Codespaces** runs the Expo development server in the cloud. **Expo tunnel** (`--tunnel`) creates a public URL via ngrok so your phone can reach that server from anywhere. **Expo Go** (free app) connects to that URL and renders the app natively.

### Prerequisites

1. **GitHub account** with this repository
2. **Expo Go** installed on your phone — must be **SDK 54**:
   - iOS: [App Store → Expo Go](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play → Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Starting a dev session

1. Go to `github.com/[your-username]/HealthTracker`
2. Tap **Code** → **Codespaces** tab → **Create codespace on main**
   - If you have an existing Codespace, reopen it instead
3. Wait ~30 seconds for the Codespace to finish setting up (the `postCreateCommand` runs `npm install && npx expo install --fix` automatically)
4. Open the **Terminal** panel (hamburger menu → Terminal → New Terminal)
5. Run:
   ```bash
   npm run tunnel
   ```
6. Wait ~20–30 seconds for a QR code and a URL starting with `exp://`
7. Open **Expo Go** → tap **Scan QR Code** → point at the QR code in the terminal

> **If reopening an existing Codespace** (not creating fresh): `postCreateCommand` does not re-run. Just open the terminal and run `npm run tunnel` directly — packages are already installed.

### Live development

- **Hot reload**: code changes apply automatically within a few seconds
- **Force full reload**: press `r` in the terminal
- **Open JS debugger**: press `j` in the terminal
- **Redisplay QR code**: press `c` in the terminal

### Ending a session

1. Press `Ctrl+C` to stop Expo
2. To pause billing: GitHub profile → **Codespaces** → `...` → **Stop codespace**

> **Free tier:** GitHub Free gets ~60 core-hours/month (roughly 60 hours on a 2-core Codespace). You'll receive an email warning before hitting the limit.

---

## Dependency Reference

> **Important for future changes:** This project has a history of dependency version conflicts from its original SDK 52 scaffolding. Always use the exact version ranges below and never upgrade a single package in isolation without checking the constraint notes.

### Working versions (SDK 54)

| Package | Version | Type |
|---------|---------|------|
| `expo` | `~54.0.0` | dep |
| `expo-router` | `~6.0.0` | dep |
| `expo-asset` | `~12.0.12` | dep |
| `expo-linking` | `~8.0.11` | dep |
| `expo-status-bar` | `~3.0.9` | dep |
| `react` | `19.1.0` | dep |
| `react-native` | `0.81.5` | dep |
| `@expo/vector-icons` | `^15.0.0` | dep |
| `@react-native-async-storage/async-storage` | `2.2.0` | dep |
| `@react-native-community/datetimepicker` | `^8.4.4` | dep |
| `react-native-chart-kit` | `^6.12.0` | dep |
| `react-native-gesture-handler` | `~2.28.0` | dep |
| `react-native-reanimated` | `~4.1.1` | dep |
| `react-native-safe-area-context` | `~5.6.0` | dep |
| `react-native-screens` | `~4.16.0` | dep |
| `react-native-svg` | `15.12.1` | dep |
| `@babel/core` | `^7.24.0` | devDep |
| `@expo/ngrok` | `^4.1.3` | devDep |
| `@types/react` | `~19.1.10` | devDep |
| `babel-preset-expo` | `~54.0.0` | devDep |
| `typescript` | `~5.9.2` | devDep |

### Version constraints — do not change without reading this

**`expo-asset` must be `~12.0.12`**
`@expo/vector-icons@15.x` calls `setCustomSourceTransformer` (from `expo-asset`) at import time to register icon font assets. This function does not exist in `expo-asset@10.x` (SDK 52 era) or `expo-asset@11.x`. Using the wrong version causes a crash the instant any icon is imported, which produces a deceptive cascade of secondary errors: "Route missing default export", "No route named (tabs) in nested children", etc. None of those routes have actual code bugs — they all fail because the tabs layout crashes before its `export default` is evaluated.

**`expo-linking` must be `~8.0.11`**
`expo-router@6.0.x` declares `expo-linking@^8.0.11` as a required peer dependency. `expo-linking@7.x` is the SDK 53 era version and will cause an `npm ERESOLVE` error that prevents `npm install` from completing at all, which in turn prevents `expo` from being installed locally, which causes `npm run tunnel` to fall back to `npx expo@latest` (wrong version) and then fail with a `ConfigError`.

**`babel-preset-expo` must be an explicit `devDependency` at `~54.0.0`**
`babel.config.js` references `babel-preset-expo` by name. npm does not auto-install peer dependencies. If it is absent from `package.json`, Metro fails immediately at bundling time with `Cannot find module 'babel-preset-expo'`. The version must match the SDK (`~54.0.0` for SDK 54).

**`expo-router` scripts must use `npx expo`, not bare `expo`**
In a Codespace, `node_modules/.bin` is not always on `PATH`. `npx expo` resolves the locally installed binary reliably. All scripts in `package.json` use `npx expo start`, `npx expo run:android`, etc.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| QR code won't scan | Press `c` in the terminal to redisplay it |
| App not updating after a change | Press `r` in terminal, or shake your phone → **Reload** |
| Tunnel is slow to start | Wait up to 60 seconds — ngrok can take a moment to initialise |
| `@expo/ngrok` not found | Run `npm install` first, then retry `npm run tunnel` |
| Codespace went to sleep | Reopen it at github.com → Codespaces, then run `npm run tunnel` again |
| "Something went wrong" in Expo Go | Stop Expo (`Ctrl+C`), run `npm run tunnel` again, rescan QR code |
| `Cannot find module 'babel-preset-expo'` | Run `npm install` — this package was missing from devDependencies and has since been added |
| `setCustomSourceTransformer is not a function` | `expo-asset` version mismatch — ensure `expo-asset` is `~12.0.12` in `package.json` |
| `npm ERESOLVE` on install | `expo-linking` version mismatch — ensure `expo-linking` is `~8.0.11` |
| Route "missing default export" warnings | Usually a symptom of the `expo-asset`/`setCustomSourceTransformer` crash above, not an actual code error |

---

## Fix History

Condensed log of dependency fixes applied after the initial SDK 52 scaffold:

| Fix | What changed |
|-----|-------------|
| Upgrade SDK 52 → 54 | All Expo + RN packages bumped to SDK 54 equivalents |
| `expo-linking` added at `~7.0.5` | Was missing; added as explicit dep for expo-router peer dep |
| `expo-linking` corrected to `~8.0.11` | `~7.0.5` was SDK 53 era; expo-router@6 requires `^8.0.11` |
| `babel-preset-expo ~54.0.0` added to devDeps | Was entirely missing; Metro cannot bundle without it |
| `expo-asset` corrected to `~12.0.12` | `~10.0.0` lacked `setCustomSourceTransformer`; caused icons crash and phantom route errors |
| All scripts switched to `npx expo` | Bare `expo` command not reliably on PATH in Codespaces |
| `.devcontainer` updated | `postCreateCommand` runs `npm install && npx expo install --fix`; ports 19000 + 19001 forwarded |
| Consolidate History + Log into single screen | Removed `history.tsx` and `log-weight.tsx`; `index.tsx` now contains a Log/History toggle with inline date picker; tab bar reduced from 3 tabs to 2 (Weight + Settings) |
| `@react-native-community/datetimepicker` added | Native date picker for iOS (spinner modal) and Android (inline); required for date selection on the consolidated Weight screen |
