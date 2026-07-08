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
- [ ] **Phase 2** — Data model, store & persistence (+ backup import)
- [ ] **Phase 3** — Business-logic utilities (+ parity tests)
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
