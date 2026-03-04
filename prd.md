# HealthTracker — Product Requirements

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
