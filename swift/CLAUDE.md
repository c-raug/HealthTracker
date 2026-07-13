# CLAUDE.md — HealthTracker native SwiftUI app (`swift/`)

Native SwiftUI rewrite of the Expo/React Native HealthTracker app (which lives in `../expo/` and is
the reference implementation). Goal: 100% feature parity, then native-only enhancements. Built in
phases, each ending in an on-device checkpoint.

## ⚠️ Critical workflow constraint
**Swift/SwiftUI cannot be compiled in this cloud agent environment** (no macOS/Xcode toolchain).
- The agent's job: **author Swift source** on branch `claude/expo-to-swift-conversion-aromb1`.
- The user builds & runs every checkpoint in **Xcode on their Mac / iPhone (iOS 26)** and reports back.
- So: write carefully, prefer conservative/idiomatic APIs, and expect a short build-fix loop after
  each push (the user pastes Xcode errors, you fix). Do **not** claim something "builds" — you can't verify that here.

## Start every session here (don't re-explore `../expo`)
1. `MIGRATION_ROADMAP.md` — phase list + **progress checklist** (what's done, what's next).
2. `docs/` — the porting specs (already extracted from the Expo app):
   - `docs/data-model.md` — types, store actions, persistence, **exact formulas**, gamification.
   - `docs/feature-inventory.md` — every screen/modal/component + its RN file.
   - `docs/design-system.md` — tokens/shadows/colors (Design layer already built).
   - `docs/rn-to-swift-mapping.md` — Expo construct → SwiftUI equivalent.
3. Read the specific `../expo/**` reference file(s) for the phase you're implementing, plus the
   `swift/HealthTracker/**` files you'll touch. Nothing more.

## Locked decisions
- **Persistence:** `Codable` structs + a single `@Observable AppStore` + JSON files. **No SwiftData.**
- **Data migration:** import the Expo app's `BackupData` JSON envelope (see `docs/data-model.md` §3).
- **HealthKit:** port everything 1:1 first; HealthKit is the final (Phase 15) optional phase.
- **Target:** iOS 26 only. Bundle id `com.healthtracker.app.native` (dev), `com.healthtracker.app` at release.

## Architecture & conventions
- Layout: `App/ Design/ Models/ Store/ Persistence/ Logic/ Features/ Navigation/ Resources/`; tests in `../HealthTrackerTests/`.
- **Design layer is done (Phase 1)** — use it, don't reinvent:
  - Colors: `@Environment(\.appColors) var colors` → `colors.primary/card/text/border/...` (+ `colors.isDark`).
  - `Typography.h1…small`, `Spacing.xs…xl`, `Radius.sm/md/lg`, `.cardStyle()`, `.featureCardStyle()`.
  - `FixedColors` (water/macros), `CalorieProximity.ringColor(...)`, `FlameColor.color(forBurn:)`.
  - Theme state: `@Environment(AppTheme.self)` (appearance mode + accent).
- **App shell is done (Phase 4)** — plug feature screens into it, don't rebuild navigation:
  - `RootView` is the onboarding gate; `RootTabView` hosts the pill tab bar + More popover + stats sheet.
  - Wrap a tab screen's body in `CollapsibleScreen(title:onXpTap:) { … }` for the collapsing header + `HeaderXpBar` + pill clearance; data tabs add `DateNavBar()` at the top.
  - Shared date state: `store.selectedDate` / `store.setSelectedDate(_:)` (not persisted).
- **Onboarding is done (Phase 5)** — `RootView` gates on `preferences.onboardingComplete`: false → `WelcomeView` → 5-step `OnboardingView`; true → `RootTabView`. Wizard form lives in the pure `OnboardingDraft` (validate + build there, keep the view thin); completion writes via `setUnit`/`setProfile`/`setMacroPreset`/`upsertEntry`/`setActivityMode(.auto)`/`setOnboardingComplete`. New runtime-timestamp helper: `Dates.nowTimestamp()` (JS `toISOString()` parity) for entry `createdAt`/`loggedAt`.
- **Weight tab is done (Phase 6)** — `Features/Weight/`. Pure logic lives in `Logic/WeightStats.swift` (save `validate`/`isSaveDisabled`, `chartSeries` range filter, 7-day `insights`, and the JS `jsParseFloat`/`jsNumberString` helpers) — reuse it (Home shows a mini scale/insight). `DigitalScaleView` (with `hideUnit`) and `WeightChartView` (Swift `Charts`) are reusable. Save calls `store.upsertEntry` only — **no XP here** (weight XP is a Phase-12 gamification-watcher concern). New date helper: `Dates.dayDifference(from:to:)`.
- **Nutrition overview is done (Phase 7a)** — `Features/Nutrition/`. Pure calorie/macro math is in `Logic/NutritionStats.swift` (`consumedCalories`/`consumedMacros`, `macroTargets`, `latestWeight`, `baseTdee`, mode-aware `caloriesBurned`, `weeklyCalorieSeries`, `adjustedCalorieGoal`) — reuse it (Home & Activities need the same numbers). `calorieTarget = baseTdee + todayBurned`. Reusable views: `CalorieRingView`, `MacroProgressBarsView`, and the cross-tab `Features/Shared/WeeklyBarChart` (pass `.proximity` for calories, `.fixed(color)` for water/activity). `ProfilePromptView`'s CTA is a `NavigationLink(value: MoreDestination.settings)` (resolves against the shell stack — no shell change). **7b** adds the meal cards/rows, **7c** the add-food/library modals, and **Phase 8** swaps the water placeholders for real widgets (the pager keeps the ring at index 1 so the water graph appends as page 2).
- **Dates:** local-timezone `"YYYY-MM-DD"` strings compared lexicographically — never UTC/ISO for day keys. ISO week is un-padded `YYYY-Wn`.
- **IDs:** `UUID().uuidString.lowercased()`.
- Store mutations mirror the RN reducer actions (see `docs/data-model.md` §2); keep newest-first prepend semantics and the once-per-day XP guards.
- Port pure logic verbatim into `Logic/` with XCTest fixtures proving parity against `../expo/utils/*`.

## Per-phase loop
1. Update roadmap: mark the phase in progress.
2. Implement under `swift/HealthTracker/<Area>/` (+ tests in `../HealthTrackerTests/`).
3. Tick the roadmap checklist; note the checkpoint's acceptance criteria.
4. Commit + push to the branch (follow the session's git trailer instructions — don't hardcode a session URL).
5. Tell the user exactly what to build and verify on-device.

## Don'ts
- Don't modify `../expo/**` except to read it as reference (until the Phase 16 cutover).
- Don't push to any branch other than the phase branch you were assigned for the session (see the session's git instructions) without permission.
- Don't add SwiftData, third-party packages, or a backend without asking.
- Don't create a PR unless the user asks.

## Token efficiency
Prefer **one context window per phase/checkpoint**. This file + `docs/` + the roadmap are the durable
memory that lets a fresh session start cheaply — keep them current so continuity lives on disk, not in chat history.
