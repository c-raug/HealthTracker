# HealthTracker

A cross-platform mobile app (iOS & Android) built with React Native (Expo) for tracking weight, nutrition, and activity — inspired by MyFitnessPal.

## Features

### Weight Tab
- Log your weight for any date with date navigation arrows
- Inline save confirmation (no popup) with timestamp
- Single scrollable screen — entry at top, chart and insights always visible below
- **Line chart** (last 30 entries, linear interpolation) with history list and delete support
- **Progress insights card** — 7-day change, estimated weekly rate, and on-track/behind/ahead status badge vs. your weight goal
- **"Go to Today" pill** — appears when you're viewing a past date; taps back to today
- Switch between **lbs** and **kg** — preference saved locally

### Nutrition Tab
- **TDEE-based calorie target** using the Mifflin-St Jeor equation; exercise calories from the Activities tab are added when applicable
- **Calorie ring** (SVG donut) — consumed vs target; shows "+N cal from exercise" when activity is logged
- **Water bottle visual** — animated fill graphic beside the calorie ring; shows consumed/goal and fill percentage; turns green at 100%; tap to expand the Water tracker below
- **Macro progress bars** for protein, carbs, and fat with configurable splits (Balanced, High Protein, Keto, or Custom)
- **Four meal categories**: Breakfast, Lunch, Dinner, Snacks — each collapsible with calorie totals
- **Custom food library** — create, edit, pin, and delete personal foods; calories auto-computed from macros; pinned foods surface first in search results
- **Saved meal templates** — group foods into reusable meals; pin meals to specific categories so they appear first
- **Portion selector** — dual drum scroll wheels (whole 0–250 + fraction in ⅛ increments) with live calorie/macro preview; available when adding a food and when editing an already-logged item
- **Drag-to-reorder** food items within meal categories
- **Swipe-to-delete** food items
- **Water tracker** (collapsible card) — three customisable quick-add preset buttons (long-press to edit; defaults 8 / 16 / 32 oz or 250 / 500 / 750 mL), custom amount input, and a per-entry delete list; auto-expands when the water bottle visual is tapped
- **"Go to Today" pill** — same pattern as Weight tab
- Date navigation matching the Weight screen pattern

### Activities Tab
- Log exercise and steps for any date with date navigation
- **Three tracking modes** — Auto (exercise is reference-only; TDEE activity level handles the burn), Manual (all logged calories add to your nutrition target), Smartwatch (only smartwatch entries add to target)
- **Exercise logging** — category/type selection with hour + minute drum pickers; live calorie burn preview
- **Step logging** — numeric input with calorie preview
- **Calories burned summary card** — total for the selected day
- **Dismissible mode-change warnings** — amber strip on entries logged under a different mode
- **"Go to Today" pill** and **"Change tracking mode →"** deep-link to Settings
- Requires a profile + weight entry (shows a prompt otherwise)

### Settings Tab
- **Profile** (collapsible) — name, date of birth, sex, height
- **Goals & Calorie Target** (collapsible) — weight goal drum wheel, activity level (auto mode only), activity tracking mode with info buttons; deep-linkable from Activities tab
- **Macros** (collapsible) — preset buttons + custom % inputs; gram equivalents shown for each preset; ⓘ icon explains how grams factor in activity average
- **Daily Water Goal** (collapsible) — Auto / Manual toggle; Auto mode calculates goal from body weight and activity level with an optional creatine adjustment (+16 oz / +500 mL); Manual mode lets you enter a fixed daily target
- **App Configuration** (collapsible) — default tab picker, accent colour picker (6 presets)
- **Units** — lbs / kg toggle
- **Data Backup** — save / load via OS share sheet or file picker
- **Send Feedback** — in-app feedback form

### Onboarding
- **5-step wizard** on first launch: (1) unit + name, (2) DOB + sex + height, (3) activity level + weight goal, (4) macro preset (skippable), (5) starting weight
- **Welcome screen** with "Start New Profile" and "Load Saved Data" options

### Data Backup
- **Save backup** — opens the OS share sheet on native (iOS/Android) or downloads a `.json` file on web
- **Load backup** — opens the OS document picker on native or a file picker on web
- Available via the Settings tab; also accessible from the Welcome screen on first launch

### General
- All data stored on-device (no accounts or internet connection required)
- Full **dark mode** support throughout via `useColors()` and `constants/theme.ts`

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo SDK 54 (managed workflow) |
| Language | TypeScript |
| Routing | Expo Router v6 (file-based tabs + modal routes) |
| Storage | AsyncStorage (`@react-native-async-storage/async-storage`) |
| Charts | react-native-chart-kit + react-native-svg (weight) / custom SVG (calorie ring) |
| State | React Context + useReducer |
| Gestures | react-native-gesture-handler + react-native-reanimated |
| Food Data | Local custom food library (no external API) |
| Drag & Drop | react-native-draggable-flatlist |
| Date Picker | @react-native-community/datetimepicker |
| Icons | @expo/vector-icons (Ionicons) |
| Backup | expo-sharing + expo-document-picker |

---

## Project Structure

```
app/
├── _layout.tsx              # Root Stack layout (GestureHandlerRootView, AppProvider, nav gating)
├── welcome.tsx              # Welcome screen — Start New Profile / Load Saved Data
├── onboarding.tsx           # 5-step onboarding wizard
├── add-food-modal.tsx       # Full-screen modal: Add Food / Add Meal tabs
└── (tabs)/
    ├── _layout.tsx          # Tab bar (Weight, Nutrition, Activities, Settings) + Ionicons
    ├── index.tsx            # Weight screen — entry, chart, insights (single scroll)
    ├── nutrition.tsx        # Nutrition screen — calorie ring, macro bars, meal categories
    ├── activities.tsx       # Activities screen — exercise/steps logging, calorie burn summary
    └── settings.tsx         # Settings screen (Profile, Goals, Units, Macros)

components/
├── WeightChart.tsx          # Line chart (react-native-chart-kit, linear)
├── WeightInsights.tsx       # 7-day progress insights card (rate, on-track badge)
├── WeightEntryList.tsx      # FlatList of all entries, newest first
├── WeightEntryItem.tsx      # Single entry row with delete + confirmation
├── InfoModal.tsx            # Reusable info/help overlay modal
├── activities/
│   └── (activity-specific components)
├── settings/
│   ├── ProfileSection.tsx   # Name, DOB picker, sex toggle, height input
│   ├── GoalsSection.tsx     # Weight goal drum, activity level, tracking mode
│   ├── MacroSection.tsx     # Macro preset buttons + custom % + gram equivalents + ⓘ tooltip
│   ├── WaterGoalSection.tsx # Auto/Manual toggle + creatine flag + manual override input
│   ├── ThemeColorPicker.tsx # 6-swatch accent colour picker
│   └── FeedbackSection.tsx  # In-app feedback text input + submit
└── nutrition/
    ├── CalorieRing.tsx      # SVG donut chart (consumed vs target)
    ├── MacroProgressBars.tsx # Protein/Carbs/Fat horizontal progress bars
    ├── MealCategory.tsx     # Collapsible meal section with header + food list
    ├── FoodItem.tsx         # Food row with drag handle, swipe-to-delete, tap-to-edit bottom sheet
    ├── PortionSelector.tsx  # Dual drum wheels (whole + fraction) + live macro preview
    ├── AddFoodTab.tsx       # Custom food search + create/edit/pin/delete + SectionList (Pinned/MyFoods)
    ├── AddMealTab.tsx       # Saved meals list + pin to categories / edit / delete
    ├── CustomFoodForm.tsx   # Create or edit a custom food (qty/unit picker + auto-calories)
    ├── CreateMealFlow.tsx   # Name meal + search/add custom foods (SectionList)
    ├── EditMealFlow.tsx     # Edit an existing saved meal template
    ├── WaterTracker.tsx     # Collapsible water log card (presets, custom input, entry list)
    ├── WaterBottleVisual.tsx # Animated bottle fill graphic (spring animation, green at 100%)
    └── ProfilePrompt.tsx    # CTA card when profile or weight entry is missing

context/AppContext.tsx       # Global state (weight entries, nutrition log, activity log, custom foods, saved meals, preferences)
storage/
├── storage.ts               # AsyncStorage read/write helpers
└── backupStorage.ts         # Cross-platform backup: share sheet / file picker
types/index.ts               # All TypeScript interfaces and type unions
constants/theme.ts           # Colors, Typography, Spacing, Radius design tokens
utils/
├── dateUtils.ts             # getToday, formatDisplayDate, formatShortDate, addDays
├── unitConversion.ts        # lbsToKg, kgToLbs, convertWeight, weightToKg
├── generateId.ts            # Shared UUID v4 generator
├── tdeeCalculation.ts       # Mifflin-St Jeor BMR/TDEE, goal calorie offset, ageFromDob
├── activityCalculation.ts   # calculateExerciseCalories (MET-based), calculateStepCalories
└── waterCalculation.ts      # calculateWaterGoal (weight-based, ×1.2 active multiplier, creatine flag)
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
  height?: number;         // cm
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
  waterGoalMode?: 'auto' | 'manual';
  waterGoalOverride?: number;          // manual daily target (oz or mL)
  waterCreatineAdjustment?: boolean;   // adds +16 oz / +500 mL to auto goal
  waterPresets?: [number, number, number]; // quick-add button values
}

type ActivityMode = 'auto' | 'manual' | 'smartwatch';

interface ActivityEntry {
  id: string;
  type: 'exercise' | 'steps' | 'smartwatch';
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
  createdAt: string;
}

interface SavedMeal {
  id: string; name: string;
  foods: NutritionFoodItem[];
  pinnedCategories?: MealCategory[];
  createdAt: string;
}

interface WaterEntry {
  id: string;
  amount: number; // oz (unit=lbs) or mL (unit=kg)
}

interface DayWater {
  date: string;  // "YYYY-MM-DD"
  entries: WaterEntry[];
}
```

AsyncStorage keys: `weight_entries`, `user_preferences`, `nutrition_log`, `custom_foods`, `saved_meals`, `activity_log`, `water_log`

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
