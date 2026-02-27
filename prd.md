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
| Framework | React Native + Expo (managed workflow) | Cross-platform, fast iteration, large ecosystem |
| Language | TypeScript | Type safety, better IDE support |
| Navigation | React Navigation v6 | Industry standard for RN |
| Local Storage | expo-sqlite or AsyncStorage | On-device persistence, no backend required |
| Charts | react-native-chart-kit or Victory Native | Flexible line charts |
| State | React Context + useReducer | Lightweight, no external library needed for v1 |
| Styling | StyleSheet API + custom theme | Native, no extra dependencies |

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

## Project Structure (Proposed)

```
HealthTracker/
├── app/                        # Expo Router file-based routing
│   ├── (tabs)/
│   │   ├── index.tsx           # Home/Dashboard
│   │   ├── history.tsx         # History (chart + list)
│   │   └── settings.tsx        # Settings
│   ├── log-weight.tsx          # Log Weight modal/screen
│   └── _layout.tsx             # Root layout + navigation
├── components/
│   ├── WeightChart.tsx         # Line chart component
│   ├── WeightEntryList.tsx     # Scrollable list of entries
│   └── WeightEntryItem.tsx     # Single list row
├── context/
│   └── AppContext.tsx          # Global state (entries + preferences)
├── storage/
│   └── storage.ts              # AsyncStorage / SQLite helpers
├── types/
│   └── index.ts                # TypeScript interfaces
├── utils/
│   └── unitConversion.ts       # lbs <-> kg conversion helpers
├── app.json                    # Expo config
├── package.json
├── tsconfig.json
└── prd.md                      # This document
```

---

## Implementation Phases

### Phase 1 — Project Setup
- [ ] Initialize Expo project with TypeScript template
- [ ] Install dependencies (React Navigation, chart library, AsyncStorage)
- [ ] Set up project structure (folders, base files)
- [ ] Configure TypeScript

### Phase 2 — Core Data Layer
- [ ] Define TypeScript interfaces (`WeightEntry`, `UserPreferences`)
- [ ] Implement storage helpers (read/write/delete entries, read/write preferences)
- [ ] Create `AppContext` with reducer for global state

### Phase 3 — Screens
- [ ] Home screen (latest entry, quick-add CTA)
- [ ] Log Weight screen (form with validation)
- [ ] History screen (chart + list with delete)
- [ ] Settings screen (unit toggle)

### Phase 4 — Navigation & Polish
- [ ] Configure tab navigation (Home, History, Settings)
- [ ] Configure modal/stack for Log Weight
- [ ] Add empty states and loading states
- [ ] Basic theming (colors, typography)

### Phase 5 — Testing & Cleanup
- [ ] Manual test on iOS Simulator and Android Emulator (via Expo Go)
- [ ] Fix edge cases (same-day duplicate entry handling, unit switching behavior)
- [ ] Update README with setup instructions

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
