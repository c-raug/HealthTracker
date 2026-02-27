# HealthTracker — Product Requirements Document

## Overview

HealthTracker is a cross-platform mobile application (iOS & Android) built with React Native (Expo) that helps users monitor their health over time. The app begins with daily weight tracking and is designed to be extended with caloric intake, activity tracking, and more in future iterations.

---

## Phase 1: Weight Tracking MVP

### Goals
- Allow users to log their weight each day
- Persist weight entries locally on-device
- Display weight history as both a line chart and a scrollable list
- Support metric (kg) and imperial (lbs) units with user preference stored locally

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React Native + Expo SDK 52 (managed workflow) | Cross-platform, fast iteration, large ecosystem |
| Language | TypeScript | Type safety, better IDE support |
| Routing | Expo Router v4 (file-based) | Modern standard for Expo apps |
| Local Storage | AsyncStorage (`@react-native-async-storage/async-storage` v2.1.0) | On-device persistence, no backend required |
| Charts | react-native-chart-kit + react-native-svg | Flexible line charts, pure JS |
| State | React Context + useReducer | Lightweight, no external library needed for v1 |
| Styling | StyleSheet API + custom theme (`constants/theme.ts`) | Native, no extra dependencies |

---

## Screens & Features

### 1. Home / Dashboard Screen
- Displays today's date
- Shows the user's most recent weight entry (or a prompt to log today's weight if none exists)
- Quick-add button to log weight for today
- Navigation to History and Settings

### 2. Log Weight Screen (Modal or Stack Screen)
- Date picker (defaults to today)
- Numeric weight input
- Unit toggle (lbs / kg) respecting the user's global preference
- Save button to persist the entry
- Basic validation (non-empty, positive number, reasonable range)

### 3. History Screen
- **Line chart**: Weight over time (last 30 days by default, with option to extend)
- **Scrollable list**: Each entry shows date, weight value, and unit
- Ability to delete an entry (swipe-to-delete or long-press)
- Empty state when no entries exist

### 4. Settings Screen
- Unit preference (lbs or kg) — stored locally, applied app-wide
- Future: reminders, goal weight, data export

---

## Data Model

### WeightEntry
```ts
interface WeightEntry {
  id: string;          // UUID
  date: string;        // ISO date string "YYYY-MM-DD"
  weight: number;      // stored in the user's selected unit
  unit: 'lbs' | 'kg';
  createdAt: string;   // ISO timestamp
}
```

### UserPreferences
```ts
interface UserPreferences {
  unit: 'lbs' | 'kg';  // default: 'lbs'
}
```

---

## Project Structure

```
HealthTracker/
├── app/                        # Expo Router file-based routing
│   ├── _layout.tsx             # Root Stack layout + AppProvider wrapper
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab bar (Home, History, Settings)
│   │   ├── index.tsx           # Home/Dashboard screen
│   │   ├── history.tsx         # History screen (chart + list)
│   │   └── settings.tsx        # Settings screen
│   └── log-weight.tsx          # Log Weight modal screen
├── components/
│   ├── WeightChart.tsx         # Line chart (react-native-chart-kit)
│   ├── WeightEntryList.tsx     # FlatList of all entries
│   └── WeightEntryItem.tsx     # Single entry row with delete
├── constants/
│   └── theme.ts                # Colors, typography, spacing, radius tokens
├── context/
│   └── AppContext.tsx          # Global state (entries + preferences) + useApp hook
├── storage/
│   └── storage.ts              # AsyncStorage read/write helpers
├── types/
│   └── index.ts                # WeightEntry & UserPreferences interfaces
├── utils/
│   ├── dateUtils.ts            # getToday, formatDisplayDate, formatShortDate, addDays
│   └── unitConversion.ts       # lbsToKg, kgToLbs, convertWeight
├── app.json                    # Expo config (scheme, plugins)
├── babel.config.js
├── package.json
├── tsconfig.json
└── prd.md                      # This document
```

---

## Implementation Phases

### Phase 1 — Project Setup ✅ _Completed 2026-02-27_
- [x] Initialize Expo project with TypeScript template (Expo SDK 52, Expo Router v4)
- [x] Install dependencies (react-native-chart-kit, AsyncStorage, react-native-svg, @expo/vector-icons)
- [x] Set up project structure (app/, components/, context/, storage/, types/, utils/, constants/)
- [x] Configure TypeScript (`tsconfig.json` extending `expo/tsconfig.base`)

### Phase 2 — Core Data Layer ✅ _Completed 2026-02-27_
- [x] Define TypeScript interfaces (`WeightEntry`, `UserPreferences`) in `types/index.ts`
- [x] Implement storage helpers (`loadEntries`, `saveEntries`, `loadPreferences`, `savePreferences`) in `storage/storage.ts`
- [x] Create `AppContext` with `useReducer` — actions: `LOAD_DATA`, `UPSERT_ENTRY`, `DELETE_ENTRY`, `SET_UNIT`
- [x] Add `utils/unitConversion.ts` (lbs ↔ kg) and `utils/dateUtils.ts` (formatting, date arithmetic)

### Phase 3 — Screens ✅ _Completed 2026-02-27_
- [x] Home screen — today's date, today's weight card, Log Weight CTA, total entries summary
- [x] Log Weight modal — prev/next day date selector, numeric input, validation (range + non-empty), upserts on same-day conflicts
- [x] History screen — empty state with CTA; `WeightChart` (last 30 entries, bezier line); `WeightEntryList` (newest first) with per-item delete + confirmation
- [x] Settings screen — lbs/kg toggle (segmented control style), persisted preference, About section

### Phase 4 — Navigation & Polish ✅ _Completed 2026-02-27_
- [x] Expo Router file-based tab navigation (Home, History, Settings) with Ionicons
- [x] Log Weight presented as a modal (`presentation: 'modal'`) via root Stack
- [x] Loading states (ActivityIndicator) on Home and History screens
- [x] Empty states on Home (no today entry prompt) and History (no entries prompt)
- [x] Design system in `constants/theme.ts` (Colors, Typography, Spacing, Radius tokens)

### Phase 5 — Testing & Cleanup ✅ _Completed 2026-02-27_
- [x] Edge case: same-day duplicate entries handled via `UPSERT_ENTRY` (replaces existing entry for same date)
- [x] Edge case: future date blocked in Log Weight date selector
- [x] Edge case: chart guarded against < 2 data points (shows placeholder message)
- [x] Unit switching: chart converts all entries to current preferred unit; list shows stored unit per entry
- [x] Updated README with full setup instructions, project structure, and roadmap link

---

---

## Development Log

| Date | Phase | Notes |
|---|---|---|
| 2026-02-27 | Planning | PRD created; tech stack and screens decided (React Native Expo, local storage, lbs+kg, chart+list history) |
| 2026-02-27 | Phase 1 | Expo SDK 52 project scaffolded; all config files created; 941 packages installed |
| 2026-02-27 | Phase 2 | Full data layer complete: types, AsyncStorage helpers, AppContext with useReducer, unit & date utilities |
| 2026-02-27 | Phase 3 | All 4 screens implemented: Home, Log Weight modal, History, Settings |
| 2026-02-27 | Phase 4 | Expo Router tab navigation + modal wiring; design system (Colors, Typography, Spacing); loading & empty states |
| 2026-02-27 | Phase 5 | Edge cases handled; README updated with full setup instructions |

---

## Out of Scope for Phase 1
- User accounts / authentication
- Cloud sync or backup
- Caloric intake tracking
- Activity tracking
- Push notification reminders
- Apple Health / Google Fit integration
- Data export (CSV, PDF)
- Goal setting

These features are planned for future phases once the weight tracking MVP is solid.

---

## Success Criteria for Phase 1
- User can open the app and log their weight for today
- Weight entry is persisted and still visible after closing and reopening the app
- User can view a chart and list of their past entries
- User can switch between lbs and kg and have that preference saved
- User can delete a past entry
- App runs on both iOS and Android via Expo Go
