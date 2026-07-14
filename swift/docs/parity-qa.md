# Phase 14 — Full Parity QA Audit

The cross-cutting QA pass for the SwiftUI rewrite. Use this as the **on-device verification
checklist** once you're back on the Mac/iPhone: it maps every user-facing surface to its RN
reference and its Swift port, lists what to check, and consolidates every "verify/tune on device"
item flagged during Phases 6–13 so nothing is lost.

Legend: ✅ ported & self-reviewed · 🎚️ needs on-device feel/tuning · ⏭️ intentionally deferred
(documented). None of the Swift code has been compiled in the cloud — expect a short build-fix loop.

---

## 1. Screen-by-screen parity checklist

### Onboarding & shell
| Surface | RN source | Swift | Verify |
|---|---|---|---|
| Welcome | `app/welcome.tsx` | `Features/Onboarding/WelcomeView` | ✅ Start New Profile / Load Saved Data / dev Gallery link |
| 5-step wizard | `app/onboarding.tsx` | `Features/Onboarding/OnboardingView` + `OnboardingDraft` | ✅ per-step gates, DOB cap, macro-sum lock, completion writes |
| Redirect gate | `app/_layout.tsx` | `App/RootView` | ✅ `onboardingComplete` → shell, else welcome |
| Pill tab bar + More | `PillTabBar.tsx` | `Navigation/PillTabBar` + `MoreMenu` | 🎚️ glass blur / hairline in light+dark, all 6 accents |
| Collapsible header + XP pill | `CollapsibleTabHeader` | `Navigation/CollapsibleHeader` + `HeaderXpBar` | 🎚️ translate/blur offset feel (`onScrollGeometryChange`) |
| Shared date-nav bar | AppContext `selectedDate` | `Features/Shared/DateNavBar` | ✅ one date drives all data tabs |

### Data tabs
| Surface | RN source | Swift | Verify |
|---|---|---|---|
| Weight | `(tabs)/index.tsx` | `Features/Weight/WeightView` | 🎚️ scale count-up ease + glow; chart range menu |
| Nutrition overview | `(tabs)/nutrition.tsx` | `Features/Nutrition/NutritionView` | ✅ 3-page pager (graph ‹ ring+bottle › water graph), macro bars |
| Nutrition meals | `MealCategory.tsx` | `MealCategoryView` + `FoodItemView` | 🎚️ `SwipeableRow` thresholds vs scroll/pager |
| Add-food flow | `add-food-modal.tsx` | `AddFoodModal` + `AddFood/Meal/QuickAdd` tabs | ✅ + **Phase 14 filter** (see §2) |
| Water | `WaterTracker.tsx` | `Features/Water/WaterTrackerView` + `WaterBottleVisual` | 🎚️ bottle spring fill, ≥100% glow |
| Activities | `(tabs)/activities.tsx` | `Features/Activities/ActivitiesView` + `CalorieFlameView` | 🎚️ flame glow + count overlay; wheel pickers |
| Home | `(tabs)/home.tsx` | `Features/Home/HomeView` + `ProfileCardView` | ✅ profile card, feature cards, recap dot |

### Profile / Settings / sub-screens
| Surface | RN source | Swift | Verify |
|---|---|---|---|
| Profile | `(tabs)/profile.tsx` | `Features/Profile/ProfileView` | ✅ card + stats/food-library/goals rows |
| Edit Profile | `profile-modal.tsx` | `Features/Profile/EditProfileView` | ✅ PhotosPicker avatar, DOB wheel, discard guard |
| Nutrition Goals | `nutrition-goals-modal.tsx` | `Features/Settings/NutritionGoalsView` | ✅ weight-goal wheel, macro custom-sum, water goal |
| Settings | `(tabs)/settings.tsx` | `Features/Settings/SettingsView` | ✅ appearance/app-settings rows, feedback, version |
| Appearance | `appearance-modal.tsx` | `Features/Settings/AppearanceView` | ✅ live recolor/appearance |
| App Settings | `app-settings-modal.tsx` | `Features/Settings/AppSettingsView` | ✅ unit, expand toggle, backup, **Debug Info crash log (Phase 14)** |
| Food Library | `food-library-modal.tsx` | `Features/Nutrition/FoodLibraryView` | ✅ + **Phase 14 filter** (see §2) |

### Gamification & recap
| Surface | RN source | Swift | Verify |
|---|---|---|---|
| XP/achievement watcher | `GamificationWatcher.tsx` | `Features/Gamification/GamificationWatcher` | ✅ silent first reconcile, then toasts; per-day guards |
| Toasts | `ToastNotification.tsx` | `Store/ToastCenter` + `Features/Shared/ToastView` | 🎚️ spring/insets |
| Stats & Achievements | `stats-achievements-modal.tsx` | `StatsAchievementsView` | ✅ level/badges/achievements, prestige |
| Leveling tutorial | `leveling-tutorial-modal.tsx` | `LevelingTutorialView` | 🎚️ tap-zone widths |
| Weekly recap | `weekly-recap-modal.tsx` | `Features/Recap/WeeklyRecapView` (+ 4 pages) | ✅ Monday auto-cover once/week, marks week shown |

---

## 2. Phase-14 additions to verify

**Food-type filter** (closes the 7c/11 deferral). RN: `FoodFilterModal` + `FavoritePillRow` +
`applyFoodFilters` in `AddFoodTab.tsx`. Swift: `FoodFilterSheet` + `FavoritePillRow` +
`FoodLibraryLogic.applyFoodTypeFilter/toggleFoodTypeFilter/hasActiveFoodTypeFilter`.
- Add-Food modal & Food Library (Foods tab) show a **filter button** (fills + tints `primary` when
  active) beside the search field, and a **Quick Filters** pill row when favorites exist.
- Tapping the button opens the filter sheet: multi-select categories (OR logic), **Clear** / **Apply**.
- **Edit** mode: *Remove* (tap a pill → confirm delete category from all foods), *Favorite* (badge
  toggles a Quick Filter, capped at 4 → "Quick Filter Limit" alert), and **+** adds a new category.
- Applied filter narrows Pinned/Recent/My-Foods (and the Library list); untyped foods drop out while
  a filter is active; empty result shows "No results found".
- 🎚️ The RN favorite-mode pills *shake* — dropped (decorative); confirm the sheet still reads clearly.

**Debug Info crash log** (closes the Phase-11 deferral). `CrashReporter` persists the last uncaught
`NSException` (message + stack + timestamp) to `Application Support/HealthTracker/crash_log.json`;
App Settings → Debug Info shows it with **Copy** / **Clear**, else "No crash log on record."
- To exercise: trigger a controlled `NSException` (or temporarily call `CrashReporter.record(...)`),
  relaunch, open App Settings → Debug Info, confirm the log renders + Copy/Clear work.

---

## 3. Consolidated on-device tuning list (🎚️)

Carried forward from each phase's checkpoint notes — the spots most likely to need a feel pass:
1. **Collapsing header** translate/blur offset (`onScrollGeometryChange` + `contentMargins`).
2. **DigitalScale** count-up cubic ease + `primary` glow (Weight & Home).
3. **Weight/Nutrition/Activities pagers** (`TabView(.page)`) dot sync + swipe vs inner wheels.
4. **SwipeableRow** drag thresholds next to the scroll view / pager (meal rows, saved-meal groups).
5. **WaterBottleVisual** spring fill + ≥100% blue glow.
6. **CalorieFlame** `FlameColor` tint + glow intensity + count overlay legibility.
7. **Toast** spring-in + safe-area insets; **tutorial/recap** left/right tap-zone widths.
8. **Wheel pickers** (portion selector, exercise duration, weight goal) sizing in sheets vs pages.
9. All of the above **in light + dark across all 6 accent colors**; water UI must stay fixed blue.

---

## 4. Intentional platform-difference deferrals (⏭️)

Documented, not bugs — each is a deliberate RN→Swift substitution or a device-interaction item that
can't be validated without a device:
- **`FloatingPillBar`** (blurred create/search/filter floating pill) → replaced by the native search
  field + filter button + toolbar `＋`. Same functions, idiomatic chrome; consistent with earlier
  native-chrome substitutions.
- **Pinned drag-reorder** of foods/meals → still deferred: a drag gesture needs on-device tuning and
  can't be validated blind. The store methods (`reorderPinnedFoods`/`reorderPinnedMeals`) are ready;
  pinned items still render in saved `pinnedOrder`.
- **ErrorBoundary fallback UI** → SwiftUI has no in-process recovery from a view-body trap, so there
  is no "Something went wrong / Try Again" screen. The durable half — a shareable Debug-Info crash
  log — is ported (§2). Remote reporting (Sentry) stays an optional future add, as in RN.
- **`AndroidGlowBackdrop`** → no iOS counterpart (iOS `.shadow` glow used throughout).

---

## 5. Regression suite (run ⌘U)

All pure logic has XCTest parity fixtures. Phase 14 adds food-type-filter cases to
`FoodLibraryLogicTests` (OR-match, untyped-exclusion, has-active, toggle). Full suite:
`Dates·Calculation·Streak·WeeklyRating·GamificationLogic` (Phase 3), `BackupCodec·CustomFoodMigration·
AppStore` (Phase 2), `Onboarding·WeightStats·NutritionStats·PortionMath·FoodLibraryLogic·WaterStats·
ActivityStats·HomeStats·ProfileEditLogic·SettingsLogic·GamificationStats·RecapStats` (Phases 5–13).
Green ⌘U + a walk through §1–§2 on device = Phase 14 sign-off, and the gate into Phase 15 (HealthKit).
