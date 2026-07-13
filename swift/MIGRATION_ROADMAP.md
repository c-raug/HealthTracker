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
- [x] **Phase 4** — App shell: navigation, tab bar, headers
- [x] **Phase 5** — Welcome + onboarding (5-step profile setup + Load Saved Data)
- [x] **Phase 6** — Weight tracking (scale/chart pager, log card, 7-day insights)
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

**Phase 4 →** First visible change since Phase 1: `RootView` is now the **onboarding gate**, not the
Design Gallery. On a fresh install it shows the Phase-5 **welcome placeholder** — tap **"Enter app
(dev)"** (sets `onboardingComplete`) to reach the **tab shell**. Verify:
- **Floating pill tab bar** (blurred glass, hairline border) with Home / Weight / Nutrition /
  Activities; the active item tints `primary`. Correct in light/dark + all 6 accents.
- **"More"** opens a popover (Profile / Settings) above the pill; tapping a scrim or row dismisses it.
  Profile/Settings push with a system back button; choosing a primary tab pops back.
- Every tab has a **collapsible large-title header** that translates up and reveals a frosted blur as
  you scroll, with the **`HeaderXpBar`** pill at the trailing edge (shows `Level N`/`MAX` + progress).
  Tapping it presents the **Stats & Achievements** sheet.
- Each data tab shows the shared **date-nav bar** (‹ · date → graphical picker capped at today · › ·
  skip-to-today) bound to the app-wide `selectedDate`.
- **Design Gallery** is still reachable (Settings → "Design Gallery (dev)", and from the welcome
  screen) so the Phase-1 token layer stays verifiable.
- The screens themselves are **placeholders** ("Coming in Phase N") — later phases replace each body.
Then run the unit tests (⌘U): the only new test is `DatesTests.testJsDayOfWeek` (the Monday
auto-recap check); all existing Phase 2/3 suites should still pass. *(The collapsing-header
translate/blur uses `onScrollGeometryChange` + `contentMargins`; if the offset feels off on device,
that's the spot to tune — flag it and we'll iterate.)*

**Phase 5 →** The onboarding gate is now real (replaces the Phase-4 welcome placeholder). On a fresh
install `RootView` shows the **welcome screen** (`figure.run` logo, tagline, two buttons + the dev
Design-Gallery link). Verify:
- **Start New Profile** pushes the **5-step wizard** (progress dots fill as you advance):
  1. **Welcome** — lbs/kg segmented toggle + optional name.
  2. **About You** — Date of Birth (wheel picker in a sheet, capped at 10 yrs ago, defaults to 30
     yrs ago), Male/Female toggle, height (ft + in when lbs, cm when kg).
  3. **Your Goals** — activity-level list + weight-goal list (labels switch lb/wk ↔ kg/wk with the unit).
  4. **Nutrition** — Balanced / High Protein / Keto presets, a **Custom** split with −/+ steppers
     (blocks Next until the three fields total 100%), a live `P:/C:/F:` summary, and a
     "Skip — use Balanced defaults" link.
  5. **Starting Weight** — numeric entry gated to 50–1000 lbs / 20–500 kg.
  The footer's Next/Complete button dims + disables until each step's inputs are valid.
- **Complete Setup** writes unit, profile, macro split, a today-dated starting **weight entry**, and
  `activityMode = auto`, then flips `onboardingComplete` → the app drops straight into the **tab shell**.
- **Load Saved Data** opens the file importer; pick an existing HealthTracker `*.json` backup and it
  imports via `store.importBackup(_:)` and enters the app (errors surface in an alert).
- Relaunch after completing setup → it skips straight to the tab shell (onboarding not shown again).
Then run the unit tests (⌘U): the new suite is `OnboardingTests` (height ft/in→in, weight-range and
custom-macro-sum gates, profile/entry builders, unit-dependent goal labels); all existing suites pass.

**Phase 6 →** The **Weight** tab is now real (replaces the Phase-4 placeholder). Complete onboarding
(or Load Saved Data), then open the Weight tab and verify:
- The shared **date-nav bar** at the top drives `store.selectedDate` (shared with the other tabs).
- A **2-page horizontal pager** (swipe + page dots): **page 0** is the **digital scale** (LCD readout
  showing the saved weight for the selected date, or a dimmed `175.5`/`80.0` placeholder); **page 1** is
  the **weight-trend line chart** (Swift Charts) with a **range menu** (1W/1M/3M/1Y/All) and a
  **Start · Change · Current** summary. With **<2 entries** the chart shows "Log at least 2 entries…".
- **Log Weight (unit)** card: type a value → **Save**. Save is **disabled** when the field is empty,
  unparseable, or unchanged from the saved value. Out-of-range (‹50 / ›1000 lbs · ‹20 / ›500 kg) or
  invalid input shows an alert. On a valid save the scale **counts up** to the new value with a
  `primary` glow, a **"Weight saved"** pill appears for 3s, and the chart/insights update.
- Saving on a date that already has an entry **overwrites** it (one entry per date); changing the
  date pre-fills the field with that date's saved value (converted to the current unit).
- **Progress Insights (Last 7 Days)** card below: weight change, weekly rate, and an
  **On Track / Behind / Ahead of Target** badge. Falls back to "Set a weight goal…" (no goal) or
  "Log more entries…" (< 2 entries in the last 7 days).
- Correct in light/dark + all 6 accents; the collapsing header + XP pill still behave.
Then run the unit tests (⌘U): the new suite is `WeightStatsTests` (parseFloat/Number-string parity,
save-range + save-disabled rules, chart-series range filter + net change, and the 7-day insight
status math); all existing suites pass. *(The chart uses the native `Charts` framework in place of RN's
`react-native-chart-kit`; the count-up uses a `Task`-driven cubic ease matching the RN rAF loop —
flag if either feels off on device and we'll tune.)*

### Phase 6 map (what landed where)
- `Logic/WeightStats.swift` — the pure, testable core: `jsParseFloat`/`jsNumberString` (JS number
  parity), `range`/`validate`/`isSaveDisabled` (the log-card save rules), `chartSeries`
  (time-range filter + fallback-to-last-2 + net change), and `insights` (7-day weekly-rate →
  `onTrack`/`behind`/`ahead`). Ports `expo/app/(tabs)/index.tsx` + `WeightChart.tsx` + `WeightInsights.tsx`.
- `Logic/Dates.swift` — added `dayDifference(from:to:)` (local-tz calendar day span) for the insight math.
- `Features/Weight/DigitalScaleView.swift` — port of `expo/components/weight/DigitalScale.tsx`: LCD
  recess, saved-value/placeholder priority, `Task`-driven cubic-ease count-up on save, `primary` glow
  (RN's iOS `scaleOuterGlow`; the Android `AndroidGlowBackdrop` has no iOS counterpart). `hideUnit`
  kept for later reuse (Home).
- `Features/Weight/WeightChartView.swift` — Swift `Charts` line chart + `Menu` range selector +
  Start/Change/Current summary; frosted `featureCardStyle` card; placeholder under 2 entries.
- `Features/Weight/WeightInsightsView.swift` — renders `WeightStats.insights` (stat rows + status badge).
- `Features/Weight/WeightView.swift` — the screen: `DateNavBar` → `TabView(.page)` pager (scale ↔ chart)
  with custom dots → Log Weight card (`@FocusState` input, validation alert, saved pill, `upsertEntry`)
  → `WeightInsightsView`. Pre-fills + resets the count-up on date/entries change. Replaces the placeholder.
- `HealthTrackerTests/WeightStatsTests.swift` — parity suite for all of `WeightStats`.
- Icons use **SF Symbols** (`checkmark.circle.fill`, `exclamationmark.triangle.fill`, `chevron.down`,
  `forward.end`) for the RN Ionicons; no XP is granted here — weight XP stays a Phase-12 watcher concern.

### Phase 5 map (what landed where)
- `Features/Onboarding/OnboardingDraft.swift` — pure, testable form model: every wizard field +
  `canProceedStep2/5`, `isNextDisabled(step:)`, `resolvedHeight()`, `makeProfile()`,
  `makeWeightEntry()`, and the RN label/preset tables (activity, lbs/kg goals, macro presets).
- `Features/Onboarding/OnboardingComponents.swift` — shared `SegmentedToggle`, `OptionButton`,
  `FieldLabel`, `OnboardingTextField` (ports of the repeated RN `toggle`/`optionBtn`/`input` styles).
- `Features/Onboarding/WelcomeView.swift` — real welcome (port of `expo/app/welcome.tsx`): Start New
  Profile → `OnboardingView`; **Load Saved Data** via `.fileImporter` → `importBackup` +
  `setOnboardingComplete`; keeps the Design-Gallery dev link. Replaces `WelcomePlaceholderView`.
- `Features/Onboarding/OnboardingView.swift` — the 5-step wizard (port of `expo/app/onboarding.tsx`):
  progress dots, step bodies, DOB wheel sheet, macro steppers, footer Back/Next/Complete; on finish
  calls `setUnit`/`setProfile`/`setMacroPreset`/`upsertEntry`/`setActivityMode(.auto)`/`setOnboardingComplete`.
- `App/RootView.swift` — gate now routes to `WelcomeView` (was the placeholder).
- `Logic/Dates.swift` — added `nowTimestamp()` (ISO-8601 UTC w/ ms = JS `toISOString()`) for the
  starting weight entry's `createdAt`; reusable for later `loggedAt` fields.
- `HealthTrackerTests/OnboardingTests.swift` — parity checks for `OnboardingDraft`.
- Icons use **SF Symbols** (`figure.run`) for the RN Ionicons `fitness-outline`; swap if a closer glyph is wanted.

### Phase 4 map (what landed where)
- `Navigation/RootTabView.swift` — the in-app shell: 4-tab switch + `NavigationStack` (Profile/Settings
  as pushed hidden routes), floating pill overlay, More popover, stats sheet, and the Monday
  **auto weekly-recap** cover (once/session).
- `Navigation/PillTabBar.swift` — floating `.ultraThinMaterial` pill (`AppTab` enum, SF-Symbol icons);
  "More" toggles the popover instead of navigating.
- `Navigation/MoreMenu.swift` — Profile/Settings popover + tap-catcher scrim (`MoreDestination`).
- `Navigation/HeaderXpBar.swift` — frosted level pill; animates `+N xp` then springs the fill on XP
  gain; drives the stats sheet. Uses `XP.progress(forXp:)`.
- `Navigation/CollapsibleHeader.swift` — translate-up/blur header **+ `CollapsibleScreen`** container
  (scroll + `contentMargins` for header/pill clearance + `onScrollGeometryChange`).
- `Navigation/SafeAreaInsets.swift` — `topSafeInset`/`bottomSafeInset` environment values injected
  once at the shell root.
- `App/RootView.swift` — now the **onboarding gate** (`onboardingComplete` → `RootTabView`, else the
  welcome placeholder).
- `Features/Shared/DateNavBar.swift` (+ graphical `DatePicker` sheet capped at today) and
  `Features/Shared/PlaceholderCard.swift`.
- `Features/{Home,Weight,Nutrition,Activities}/*View.swift` — placeholder tab screens (data tabs host
  `DateNavBar`); `Features/{Profile,Settings}/*View.swift` — pushed placeholders (Settings keeps the
  dev Design-Gallery link); `Features/Onboarding/WelcomePlaceholderView.swift` *(replaced by `WelcomeView` in Phase 5)*;
  `Features/Gamification/StatsAchievementsPlaceholderView.swift`;
  `Features/Recap/WeeklyRecapPlaceholderView.swift` (marks `lastRecapShownWeek` on dismiss).
- `Logic/Dates.swift` — added `jsDayOfWeek` (JS `getDay()` semantics) for the Monday recap check
  (+ `DatesTests.testJsDayOfWeek`).
- Icons use **SF Symbols** as stand-ins for the RN Ionicons; swap if a closer glyph is wanted.

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
