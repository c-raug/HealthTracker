# HealthTracker — Claude Code Reference

## Commands

- `npm start` — launch Metro (dev server, shows QR code)
- `npm run tunnel` — start with ngrok tunnel (for Codespaces or different-network devices)
- `npm run ios` / `npm run android` / `npm run web` — native builds

No test runner or lint script exists in package.json.

## Architecture

- **Runtime**: Expo SDK 54, React Native 0.81.5
- **Navigation**: Expo Router v6 (file-based tabs)
  - 2 tabs: Weight (`app/(tabs)/index.tsx`) and Settings (`app/(tabs)/settings.tsx`)
- **State**: React Context + useReducer in `context/AppContext.tsx`; access via `useApp()`
- **Persistence**: auto-saves on every state change to AsyncStorage
- **Actions**: `LOAD_DATA`, `UPSERT_ENTRY`, `DELETE_ENTRY`, `SET_UNIT`
- **Units**: stored per-entry; display conversion done at render time via `convertWeight()`

## Key Patterns

- **Design tokens**: always import from `constants/theme.ts` (`Colors`, `Typography`, `Spacing`, `Radius`)
- **Date strings**: always `"YYYY-MM-DD"` (local timezone via `getToday()`); never use `new Date().toISOString()` for dates
- **TypeScript path alias**: `@/*` → project root

## Critical Dependency Constraints

- `expo-asset` must stay at `~12.0.12` — lower versions crash vector-icons
- `expo-linking` must stay at `~8.0.11` — expo-router peer dep
- All scripts use `npx expo` (not bare `expo`)
