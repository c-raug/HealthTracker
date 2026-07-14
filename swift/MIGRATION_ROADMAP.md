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
- [x] **Phase 7** — Nutrition — three on-device checkpoints (core complete; polish deferred):
  - [x] **7a** — overview (profile/weight prompts, calorie pager + ring, macro bars)
  - [x] **7b** — meals & food rows (collapsible meal cards, food items, portion selector)
  - [x] **7c** — add-food flow (3-tab add modal, custom-food form, saved meals, create-meal)
    *(deferred polish: pinned drag-reorder, food-type filter modal, EditMealFlow, standalone Food
    Library screen — tracked for a 7c follow-up / Phase 11 Profile)*
- [x] **Phase 8** — Water tracking (bottle visual, water tracker card, 7-day water graph)
- [x] **Phase 9** — Activity tracking (burn flame, 7-day activity graph, exercise/steps/smartwatch logging)
- [x] **Phase 10** — Home dashboard (profile card + nutrition/activity/weight summary cards)
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

## Phase 7 plan (Nutrition — the largest phase)
Ported in three self-contained checkpoints so each can be built & verified on device independently.
The **water** parts of the Nutrition screen (bottle visual, water tracker, 7-day water graph) belong
to **Phase 8** and are honest placeholders until then; the pure calorie/macro math is shared now.
- **7a — overview:** `NutritionView` rebuild — profile/weight prompts, the calorie **pager** (7-day
  calorie graph ↔ calorie ring), and the **macro bars**. Pure `Logic/NutritionStats.swift` holds the
  consumed totals, TDEE-base + mode-aware burn, `calorieTarget`, macro targets, and the weekly series.
- **7b — meals & food rows:** the four collapsible **meal category** cards (add pill, copy-yesterday,
  swipe→save-as-meal, grouped saved meals) + **food rows** (swipe-delete, tap→edit portion / quick-edit)
  + the **portion selector** wheels. Wires `addFoodToMeal`/`deleteFoodFromMeal`/`updateFoodInMeal`.
- **7c — add-food / library:** the 3-tab **Add** modal (Add Food · Add Meal · Quick Add), the
  **custom-food form**, **create/edit-meal** flows, the **Food Library** screen, and the food-type
  **filter** + pinned/recent ordering. Pure logic for recent-food ranking / search / pinning.

**Phase 7a →** The **Nutrition** tab is now real for the overview (replaces the Phase-4 placeholder).
Complete onboarding (or Load Saved Data with real nutrition history) and open the Nutrition tab:
- Missing profile → **"Set Up Your Profile"** prompt (Go to Settings pushes the real Settings screen);
  profile but no weight entry → the **log-a-weight** prompt. Both block the rest of the screen.
- With profile + weight: a **2-page pager** (swipe + page dots) — **page 0** the **7-day calorie graph**
  (Swift `Charts` bars, proximity-colored, dashed activity-adjusted goal line); **page 1** (default) the
  **calorie ring** (consumed / target, proximity color, "N remaining/over"), plus a **"+N cal from
  exercise/smart watch"** note when the day has burn. **Macro bars** (protein/carbs/fat, fixed colors,
  grams vs target) sit below.
- The **Water Tracker** and per-**Meals** sections are marked **Coming in Phase 8 / Phase 7b**.
- `calorieTarget = baseTdee + todayBurned` (manual = non-smartwatch burn, smartwatch = smartwatch burn,
  auto = 0). Correct in light/dark + all 6 accents; collapsing header + XP pill still behave.
Then run the unit tests (⌘U): the new suite is `NutritionStatsTests` (consumed totals, macro targets,
latest-weight, TDEE-base, mode-aware burn, weekly series + adjusted goal); all existing suites pass.

### Phase 7a map (what landed where)
- `Logic/NutritionStats.swift` — the pure core: `consumedCalories`/`consumedMacros`, `macroTargets`
  (`round(pct/100·cal/calPerGram)`), `latestWeight`, `resolvedAge`, `baseTdee` (delegates to `TDEE`),
  mode-aware `caloriesBurned`, `last7Days`, `weeklyCalorieSeries`, `adjustedCalorieGoal`. Ports the
  inline math in `expo/app/(tabs)/nutrition.tsx` + `MacroProgressBars.tsx`.
- `Features/Nutrition/NutritionView.swift` — the screen: `DateNavBar` → prompts **or** pager
  (calorie graph ↔ ring) → macro bars → water/meals placeholders. Replaces the Phase-4 placeholder.
- `Features/Nutrition/CalorieRingView.swift` — trimmed-`Circle` ring (port of `CalorieRing.tsx`).
- `Features/Nutrition/MacroProgressBarsView.swift` — the Macros card (port of `MacroProgressBars.tsx`).
- `Features/Nutrition/ProfilePromptView.swift` — the set-up prompt; its button is a
  `NavigationLink(value: MoreDestination.settings)` resolving against the shell's registered
  destination (no shell change). Port of `ProfilePrompt.tsx`.
- `Features/Shared/WeeklyBarChart.swift` — reusable 7-day bar chart (bars + dashed goal line) with a
  `Coloring` (`.proximity` for calories now; `.fixed` for water Phase 8 / activity Phase 9). Swift
  `Charts` port of `BarChart`/`WeeklyCalorieGraph` in `WeeklyIntakeGraph.tsx`.
- `HealthTrackerTests/NutritionStatsTests.swift` — parity suite for all of `NutritionStats`.
- Water widgets (`WaterBottleVisual`, `WaterTracker`, `WeeklyWaterGraph`) intentionally deferred to
  Phase 8; the pager keeps the ring at index 1 so Phase 8 can append the water graph as page 2.

**Phase 7b →** The Nutrition tab now shows the four **meal-category cards** below the macro bars
(replaces the Phase-7a "Meals" placeholder). Import a backup with nutrition history (or wait for 7c to
add foods) and verify:
- Each card (**Breakfast/Lunch/Dinner/Snacks**) is **collapsible** (chevron header; defaults to
  collapsed unless "Expand sections by default" is on, and re-collapses on tab-leave when that's off).
  The header shows `(count) · N cal` when non-empty, a **copy-yesterday** button, and a **+ Add** pill.
- **Swipe a header left** → a blue **save-as-meal** action (confirms, then opens the Create-Meal
  placeholder — real flow in 7c). **+ Add** opens the Add-Food placeholder (real flow in 7c).
- **Copy-yesterday** copies that category's foods from the previous day (fresh IDs) after a confirm,
  or says "Nothing to Copy" when yesterday is empty.
- **Food rows**: bullet · name (italic + "Quick" badge for quick-adds) · serving detail · `N cal`.
  **Swipe left → Delete.** **Tap** → an edit sheet: quick-adds get a calories/name form; normal foods
  get the **portion selector** (two wheels — whole + eighth fraction — with a live cal/macro preview),
  and **Update Portion** rescales the stored values.
- **Saved-meal groups** (foods sharing a `mealGroupId`) render as their own collapsible sub-header
  (`name · N cal`); **swipe left → remove** the whole group (confirms).
- Correct in light/dark + all 6 accents. *(Swipe uses a custom `SwipeableRow` drag — like the Phase 6
  count-up, flag it if the gesture feels grabby next to the scroll/pager and we'll tune the thresholds.)*
Then run the unit tests (⌘U): the new suite is `PortionMathTests` (decompose/compose, scale + preview,
serving labels, per-serving base + row rescale); all existing suites pass.

**Phase 7c →** Logging food end-to-end now works. From any meal card tap **+ Add** and verify the
**Add-Food modal** (three-tab segmented switcher, title "Add to {Category}"):
- **Add Food** — a searchable custom-food list: **Pinned** (for this category) + **Recent** (top-7 by
  how often logged) when idle; **Pinned** + **My Foods** when searching. Each row → **pin** (choose
  categories), **edit** (opens the custom-food form), **delete**. **Tap a row** → the **portion
  selector** (wheels + preview) → **Add to {Category}** logs the scaled food and closes the modal.
  **Create Custom Food** opens the form (Required/Optional tabs, auto-computed calories with Override,
  food-type chips); saving jumps straight to that food's portion step.
- **Add Meal** — a searchable saved-meal list (Pinned + All Meals); **tap** logs every food in the
  meal under one group (appears as a collapsible saved-meal group on the Nutrition tab). Pin / delete /
  **Create Meal** (name + food search + per-food portion → Save Meal) supported.
- **Quick Add** — name (optional) + calories → logs a `quickAdd` food.
- Swiping a meal header's **save-as-meal** now opens the real **Create-Meal** flow seeded with that
  category's foods. Correct in light/dark + all 6 accents.
Then run the unit tests (⌘U): the new suite is `FoodLibraryLogicTests` (frequency map, search, pinned
sort, recent top-7, custom→logged scaling, meal-group explode, auto-calories, serving parse); all
existing suites pass.
*(Deferred from the RN original, tracked for a follow-up: pinned **drag-reorder**, the food-type
**filter** modal + favorite pills, **EditMealFlow** (editing a saved meal), and the standalone **Food
Library** management screen — which Phase 11's Profile will surface. The core log-food loop is complete.)*

**Phase 8 →** The Nutrition tab's three **water placeholders are now real widgets** (the Phase-7a
"Water Tracker" placeholder and the pager's missing bottle/graph). Complete onboarding (or Load Saved
Data), open the Nutrition tab, and verify:
- The center pager page (**page 1**, default) now shows the **calorie ring + water bottle side by
  side**. The bottle fills (spring-animated) to today's `consumed / goal` fraction, shows the percent
  inside, a **`consumed/goal oz|mL`** caption below, and a **blue glow at ≥100%**. The pager is now
  **3 pages** (graph ‹ ring+bottle › **water graph**) with **3 dots**; **page 2** is the 7-day water
  bar graph (fixed water-blue bars + dashed goal line), reusing `WeeklyBarChart`.
- **Tapping the bottle** expands the **Water** card below the macro bars. The card (collapsed by
  default, with a **+{middle preset} oz|mL** quick-add pill in the header when collapsed) has **three
  gradient preset buttons** (tap to add that amount; **long-press to edit** the amount inline — blank/
  invalid resets to the unit default), a **custom-amount** field + **Add**, and a **grouped entry
  list** (one row per amount with an **Nx** badge): the **trash** icon removes the most-recently-logged
  entry of that amount, **Clear** removes all of that amount after a confirm.
- The **goal** resolves manual-override-first, else auto from latest weight × activity level (the
  ported `WaterGoal` formula; ×1.2 for Active/Very Active, optional creatine bump). Amounts are in the
  user's unit (**oz** for lbs, **mL** for kg). Water UI is fixed **blue** in light/dark + all 6 accents.
Then run the unit tests (⌘U): the new suite is `WaterStatsTests` (preset defaults/override, goal
resolution, entry grouping + most-recent-id, weekly series, bottle fill/percent, custom-amount + save-
preset input rules); all existing suites pass. *(No XP is granted on logging water — water-goal XP
stays a Phase-12 gamification-watcher concern, consistent with weight/food.)*

**Phase 9 →** The **Activities** tab is now real (replaces the Phase-4 placeholder). Complete onboarding
(or Load Saved Data), open the Activities tab, and verify:
- Missing profile **or** no weight entry → the **Set-Up prompt** ("Set up your profile and log a weight
  entry…", Go to Settings pushes the real Settings screen) blocks the rest of the screen.
- With profile + weight: the shared **date-nav bar** drives `store.selectedDate`. In **Auto** mode a red
  **reference-only warning** banner shows (activities here don't affect the calorie target). A **2-page
  pager** (swipe + 2 dots) — **page 0** the **burn flame** (`flame.fill` tinted by the `FlameColor`
  0…600 ramp with a burn-scaled glow, today's total-burned count + `cal`/`kcal` overlaid); **page 1** the
  **7-day activity bar graph** (accent-colored bars, no goal line), reusing `WeeklyBarChart`.
- **Manual / Auto** modes show two collapsible cards (default per "Expand sections by default",
  re-collapse on tab-leave when off): **Log Exercise** (Weight-Lifting pill + Hours 0–5 / Minutes 0–59
  **wheel pickers** → `~N cal burned` preview → **Add Exercise**, disabled at 0 duration; resets to 0h/30m
  after adding) and **Log Steps** (numeric field → preview → **Add Steps**, disabled when ≤ 0). Below,
  **Today's Activities** lists each entry (label · detail · `N cal` · trash-delete); a row logged under a
  different mode shows a dismissible **mode-mismatch warning** row.
- **Smart Watch** mode replaces both logging cards + the list with a single **Calories Burned** field
  (pre-filled from the day's existing smartwatch entry; **Save** disabled when empty/unparseable/unchanged;
  saving overwrites the one-per-day smartwatch entry, or removes it when 0, and shows an "Entry saved"
  pill for 3s). Correct in light/dark + all 6 accents; collapsing header + XP pill still behave.
Then run the unit tests (⌘U): the new suite is `ActivityStatsTests` (jsParseInt, total-burned +
weekly series, exercise/steps previews, the smartwatch save-disabled gate, duration/label/detail
formatting, mode-mismatch warning); all existing suites pass. *(The pager uses `TabView(.page)` like
Weight/Nutrition; the flame is an SF-Symbol adaptation of RN's SVG fire path — flag if the glow or the
count overlay wants tuning on device. No XP is granted here — activity XP stays a Phase-12 concern.)*

**Phase 10 →** The **Home** tab is now real (replaces the Phase-4 placeholder). Complete onboarding
(or Load Saved Data), open the Home tab, and verify:
- The shared **date-nav bar** at the top drives `store.selectedDate` (shared with the other tabs) —
  changing the date here reflects on Weight/Nutrition/Activities and vice-versa.
- The **Profile card**: an accent-ringed **avatar** (photo if set → initials from the name → a person
  icon), the profile **name** (or "Your Profile"), and the gamified **level label** (`⭐ Level N ·
  Title`, prefixed `⭐ P{n} ·` at prestige > 0). A small **red dot** on the avatar when this ISO week's
  recap is unseen. **Tap the avatar** → the weekly-recap cover; **tap the name/chevron** → the Edit
  Profile screen (pushed; Phase-11 placeholder for now).
- The full-width **Nutrition** card: the **calorie ring** (consumed / `baseTdee + burn` target,
  proximity-colored) beside the spring-filled **water bottle**. **Tap anywhere** → the Nutrition tab.
- The bottom row of two half-width cards: **Activity** (the burn **flame** tinted by today's total
  burned) → the Activities tab, and **Weight** (the **digital scale** LCD showing the latest weight at
  or before the viewed date, unit hidden, or a dimmed placeholder) → the Weight tab.
- Home is **not** gated on a complete profile (matching RN): with no profile/weight the target is 0,
  the flame reads 0, and the scale shows its placeholder — the cards still render. Correct in
  light/dark + all 6 accents; the collapsing header + XP pill still behave.
Then run the unit tests (⌘U): the new suite is `HomeStatsTests` (initials, prestige/level label,
latest-entry-on-or-before-date, recap badge); all existing suites pass. *(The RN `EdgeBlurFade`
top/bottom overlays have no separate port — the shared `CollapsibleScreen` already frosts the header
region; flag if the bottom pill edge wants a fade on device.)*

### Phase 10 map (what landed where)
- `Logic/HomeStats.swift` — the small pure core: `initials(from:)` (ProfileCard first/last-initial
  rule), `levelLabel(prestige:totalXp:)` (⭐ / prestige prefix over `XP.levelLabel`), `latestEntry
  (onOrBefore:in:)` (the scale value for the viewed date), and `showRecapBadge(...)`.
- `Features/Home/ProfileCardView.swift` — the summary card (port of `profile/ProfileCard.tsx`):
  avatar ring (photo/initials/person) + recap dot, name, level label, chevron; avatar → recap,
  name/chevron → profile (closures from the shell). Includes `AvatarImage` (best-effort `data:`/file
  URI loader; real photo-picking is Phase 11).
- `Features/Home/HomeView.swift` — the dashboard (replaces the Phase-4 placeholder): `DateNavBar` →
  `ProfileCardView` → full-width Nutrition feature card (`CalorieRingView` + `WaterBottleVisual`) →
  half-width Activity (`CalorieFlameView`) + Weight (`DigitalScaleView`, `hideUnit`) cards, each
  tapping through to its tab. Reuses `NutritionStats`/`WaterStats`/`ActivityStats` verbatim for the
  numbers — no new derived math beyond `HomeStats`.
- `Navigation/RootTabView.swift` — feeds `HomeView` the `onSelectTab` (switch primary tab),
  `onOpenProfile` (`navPath.append(.profile)`), and `onOpenRecap` (present the recap cover) closures.
- `HealthTrackerTests/HomeStatsTests.swift` — parity suite for `HomeStats`.
- Reuses the shared `featureCardStyle` (Design layer) for all four cards; the RN nested-touchable
  quirk (bottle tap = no-op on Home) is intentionally simplified so the whole Nutrition card is tappable.

### Phase 9 map (what landed where)
- `Logic/ActivityStats.swift` — the pure core ported from the inline math in
  `expo/app/(tabs)/activities.tsx`: `jsParseInt` (JS `parseInt` parity), `totalBurned` (mode-independent
  day sum, distinct from `NutritionStats.caloriesBurned`), `weeklyActivitySeries` (reuses
  `NutritionStats.DayPoint`, `goal = 0`), `exercisePreview`/`stepsPreview` (wrap `ActivityCalories`),
  `smartwatchEntry` + `smartwatchSaveDisabled`, `formatDuration`, `label`/`detail`, `modeLabel`,
  `showWarning`, `groupedNumber`.
- `Features/Activities/CalorieFlameView.swift` — the burn flame (port of `CalorieFlame.tsx`): `flame.fill`
  SF Symbol tinted by `FlameColor.color(forBurn:)` with a `FlameColor.glowIntensity`-scaled `.shadow`
  glow, the grouped burn count + `cal`/`kcal` unit overlaid over the flame body.
- `Features/Activities/ActivitiesView.swift` — the screen (replaces the Phase-4 placeholder): prompt vs
  content gate, auto-mode warning, the flame ↔ weekly-graph pager, the mode-specific logging
  (smartwatch card **or** Log-Exercise wheels + Log-Steps), and the Today's-Activities list with the
  per-row mode-mismatch warning. Writes via `store.addActivity` / `deleteActivity` /
  `dismissActivityWarning` (the store stamps `loggedWithMode` at add-time).
- `HealthTrackerTests/ActivityStatsTests.swift` — parity suite for `ActivityStats`.
- Reuses the already-ported `Logic/ActivityCalories.swift` (Phase 3), `Design/FlameColor.swift` (Phase 1),
  and the shared `Features/Shared/WeeklyBarChart.swift` (Phase 7a). The RN custom duration "drums" become
  native `Picker(.wheel)`s (as with the portion selector); the RN `AndroidGlowBackdrop` has no iOS
  counterpart (an iOS `.shadow` glow is used, as in Phases 6/8).

### Phase 8 map (what landed where)
- `Logic/WaterStats.swift` — the pure core: `resolveGoal` (manual/legacy-override vs auto
  `WaterGoal.calculate`, ported from the `waterGoalValue` IIFE in `nutrition.tsx`), `presets`/
  `defaultPresets`/`unitLabel`, `consumed`, `grouped` + `mostRecentId` (remove-one target),
  `weeklyWaterSeries` (reuses `NutritionStats.DayPoint`), `rawFraction`/`fillFraction`/`pctDisplay`
  (bottle), and the `parseCustomAmount`/`savePreset` input rules. Ports `WaterBottleVisual.tsx` +
  `WaterTracker.tsx` numbers.
- `Features/Water/WaterBottleVisual.swift` — cap/neck/body bottle, spring-animated fill, centered
  percent, `consumed/goal` caption, ≥100% blue glow, tap-to-expand (port of `WaterBottleVisual.tsx`).
- `Features/Water/WaterTrackerView.swift` — the collapsible **Water** card: header (chevron +
  collapsed quick-add pill), three gradient preset buttons (long-press → inline edit), custom-amount
  field + Add, and the grouped entry list (trash = remove-one, Clear = confirm-remove-all). Writes via
  `store.addWaterEntry`/`deleteWaterEntry`/`setWaterPresets`. Port of `WaterTracker.tsx`.
- `Features/Nutrition/NutritionView.swift` — page 1 is now the **ring + bottle** row; page 2 appends
  the water graph via the shared `WeeklyBarChart(coloring: .fixed(FixedColors.water))`; the dot count
  is now 3; the bottle's tap bumps a `waterExpandKey` that expands the tracker (the 7a `PlaceholderCard`
  is gone).
- `HealthTrackerTests/WaterStatsTests.swift` — parity suite for `WaterStats`.
- Water color is the fixed `FixedColors.water`/`waterLight`/`waterGlow` (already in the Design layer);
  the RN Android glow backdrop has no iOS counterpart (an iOS `.shadow` glow is used, as in Phase 6).

### Phase 7c map (what landed where)
- `Logic/FoodLibraryLogic.swift` — pure ranking/scaling/search: `frequencyMap`, `matches`, `pinned`,
  `recent`, `unpinned`, `toNutritionItem`, `logged` (portion scale + fresh id), saved-meal helpers
  (`pinnedMeals`/`otherMeals`/`mealCalories`/`mealGroupFoods`), and form helpers (`autoCalories`,
  `parseServingSize`, `caloriesAreManual`).
- `Features/Nutrition/AddFoodModal.swift` — the 3-tab sheet host (port of `add-food-modal.tsx`).
- `Features/Nutrition/AddFoodTabView.swift` — custom-food list + portion step + create/edit
  (port of `AddFoodTab.tsx`).
- `Features/Nutrition/AddMealTabView.swift` — saved-meal list + add-group + create (port of `AddMealTab.tsx`).
- `Features/Nutrition/QuickAddTabView.swift` — calories-only add (port of `QuickAddTab.tsx`).
- `Features/Nutrition/CustomFoodFormView.swift` — Required/Optional custom-food form (port of `CustomFoodForm.tsx`).
- `Features/Nutrition/CreateMealFlowView.swift` — build+save a meal (port of `CreateMealFlow.tsx`);
  also the target of the 7b save-as-meal swipe.
- `Features/Nutrition/PinCategoriesSheet.swift` — shared "pin to categories" sheet.
- `Features/Nutrition/NutritionView.swift` — now presents the real `AddFoodModal` / `CreateMealFlowView`
  (the 7b placeholder sheets are gone).
- `HealthTrackerTests/FoodLibraryLogicTests.swift` — parity suite for `FoodLibraryLogic`.

### Phase 7b map (what landed where)
- `Logic/PortionMath.swift` — pure portion math: `decompose`/`compose` (whole + eighth), `scale`,
  `preview` (cal Int + 1-dp macros), `servingCountLabel`/`totalDisplay`, `perServingBase`, and
  `rescale` (row re-portion). Ports `PortionSelector.tsx` numbers + `FoodItem.tsx` scaling.
- `Features/Nutrition/PortionSelectorView.swift` — the two wheel `Picker(.wheel)`s + live preview
  (rn-to-swift map's replacement for the RN scroll drums).
- `Features/Nutrition/FoodItemView.swift` — the food row (swipe-delete, tap→edit portion / quick-edit),
  writing via `store.updateFoodInMeal` / `deleteFoodFromMeal`.
- `Features/Nutrition/MealCategoryView.swift` — the collapsible category card (header swipe→save-as-meal,
  copy-yesterday, empty state, ungrouped rows, saved-meal groups w/ swipe→remove) + the `MealGroup`
  splitter. `+ Add` / save-as-meal are surfaced as closures the parent presents.
- `Features/Shared/SwipeableRow.swift` — reusable left-swipe-to-reveal-one-action row (RN `Swipeable`
  stand-in for content outside a `List`). Content paints opaque so the action hides until swiped.
- `Features/Nutrition/NutritionView.swift` — renders the four `MealCategoryView`s and owns the
  Add-Food / Create-Meal sheet presentation (placeholders until 7c).
- `HealthTrackerTests/PortionMathTests.swift` — parity suite for `PortionMath`.

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
