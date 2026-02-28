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
