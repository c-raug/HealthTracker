# HealthTracker — Claude Code Reference

## Commands

- `npm start` — launch Metro (dev server, shows QR code)
- `npm run tunnel` — start with ngrok tunnel (for Codespaces or different-network devices)
- `npm run ios` / `npm run android` / `npm run web` — native builds

No test runner or lint script exists in package.json.

## Architecture

- **Runtime**: Expo SDK 54, React Native 0.81.5
- **Navigation**: Expo Router v6 (file-based tabs)
  - 3 tabs: Weight (`app/(tabs)/index.tsx`), Nutrition (`app/(tabs)/nutrition.tsx`), and Settings (`app/(tabs)/settings.tsx`)
  - 1 modal route: `app/add-food-modal.tsx` (full-screen food/meal search)
- **State**: React Context + useReducer in `context/AppContext.tsx`; access via `useApp()`
- **Persistence**: auto-saves on every state change to AsyncStorage
- **Actions**: `LOAD_DATA`, `UPSERT_ENTRY`, `DELETE_ENTRY`, `SET_UNIT`, `SET_PROFILE`, `SET_MACRO_PRESET`, `ADD_FOOD_TO_MEAL`, `DELETE_FOOD_FROM_MEAL`, `UPDATE_FOOD_IN_MEAL`, `REORDER_MEAL_FOODS`, `ADD_CUSTOM_FOOD`, `DELETE_CUSTOM_FOOD`, `ADD_SAVED_MEAL`, `UPDATE_SAVED_MEAL`, `DELETE_SAVED_MEAL`
- **Units**: stored per-entry; display conversion done at render time via `convertWeight()`
- **TDEE**: Mifflin-St Jeor equation in `utils/tdeeCalculation.ts`; requires user profile + latest weight entry
- **Food Search**: USDA FoodData Central API in `api/usdaFoodData.ts`; requires `EXPO_PUBLIC_USDA_API_KEY` in `.env`

## Key Patterns

- **Design tokens**: always import from `constants/theme.ts` (`Colors`, `Typography`, `Spacing`, `Radius`)
- **Date strings**: always `"YYYY-MM-DD"` (local timezone via `getToday()`); never use `new Date().toISOString()` for dates
- **TypeScript path alias**: `@/*` → project root
- **ID generation**: use `generateId()` from `utils/generateId.ts` (shared UUID v4 generator)
- **Styles**: use `makeStyles(colors)` pattern with `useColors()` for dark mode support
- **Collapsible sections**: use `useState(false)` + `TouchableOpacity` header + `Ionicons` chevron-down/chevron-forward + conditional render `{!collapsed && <Content />}`. See `components/nutrition/MealCategory.tsx` for the canonical pattern. Settings uses this for Profile and Macro Split.
- **Macro gram calculation**: `Math.round((pct / 100) * goalCalories / calPerGram)` — calPerGram is 4 for protein/carbs, 9 for fat. Canonical implementation in `components/nutrition/MacroProgressBars.tsx`; reused in `components/settings/MacroSection.tsx`.
- **Portion scaling**: stored food calories/macros are scaled at add-time. To reconstruct per-serving base values for re-editing: `baseCalories = food.calories / (food.servings ?? 1)`.

## Component Notes

- **`PortionSelector`** (`components/nutrition/PortionSelector.tsx`): whole-number slider (PanResponder, 0–250) + fraction chip row (⅛ increments) + keypad toggle + live macro preview. Used in `AddFoodTab` (before adding), `CreateMealFlow` and `EditMealFlow` (before adding food to a saved meal), and `FoodItem` (bottom-sheet edit modal after adding).
- **`FoodItem`** (`components/nutrition/FoodItem.tsx`): tapping the food info area opens a bottom-sheet `Modal` with `PortionSelector`; long-pressing the reorder icon drags; swiping right deletes. Requires `date` and `category` props (passed down from `MealCategory`).
- **`MacroSection`** (`components/settings/MacroSection.tsx`): accepts `goalCalories: number | null` prop from `settings.tsx`. Displays gram equivalents below each preset button and custom % input. Shows `—g` when no goal calories are available.
- **`CustomFoodForm`** (`components/nutrition/CustomFoodForm.tsx`): serving size is quantity + unit picker (Serving, g, oz, ml, Cup, Tbsp, Tsp). Calories auto-computed from macros via `useEffect`; manual override shows an `Alert` warning.
- **`EditMealFlow`** (`components/nutrition/EditMealFlow.tsx`): edit an existing saved meal template. Pre-populated from a `SavedMeal` prop; supports renaming, adding foods (search + PortionSelector), removing foods (× button), and adjusting portions of already-added foods (tap row → bottom-sheet PortionSelector). Dispatches `UPDATE_SAVED_MEAL` on save. Launched from `AddMealTab` via the pencil icon.

## Runtime Requirements

- **`GestureHandlerRootView`** wraps the entire app in `app/_layout.tsx` — required by `react-native-gesture-handler` and any library that depends on it (e.g., `react-native-draggable-flatlist`). Must be the outermost wrapper.

## Dependency Management

For all version constraints, compatibility rules, and install commands, use the `/dependency-check` skill.
