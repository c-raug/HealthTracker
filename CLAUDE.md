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
- **Actions**: `LOAD_DATA`, `UPSERT_ENTRY`, `DELETE_ENTRY`, `SET_UNIT`, `SET_PROFILE`, `SET_MACRO_PRESET`, `ADD_FOOD_TO_MEAL`, `DELETE_FOOD_FROM_MEAL`, `REORDER_MEAL_FOODS`, `ADD_CUSTOM_FOOD`, `DELETE_CUSTOM_FOOD`, `ADD_SAVED_MEAL`, `UPDATE_SAVED_MEAL`, `DELETE_SAVED_MEAL`
- **Units**: stored per-entry; display conversion done at render time via `convertWeight()`
- **TDEE**: Mifflin-St Jeor equation in `utils/tdeeCalculation.ts`; requires user profile + latest weight entry
- **Food Search**: OpenFoodFacts API in `api/openFoodFacts.ts`; no API key required

## Key Patterns

- **Design tokens**: always import from `constants/theme.ts` (`Colors`, `Typography`, `Spacing`, `Radius`)
- **Date strings**: always `"YYYY-MM-DD"` (local timezone via `getToday()`); never use `new Date().toISOString()` for dates
- **TypeScript path alias**: `@/*` → project root
- **ID generation**: use `generateId()` from `utils/generateId.ts` (shared UUID v4 generator)
- **Styles**: use `makeStyles(colors)` pattern with `useColors()` for dark mode support

## Runtime Requirements

- **`GestureHandlerRootView`** wraps the entire app in `app/_layout.tsx` — required by `react-native-gesture-handler` and any library that depends on it (e.g., `react-native-draggable-flatlist`). Must be the outermost wrapper.

## Dependency Management

For all version constraints, compatibility rules, and install commands, use the `/dependency-check` skill.
