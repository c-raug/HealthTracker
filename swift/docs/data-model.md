# Data model & business logic — porting spec

Source of truth in the Expo app: `expo/types/index.ts`, `expo/context/AppContext.tsx`,
`expo/storage/storage.ts`, `expo/storage/backupStorage.ts`, `expo/utils/*`.
Swift target: `Codable` structs (`swift/HealthTracker/Models/`), a single `@Observable AppStore`
(`swift/HealthTracker/Store/`), JSON-file persistence (`swift/HealthTracker/Persistence/`), and
pure logic (`swift/HealthTracker/Logic/`). Read this instead of re-exploring `expo/`.

## 1. Entities & enums (`expo/types/index.ts`) — **Ported: `Models/*` (Phase 2)**

**Enums / unions**
- `Sex` = `male | female`
- `ActivityLevel` = `sedentary | lightly_active | moderately_active | active | very_active`
- `WeightGoal` = `lose_2 | lose_1.5 | lose_1 | lose_0.5 | maintain | gain_0.5 | gain_1 | gain_1.5 | gain_2`
- `ActivityMode` = `auto | manual | smartwatch`
- `MealCategory` = `breakfast | lunch | dinner | snacks`
- `MacroPreset` = `balanced | high_protein | keto | custom`
- `ExerciseType` = `weight_lifting` (only value)

**WeightEntry** — `id: string`, `date: "YYYY-MM-DD"`, `weight: number`, `unit: 'lbs'|'kg'`, `createdAt: ISO`.

**UserProfile** — `name?`, `age?` (legacy), `dob?: "YYYY-MM-DD"` (age computed from this), `fitnessGoal?`,
`sex: Sex`, `heightValue: number`, `heightUnit: 'in'|'cm'`, `activityLevel`, `weightGoal`.

**NutritionFoodItem** (a logged food) — `id`, `name`, `calories?`, `protein?`, `carbs?`, `fat?`,
`servingSize?`, `servings?`, `mealGroupId?`, `mealGroupName?`, `quickAdd?` (calorie-only entry).

**DayNutrition** — `date`, `meals: Record<MealCategory, NutritionFoodItem[]>` (keys breakfast/lunch/dinner/snacks).

**MacroSplit** — `protein/carbs/fat` percentages (0–100). Preset splits (replicate):
balanced `30/40/30` (default), high_protein `40/30/30`, keto `25/5/70`, custom = user-defined.
Macro grams: `round(splitPct/100 * goalCalories / calPerGram)`, calPerGram `{protein:4, carbs:4, fat:9}`.

**CustomFood** — `id`, `name`, `calories`, `protein`, `carbs`, `fat`, `servingSize`, `createdAt`,
`pinnedCategories?: MealCategory[]`, `pinnedOrder?: Record<string, number>` (per-category order),
`foodTypes?: string[]`.

**SavedMeal** — `id`, `name`, `foods: NutritionFoodItem[]`, `createdAt`, `pinnedCategories?`, `pinnedOrder?`.

**XpDayLog** (per-day XP ledger; guards daily grants) — `food: number` (0–25), `calorieGoal: bool`,
`waterGoal: bool`, `weight: bool`, `activity: bool`.

**UserPreferences** — `unit: 'lbs'|'kg'` (default `lbs`), `profile?`, `macroPreset?`, `macroSplit?`,
`activityMode?`, `onboardingComplete?`, `themeColor?` (accent hex), `waterGoalOverride?`,
`waterGoalMode?: 'auto'|'manual'`, `waterCreatineAdjustment?`, `waterPresets?: [n,n,n]`,
`sectionsExpanded?`, `appearanceMode?: 'light'|'dark'|'system'`, `avatarUri?`,
`unlockedAchievements?: string[]`, `totalXp?`, `prestige?`, `xpLog?: Record<"YYYY-MM-DD", XpDayLog>`,
`lastRecapShownWeek?` (ISO week e.g. `2026-W15`), `foodTypeCategories?: string[]`, `favoriteFilterTypes?: string[]`.
Default food-type categories: `['Meat','Fruit','Vegetable','Grain','Dairy','Snack','Beverage','Other']`.

**ActivityEntry** — `id`, `type: 'exercise'|'steps'|'smartwatch'`, `exerciseType?`, `durationMinutes?`,
`steps?`, `caloriesBurned`, `loggedWithMode?`, `warningDismissed?`.
**DayActivity** — `date`, `activities: ActivityEntry[]`.

**WaterEntry** — `id`, `amount` (oz when unit=lbs, mL when unit=kg — implicit from `preferences.unit`), `loggedAt?`.
**DayWater** — `date`, `entries: WaterEntry[]`. Default presets: imperial `[8,16,32]` oz, metric `[250,500,750]` mL.

## 2. Store / reducer (`expo/context/AppContext.tsx`) — **Ported: `Store/AppStore.swift` (Phase 2)**

Global state slices: `entries`, `preferences` (init `{unit:'lbs'}`), `nutritionLog`, `customFoods`,
`savedMeals`, `activityLog`, `waterLog`, `selectedDate` (init `getToday()`, **not persisted**), `isLoading`.

**Helpers to preserve:** `EMPTY_MEALS()`, `getOrCreateDay`, `upsertDay` = `[day, ...filtered]`
(**newest-first prepend**); same for activity days.

**~40 actions** (each is a method on `AppStore`). Key ones:
- `LOAD_DATA` — set all slices, `isLoading=false`, run migrations (see §3).
- `UPSERT_ENTRY` — one weight entry per date (remove same-date, prepend).
- `DELETE_ENTRY`, `SET_SELECTED_DATE`, `SET_UNIT`, `SET_PROFILE`, `SET_MACRO_PRESET {preset,split}`.
- `ADD_FOOD_TO_MEAL`, `DELETE_FOOD_FROM_MEAL`, `UPDATE_FOOD_IN_MEAL` (by id, per category/date).
- `ADD/UPDATE/DELETE_CUSTOM_FOOD`, `ADD/UPDATE/DELETE_SAVED_MEAL` (prepend on add).
- `ADD_ACTIVITY` (stamps `loggedWithMode = activityMode ?? 'auto'`), `DELETE_ACTIVITY`, `DISMISS_ACTIVITY_WARNING`, `SET_ACTIVITY_MODE`.
- `SET_ONBOARDING_COMPLETE`, `SET_THEME_COLOR`.
- `ADD_WATER_ENTRY`, `DELETE_WATER_ENTRY`, `SET_WATER_GOAL_OVERRIDE`, `SET_WATER_GOAL_MODE`, `SET_WATER_CREATINE`, `SET_WATER_PRESETS`.
- `SET_SECTIONS_EXPANDED`, `SET_APPEARANCE_MODE`, `SET_AVATAR`.
- `REORDER_PINNED_FOODS {category, ids}` / `REORDER_PINNED_MEALS` — set `pinnedOrder[category]=index`.
- `REORDER_MEAL_FOODS {date, category, foods}` — replace category array wholesale.
- `UNLOCK_ACHIEVEMENT {id}` (dedup), `ADD_XP {amount,date,source}` (see gamification §5), `PRESTIGE` (`totalXp=0`, `prestige++`).
- `SET_LAST_RECAP_WEEK`, `SET_FOOD_TYPE_CATEGORIES` (also prunes each custom food's `foodTypes`), `SET_FAVORITE_FILTER_TYPES`.

## 3. Persistence (`expo/storage/`) — **Ported: `Persistence/JSONStore.swift` + `Persistence/BackupCodec.swift` (Phase 2)**

**7 keyed slices** (JSON per key): `weight_entries`, `user_preferences` (default `{unit:'lbs'}`),
`nutrition_log`, `custom_foods`, `saved_meals`, `activity_log`, `water_log`. → Swift: 7 JSON files
in Application Support, write-through on change (gated by `!isLoading`).

**Auto-backup:** debounced 3s write of full state to Documents `healthtracker-backup.json`.

**Backup envelope (`BackupData`):** `{entries, preferences, nutritionLog, customFoods, savedMeals,
activityLog, waterLog, exportedAt}`. Validation requires `['entries','preferences','nutritionLog',
'customFoods','savedMeals','activityLog']` (waterLog + exportedAt optional — older backups accepted).
Export = pretty JSON via share sheet; import = document picker. **This is the bridge for the user's
existing data** — Swift `BackupCodec` must read/write the identical envelope.

**LOAD_DATA migrations:** legacy onboarding auto-complete (profile + entries + !onboardingComplete →
true); seed 8 default food-type categories; `favoriteFilterTypes ??= []`; custom-food migration
(legacy `pinned:bool`→`pinnedCategories`=all 4; numeric `pinnedOrder`→per-cat record;
`foodType:string`→`foodTypes:[x]`; drop `mealTags`); `waterLog ?? []`.

## 4. Business logic (`expo/utils/*`) — exact formulas

- **TDEE** (`tdeeCalculation.ts`): BMR Mifflin–St Jeor `10*kg + 6.25*cm − 5*age + (male?+5:−161)`.
  Multipliers: sedentary 1.2, lightly 1.375, moderately 1.55, active 1.725, very 1.9.
  Goal deltas: lose_2 −1000 … maintain 0 … gain_2 +1000 (±250/step). `calculateDailyCalories`:
  `effectiveLevel = activityMode==='auto' ? level : 'sedentary'` (manual+smartwatch force ×1.2;
  their calories added separately). `heightToCm` (in×2.54), `weightToKg` (lbs×0.453592), `ageFromDob`.
  Call-site target: `calorieTarget = baseTdee + todayBurned`.
- **Water** (`waterCalculation.ts`): `lbs×0.5` oz or `kg×35` mL; ×1.2 if active/very_active; +16 oz / +500 mL creatine; `round`.
- **Activity** (`activityCalculation.ts`): exercise `round(5.0 * kg * minutes/60)` (MET 5); steps `round(steps * (kg/70) * 0.04)`.
- **Calorie proximity** (`calorieColor.ts`): by `|consumed−target|` — ≤25 `#2E7D32`, ≤50 `#4CAF50`, ≤100 `#FFC107`, ≤200 `#FF9800`, else `#F44336`; fallback if target≤0. **(Ported: `Design/CalorieProximityColor.swift`.)**
- **Flame** (`flameColor.ts`): STOPS `[0,120,240,300,420,540]`, COLORS `['#FFC107','#FF9800','#F44336','#3B82F6','#9C27B0','#4CAF50']`, RGB lerp, clamp 0–600; glow `clamp(cal,0,600)/600`. **(Ported: `Design/FlameColor.swift`.)**
- **Weekly rating** (`weeklyRatingCalculation.ts`): 7 days from Monday; per-day fractions for
  food (≥1 food), calories (`|consumed−target| ≤ target*0.1`), weight (entry exists), water
  (`consumed ≥ goal`). `avg=(cal+water+weight+food)/4`; `stars = clamp(round(1+avg*4), 1, 5)`.
- **Dates** (`dateUtils.ts`, all **local-tz** `YYYY-MM-DD`): `getToday`, `formatDisplayDate`,
  `formatShortDate`, `getISOWeekString` (**un-padded** `YYYY-Wn`), `getISOWeekMonday`, `addDays`.
- **Units** (`unitConversion.ts`): `lbsToKg`/`kgToLbs` rounded 1-dp (display); TDEE uses unrounded 0.453592.
- **`generateId`** → `UUID().uuidString.lowercased()`.

## 5. Gamification (`expo/utils/xpCalculation.ts`, `achievementCalculation.ts`, `streakCalculation.ts`, `components/GamificationWatcher.tsx`)

- **XP:** food +5/entry (cap **25/day**), calorie goal +20, water goal +15, weight +10, activity +10 (each once/day via `xpLog`); one-time streak bonuses +50 (7d) / +200 (30d).
- **Levels (10):** thresholds `[0,100,250,500,1000,2000,3500,5500,8000,11000]`; names Novice, Apprentice, Journeyman, Dedicated, Committed, Veteran, Elite, Expert, Master, Legend. Label `"Level N · Name"`, prestige prefix `P{n}`.
- **`ADD_XP` guards:** food `min(amount, 25 − dayLog.food)`; boolean sources no-op if already true.
- **Achievements (8 visible):** streak 7/30/100/365 (🔥⚡🏅🏆), foods 10/50/100/500 (🍎🥗🍽️⭐). `totalFoodsLogged` = sum of all foods across all days. First reactive pass unlocks silently; later unlocks toast.
- **Synthetic guard ids** `xp_streak_7` / `xp_streak_30` live only in `unlockedAchievements` (not shown) to gate the one-time streak XP bonuses.
- **Streaks:** `current` = consecutive days back from today (inclusive); `longest` across all dates. Variants: food, calorieGoal(±10%), weight, activity.
- **Prestige:** only at Level 10; confirm → `totalXp=0`, `prestige++`; repeatable.
- **Weekly recap trigger:** `getISOWeekString(getToday()) !== lastRecapShownWeek` (and Monday for auto-open).

## Gotchas
- Dates are local-tz `YYYY-MM-DD` strings compared lexicographically (zero-padded). Reproduce with a fixed local `DateFormatter`, never UTC/ISO.
- Day arrays kept newest-first by upsert helpers; "latest" lookups usually re-sort explicitly.
- `xpLog` key = `YYYY-MM-DD`; `lastRecapShownWeek` = un-padded `YYYY-Wn`.
- Water `amount` unit is implicit from `preferences.unit`.
