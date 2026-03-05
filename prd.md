# HealthTracker — Product Requirements

## Phase 9: Cross-Page Polish & Settings Overhaul [IN PROGRESS]

### 9.1 — "Go to Today" quick-nav pill

All three date-navigable screens (Weight, Nutrition, Activities) let users scroll arbitrarily far into the past with no fast path back to the current day. A small "Today" pill button should appear above the date navigation bar **only** when the selected date is not today. Tapping it snaps the selected date back to `getToday()` immediately.

**Changes:**
- `app/(tabs)/index.tsx`: Add `todayPill` / `todayPillText` styles. Render `{selectedDate !== today && <TouchableOpacity style={styles.todayPill} onPress={() => setSelectedDate(today)}><Text style={styles.todayPillText}>Today</Text></TouchableOpacity>}` directly above the `dateNav` View inside the `'log'` section.
- `app/(tabs)/nutrition.tsx`: Same pill pattern — add styles, render pill above the `dateNav` View when `selectedDate !== today`.
- `app/(tabs)/activities.tsx`: Same pill pattern — render above the `dateNav` View when `selectedDate !== today`.
- Style: small horizontally-centered rounded pill (`backgroundColor: colors.primaryLight`, `color: colors.primary`, `borderRadius: Radius.md`, `paddingVertical: 4`, `paddingHorizontal: Spacing.md`, `alignSelf: 'center'`, `marginBottom: Spacing.xs`).

### 9.2 — Weight chart: linear interpolation

The `<LineChart>` in `WeightChart.tsx` uses the `bezier` prop, which produces curved splines between points. This can visually imply values above or below the actual logged readings, misleading the user. Removing `bezier` makes the line a straight segment between each adjacent pair of data points.

**Changes:**
- `components/WeightChart.tsx`: Remove the `bezier` prop from `<LineChart>`.

### 9.3 — Weight insights card

After the chart, there is no summary of progress toward the user's weight goal. A new insights card should appear below `<WeightChart />` in the History view, showing:
1. **Total change in the last 7 days** — difference (in the user's preferred unit) between the most recent entry and the oldest entry within the past 7 calendar days.
2. **Estimated weekly rate** — the above change scaled to a per-week rate (change / days_span × 7).
3. **On-Track status badge** — compares the weekly rate against the target rate implied by `profile.weightGoal`:
   - Target rates (lbs/wk): `lose_2` = −2, `lose_1.5` = −1.5, `lose_1` = −1, `lose_0.5` = −0.5, `maintain` = 0, `gain_0.5` = +0.5, `gain_1` = +1, `gain_1.5` = +1.5, `gain_2` = +2.
   - **On Track** (green ✓): `|actual_rate − target_rate| ≤ 0.25 lbs/wk` (or `≤ 0.1 kg/wk` when unit is kg).
   - **Behind** (amber ⚠): actual rate is in the wrong direction or the gap is too large.
   - **Ahead** (amber ⚠): actual rate exceeds target by more than the tolerance (e.g. losing faster than intended).
   - If `< 2` entries exist in the last 7 days, or no weight goal is set (no profile), display a neutral placeholder: "Log more entries to see progress insights."

**Changes:**
- `components/WeightInsights.tsx` *(new)*: Reads `entries`, `preferences.unit`, and `preferences.profile.weightGoal`. Implements the logic above. Renders a card (`backgroundColor: colors.card`, `borderRadius: Radius.lg`, `padding: Spacing.md`, shadow) with a "Progress Insights" label, the change value + rate line, and a colored status badge row.
- `app/(tabs)/index.tsx`: Import and render `<WeightInsights />` below `<WeightChart />` inside the `'history'` section.

### 9.4 — CreateMealFlow: custom food tap resets selection (bug fix)

**Root cause:** `handleSelectItem` calls `Keyboard.dismiss()`, which triggers `onBlur` on the search `TextInput`, setting `searchFocused = false`. When `query` is also empty (no text typed), `isSearchMode` (`searchFocused || query.length > 0`) becomes `false`, switching the view to the "Foods in Meal" list and hiding the `PortionSelector` panel — even though `selectedItem` was just set.

On the second tap the user sees both the portion window and the keyboard simultaneously because keyboard re-focuses on tap, creating a broken state that forces them to cancel and restart.

**Fix:** Include `selectedItem !== null` in the `isSearchMode` guard so a selected item keeps the search-mode view alive regardless of focus state.

**Changes:**
- `components/nutrition/CreateMealFlow.tsx`: Change line `const isSearchMode = searchFocused || query.length > 0;` → `const isSearchMode = searchFocused || query.length > 0 || selectedItem !== null;`

### 9.5 — Activity page: keyboard doesn't dismiss on save

After the user enters steps or smartwatch calories via the keyboard and taps the save/add button, the keyboard stays open. `handleAddSteps` and `handleSaveSmartwatch` need to call `Keyboard.dismiss()` before their dispatch/logic so the keyboard closes on save.

**Changes:**
- `app/(tabs)/activities.tsx`: Add `import { Keyboard } from 'react-native'` (already imported via the existing import block — verify it's included). In `handleAddSteps`, call `Keyboard.dismiss()` before the `dispatch` call. In `handleSaveSmartwatch`, call `Keyboard.dismiss()` at the top of the function (before the early return guard).

### 9.6 — Settings page reorganization

The current Settings layout mixes biometric identity data (name, DOB, sex, height), goal/calorie settings (weight goal, activity level, activity mode, fitness goal), and display preferences (units) into an unintuitive order. Specifically: Activity Tracking mode sits between Profile and Macros despite being conceptually part of calorie-goal configuration; the Profile section is overlong; the About card adds noise.

**New section order:**
1. **Profile** (collapsible) — biometrics only: Name, DOB, Sex, Height.
2. **Goals & Calorie Target** (collapsible, new) — everything that affects the calorie calculation: Weight Goal, Activity Level, Activity Tracking Mode, Fitness Goal.
3. **Units** (non-collapsible card, moved up) — lbs/kg toggle.
4. **Macros** (collapsible) — unchanged.
5. **About** — removed as a card; replaced with a small plain `<Text>` footer at the bottom of the `ScrollView` showing `HealthTracker v1.0.0`.

**Changes:**
- `components/settings/ProfileSection.tsx`: Remove the Activity Level, Weight Goal, and Fitness Goal fields. The component retains only Name, DOB picker, Sex toggle, and Height input(s). Remove the `GOAL_LABELS`, `ACTIVITY_LABELS`, `ACTIVITY_INFO`, and associated handler/state (`activityLevel`, `weightGoal`, `fitnessGoal`, `infoModal` for activity, etc.). Remove the `activityMode` prop (no longer needed here).
- `components/settings/GoalsSection.tsx` *(new)*: Accepts props `activityMode: ActivityMode`, `goalCalories: number | null`, `onActivityModeChange: (mode: ActivityMode) => void`. Contains:
  - **Weight Goal** picker — dynamic labels based on `isImperial` (see 9.7).
  - **Activity Level** buttons — same greyed-out behaviour (opacity 0.4, non-tappable) when `activityMode !== 'auto'`; ⓘ info buttons opening `InfoModal`.
  - **Activity Tracking Mode** — the three pill buttons (Auto / Manual / Smart Watch) with ⓘ buttons and banner (moved from `settings.tsx` inline block).
  - **Fitness Goal** text input.
  - Dispatches `SET_PROFILE` for weight goal, activity level, fitness goal changes; calls `onActivityModeChange` for mode changes.
- `app/(tabs)/settings.tsx`: Remove the `activityModeExpanded` state and the "Activity Tracking" collapsible card. Add `goalsExpanded` state (default `true`). Add a new "Goals & Calorie Target" collapsible card that renders `<GoalsSection activityMode={activityMode} goalCalories={goalCalories} onActivityModeChange={setActivityMode} />`. Move the Units card above the Macros card. Remove the About card; add `<Text style={styles.footer}>HealthTracker v1.0.0</Text>` at the bottom of the `ScrollView`. Update `ProfileSection` — remove `activityMode` prop.

### 9.7 — Expanded weight goal options (±2 lbs in 0.5 lb steps)

Currently only 5 weight goal presets exist (lose 1, lose 0.5, maintain, gain 0.5, gain 1). The full ±2 lb range in 0.5 lb increments requires 9 options. When the user's unit is `kg`, labels show the kg equivalent.

**Target rate → daily calorie offset mapping:**
| Goal | Cal offset |
|------|-----------|
| lose_2 | −1000 |
| lose_1.5 | −750 |
| lose_1 | −500 |
| lose_0.5 | −250 |
| maintain | 0 |
| gain_0.5 | +250 |
| gain_1 | +500 |
| gain_1.5 | +750 |
| gain_2 | +1000 |

**Label mapping (lbs / kg):**
| Value | lbs label | kg label |
|-------|-----------|---------|
| lose_2 | Lose 2 lb/wk | Lose 0.9 kg/wk |
| lose_1.5 | Lose 1.5 lb/wk | Lose 0.7 kg/wk |
| lose_1 | Lose 1 lb/wk | Lose 0.5 kg/wk |
| lose_0.5 | Lose 0.5 lb/wk | Lose 0.25 kg/wk |
| maintain | Maintain | Maintain |
| gain_0.5 | Gain 0.5 lb/wk | Gain 0.25 kg/wk |
| gain_1 | Gain 1 lb/wk | Gain 0.5 kg/wk |
| gain_1.5 | Gain 1.5 lb/wk | Gain 0.7 kg/wk |
| gain_2 | Gain 2 lb/wk | Gain 0.9 kg/wk |

**Changes:**
- `types/index.ts`: Expand `WeightGoal` union to add `'lose_2' | 'lose_1.5' | 'gain_1.5' | 'gain_2'`.
- `utils/tdeeCalculation.ts`: Add four new cases to `getGoalCalories` switch: `lose_2` (−1000), `lose_1.5` (−750), `gain_1.5` (+750), `gain_2` (+1000).
- `components/settings/GoalsSection.tsx`: Build `GOAL_LABELS` dynamically from `isImperial` using the table above. Render all 9 options in the weight goal picker grid.

---

## Files Changed in Phase 9

- `app/(tabs)/index.tsx` — Add "Today" pill above date nav; render `WeightInsights` in History view
- `app/(tabs)/nutrition.tsx` — Add "Today" pill above date nav
- `app/(tabs)/activities.tsx` — Add "Today" pill above date nav; `Keyboard.dismiss()` in `handleAddSteps` and `handleSaveSmartwatch`
- `app/(tabs)/settings.tsx` — Restructure sections: slim Profile, new Goals card, Units moved up, About removed → footer text
- `components/WeightChart.tsx` — Remove `bezier` prop
- `components/WeightInsights.tsx` *(new)* — 7-day progress insights card
- `components/settings/ProfileSection.tsx` — Remove Activity Level, Weight Goal, Fitness Goal; remove `activityMode` prop
- `components/settings/GoalsSection.tsx` *(new)* — Weight Goal, Activity Level, Activity Mode, Fitness Goal; dynamic lbs/kg labels
- `types/index.ts` — Expand `WeightGoal` with 4 new values
- `utils/tdeeCalculation.ts` — Add `lose_2`, `lose_1.5`, `gain_1.5`, `gain_2` to `getGoalCalories`
- `components/nutrition/CreateMealFlow.tsx` — Fix `isSearchMode` guard to include `selectedItem !== null`

---

## Phase 7: Nutrition & Weight UX Improvements [IN PROGRESS]

### 7.1 — Portion selection when building meal templates

When creating a saved meal in the "Create New Meal" flow (`CreateMealFlow.tsx`), tapping a food from the search results previously added it immediately at 1 serving with no opportunity to choose portions. This should match the behavior in `AddFoodTab`:

- Tapping a food result selects it and reveals a `PortionSelector` panel below the search results.
- The user adjusts servings (whole + fraction drums or keypad), seeing a live macro preview.
- An "Add to Meal" button confirms the selection, scaling calories/macros by the chosen portion before appending the food to the meal list.
- After confirming, the search query clears and the portion panel hides, ready for the next food.

### 7.2 — Food search results disappear when typing

**Root cause:** In `AddFoodTab.tsx`, the render is `loading ? <ActivityIndicator> : <FlatList>`. When the user types 2+ characters, the 300ms debounce fires, sets `loading=true`, and the entire FlatList is replaced by a spinner — including matching custom foods that don't require an API call.

**Fix:** Decouple the spinner from the list. The ActivityIndicator is shown as a small inline indicator (above the list), and the FlatList always renders when results are available. Custom food matches remain visible during the USDA API loading phase.

### 7.3 — Edit saved meal templates

No edit UI exists for saved meal templates despite `UPDATE_SAVED_MEAL` already being handled in the reducer.

**Changes:**
- `AddMealTab.tsx`: Add a pencil (`pencil-outline`) icon button next to the existing delete (trash) button on each saved meal row. Tapping it opens `EditMealFlow`.
- `EditMealFlow.tsx` (new): Same search + PortionSelector flow as CreateMealFlow, but pre-populated with the meal's existing name and foods. Existing foods in the meal can be removed (×) or have their portion adjusted (tap to open an inline PortionSelector). On save, dispatches `UPDATE_SAVED_MEAL`.

**Also covers daily meal editing note:** Individual food items in daily meals are already editable — tap a food to adjust portions via PortionSelector bottom sheet, swipe to delete, tap + to add foods. No changes needed there.

### 7.4 — Keyboard dismissal after saving a weight

After the user taps "Save Entry" on the Weight tab, the keyboard remains visible behind the success Alert. Fix: call `Keyboard.dismiss()` in `handleSave()` (in `app/(tabs)/index.tsx`) immediately before the `Alert.alert('Saved', ...)` call on the success path.

### 7.5 — Reduce custom food unit picker options

In `CustomFoodForm`, trim the serving-unit chip row from 7 options (`Serving`, `g`, `oz`, `ml`, `Cup`, `Tbsp`, `Tsp`) down to 3 (`g`, `oz`, `qty`). Default selection changes to `g`. The stored `servingSize` string format is unchanged.

### 7.6 — Create Meal search view: hide meal list while searching

In `CreateMealFlow`, introduce a `searchFocused` boolean state wired to `onFocus`/`onBlur` on the search TextInput. When `searchFocused || query.length > 0` (search mode), the "Foods in Meal" list is hidden and the search results FlatList expands to `flex: 1`, filling the space between the header and the always-visible Cancel/Save Meal buttons. When the search input is blurred and the query is empty (browse mode), the Foods in Meal list is shown instead. After confirming a food portion, `handleSearch('')` is called to repopulate custom foods so the user can immediately search again.

### 7.7 — Dismiss keyboard on food selection in Add Food tab

In `AddFoodTab`, call `Keyboard.dismiss()` immediately when the user taps a food result row, so the keyboard closes before the PortionSelector drum pickers appear.

### 7.8 — Compact drum pickers and scrollable portion editor bottom sheet

`PortionSelector`: Reduced `VISIBLE_ITEMS` from 5 to 3, shrinking each drum from 220 px to 132 px. `FoodItem`: The portion-edit bottom sheet (`editSheet`) now has `maxHeight: '85%'` to prevent overflow on small screens. The PortionSelector and Update Portion button are wrapped in a `ScrollView` (with `paddingBottom` for safe-area clearance) so the button is always reachable.

---

## Phase 8: Profile & Activity Tracking Overhaul [IN PROGRESS]

### 8.1 — Enhanced Profile Form

The profile form only captured age, sex, height, activity level, and weight goal. Added name (optional), date of birth replacing the age input (age auto-updates yearly via `ageFromDob()`), and a freeform fitness goal field.

**Changes:**
- `types/index.ts`: Added `name?: string`, `dob?: string`, `fitnessGoal?: string` to `UserProfile`; kept `age?: number` for backward compat with existing stored data
- `utils/tdeeCalculation.ts`: Added `ageFromDob(dob: string): number` helper; updated all TDEE call sites to use `dob ? ageFromDob(dob) : age ?? 30`
- `components/settings/ProfileSection.tsx`: Added Name TextInput at top; replaced Age TextInput with DOB date picker (DateTimePicker + iOS bottom-sheet Modal); added Fitness Goal TextInput after weight goal; updated `buildAndSave` signature and state vars

### 8.2 — Activity Tracking Mode (Auto / Manual / Smart Watch)

All logged activities previously always added to the nutrition calorie target, causing double-counting for users who selected an activity level for TDEE. A mode selector was added to Settings.

**Changes:**
- `types/index.ts`: Added `ActivityMode = 'auto' | 'manual' | 'smartwatch'`; added `activityMode?: ActivityMode` to `UserPreferences`; extended `ActivityEntry.type` to include `'smartwatch'`
- `context/AppContext.tsx`: Added `SET_ACTIVITY_MODE` action and reducer case
- `app/(tabs)/settings.tsx`: Added new collapsible "Activity Tracking" card between Profile and Macros; three pill buttons (Auto / Manual / Smart Watch) each with an ⓘ info button; warning/info banners below; passes `activityMode` prop to `ProfileSection`
- `components/settings/ProfileSection.tsx`: Accepts `activityMode` prop; shows activity level buttons at 0.4 opacity (non-tappable) with a note when mode is Manual or Smart Watch
- `utils/tdeeCalculation.ts`: Added `activityMode` param (default `'manual'`); when not `'auto'`, overrides activity multiplier with sedentary (×1.2)
- `app/(tabs)/nutrition.tsx`: Reads `activityMode`; skips activity calories when `'auto'`; sums only smartwatch entries when `'smartwatch'`; updates TDEE call with resolved age and mode
- `app/(tabs)/activities.tsx`: Reads `activityMode`; shows warning banner in `'auto'` mode with grayed calorie figures labeled "ref"; replaces exercise/steps sections with smartwatch calorie input when `'smartwatch'`; pre-fills smartwatch input from existing entry

### 8.3 — Info Buttons ("ⓘ") Throughout

No info/help context existed anywhere. Added contextual info buttons for activity modes and activity levels.

**Changes:**
- `components/InfoModal.tsx` *(new)*: Reusable transparent-overlay modal. Props: `visible`, `title`, `description`, `onClose`. Fade animation, centered card, "Got it" close button.
- `components/settings/ProfileSection.tsx`: ⓘ icon next to each Activity Level button. Tapping opens InfoModal with level description and multiplier.
- `app/(tabs)/settings.tsx`: ⓘ icon next to each Activity Mode pill. Tapping opens InfoModal with mode description.

### 8.4 — Weight Save: Inline Confirmation Instead of Alert Popup

After saving a weight entry the app showed `Alert.alert('Saved', ...)`. Replaced with an inline message below the save button.

**Changes:**
- `app/(tabs)/index.tsx`: Removed `Alert.alert('Saved', ...)`. Added `savedMessage: string | null` state. After dispatch, sets message to "Weight saved on [Weekday, Month Day] at [H:MM AM/PM]". Auto-clears via `setTimeout` after 3.5 s. Clears when user starts typing. Rendered below save button in primary-colored italic small text.

---

## Files Changed in Phase 8

- `types/index.ts` — Added `name`, `dob`, `fitnessGoal` to UserProfile; added `ActivityMode`; extended UserPreferences and ActivityEntry
- `utils/tdeeCalculation.ts` — Added `ageFromDob()`, updated `calculateDailyCalories` with activityMode param
- `components/InfoModal.tsx` *(new)* — Reusable info modal component
- `components/settings/ProfileSection.tsx` — Name, DOB picker, fitness goal, activityMode prop, greyed-out activity level state, activity level info buttons
- `context/AppContext.tsx` — SET_ACTIVITY_MODE action
- `app/(tabs)/settings.tsx` — Activity Tracking mode card with info buttons, mode-aware TDEE call
- `app/(tabs)/nutrition.tsx` — Mode-aware calorie target calculation and label
- `app/(tabs)/activities.tsx` — Mode-aware UI: auto warning, smartwatch input section, reference labels
- `app/(tabs)/index.tsx` — Inline weight save confirmation

---

## Files Changed in Phase 7

- `components/nutrition/AddFoodTab.tsx` — fix loading spinner hiding FlatList; keyboard dismiss on selection
- `components/nutrition/CreateMealFlow.tsx` — add PortionSelector before adding food to meal; search mode hides meal list
- `components/nutrition/CustomFoodForm.tsx` — reduce unit picker to g / oz / qty
- `components/nutrition/FoodItem.tsx` — scrollable bottom sheet with maxHeight cap
- `components/nutrition/PortionSelector.tsx` — compact drums (VISIBLE_ITEMS 5→3)
- `components/nutrition/EditMealFlow.tsx` *(new)* — edit saved meal templates
- `components/nutrition/AddMealTab.tsx` — add edit button, wire up EditMealFlow
- `app/(tabs)/index.tsx` — call `Keyboard.dismiss()` in `handleSave()`
- `prd.md` — this file
