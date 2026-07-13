# Feature & screen inventory — porting checklist

Complete inventory of the Expo app's user-facing surface. Source: `expo/app/**`,
`expo/components/**`. Use this as the parity checklist; read the referenced RN file when
implementing each screen. Data/logic details live in `data-model.md`; visuals in `design-system.md`.

## Navigation architecture (`expo/app/_layout.tsx`, `expo/app/(tabs)/_layout.tsx`)

- Provider stack: GestureHandlerRootView → SafeAreaProvider → ErrorBoundary → AppProvider →
  ToastProvider → ThemeColorSync → GamificationWatcher + RootNavigator + ToastNotification.
- Stack screens: `welcome`, `onboarding`, `(tabs)`, + 10 modals. Modals use `presentation:'modal'`
  except `weekly-recap-modal` & `leveling-tutorial-modal` (`fullScreenModal`). All modals render their own header.
- **Redirect:** `onboardingComplete` → `/(tabs)/home`; else → `/welcome`.
- **Auto weekly recap:** on open, if onboarding complete + today is **Monday** + `lastRecapShownWeek !== currentISOWeek` → push recap once/session.
- **5 tabs:** Home, Weight (`index`), Nutrition, Activities, More. Hidden routes: Profile, Settings.
- **PillTabBar** (`components/navigation/PillTabBar.tsx`): floating blurred pill; "More" press opens
  a popover (Profile/Settings) via `MoreMenuContext`, does not navigate. `more.tsx` is a stub redirect.
- **HeaderXpBar** (frosted pill, every tab header): Level N + progress + animated `+N xp`; taps → stats modal.
- **CollapsibleTabHeader** + **EdgeBlurFade**: translate-up-on-scroll header with blur edges.
- **Shared `selectedDate`** (AppContext, not persisted): every data tab has a date-nav bar
  (back / center date-picker / forward capped at today / skip-to-today).

## Onboarding
- **welcome.tsx:** Start New Profile → `/onboarding`; Load Saved Data → `loadBackup()` (doc picker) → `LOAD_DATA` with `onboardingComplete:true`.
- **onboarding.tsx:** 5 steps — (1) unit + name; (2) DOB/sex/height; (3) activity level + weight goal;
  (4) macro preset/custom or skip; (5) starting weight (50–1000 lb / 20–500 kg). Dispatches
  SET_UNIT, SET_PROFILE, SET_MACRO_PRESET, UPSERT_ENTRY, SET_ACTIVITY_MODE:'auto', SET_ONBOARDING_COMPLETE.

## Tab screens
- **Home** (`(tabs)/home.tsx`): dashboard for selectedDate — ProfileCard, Nutrition card
  (CalorieRing + WaterBottleVisual), Activity card (CalorieFlame), Weight card (DigitalScale); iOS-26 feature cards; tapping navigates.
- **Weight** (`(tabs)/index.tsx`): 2-page pager (DigitalScale / WeightChart), Log Weight card
  (validation, UPSERT_ENTRY, saved pill), WeightInsights (7-day change/rate + On Track/Behind/Ahead badge).
- **Nutrition** (`(tabs)/nutrition.tsx`): profile/weight prompts; 3-page pager (WeeklyCalorieGraph /
  CalorieRing+WaterBottle / WeeklyWaterGraph); MacroProgressBars; WaterTracker; 4 MealCategory sections.
  `calorieTarget = baseTdee + caloriesBurned`.
- **Activities** (`(tabs)/activities.tsx`): profile/weight required; auto-mode warning banner;
  2-page pager (CalorieFlame / WeeklyActivityGraph); mode-dependent input (Smart Watch = one burned
  input; Manual/Auto = collapsible Log Exercise [type pill, h+m drum pickers, live preview] + Log
  Steps); Today's Activities list with per-entry mode-mismatch warnings (dismissible).
- **Profile** (hidden, `(tabs)/profile.tsx`): ProfileCard, BadgesSection, rows → Food Library / Nutrition Goals. Param `focusActivityMode` auto-opens goals modal.
- **Settings** (hidden, `(tabs)/settings.tsx`): rows → Appearance / App Settings; FeedbackSection; version footer. Param `focusFeedback`.

## Modals (10)
- **add-food-modal** (params date, category): tabs Add Food (`AddFoodTab`: Pinned + Recent top-7 /
  search → My Foods; pin multi-category, edit `CustomFoodForm`, delete; select → `PortionSelector`),
  Add Meal (`AddMealTab`: saved meals, adds all foods as one `mealGroupId`), Quick Add (calories-only).
  Plus `FloatingPillBar`, `FavoritePillRow`, `FoodFilterModal`.
- **create-meal-modal:** hosts `CreateMealFlow` (name + food search + per-food portion → Save Meal).
- **app-settings-modal:** Weight Unit toggle; Expand sections default; Data Backup (Save Data share); Debug Info (crash log copy/clear).
- **appearance-modal:** Color Mode (`AppearanceModePicker` light/dark/system) + Accent Color (`ThemeColorPicker` 6 swatches).
- **nutrition-goals-modal:** GoalsSection (weight-goal drum + activity level [auto only]); MacroSection (preset/custom ± steppers, live grams); Daily Water Goal (auto/manual + creatine toggle).
- **weekly-recap-modal** (full-screen story): RecapWeight / RecapNutrition / RecapStreaks / RecapRating (1–5 stars). Marks `lastRecapShownWeek`.
- **food-library-modal:** Foods/Meals tabs (alphabetical), Create/edit/delete, FloatingPillBar + filters.
- **profile-modal:** avatar (PhotosPicker → copy to documents; remove); Name/DOB/Sex/Height/Activity Mode (InfoModal)/Activity Level (auto only); discard-changes guard.
- **stats-achievements-modal:** Level card (label + XP bar; Prestige at Legend); 4 streak badges (current + best); 8-achievement grid (locked/unlocked).
- **leveling-tutorial-modal** (full-screen story): TutorialXp / TutorialLevels / TutorialPrestige.

## Key shared components (custom-drawn — highest port effort)
- **CalorieRing** (`components/nutrition/CalorieRing.tsx`): SVG progress ring, proximity color, center text → SwiftUI `Circle().trim`.
- **CalorieFlame** (`components/activities/CalorieFlame.tsx`): SVG flame Path, dynamic color/glow → `Path`/`Canvas`.
- **WaterBottleVisual** (`components/nutrition/WaterBottleVisual.tsx`): shape + animated spring fill + 100% glow.
- **DigitalScale** (`components/DigitalScale.tsx`): LCD scale, `requestAnimationFrame` count-up (1500ms ease-out), primary glow → `TimelineView`/`Animatable` + `.monospacedDigit()`.
- **WeightChart** (`components/WeightChart.tsx`): chart-kit line + range picker → Swift Charts `LineMark`.
- **WeeklyIntakeGraph** (`components/nutrition/WeeklyIntakeGraph.tsx`): exports WeeklyCalorieGraph/WeeklyWaterGraph/WeeklyActivityGraph (SVG bars + goal line + tap tooltip) → Swift Charts `BarMark`+`RuleMark`.
- **PortionSelector**: dual scroll-wheel drums (whole 0–250 + eighths) → `Picker(.wheel)`.
- **MealCategory / FoodItem**: collapsible card, swipe-to-delete/save-meal, copy-yesterday, grouped saved-meals → `.swipeActions`, `List.onMove`.
- **ProfileCard / BadgesSection**, **ToastNotification**, **ErrorBoundary**, **FloatingPillBar/FavoritePillRow/FoodFilterModal**, **CustomFoodForm/CreateMealFlow/EditMealFlow**, **WeightInsights** (On Track/Behind/Ahead; tolerance 0.25 lb / 0.1 kg), **ProfilePrompt**, recap/tutorial story pages.
