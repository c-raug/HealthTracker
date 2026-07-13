# HealthTracker — Native SwiftUI Migration Roadmap

This folder (`swift/`) holds the **native SwiftUI rewrite** of HealthTracker for iOS 26.
The React Native / Expo app under [`expo/`](../expo) remains the reference implementation until the
final cutover (Phase 16). See `XCODE_SETUP.md` for one-time project setup.

## How this works
- All Swift source is authored on the branch `claude/expo-to-swift-conversion-aromb1`.
- The Swift/SwiftUI code **cannot be compiled in the cloud agent environment** (no macOS/Xcode).
  You build & run each checkpoint in **Xcode on your Mac** and on your **iPhone (iOS 26)**, then
  report results so we iterate.
- Temporary dev bundle id `com.healthtracker.app.native` lets the new app run **alongside** the
  current Expo app for side-by-side comparison. Switches to `com.healthtracker.app` at Phase 16.
- **Fresh-session bootstrap:** read `CLAUDE.md` (conventions/workflow) + `docs/` (porting specs —
  `data-model.md`, `feature-inventory.md`, `design-system.md`, `rn-to-swift-mapping.md`) instead of
  re-exploring `../expo`. Recommended: **one context window per phase** (see `CLAUDE.md`).

## Architecture (target)
```
swift/HealthTracker/
  App/           App entry + root onboarding gate + store/theme injection
  Design/        Colors, Typography, Spacing/Radius, shadows, proximity/flame color, card modifiers
  Models/        Codable structs + enums (1:1 with expo/types/index.ts)
  Store/         AppStore (@Observable) — methods mirror the ~40 reducer actions
  Persistence/   JSONStore (per-slice), AutoBackup, BackupCodec (import/export)
  Logic/         TDEE, Water, Activity, Streak, WeeklyRating, XP, Achievements, Dates, Units (pure)
  Features/      Onboarding, Weight, Nutrition, Water, Activities, Home, Profile, Settings,
                 Gamification, Recap, Shared, DesignGallery
  Navigation/    RootTabView, PillTabBar, MoreMenu, CollapsibleHeader, HeaderXpBar
  Resources/     Assets.xcassets, Info.plist, entitlements
swift/HealthTrackerTests/  XCTest for Logic + Store + Backup round-trip
```

## Progress checklist
- [x] **Phase 0** — Project scaffolding & foundation (roadmap, setup docs, app entry, folder layout)
- [x] **Phase 1** — Design system (tokens, theme, shadows, proximity/flame color, Design Gallery)
- [x] **Phase 2** — Data model, store & persistence (+ backup import)
- [x] **Phase 3** — Business-logic utilities (+ parity tests)
- [ ] **Phase 4** — App shell: navigation, tab bar, headers
- [ ] **Phase 5** — Welcome + onboarding
- [ ] **Phase 6** — Weight tracking
- [ ] **Phase 7** — Nutrition (7a overview · 7b meals/rows · 7c add-food/library)
- [ ] **Phase 8** — Water tracking
- [ ] **Phase 9** — Activity tracking
- [ ] **Phase 10** — Home dashboard
- [ ] **Phase 11** — Profile & Settings + sub-modals
- [ ] **Phase 12** — Gamification
- [ ] **Phase 13** — Weekly recap
- [ ] **Phase 14** — Cross-cutting polish & full parity QA
- [ ] **Phase 15** — HealthKit integration
- [ ] **Phase 16** — Release & cutover

## Reference map (Expo → Swift)
Business logic to port verbatim: `expo/utils/*` (tdeeCalculation, waterCalculation,
activityCalculation, streakCalculation, weeklyRatingCalculation, xpCalculation,
achievementCalculation, calorieColor, flameColor, dateUtils, unitConversion, generateId).
Data model: `expo/types/index.ts`. State/reducer: `expo/context/AppContext.tsx`.
Persistence: `expo/storage/storage.ts`, `expo/storage/backupStorage.ts`.
Design tokens: `expo/constants/theme.ts` + `expo/.claude/documentation/style_guide.md`.
Screens/modals: `expo/app/**`. Components: `expo/components/**`.

## Checkpoints (build & test on device)
Each phase ends in an on-device checkpoint. Current checkpoint:

**Phase 0 + 1 →** After completing `XCODE_SETUP.md`, the app builds and launches showing the
**Design Gallery** (swatches, type scale, card styles, calorie-proximity + flame ramps),
correct in light/dark and across all 6 accent colors. This proves the toolchain, project
structure, and the entire design-token layer before any feature work.

**Phase 2 →** No new UI — RootView still shows the Design Gallery. The data layer is now wired:
`AppStore` is injected into the environment and `store.load()` runs on launch (empty state on a
fresh install). Verify the app still builds & launches unchanged, then run the unit tests (⌘U):
`BackupCodecTests` (envelope round-trip + validation), `CustomFoodMigrationTests` (legacy-field
migration), and `AppStoreTests` (prepend/XP-cap/import parity) should all pass. Once the Settings
screen exists (Phase 11), importing an existing Expo `healthtracker-backup.json` becomes the real
end-to-end data-migration check.

**Phase 3 →** No new UI — RootView still shows the Design Gallery. The pure business-logic layer
(`Logic/`) is now in place, ported verbatim from `expo/utils/*`. Verify the app still builds &
launches unchanged, then run the unit tests (⌘U): the new parity suites — `DatesTests`,
`CalculationTests` (TDEE/water/activity/units/id + `jsRound`), `StreakTests`, `WeeklyRatingTests`,
`GamificationLogicTests` (XP + achievements) — plus the existing Phase 2 tests should all pass.
No behavior visible to the user yet; this locks the formulas before feature screens consume them.

### Phase 3 map (what landed where)
- `Logic/Dates.swift` — `getToday`, `addDays`, `formatDisplayDate/ShortDate`, `getISOWeekString`
  (**un-padded** `YYYY-Wn`), `getISOWeekMonday`; local-tz Gregorian, day-count ISO-week math.
- `Logic/MathParity.swift` — `jsRound`/`jsRoundInt` (JS `Math.round` half-up semantics) used by every port.
- `Logic/Units.swift` — `lbsToKg`/`kgToLbs` (1-dp display), `convertWeight`.
- `Logic/Identifiers.swift` — `generate()` → `UUID().uuidString.lowercased()` (locked decision).
- `Logic/TDEE.swift` — BMR, activity multipliers, goal deltas, `heightToCm`/`weightToKg` (unrounded), `ageFromDob`, `calculateDailyCalories` (auto vs manual/smartwatch multiplier).
- `Logic/WaterGoal.swift`, `Logic/ActivityCalories.swift` — water target; exercise (MET 5) + step calories.
- `Logic/Streaks.swift` — current/longest for food/calorie-goal/weight/activity.
- `Logic/WeeklyRating.swift` — 4-factor (food/calorie/weight/water) → 1–5 stars.
- `Logic/XP.swift`, `Logic/Achievements.swift` — XP constants + 10-level ladder; 8 achievements + newly-unlocked check.
- `Store/AppStore.swift` — `todayString()` now delegates to `Dates.getToday()`; `xpFoodCap` → `XP.foodCap` (single source of truth).
- `calorieColor`/`flameColor` were already ported in Phase 1 (`Design/`), so not re-ported here.

### Phase 2 map (what landed where)
- `Models/` — `Enums`, `WeightEntry`, `UserProfile`, `Nutrition` (+ `Meals`/`DayNutrition`/`MacroSplit`),
  `CustomFood` (legacy-tolerant decoder), `SavedMeal`, `Activity`, `Water`, `UserPreferences` (+ `XpDayLog`), `BackupData`.
- `Persistence/` — `JSONStore` (7 slice files in Application Support + backup file in Documents), `BackupCodec` (envelope encode/decode/validate).
- `Store/AppStore.swift` — `@MainActor @Observable`; all ~40 reducer actions as methods, write-through per slice, debounced 3s auto-backup, `LOAD_DATA` migrations, backup export/import.
- `App/` — `AppStore` injected into the environment, loaded on launch; `AppTheme.sync(from:)` bridges persisted theme prefs (the Phase 2 hook noted in `AppTheme.swift`).
- All dates/timestamps modeled as `String` for byte-clean JSON parity with the Expo backup envelope.
