# HealthTracker — Claude Code Reference

## Commands

- `npm start` — launch Metro (dev server, shows QR code)
- `npm run tunnel` — start with ngrok tunnel (for Codespaces or different-network devices)
- `npm run ios` / `npm run android` / `npm run web` — native builds

No test runner or lint script exists in package.json.

## Architecture

- **Runtime**: Expo SDK 54, React Native 0.81.5
- **Navigation**: Expo Router v6 (file-based tabs)
  - 5 tabs in the bottom bar: Home (`app/(tabs)/home.tsx`), Weight (`app/(tabs)/index.tsx`), Nutrition (`app/(tabs)/nutrition.tsx`), Activities (`app/(tabs)/activities.tsx`), and **More** (`app/(tabs)/more.tsx`) — the "…" (`ellipsis-horizontal`) tab on the far right. Both Profile (`app/(tabs)/profile.tsx`) and Settings (`app/(tabs)/settings.tsx`) are hidden tab routes (`href: null`) — both are accessed by tapping the "…" tab which opens `MoreMenuPopover` (anchored popover above the pill tab bar with Profile and Settings rows). The tab bar is rendered by `PillTabBar` (`components/navigation/PillTabBar.tsx`), a custom floating pill tab bar; the "…" tab press is intercepted in `PillTabBar` via `toggle()` from `MoreMenuContext` — `more.tsx` is a redirect stub that is never actually visited.
  - 10 modal routes: `app/add-food-modal.tsx` (full-screen modal with 3 tabs: "Add Food", "Add Meal", "Quick Add"), `app/create-meal-modal.tsx` (pre-populated CreateMealFlow for saving a meal category), `app/app-settings-modal.tsx` (App Settings sub-screen with Weight Unit, Expand sections toggle, Data Backup, Debug Info), `app/appearance-modal.tsx` (Appearance sub-screen with AppearanceModePicker + ThemeColorPicker), `app/nutrition-goals-modal.tsx` (Nutrition Goals sub-screen with GoalsSection, MacroSection, Daily Water Goal), `app/weekly-recap-modal.tsx` (full-screen story-style weekly recap with 4 pages: Weight, Nutrition, Streaks & Milestones, Week Rating), `app/food-library-modal.tsx` (Food Library sub-screen with Foods tab (alphabetical list + create/edit/delete) and Meals tab (alphabetical list + create/edit/delete)), `app/profile-modal.tsx` (Edit Profile sub-screen with avatar section at top (120px avatar + Edit button + action sheet for Choose Photo / Remove Photo), then Name, DOB, Sex, Height, Activity Tracking Mode, Activity Level fields — no Cancel button, Save disabled when unchanged, back chevron shows discard-changes alert), `app/stats-achievements-modal.tsx` (Stats & Achievements sub-screen with Level, Badges, and Achievements sections), `app/leveling-tutorial-modal.tsx` (full-screen story-style tutorial with 3 pages: How to Earn XP, The Levels, Prestige)
- **State**: React Context + useReducer in `context/AppContext.tsx`; access via `useApp()`
- **Persistence**: auto-saves on every state change to AsyncStorage; also writes a silent debounced auto-backup to `FileSystem.documentDirectory` via `writeAutoBackup()` in `storage/backupStorage.ts`
- **Actions**: `LOAD_DATA`, `UPSERT_ENTRY`, `DELETE_ENTRY`, `SET_UNIT`, `SET_PROFILE`, `SET_MACRO_PRESET`, `ADD_FOOD_TO_MEAL`, `DELETE_FOOD_FROM_MEAL`, `UPDATE_FOOD_IN_MEAL`, `ADD_CUSTOM_FOOD`, `UPDATE_CUSTOM_FOOD`, `DELETE_CUSTOM_FOOD`, `ADD_SAVED_MEAL`, `UPDATE_SAVED_MEAL`, `DELETE_SAVED_MEAL`, `ADD_ACTIVITY`, `DELETE_ACTIVITY`, `DISMISS_ACTIVITY_WARNING`, `SET_ACTIVITY_MODE`, `SET_ONBOARDING_COMPLETE`, `SET_THEME_COLOR`, `ADD_WATER_ENTRY`, `DELETE_WATER_ENTRY`, `SET_WATER_GOAL_OVERRIDE`, `SET_WATER_GOAL_MODE`, `SET_WATER_CREATINE`, `SET_WATER_PRESETS`, `SET_SELECTED_DATE`, `SET_SECTIONS_EXPANDED`, `REORDER_PINNED_FOODS`, `REORDER_PINNED_MEALS`, `REORDER_MEAL_FOODS`, `SET_APPEARANCE_MODE`, `SET_AVATAR`, `UNLOCK_ACHIEVEMENT`, `ADD_XP`, `PRESTIGE`, `SET_LAST_RECAP_WEEK`, `SET_FOOD_TYPE_CATEGORIES`, `SET_FAVORITE_FILTER_TYPES`
- **Shared date state**: `selectedDate: string` in AppContext (initialized to `getToday()`, never persisted). All data tabs (Home, Weight, Nutrition, Activities) read from and write to `selectedDate` via `useApp()` and `dispatch({ type: 'SET_SELECTED_DATE', date })` — changing date on one tab instantly reflects on all others. Resets to today on app restart (not persisted to AsyncStorage).
- **Default tab**: `RootNavigator` in `app/_layout.tsx` always routes to `/(tabs)/home` after onboarding completes. There is no user-selectable default tab preference — `preferences.defaultTab` and the `SET_DEFAULT_TAB` action have been removed.
- **Activity state**: `activityLog: DayActivity[]` — one record per date, each with `activities: ActivityEntry[]`
- **Water state**: `waterLog: DayWater[]` — one record per date, each with `entries: WaterEntry[]`. Amounts stored in the user's current unit (oz if lbs, mL if kg). `WaterEntry` includes optional `loggedAt?: string` (ISO timestamp) set at dispatch time via `new Date().toISOString()`.
- **Units**: stored per-entry; display conversion done at render time via `convertWeight()`
- **TDEE**: Mifflin-St Jeor equation in `utils/tdeeCalculation.ts`; requires user profile + latest weight entry
- **Food Search**: In `AddFoodTab`, `CreateMealFlow`, and `EditMealFlow`, when no search query is active the list shows **Pinned** + **Recent** (top 7 non-pinned custom foods by logging frequency, computed from `nutritionLog` on the fly). When a search query is typed, all matching custom foods are shown (Pinned + My Foods). No external API. `AddFoodTab` and Food Library modal also support **category filtering** via `FoodFilterModal` (food type multi-select OR logic).

## UI Style Guide

**IMPORTANT:** Before making ANY UI changes (colors, sizing, spacing, typography, shadows, buttons, icons, or component styling), you MUST read and follow `.claude/documentation/style_guide.md`. This guide documents every design token, component pattern, and fixed color rule in the app. Deviating from it will introduce visual inconsistencies.

Key rules:
- Always use `useColors()` + `makeStyles(colors)` — never hardcode colors or use `StyleSheet.create()` at module level
- Always use `Spacing`, `Typography`, `Radius` tokens — never hardcode pixel values for spacing, font sizes, or border radii
- Water UI is always fixed blue `#2196F3` — never `colors.primary`
- Calorie indicators use `ringColorForProximity()` — never hardcode
- Macro colors are fixed: Protein `#3B82F6`, Carbs `#F59E0B`, Fat `#EF4444`
- Standard content cards use the standard shadow (see style guide Section 7); Home screen feature cards (Profile, Nutrition, Activity, Weight) use the iOS 26 shadow + `LinearGradient` pattern (see style guide Section 15)
- All collapsible sections default to collapsed (`useState(true)`)

## Key Patterns

- **Design tokens**: always import from `constants/theme.ts` (`Colors`, `Typography`, `Spacing`, `Radius`)
- **Date strings**: always `"YYYY-MM-DD"` (local timezone via `getToday()`); never use `new Date().toISOString()` for dates. `utils/dateUtils.ts` also exports `getISOWeekString(dateStr)` → ISO week string (e.g. `"2026-W15"`) and `getISOWeekMonday(dateStr)` → `"YYYY-MM-DD"` of the Monday starting that ISO week — used by the weekly recap feature.
- **TypeScript path alias**: `@/*` → project root
- **ID generation**: use `generateId()` from `utils/generateId.ts` (shared UUID v4 generator)
- **Styles**: use `makeStyles(colors)` pattern with `useColors()` for dark mode support
- **Dynamic accent color**: `useColors()` in `constants/theme.ts` reads from `ThemeContext` (provided by `ThemeColorSync` in `app/_layout.tsx`) to override `primary` and `primaryLight` with the user's chosen accent. `ACCENT_PRESETS` (exported from `constants/theme.ts`) defines 6 color options with light/dark `primaryLight` variants. `preferences.themeColor` stores the hex value; dispatching `SET_THEME_COLOR` updates it. All components using `useColors()` automatically pick up accent changes — no further changes needed in individual components.
- **Appearance mode**: `ThemeContext` also carries `appearanceMode?: 'light' | 'dark' | 'system'` (bridged by `ThemeColorSync` from `preferences.appearanceMode`). `useColors()` uses this to override the OS color scheme — `'light'` forces light colors, `'dark'` forces dark colors, `'system'` (default) follows the device. Stored in `preferences.appearanceMode`; dispatching `SET_APPEARANCE_MODE` updates it. `AppearanceModePicker` (`components/settings/AppearanceModePicker.tsx`) renders three option cards (sun/moon/phone icons) inside the App Configuration collapsible in Settings. **iOS date pickers**: whenever an iOS `DateTimePicker` (display `"spinner"`) is rendered, pass `themeVariant={resolvedScheme}` where `resolvedScheme` is computed as `preferences.appearanceMode === 'light' ? 'light' : preferences.appearanceMode === 'dark' ? 'dark' : (useColorScheme() ?? 'light')` — this prevents invisible text when the app appearance conflicts with the device appearance mode.
- **Collapsible sections**: use `useState(!(preferences.sectionsExpanded ?? false))` in `MealCategory` (respects user preference) or `useState(true)` elsewhere (default collapsed) + `TouchableOpacity` header + `Ionicons` chevron-down/chevron-forward + conditional render `{!collapsed && <Content />}`. See `components/nutrition/MealCategory.tsx` for the canonical pattern. **Reset on tab leave**: `MealCategory` and the Log Exercise / Log Steps sections on `activities.tsx` use `useFocusEffect` with a cleanup return to reset collapsed state to `true` on blur, only when `preferences.sectionsExpanded` is falsy — this ensures sections collapse when navigating away if "Expand sections by default" is OFF.
- **Copy meal from previous day**: `MealCategory` header includes a copy icon (`copy-outline`); tapping copies from the immediately preceding day (date − 1 day). Shows a confirmation `Alert.alert()` — "Copy [Category] from yesterday? This will add X foods to your log." with Copy/Cancel. On confirm, dispatches individual `ADD_FOOD_TO_MEAL` actions with fresh IDs via `generateId()`. If previous day has no foods in that category, shows "Nothing to Copy" alert. No date picker — source is always yesterday relative to the currently viewed date.
- **Water goal calculation**: `utils/waterCalculation.ts` — `calculateWaterGoal(weightValue, weightUnit, activityLevel, creatine?)` returns daily oz (imperial) or mL (metric) target; ×1.2 multiplier for Active/Very Active users; optional `creatine` flag adds +16 oz / +500 mL. Goal mode stored in `preferences.waterGoalMode` (`'auto' | 'manual'`); manual override in `preferences.waterGoalOverride`. Creatine flag in `preferences.waterCreatineAdjustment`. Backward compat: if `waterGoalMode` is unset and `waterGoalOverride` exists, defaults to `'manual'`. Default quick-add amount is always `waterPresets[1]` (middle preset); no stored preference needed.
- **Calorie proximity colors**: `utils/calorieColor.ts` exports `ringColorForProximity(consumed, target, fallback)` — returns a hex color based on `|consumed − target|`: ≤25 → dark green `#2E7D32`, ≤50 → green `#4CAF50`, ≤100 → yellow `#FFC107`, ≤200 → orange `#FF9800`, >200 → red `#F44336`. Falls back to `fallback` when `target ≤ 0`. Used by `CalorieRing` and `WeeklyIntakeGraph`.
- **Flame color interpolation**: `utils/flameColor.ts` exports `flameColorForBurn(calories: number): string` (6-stop lerp: yellow `#FFC107` → orange `#FF9800` → red `#F44336` → blue `#3B82F6` → purple `#9C27B0` → green `#4CAF50` at stops 0/120/240/360/480/600; clamped, channel-wise lerp) and `glowIntensityForBurn(calories: number): number` (`Math.min(Math.max(cals, 0), 600) / 600`). Used exclusively by `CalorieFlame`.
- **Water fixed color**: Water-related UI (`WaterTracker`, `WaterBottleVisual`, water bars in `WeeklyIntakeGraph`, MealCategory save-as-meal action) always uses fixed blue `#2196F3` (light variant `#E3F2FD`) regardless of the user's accent theme. Do not use `colors.primary` for water visuals.
- **Macro gram calculation**: `Math.round((pct / 100) * goalCalories / calPerGram)` — calPerGram is 4 for protein/carbs, 9 for fat. Canonical implementation in `components/nutrition/MacroProgressBars.tsx`; reused in `components/settings/MacroSection.tsx`.
- **Portion scaling**: stored food calories/macros are scaled at add-time. To reconstruct per-serving base values for re-editing: `baseCalories = food.calories / (food.servings ?? 1)`.
- **Activity calorie calculation**: `utils/activityCalculation.ts` — `calculateExerciseCalories(durationMinutes, weightValue, weightUnit)` uses MET=5.0 for weight lifting; `calculateStepCalories(steps, weightValue, weightUnit)` uses `steps × (weightKg/70) × 0.04`. Both reuse `weightToKg()` from `utils/tdeeCalculation.ts`. Calories stored at log-time (same pattern as food).
- **Nutrition calorie target**: `calorieTarget = baseTdee + caloriesBurned` — exercise calories from `activityLog` for the selected date are added to the TDEE-based goal in `nutrition.tsx`. The ring shows "+N cal from exercise" when activity is logged.
- **Nutrition pager**: The `CalorieRing + WaterBottleVisual` area in `nutrition.tsx` is a **3-page** horizontal `ScrollView` (`pagingEnabled`). Page 0 (left) = `WeeklyCalorieGraph`. Page 1 (center, default) = ring + bottle. Page 2 (right) = `WeeklyWaterGraph`. Page width = `windowWidth - Spacing.md * 2` (the content padding). Page dot indicators (3 dots) sit below; active dot uses `colors.primary`, inactive uses `colors.border`. `activePagerPage` state is updated on `onMomentumScrollEnd`. All pages are `{ width: pagerWidth }` views. The pager resets to the center page (`scrollTo({ x: pagerWidth, animated: false })`) and `activePagerPage` resets to 1 every time the Nutrition tab gains focus via `useFocusEffect`. Uses `contentOffset={{ x: pagerWidth, y: 0 }}` on the `ScrollView` to start at the center page without flashing. Uses a dedicated `pagerScrollRef`. Page 1 container uses `justifyContent: 'center'` and `paddingVertical: Spacing.lg` to vertically center the ring + bottle within the pager area.

## Component Notes

Detailed notes for all components, screens, modals, and utilities live in `.claude/documentation/component-notes.md`. Read that file on demand when modifying or referencing a specific item below — it is NOT auto-loaded.

Index (alphabetical-ish, by appearance in detail file):

- **`PortionSelector`**
- **`FoodItem`**
- **Tab header style**
- **`CollapsibleTabHeader`**
- **`HeaderXpBar`**
- **`PillTabBar`**
- **`MoreMenuPopover`**
- **`MoreMenuContext`**
- **`ProfileCard`**
- **`BadgesSection`**
- **Streak calculation**
- **`MacroSection`**
- **`CustomFoodForm`**
- **`EditMealFlow`**
- **`AddMealTab`**
- **`AddFoodTab`**
- **`FloatingPillBar`**
- **`CreateMealFlow`**
- **Swipe-left to save meal**
- **Saved meal groups in MealCategory**
- **`AddMealTab`**
- **`QuickAddTab`**
- **`CustomFood`**
- **`NutritionFoodItem`**
- **`SavedMeal`**
- **Home screen**
- **Activities screen**
- **Profile tab**
- **Settings tab**
- **App Settings sub-screen**
- **`ErrorBoundary`**
- **`utils/crashReporting.ts`**
- **Nutrition Goals modal**
- **Appearance modal**
- **`WaterTracker`**
- **`ThemeColorPicker`**
- **`AppearanceModePicker`**
- **`AndroidGlowBackdrop`**
- **`CalorieFlame`**
- **`DigitalScale`**
- **Weight tab pager**
- **`CalorieRing`**
- **`WeeklyCalorieGraph` / `WeeklyWaterGraph` / `WeeklyActivityGraph`**
- **`WeightChart`**
- **`WaterBottleVisual`**
- **`ToastNotification`**
- **`GamificationWatcher`**
- **`ToastContext`**
- **Achievement definitions**
- **XP/level definitions**
- **`UserPreferences` gamification fields**
- **Weekly Recap modal**
- **`RecapWeightPage`**
- **`RecapNutritionPage`**
- **`RecapStreaksPage`**
- **`RecapRatingPage`**
- **`utils/weeklyRatingCalculation.ts`**
- **Leveling Tutorial modal**
- **`TutorialXpPage`**
- **`TutorialLevelsPage`**
- **`TutorialPrestigePage`**
- **`FeedbackSection`**
- **`FavoritePillRow`**
- **`FoodFilterModal`**
- **Food Library modal**
- **Profile modal**
- **Stats & Achievements modal**

## Runtime Requirements

- **`GestureHandlerRootView`** wraps the entire app in `app/_layout.tsx` — required by `react-native-gesture-handler` and any library that depends on it (e.g., `react-native-draggable-flatlist`). Must be the outermost wrapper.
- **`react-native-draggable-flatlist` compatibility**: Always use the default `DraggableFlatList` export — never `NestableDraggableFlatList` or `NestableScrollContainer`. The nestable variants call `ref.measureLayout` on non-native refs under RN 0.81 / React 19, causing a fatal warning and broken drag. Use a plain `ScrollView` where a scroll container is needed. Drag handles must use `onLongPress={drag}` with `delayLongPress={100}` — `onPressIn={drag}` causes a gesture conflict that freezes items in place. See **Section 13** of `.claude/documentation/style_guide.md` for the full pattern.
- **`SafeAreaProvider`** (from `react-native-safe-area-context`) is nested directly inside `GestureHandlerRootView` in `app/_layout.tsx`. Required for React Navigation headers to correctly offset below the Android status bar. `add-food-modal.tsx` uses `SafeAreaView` from `react-native-safe-area-context` (not from `react-native`) for the same reason.
- **`ErrorBoundary`** (`components/ErrorBoundary.tsx`): React class component wrapping `RootNavigator` inside `ThemeColorSync` in `app/_layout.tsx`. Catches unhandled JS exceptions via `componentDidCatch`, logs error details (message, stack, component stack, timestamp) to AsyncStorage under `@healthtracker_last_error`, and renders a "Something went wrong" fallback UI with a Restart button instead of force-closing.
- **`ToastProvider`** (`context/ToastContext.tsx`): wraps `ThemeColorSync` (inside `AppProvider`) in `app/_layout.tsx`. Required for `useToast()` to work in any component. `ToastNotification` and `GamificationWatcher` both depend on it and are rendered inside `ThemeColorSync` (so they have access to both `useApp()` and `useToast()`).
- **`ThemeColorSync`** (defined in `app/_layout.tsx`): bridges `preferences.themeColor` from `AppContext` into `ThemeContext` (from `constants/theme.ts`). Wraps `RootNavigator` inside `AppProvider`. Required so that `useColors()` can read the dynamic accent color from any component in the tree. Also renders `<StatusBar>` (from `expo-status-bar`) with `style` derived from the resolved appearance: `'dark'` when resolved scheme is light (dark text on light background), `'light'` when resolved scheme is dark (light text on dark background). Resolved scheme = `preferences.appearanceMode` unless `'system'`, in which case `useColorScheme()` is used.
- **Nested drum ScrollViews**: All drum pickers (scroll wheels) that sit inside a page-level `ScrollView` must include `nestedScrollEnabled={true}` — required on Android to prevent the outer scroll view from capturing touch events. Applies to the exercise duration drums in `activities.tsx` and the Weight Goal drum in `GoalsSection.tsx`. The `PortionSelector` drums are exempt as they render inside a `Modal`.
- **Backup storage** (`storage/backupStorage.ts`): two separate export paths — `saveBackup()` opens the OS share sheet (iOS/Android) or triggers a browser download (web) for cross-device/cross-Codespace portability; `writeAutoBackup()` writes silently to `documentDirectory` (native only, used by AppContext auto-backup). `loadBackup()` opens the OS document picker on native and a file-input on web. `backupExists()` always returns `true` on both platforms — "Load Saved Data" is always shown on the welcome screen. Dependencies: `expo-sharing ~14.0.8`, `expo-document-picker ~14.0.8`.

## Skills

Skills are defined in `.claude/skills/*/SKILL.md` (modern format with YAML frontmatter).

- **`/interview`** — Invoke automatically whenever the user mentions planning, update ideas, new features, or improvements to the app. Conducts a structured interview using `AskUserQuestion` (as many rounds as needed) to clarify all details, then produces a structured GitHub issue (title, labels, description, technical implementation, acceptance criteria). Designed to be called standalone or from within `/ci`. Does not write to any file — returns structured issue content directly.
- **`/push-changes`** — Invoke automatically after completing any code change (feature, fix, or refactor). Updates affected documentation, creates a new `claude/<description>-<id>` sub-branch off the current branch, commits all changes, and pushes to GitHub.
- **`/dependency-check`** — For all version constraints, compatibility rules, and install commands.
- **`/ci`** — Invoke automatically when user says "brainstorm", "idea dump", "create github issues", "sync issues", "push to board", or similar. Accepts a list of ideas, then structures each into a well-defined issue with 3 labels (type: bug/improvement/feature, page: weight/nutrition/activity/settings/global, timeline: short-term/medium-term/long-term), a detailed description, technical implementation section referencing the codebase, and acceptance criteria. Each issue is presented for individual approval before creation. Auto-creates missing labels. All issues added to Backlog on the project board.
- **`/cp`** — Invoke automatically when user says "work on prioritized", "complete the board", "do the prioritized tickets", or similar. Reads all issues in the "Prioritized" column of the project board, parses each issue's Description, Technical Implementation, and Acceptance Criteria sections, implements strictly what is outlined (no unrelated changes), verifies all acceptance criteria are met, then calls `/push-changes` to commit and push on a new branch. After pushing, moves all successfully completed issues to the "In Review" column on the project board.
- **`/cr`** — Only invoked explicitly. Asks major/minor bump type, auto-computes new version from `app.json` (`expo.version`), updates and commits `app.json`, compiles release notes via `/release-notes`, creates an annotated tag, pushes to GitHub (triggers the `release-android.yml` APK build pipeline), creates a GitHub Release with the compiled notes, then archives all Done items from the project board.
- **`/release-notes`** — Invoked automatically by `/cr` (Step 5); also usable standalone. Fetches all issues in the "Done" column of the project board via GitHub GraphQL, sorts by `closedAt` descending, deduplicates conflicting items (keeps newest per feature area), categorises into ✨ New Features / 🐛 Bug Fixes / 🔧 Improvements, and returns formatted markdown release notes. Project board ID read from `$GH_PROJECT_BOARD_ID` env var.
- **`/revise-in-review`** — Invoke automatically when user says "revise in review", "revise the in review tickets", "rework in review issues", "the last attempt didn't work", or wants to revise issues in the In Review column whose previous implementation failed. Fetches every In Review issue and loops through them one at a time. For each issue, shows the current body, then uses `AskUserQuestion` (as many rounds as needed) to ask (1) what about the previous implementation failed or is incorrect, (2) how it should actually behave now, and (3) any follow-ups needed to fully scope the next attempt. Rewrites each ticket into a 5-section format — Description / Previous Attempt / Why It Failed / What Must Be Done Now / Acceptance Criteria — then shows it for approval and saves with `gh issue edit` before advancing to the next issue. Does not move issues between columns.
- **`/update-docs`** — Invoke when user says "update docs", "sync documentation", "refresh docs", or wants to ensure all documentation reflects the current codebase state. Audits the full codebase (actions, types, file structure, components) against CLAUDE.md, README.md, style guide, and skill files; presents a gap summary; applies targeted updates; commits and pushes.

## Dependency Management

For all version constraints, compatibility rules, and install commands, use the `/dependency-check` skill.
