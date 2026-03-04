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
