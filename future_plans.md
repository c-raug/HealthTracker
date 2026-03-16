# HealthTracker — Future Plans

This document is a living roadmap of planned features and quality-of-life improvements for HealthTracker. Ideas are grouped loosely by complexity and implementation horizon — not by strict release order.

---

## Short-Term Ideas

These are lower-complexity improvements that would add meaningful value to daily use.

---

### Water Tracking

**Goal:** Let users log daily water intake on the Nutrition page and track it against a personalized goal.

**UX:**
- A collapsible "Water" card appears on the Nutrition page, below the macro progress bars
- Quick-add buttons (+8 oz or +250 mL, depending on unit setting) for fast logging
- A "Custom amount" input for logging any amount
- Progress bar + label ("X oz / Y oz goal" or mL equivalent)

**Goal calculation:**
- Auto-calculated from the user's profile in Settings:
  - Imperial: `body weight (lbs) × 0.5` oz/day, scaled up for Active/Very Active users
  - Metric: `body weight (kg) × 35` mL/day, scaled up for Active/Very Active users
- User can override the calculated goal with a custom number directly in Settings

**Technical notes:**
- New `waterLog` field per date in app state (entries + optional goal override)
- New reducer actions: `ADD_WATER_ENTRY`, `DELETE_WATER_ENTRY`, `SET_WATER_GOAL_OVERRIDE`
- New utility: `utils/waterCalculation.ts`
- New component: `components/nutrition/WaterTracker.tsx`
- Modified: `types/index.ts`, `context/AppContext.tsx`, `app/(tabs)/nutrition.tsx`, `app/(tabs)/settings.tsx`

---

### Copy Meal Categories from a Past Day

**Goal:** Reduce repetitive logging by letting users copy an entire meal category (e.g. Breakfast) from a past date to today.

**UX:**
- A "Copy from…" button appears on each meal category header (e.g. on the Breakfast section)
- Tapping it opens a date picker to select the source date
- All foods from that category on the chosen date are duplicated and appended to today's same category
- If the source category is empty, a friendly message is shown
- Does not overwrite existing entries — always appends

**Technical notes:**
- No new state needed; reads from existing `nutritionLog` history and dispatches multiple `ADD_FOOD_TO_MEAL` actions
- Modified: `components/nutrition/MealCategory.tsx`, `app/(tabs)/nutrition.tsx` or `app/add-food-modal.tsx`

---

### Streak Tracking

**Goal:** Motivate consistent daily logging by tracking streaks for different health habits.

**Four independent streaks:**
1. **Food streak** — at least one food logged per day
2. **Calorie goal streak** — daily intake within ±10% of the calorie target
3. **Weight streak** — at least one weight entry per day
4. **Activity streak** — at least one exercise or step log per day

**UX:**
- A "Streaks" card displayed on the Weight tab (or in Settings)
- Each streak shows: flame icon, habit name, current streak count, and longest-ever streak
- Example: "🔥 7 days — Food Logged"

**Technical notes:**
- Computed at render time from existing data — no new stored state needed
- New utility: `utils/streakCalculation.ts`
- New component: `components/streaks/StreakCard.tsx`
- Modified: `app/(tabs)/index.tsx` or `app/(tabs)/settings.tsx`

---

### Default to Nutrition Tab on Launch

**Goal:** After a user has completed profile setup, always open the app on the Nutrition tab instead of the Weight tab.

**UX:**
- First launch (no profile): user is walked through the profile creation wizard as today
- Every subsequent launch: app lands directly on the Nutrition tab
- No setting needed — this is the fixed post-onboarding default

**Technical notes:**
- Modified: `app/(tabs)/_layout.tsx` — set `initialRouteName` to `"nutrition"` or add a mount-time redirect using Expo Router's `<Redirect>` when a profile exists
- Condition check: read profile from `AppContext` (or AsyncStorage before context loads) to distinguish first-run vs returning user
- No new state or actions needed

---

### Theme Accent Color Picker in Settings

**Goal:** Let users personalise the app by choosing from a small set of accent colors that apply to all interactive elements (buttons, progress rings, active tab icon, links).

**UX:**
- A "Accent Color" row appears in the Settings screen (logical place: near the top, alongside other appearance options)
- Tapping it shows a horizontal row of color swatches (5–7 curated options, e.g. the current blue, green, orange, purple, red, teal)
- The selected swatch gets a checkmark; the UI updates immediately on selection
- Dark mode continues to work — only the accent hue changes, not background/surface colors

**Technical notes:**
- New state field: `themeColor: string` (hex or token key) added to app settings in `types/index.ts` and `context/AppContext.tsx`
- New reducer action: `SET_THEME_COLOR`
- Modified: `constants/theme.ts` — `Colors.primary` (and any other accent tokens) become dynamic, derived from the stored `themeColor`; `useColors()` hook reads from context so every component picks up changes automatically
- New component (or inline section): `components/settings/ThemeColorPicker.tsx`
- Modified: `app/(tabs)/settings.tsx` to render the picker row

---

### In-App Feedback Submission in Settings

**Goal:** Give users a simple way to submit feedback from within the app; submissions should reach the developer (exact delivery mechanism TBD — candidates: Google Form WebView, webhook to Google Sheets, or mailto).

**UX:**
- A "Send Feedback" section appears at the bottom of the Settings screen
- A multi-line text input (at least 5–6 visible lines) for the user to type their message
- A "Submit" button below the input
- On submit: show a brief success confirmation ("Thanks for your feedback!"), clear the input
- On cancel / navigate away: optionally prompt to discard unsaved text

**Delivery options (to decide at implementation time):**
1. **Google Form (recommended for zero backend):** open a pre-built Google Form URL in `expo-web-browser` or as a prefilled WebView
2. **Webhook:** POST JSON to a serverless function that appends a row to Google Sheets
3. **mailto:** open device mail app pre-filled with the text

**Technical notes:**
- No new state needed — input is transient local component state
- Modified: `app/(tabs)/settings.tsx` — add Feedback section at the bottom
- Optionally new component: `components/settings/FeedbackSection.tsx`
- Dependency check needed if using `expo-web-browser` or a fetch-based webhook

---

## Medium-Term Ideas

These require more design and development effort but are well-scoped and impactful.

---

### Weight History Chart — Expanded Time Ranges

**Goal:** Let users see their weight trend over different time windows, not just the most recent entries.

**UX:**
- A segmented control or tab strip above the weight chart with options: **1W / 1M / 3M / 1Y / All Time**
- Selecting a range filters the chart to show only entries within that window
- Chart shows: line with data points, start weight, end weight, and net change (e.g. "−4.2 lbs")

**Technical notes:**
- Extend the existing weight chart component with a range selector
- Check for an existing chart library in the project; if none, use `react-native-chart-kit` or `victory-native` (run `/dependency-check` to confirm compatibility)
- Modified: Weight chart component in `app/(tabs)/index.tsx` or its sub-components

---

### More Exercise Types + Weekly Activity Summary

**More exercise types:**

Currently only "weight lifting" (MET 5.0) is supported. This expands to a full exercise library.

**UX:**
- Replace the single exercise type pill with a two-step picker:
  1. Category pills: **Cardio / Strength / Flexibility / Sports / Other**
  2. Tap a category → sub-list of specific exercises (e.g. Cardio → Running, Cycling, Swimming, Walking, HIIT, Rowing…)
- Each exercise has a defined MET value used in calorie calculation

**Technical notes:**
- New file: `constants/exerciseTypes.ts` — exercise library with categories and MET values
- Modified: `app/(tabs)/activities.tsx`, `utils/activityCalculation.ts`

**Weekly activity summary card:**

A persistent summary card at the top of the Activities tab (above the date navigator) showing:
- Total calories burned this week
- Number of active days this week
- Total steps logged this week

**Technical notes:**
- Computed from `activityLog` filtered to the current ISO week
- New component: `components/activities/WeeklyActivitySummary.tsx`
- Modified: `app/(tabs)/activities.tsx`

---

### UI Refresh + Animations

**Goal:** Give the app a more polished, modern, and unique visual identity with tasteful motion — while preserving the existing minimal aesthetic and dark mode support.

**Design direction:**
- Update `constants/theme.ts` values: refined color palette, slightly rounder card radii, more generous whitespace
- No major layout restructuring — this is an enhancement layer, not a redesign
- All changes dark-mode compatible

**Animations (three types):**

1. **Progress ring + macro bar fill** — the calorie ring and macro progress bars animate when values change (mount + update), using `react-native-reanimated`
2. **Food item transitions** — food items slide in when added to a meal and fade+slide out when deleted, using `react-native-reanimated` layout animations
3. **Micro-interactions** — primary action buttons (Add, Save, Log) scale down slightly on press (`withSpring`); subtle haptic feedback via `expo-haptics`

**Technical notes:**
- Modified: `constants/theme.ts`, `components/nutrition/MacroProgressBars.tsx`, calorie ring component, `components/nutrition/FoodItem.tsx`, `components/nutrition/MealCategory.tsx`
- Confirm `react-native-reanimated` and `expo-haptics` are available (run `/dependency-check`)

---

## Long-Term Ideas

These are larger capabilities that require significant new infrastructure.

---

### Food Database API + Barcode Scanning

**Goal:** Let users search a real food database and scan product barcodes to add foods — eliminating the need to manually enter nutritional info.

**Recommended API:** [Open Food Facts](https://world.openfoodfacts.org) — free, open-source, no API key required, supports both text search and barcode lookup.

**UX flow:**
1. In the food search modal, a new **"Search Database"** tab appears alongside "My Foods"
2. User types a query → debounced API call → results list shows product name, brand, and calories per serving
3. Tap a result → **Food Detail Card** showing full name, brand, serving size, and complete macro breakdown
4. **"Add to Meal"** → opens `PortionSelector` → scales and appends to the meal (same flow as custom foods)
5. **"Save to My Foods"** → saves a local copy as a custom food for quick future access
6. **Barcode scanner:** a camera icon in the search bar opens a live barcode scanner; on scan, the barcode is looked up and the Food Detail Card is shown

**Technical notes:**
- New utility: `utils/foodApi.ts` — API calls + response normalizer to `CustomFood` shape
- New components: `FoodDatabaseSearch.tsx`, `FoodDetailCard.tsx`, `BarcodeScanner.tsx`
- Modified: `app/add-food-modal.tsx`, `package.json` (add `expo-camera` via `/dependency-check`)
- Reuses existing `ADD_CUSTOM_FOOD` action when user saves an API food locally

---

### Micronutrient Tracking

**Goal:** Give users who want deeper nutritional insight a full breakdown of vitamins, minerals, fiber, and sodium — both per food item and as a daily summary.

**Scope:** Full micronutrient panel including vitamins (A, C, D, B12, folate, etc.), minerals (iron, calcium, magnesium, potassium, zinc, etc.), fiber, and sodium.

**UX:**
- **Per food:** The `FoodItem` bottom-sheet modal (shown when you tap a logged food) gains an expandable "Micronutrients" section listing available values
- **Daily summary:** A collapsible "Daily Micronutrients" section on the Nutrition page shows the day's totals alongside RDA percentage where reference values exist
- Graceful empty state — sections only appear when data is available (not all foods will have complete micro data)

**Data source:**
- Populated from Open Food Facts data (depends on the Food Database feature above)
- Custom foods can optionally include micronutrient fields

**Technical notes:**
- New file: `constants/rda.ts` — RDA reference values for common micronutrients
- New component: `components/nutrition/MicronutrientSummary.tsx`
- Modified: `types/index.ts` (add `micronutrients?: Record<string, number>` to food types), `components/nutrition/FoodItem.tsx`, `app/(tabs)/nutrition.tsx`
