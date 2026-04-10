# HealthTracker

A cross-platform mobile app (iOS & Android) built with React Native (Expo) for tracking weight, nutrition, and activity — inspired by MyFitnessPal.

## Features

### Weight Tab
- Log your weight for any date with date navigation arrows
- Inline save confirmation (no popup) with timestamp
- Single scrollable screen — entry at top, chart and insights always visible below
- **Line chart** with **dropdown range selector** (1W / 1M / 3M / 1Y / All) — tapping the pill opens an action sheet; summary row shows Start weight, Change (color-coded), and Current weight
- **Progress insights card** — 7-day change, estimated weekly rate, and on-track/behind/ahead status badge vs. your weight goal
- **"Go to Today" pill** — appears when you're viewing a past date; taps back to today
- Switch between **lbs** and **kg** — preference saved locally

### Nutrition Tab
- **TDEE-based calorie target** using the Mifflin-St Jeor equation; exercise calories from the Activities tab are added when applicable
- **3-page swipeable pager** — Page 0: Weekly Calorie Graph, Page 1 (center, default): Calorie Ring + Water Bottle, Page 2: Weekly Water Graph; page dot indicators below; resets to center on tab focus
- **Calorie ring** (SVG donut) — consumed vs target with **proximity-based colors** (dark green when on target, transitioning through green/yellow/orange/red as delta grows); shows "+N cal from exercise" when activity is logged
- **Water bottle visual** — animated fill graphic beside the calorie ring; shows consumed/goal and fill percentage; glows blue at 100%; tap to expand the Water tracker below
- **Weekly graphs with tap-to-tooltip** — tapping a bar shows a floating tooltip with date + value (calorie graph includes colored P/C/F macro breakdown); tapping again or pressing × dismisses
- **Macro progress bars** for protein, carbs, and fat with configurable splits (Balanced, High Protein, Keto, or Custom)
- **Four meal categories**: Breakfast, Lunch, Dinner, Snacks — each collapsible with calorie totals
- **Copy meal from previous day** — copy icon in meal category header copies foods from yesterday with confirmation
- **Swipe-left to save meal** — swipe a meal category header left to save its foods as a reusable meal template
- **Saved meal groups** — foods added via a saved meal are grouped under a collapsible header showing meal name + total calories; swipe left on a group header to remove the entire meal
- **Quick Add** — fast calorie-only entries via the "Quick Add" tab in the add-food modal; optional name label (defaults to "Quick Add"); quick-added items display with italic name and "Quick" badge in the meal log; tap to edit calories or name
- **Recent foods** — when no search query is active, the food picker shows a "Recent" section with up to 7 most-frequently-logged foods (sorted by frequency), replacing the full "My Foods" list; typing a search query reveals all matching custom foods
- **Custom food library** — create, edit, pin, and delete personal foods; calories auto-computed from macros; pinned foods surface first with drag-to-reorder in Edit mode
- **Saved meal templates** — group foods into reusable meals; pin meals to specific categories so they appear first; drag-to-reorder pinned meals in Edit mode
- **Portion selector** — dual drum scroll wheels (whole 0–250 + fraction in ⅛ increments) with live calorie/macro preview; available when adding a food and when editing an already-logged item
- **Drag-to-reorder** food items within meal categories
- **Swipe-to-delete** food items
- **Water tracker** (collapsible card) — three customisable quick-add preset buttons (long-press to edit; defaults 8 / 16 / 32 oz or 250 / 500 / 750 mL), collapsed header shows quick-add pill, custom amount input, and a grouped per-entry delete list; auto-expands when the water bottle visual is tapped
- **"Go to Today" pill** — same pattern as Weight tab
- Date navigation matching the Weight screen pattern

### Activities Tab
- Log exercise and steps for any date with date navigation
- **2-page swipeable pager** — Page 0: CalorieFlame visual (SVG flame outline with total burned overlay), Page 1: Weekly Activity Graph (7-day bar chart with tap-to-tooltip); resets to page 0 on tab focus
- **Three tracking modes** — Auto (exercise is reference-only; TDEE activity level handles the burn), Manual (all logged calories add to your nutrition target), Smartwatch (only smartwatch entries add to target)
- **Activity Tracking Mode** — configured in ProfileCard on the Profile tab (Auto/Manual/Smart Watch pills with info icons)
- **Exercise logging** — collapsible section with exercise type pill + hour/minute drum pickers + calorie burn preview
- **Step logging** — collapsible section with numeric input + calorie preview (input and button side-by-side)
- **Smartwatch input** — dedicated calorie entry field (visible only in Smartwatch mode) with "Entry saved" confirmation toast
- **Activity log** — list of logged activities with delete support; visible in Auto and Manual modes, hidden in Smartwatch mode
- **Dismissible mode-change warnings** — amber strip on entries logged under a different mode
- **"Go to Today" pill** and **"Change tracking mode →"** deep-link to Profile
- Requires a profile + weight entry (shows a prompt otherwise)

### Profile Tab
- **ProfileCard** (always visible) — circular avatar (tap to pick from camera roll, falls back to initials or default icon), user name, height, current weight, and activity level; tap to expand inline edit form with Name, DOB, Sex, Height, Activity Tracking Mode (Auto/Manual/Smart Watch), and Activity Level
- **Badges** (collapsible) — XP/level display always visible (⭐ level name + XP progress bar; at Level 10 a "Prestige →" button resets XP and increments prestige counter); four streak badges: Calorie Goal, Weight, Food, and Activity (collapsed pill row / expanded streak cards); 8 permanently-unlockable achievement tiles in a 2-column grid (4 streak milestones × 7/30/100/365 days, 4 food-logged milestones × 10/50/100/500 entries) — unlocked in full color, locked in gray with a lock icon
- **Food Library →** — navigates to Food Library modal; two tabs: Foods (alphabetical list of all custom foods with create/edit/delete) and Meals (alphabetical list of all saved meal templates with create/edit/delete)
- **Nutrition Goals →** — navigates to Nutrition Goals modal (Goals & Calorie Target, Macros with gram equivalents, Daily Water Goal with auto/manual + creatine adjustment)
- **Appearance →** — navigates to Appearance modal (Light/Dark/System mode picker + 6-swatch accent color picker)
- **App Settings →** — navigates to App Settings modal (Default Tab, Weight Unit, Expand sections toggle, Data Backup, Debug Info with crash log viewer)
- **Send Feedback** — in-app feedback form; also reachable via the feedback button in the header of all other tabs
- **Footer** — app version string

### Onboarding
- **5-step wizard** on first launch: (1) unit + name, (2) DOB + sex + height, (3) activity level + weight goal, (4) macro preset (skippable), (5) starting weight
- **Welcome screen** with "Start New Profile" and "Load Saved Data" options

### Data Backup
- **Save backup** — opens the OS share sheet on native (iOS/Android) or downloads a `.json` file on web
- **Load backup** — opens the OS document picker on native or a file picker on web
- Available via the Settings tab; also accessible from the Welcome screen on first launch

### General
- All data stored on-device (no accounts or internet connection required)
- Full **dark mode** support with Light / Dark / System appearance modes
- **6 accent color themes** — Green (default), Blue, Orange, Purple, Red, Teal
- **Global feedback button** — chatbubble icon in the header of Weight, Nutrition, and Activities tabs; taps navigate to the feedback form on the Profile tab
- **XP & level system** — earn XP for daily actions (food logging, hitting calorie/water goals, logging weight/activity, streak bonuses); 10 named levels (Novice → Legend); level-up toast notification; Prestige system for indefinite progression
- **Achievement badges** — 8 permanently-unlockable milestones (streak and food-logged); toast notification on first unlock; persisted across restarts
- **Error boundary** — catches unhandled JS exceptions, logs crash details to AsyncStorage, renders a "Something went wrong" fallback with Restart button; optional Sentry integration via `SENTRY_DSN`
- **Shared date state** — changing the date on any tab instantly reflects on all others; resets to today on app restart
- **Collapsible sections** — all sections default to collapsed; "Expand sections by default" toggle available in App Settings

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo SDK 54 (managed workflow) |
| Language | TypeScript |
| Routing | Expo Router v6 (file-based tabs + modal routes) |
| Storage | AsyncStorage (`@react-native-async-storage/async-storage`) |
| Charts | react-native-chart-kit + react-native-svg (weight chart) / custom SVG (calorie ring, bar graphs, flame) |
| State | React Context + useReducer |
| Gestures | react-native-gesture-handler + react-native-reanimated |
| Food Data | Local custom food library (no external API) |
| Drag & Drop | react-native-draggable-flatlist |
| Date Picker | @react-native-community/datetimepicker |
| Icons | @expo/vector-icons (Ionicons) |
| Image Picker | expo-image-picker (avatar photos) |
| Crash Reporting | Optional Sentry integration (`@sentry/react-native`) |
| Backup | expo-sharing + expo-document-picker |

---

## Project Structure

```
app/
├── _layout.tsx              # Root Stack layout (GestureHandlerRootView, SafeAreaProvider, AppProvider, ThemeColorSync, ErrorBoundary)
├── welcome.tsx              # Welcome screen — Start New Profile / Load Saved Data
├── onboarding.tsx           # 5-step onboarding wizard
├── add-food-modal.tsx       # Full-screen modal: Add Food / Add Meal / Quick Add tabs
├── create-meal-modal.tsx    # Pre-populated CreateMealFlow for saving a meal category
├── app-settings-modal.tsx   # App Settings sub-screen (Default Tab, Units, Expand toggle, Backup, Debug Info)
├── appearance-modal.tsx     # Appearance sub-screen (Color Mode + Accent Color)
├── nutrition-goals-modal.tsx # Nutrition Goals sub-screen (Goals, Macros, Water Goal)
├── food-library-modal.tsx   # Food Library sub-screen (Foods + Meals tabs with create/edit/delete)
├── weekly-recap-modal.tsx   # Full-screen story-style weekly recap (4 pages: Weight, Nutrition, Streaks, Rating)
└── (tabs)/
    ├── _layout.tsx          # Tab bar (Weight, Nutrition, Activities, Profile) + global feedback button
    ├── index.tsx            # Weight screen — entry, chart (with range selector), insights
    ├── nutrition.tsx        # Nutrition screen — 3-page pager (calorie graph / ring+bottle / water graph), macros, meals
    ├── activities.tsx       # Activities screen — 2-page pager (CalorieFlame / WeeklyActivityGraph), exercise/steps/smartwatch logging
    └── settings.tsx         # Profile screen (ProfileCard, Badges, navigation rows to modals, Feedback)

components/
├── ErrorBoundary.tsx        # React error boundary with crash logging and Sentry integration
├── GamificationWatcher.tsx  # Invisible root component — grants XP, unlocks achievements, shows level-up toasts
├── ToastNotification.tsx    # Animated top-of-screen toast banner (slide-in, 3s auto-dismiss)
├── WeightChart.tsx          # Line chart with dropdown range selector (1W/1M/3M/1Y/All) + summary row
├── WeightInsights.tsx       # 7-day progress insights card (rate, on-track badge)
├── WeightEntryList.tsx      # FlatList of all entries, newest first
├── WeightEntryItem.tsx      # Single entry row with delete + confirmation
├── InfoModal.tsx            # Reusable info/help overlay modal
├── activities/
│   └── CalorieFlame.tsx     # SVG flame outline visual with total burned overlay
├── profile/
│   ├── ProfileCard.tsx      # Avatar + summary + inline edit form (name, DOB, sex, height, activity mode)
│   └── BadgesSection.tsx    # XP/level bar + collapsible streaks + achievements grid
├── settings/
│   ├── AppearanceModePicker.tsx # Light / Dark / System 3-card picker
│   ├── ProfileSection.tsx   # Name, DOB picker, sex toggle, height input
│   ├── GoalsSection.tsx     # Weight goal drum, activity level, tracking mode
│   ├── MacroSection.tsx     # Macro preset buttons + custom % + gram equivalents + ⓘ tooltip
│   ├── ThemeColorPicker.tsx # 6-swatch accent colour picker
│   └── FeedbackSection.tsx  # In-app feedback text input + submit (with forwardRef for deep-link focus)
└── nutrition/
    ├── CalorieRing.tsx      # SVG donut chart with proximity-based colors
    ├── MacroProgressBars.tsx # Protein/Carbs/Fat horizontal progress bars
    ├── MealCategory.tsx     # Collapsible meal section with copy-from-yesterday, swipe-to-save-meal, meal groups
    ├── FoodItem.tsx         # Food row with drag handle, swipe-to-delete, tap-to-edit bottom sheet
    ├── PortionSelector.tsx  # Dual drum wheels (whole + fraction) + live macro preview
    ├── AddFoodTab.tsx       # Custom food search + create/edit/pin/delete + Edit mode for pinned reordering
    ├── AddMealTab.tsx       # Saved meals list + pin to categories / edit / delete + Edit mode for pinned reordering
    ├── CustomFoodForm.tsx   # Create or edit a custom food (qty/unit picker + auto-calories)
    ├── CreateMealFlow.tsx   # Name meal + search/add custom foods (SectionList)
    ├── EditMealFlow.tsx     # Edit an existing saved meal template
    ├── QuickAddTab.tsx      # Quick calorie-only entry (name + calories, no portion selector)
    ├── WaterTracker.tsx     # Collapsible water log card (presets, quick-add pill, grouped entries)
    ├── WaterBottleVisual.tsx # Animated bottle fill with blue glow at 100%
    ├── WeeklyIntakeGraph.tsx # WeeklyCalorieGraph, WeeklyWaterGraph, WeeklyActivityGraph (tap-to-tooltip)
    └── ProfilePrompt.tsx    # CTA card when profile or weight entry is missing

context/AppContext.tsx       # Global state (39 action types) with auto-save + auto-backup
context/ToastContext.tsx     # Toast notification context — showToast(), dismiss(), current message
storage/
├── storage.ts               # AsyncStorage read/write helpers
└── backupStorage.ts         # Cross-platform backup: share sheet / file picker + silent auto-backup
types/index.ts               # All TypeScript interfaces and type unions
constants/theme.ts           # Colors, Typography, Spacing, Radius design tokens + ThemeContext + ACCENT_PRESETS
utils/
├── activityCalculation.ts   # calculateExerciseCalories (MET-based), calculateStepCalories
├── calorieColor.ts          # ringColorForProximity() — proximity-based calorie indicator colors
├── crashReporting.ts        # CRASH_LOG_KEY, initCrashReporting(), captureCrash() — optional Sentry integration
├── dateUtils.ts             # getToday, formatDisplayDate, formatShortDate, addDays
├── featureFlags.ts          # Feature flag utilities
├── generateId.ts            # Shared UUID v4 generator
├── achievementCalculation.ts # ACHIEVEMENTS constant + checkNewAchievements() — 8 milestone badges
├── streakCalculation.ts     # foodStreak, calorieGoalStreak, weightStreak, activityStreak
├── tdeeCalculation.ts       # Mifflin-St Jeor BMR/TDEE, goal calorie offset, ageFromDob
├── unitConversion.ts        # lbsToKg, kgToLbs, convertWeight, weightToKg
├── waterCalculation.ts      # calculateWaterGoal (weight-based, ×1.2 active multiplier, creatine flag)
└── xpCalculation.ts         # XP constants, LEVEL_THRESHOLDS, LEVEL_NAMES, getLevelFromXp(), getLevelProgress()
```

---

## Data Model

```ts
interface WeightEntry {
  id: string;        // UUID
  date: string;      // "YYYY-MM-DD"
  weight: number;    // stored in user's selected unit
  unit: 'lbs' | 'kg';
  createdAt: string; // ISO timestamp
}

interface UserProfile {
  name?: string;
  dob?: string;            // "YYYY-MM-DD"
  age?: number;            // legacy fallback
  sex?: 'male' | 'female';
  heightValue?: number;    // numeric height
  heightUnit?: string;     // height unit
  activityLevel?: ActivityLevel;
  weightGoal?: WeightGoal;
  fitnessGoal?: string;
}

interface UserPreferences {
  unit: 'lbs' | 'kg';
  profile?: UserProfile;
  macroPreset?: MacroPreset;
  macroSplit?: MacroSplit;              // { protein, carbs, fat } percentages
  activityMode?: ActivityMode;         // 'auto' | 'manual' | 'smartwatch'
  onboardingComplete?: boolean;
  themeColor?: string;                 // hex accent color
  defaultTab?: string;                 // 'weight' | 'nutrition' | 'activity'
  waterGoalMode?: 'auto' | 'manual';
  waterGoalOverride?: number;          // manual daily target (oz or mL)
  waterCreatineAdjustment?: boolean;   // adds +16 oz / +500 mL to auto goal
  waterPresets?: [number, number, number]; // quick-add button values
  sectionsExpanded?: boolean;          // "Expand sections by default" toggle
  appearanceMode?: 'light' | 'dark' | 'system';
  avatarUri?: string;                  // path to avatar image
  // Gamification
  unlockedAchievements?: string[];     // IDs of permanently unlocked achievements (+ streak XP guards)
  totalXp?: number;                    // cumulative XP (resets to 0 on Prestige)
  prestige?: number;                   // prestige counter (increments on each Prestige)
  xpLog?: Record<string, XpDayLog>;   // per-date XP tracking to prevent duplicate daily grants
}

type ActivityMode = 'auto' | 'manual' | 'smartwatch';
type ExerciseType = 'weight_lifting';

interface ActivityEntry {
  id: string;
  type: 'exercise' | 'steps' | 'smartwatch';
  exerciseType?: ExerciseType;
  date: string;
  durationMinutes?: number;
  steps?: number;
  caloriesBurned: number;
  loggedWithMode?: ActivityMode;
  warningDismissed?: boolean;
}

interface DayActivity {
  date: string;
  activities: ActivityEntry[];
}

interface NutritionFoodItem {
  id: string;
  name: string;
  calories?: number;
  protein?: number; carbs?: number; fat?: number;
  servingSize?: string;
  servings?: number;
  mealGroupId?: string;     // links foods added via a saved meal
  mealGroupName?: string;   // saved meal name for group header
  quickAdd?: boolean;       // true for calorie-only entries from QuickAddTab
}

interface DayNutrition {
  date: string;
  meals: Record<MealCategory, NutritionFoodItem[]>;
}

interface CustomFood {
  id: string; name: string;
  calories: number; protein: number; carbs: number; fat: number;
  servingSize?: string;
  pinned?: boolean;
  pinnedOrder?: number;     // drag-to-reorder position
  createdAt: string;
}

interface SavedMeal {
  id: string; name: string;
  foods: NutritionFoodItem[];
  pinnedCategories?: MealCategory[];
  pinnedOrder?: Record<string, number>; // per-category drag order
  createdAt: string;
}

interface WaterEntry {
  id: string;
  amount: number;       // oz (unit=lbs) or mL (unit=kg)
  loggedAt?: string;    // ISO timestamp
}

interface DayWater {
  date: string;  // "YYYY-MM-DD"
  entries: WaterEntry[];
}
```

AsyncStorage keys: `weight_entries`, `user_preferences`, `nutrition_log`, `custom_foods`, `saved_meals`, `activity_log`, `water_log`, `@healthtracker_last_error` (crash logs)

---

## Local Development (Mac)

### Prerequisites

- **Node.js 20+** — required by Expo SDK 54. Check with `node -v`; install from [nodejs.org](https://nodejs.org/) if needed
- **Expo Go (SDK 54)** on your phone
  - iOS: [App Store → Expo Go](https://apps.apple.com/app/expo-go/id982107779)
  - Android: [Google Play → Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **Xcode** (optional) — for iOS Simulator
- **Android Studio** (optional) — for Android Emulator

### Setup

```bash
git clone <repo-url>
cd HealthTracker
npm install --legacy-peer-deps
```

> Always use `--legacy-peer-deps` — see [CLAUDE.md → Dependency Management](CLAUDE.md) for details.

### Running the app

```bash
npm start
```

Metro starts and shows a QR code. Then choose your target:

| Target | How |
|--------|-----|
| Physical device (Expo Go) | Scan the QR code — phone must be on the **same Wi-Fi** as your Mac |
| iOS Simulator | Press `i` in the terminal (requires Xcode installed) |
| Android Emulator | Press `a` in the terminal (requires Android Studio + emulator already running) |

> **Different network?** Use `npm run tunnel` instead of `npm start`.

### Live development

| Key | Action |
|-----|--------|
| `r` | Force full reload |
| `i` | Open iOS Simulator |
| `a` | Open Android Emulator |
| `j` | Open JS debugger |
| `c` | Show QR code again |
| `Ctrl+C` | Stop Metro |

---

## Codespace Development

This is the no-install workflow — runs entirely in the browser with no local setup required.

### How it works

**GitHub Codespaces** runs the Expo development server in the cloud. **Expo tunnel** (`--tunnel`) creates a public URL via ngrok so your phone can reach that server from anywhere. **Expo Go** connects to that URL and renders the app natively.

### Prerequisites

1. **GitHub account** with this repository
2. **Expo Go (SDK 54)** installed on your phone

### Starting a dev session

1. Go to `github.com/[your-username]/HealthTracker`
2. Tap **Code** → **Codespaces** tab → **Create codespace on main**
3. Wait ~30 seconds for setup (the `postCreateCommand` runs `npm install --legacy-peer-deps` automatically)
4. Open the **Terminal** panel and run:
   ```bash
   npm run tunnel
   ```
5. Wait ~20–30 seconds for a QR code, then scan it in Expo Go

> **Reopening an existing Codespace:** `postCreateCommand` does not re-run. Just open the terminal and run `npm run tunnel` — packages are already installed.

### Ending a session

1. Press `Ctrl+C` to stop Expo
2. To pause billing: GitHub profile → **Codespaces** → `...` → **Stop codespace**

> **Free tier:** GitHub Free gets ~60 core-hours/month.

---

## Android APK Distribution

Tagged releases trigger an automated GitHub Actions pipeline that builds a debug APK via EAS and attaches it to a GitHub Release.

```bash
git tag v1.0.0
git push origin v1.0.0
```

**One-time setup required** — see `.github/workflows/release-android.yml` and `eas.json` for prerequisites (EAS CLI, Expo account, `EXPO_TOKEN` secret).

**Installing on Android:** GitHub repo → Releases → download `.apk` → enable "Install unknown apps" in Android Settings → tap APK.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| QR code won't scan | Press `c` in the terminal to redisplay it |
| App not updating after a change | Press `r` in terminal, or shake your phone → **Reload** |
| Tunnel is slow to start | Wait up to 60 seconds — ngrok can take a moment |
| `@expo/ngrok` not found | Run `npm install --legacy-peer-deps` first, then retry |
| Codespace went to sleep | Reopen at github.com → Codespaces, then run `npm run tunnel` |
| "Something went wrong" in Expo Go | Stop Expo (`Ctrl+C`), run `npm run tunnel` again, rescan QR |
