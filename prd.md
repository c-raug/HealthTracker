# HealthTracker — Product Requirements

## Phase 1: Add a Nutrition Page [COMPLETED]

- Note that this is meant to be very similar in functionality to the app called MyFitnessPal
- Create a new page in the app called Nutrition.
- Calculate calories and macros based on weight and display the results.
- Provide four categories for adding food items (no calorie or macro information is added yet): breakfast, lunch, dinner, and snacks.
- Each category should be a drop-down menu, and within the drop-down bar, have a "+" icon to add a food item. For now, it should just be a text entry.

**Implementation:** Nutrition tab added between Weight and Settings. Profile setup in Settings (age, sex, height, activity level, weight goal) calculates TDEE via Mifflin-St Jeor. Four collapsible meal categories with add, swipe-to-delete, and drag-to-reorder. Date navigation matches Weight screen pattern.

## Phase 2: Integrate Calories and Macros [COMPLETED]

- Add a setting in the settings menu to determine the percentage of calories that should be used for each macro. This should be three boxes that can be either scrolled or typed in for the 1%. Ensure that the total adds up to 100%.
- At the top of the nutrition page, display two pie charts: one showing the total remaining calories and the other showing the remaining macros.
- Research a food database or API that can be used to search for food and add them to meals. The caloric and macro information should be pulled in and used.
- Add an ability to use this library to enter foods.

**Implementation:** Macro split settings (Balanced/High Protein/Keto presets + Custom with validation). CalorieRing SVG donut chart and MacroProgressBars on the nutrition screen. OpenFoodFacts API integration for food search with debounced queries and nutritional data.

## Phase 3: Customize Foods and Meals [COMPLETED]

- When adding food to a meal, take the user to a menu with two tabs: "Add Food" and "Add Meal."
- In the "Add Food" menu, allow users to search the database for food or create a new food item where they can add their personal favorite foods to the local database. This should include the name of the food and its macros.
- When the user selects a meal, display their existing meals and provide an option to create a new meal. In the "Create New Meal" screen, allow users to name the meal and add foods.

**Implementation:** Full-screen modal (`add-food-modal.tsx`) with "Add Food" and "Add Meal" tabs. Add Food tab searches both OpenFoodFacts and local custom foods simultaneously, with a "Create Custom Food" form. Add Meal tab lists saved meals and provides a "Create New Meal" flow that reuses the food search interface. All custom foods and saved meals persist via AsyncStorage.

## Phase 4: Improved Food Search [COMPLETED]

- Replace OpenFoodFacts API with USDA FoodData Central for faster, more accurate, English-only food search results.
- Filter to Foundation and SR Legacy data types for well-named generic foods (e.g., "Egg, whole, raw" instead of random branded products).
- Require a free USDA API key stored in `.env` as `EXPO_PUBLIC_USDA_API_KEY`.
- Add AbortController support to cancel stale in-flight search requests when the user types more characters, preventing result flickering.
- All nutrition values are per 100g serving (USDA standard for generic foods).

**Implementation:** New `api/usdaFoodData.ts` module using POST `/fdc/v1/foods/search` with nutrient filtering (kcal, protein, fat, carbs). Both `AddFoodTab.tsx` and `CreateMealFlow.tsx` updated to use the new API with AbortController-based request cancellation. Old `api/openFoodFacts.ts` removed.

## Phase 5: UX Polish — Collapsible Settings, Macro Grams, and Portion Control [COMPLETED]

- Settings sections (Profile and Macro Split) are collapsible/expandable with chevron headers, defaulting to expanded.
- Macro Split section shows computed grams (e.g., 150g protein) beneath each percentage, live-updating as percentages change. Grams are shown for all presets and custom inputs. Requires a weight entry and completed profile to display actual values; shows "—g" otherwise.
- Custom food creation: serving size split into a numeric quantity input plus a unit picker (Serving, g, oz, ml, Cup, Tbsp, Tsp). Calories are auto-computed from macros using (protein × 4) + (carbs × 4) + (fat × 9); users can manually override with a warning that calories may not match macro tracking.
- Portion selector replaces the old +/- buttons when selecting a food to add: dual controls featuring a whole-number slider (0–250) and a fraction chip selector (0, ⅛, ¼, ⅜, ½, ⅝, ¾, ⅞) plus a keypad toggle for direct numeric entry. A live preview row shows updated calories, protein, carbs, and fat as the portion is adjusted.
- Portion can be adjusted both before adding a food (inline in the food search flow) and after (tap an existing meal item to open a bottom-sheet editor with the same portion selector).

**Implementation:** New `components/nutrition/PortionSelector.tsx` component with PanResponder-based whole slider, fraction chip row, keypad toggle, and live macro preview. `UPDATE_FOOD_IN_MEAL` action added to AppContext reducer. `CustomFoodForm.tsx` updated with quantity/unit picker and useEffect-driven calorie auto-compute. `AddFoodTab.tsx` replaces serving +/- buttons with PortionSelector. `FoodItem.tsx` adds a tap-to-edit bottom-sheet Modal using PortionSelector. `MealCategory.tsx` passes date/category props to FoodItem. `MacroSection.tsx` accepts a `goalCalories` prop and displays gram equivalents. `settings.tsx` gains collapsible card wrappers for Profile and Macros sections and computes `goalCalories` via `calculateDailyCalories()`.

## Phase 6: Settings Polish, Drum Picker, and Custom Food Visibility [IN PROGRESS]

### 6.1 — Remove gram hints from Macro Split section

Remove the computed gram hint text displayed below each macro preset button (Balanced, High Protein, Keto) and below each custom percentage input (Protein %, Carbs %, Fat %) in the Settings > Macro Split section. The summary line at the bottom of the section (e.g., "P: 30% (150g) · C: 40% (200g) · F: 30% (75g)") remains.

### 6.2 — Add +/- stepper buttons to custom macro inputs

In the Settings > Macro Split > Custom section, add a minus (−) button to the left and a plus (+) button to the right of each percentage TextInput (Protein %, Carbs %, Fat %). Each press increments or decrements the value by 1%, clamped to [0, 100]. Dispatch to context only when the three values sum to 100% (existing validation behavior preserved).

### 6.3 — Replace portion slider with iOS-style drum pickers

Replace the PanResponder-based horizontal slider and fraction chip row in `PortionSelector` with two vertically scrollable drum pickers side by side:
- Left drum: whole numbers 0–250
- Right drum: fractions ⅛-increments (0, ⅛, ¼, ⅜, ½, ⅝, ¾, ⅞)

Each drum uses a ScrollView with `snapToInterval` for snapping, `decelerationRate="fast"`, and an absolutely-positioned highlight bar over the center row. Initial scroll position is set from the `value` prop on mount. The keypad toggle mode is unchanged. The live macro preview row is unchanged.

### 6.4 — Show custom foods when search query is empty

In both `AddFoodTab` (food-to-meal flow) and `CreateMealFlow` (saved meal creation), display all custom foods in a "My Foods" section when the search query is empty (no characters typed). When the user types 1 or more characters, custom foods are filtered by name match. USDA API calls continue to require 2+ characters. This ensures custom foods are always accessible immediately without requiring a minimum search length.

**Files changed:** `components/settings/MacroSection.tsx`, `components/nutrition/PortionSelector.tsx`, `components/nutrition/AddFoodTab.tsx`, `components/nutrition/CreateMealFlow.tsx`, `prd.md`
