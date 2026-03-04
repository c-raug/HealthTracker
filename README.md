# HealthTracker

A cross-platform mobile app (iOS & Android) built with React Native (Expo) for tracking daily weight and nutrition, inspired by MyFitnessPal.

## Features

### Weight Tracking
- Log your weight for any date with date navigation arrows and a native date picker
- Toggle between **Log** and **History** views within the same screen — no separate tab
- View your history as a line chart (last 30 entries) and a scrollable list
- Delete any past entry with a confirmation prompt
- Switch between **lbs** and **kg** — preference saved locally

### Nutrition Tracking
- **TDEE calculation** based on user profile (age, sex, height, activity level, weight goal) using the Mifflin-St Jeor equation
- **Calorie ring chart** (SVG donut) showing consumed vs target with color indicators (green/yellow/red)
- **Macro progress bars** for protein, carbs, and fat with configurable splits (Balanced, High Protein, Keto, or Custom)
- **Four meal categories**: Breakfast, Lunch, Dinner, Snacks — each collapsible with calorie totals
- **Food search** via USDA FoodData Central API (Foundation + SR Legacy data types; requires free API key in `.env`)
- **Custom foods** — create and save personal foods with full nutritional info; calories auto-computed from macros
- **Saved meals** — group foods into reusable meals that can be added with one tap
- **Portion selector** — dual sliders (whole 0–250 + fraction in ⅛ increments) with keypad toggle and live calorie/macro preview; available before adding a food and when editing an already-logged item
- **Drag-to-reorder** food items within meal categories
- **Swipe-to-delete** food items
- Date navigation matching the Weight screen pattern

### Settings
- **Collapsible sections** — Profile and Macro Split sections expand/collapse with a chevron header
- **Macro gram display** — computed grams shown alongside each percentage (e.g. 150g protein) for all presets and custom inputs; requires a completed profile and weight entry

### General
- All data stored on-device (no accounts required; USDA food search requires internet + API key)
- Dark mode support throughout

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo SDK 54 (managed workflow) |
| Language | TypeScript |
| Routing | Expo Router v6 (file-based) |
| Storage | AsyncStorage (`@react-native-async-storage/async-storage`) |
| Charts | react-native-chart-kit + react-native-svg (weight) / custom SVG (calorie ring) |
| State | React Context + useReducer |
| Food Data | USDA FoodData Central API (free key in `.env`) + local custom foods |
| Drag & Drop | react-native-draggable-flatlist |
| Icons | @expo/vector-icons (Ionicons) |

---

## Project Structure

```
app/
├── _layout.tsx              # Root Stack layout (wraps AppProvider, modal route)
├── add-food-modal.tsx       # Full-screen modal: Add Food / Add Meal tabs
└── (tabs)/
    ├── _layout.tsx          # Tab bar (Weight, Nutrition, Settings) + Ionicons
    ├── index.tsx            # Weight screen — Log/History toggle, date picker, chart
    ├── nutrition.tsx        # Nutrition screen — calorie ring, macro bars, meal categories
    └── settings.tsx         # Settings screen (collapsible profile, macros, units)

api/
└── usdaFoodData.ts          # USDA FoodData Central API search client

components/
├── WeightChart.tsx          # Line chart (react-native-chart-kit)
├── WeightEntryList.tsx      # FlatList of all entries, newest first
├── WeightEntryItem.tsx      # Single entry row with delete + confirmation
├── settings/
│   ├── ProfileSection.tsx   # Profile form (age, sex, height, activity, goal)
│   └── MacroSection.tsx     # Macro split presets + custom % + live gram display
└── nutrition/
    ├── CalorieRing.tsx      # SVG donut chart (consumed vs target)
    ├── MacroProgressBars.tsx # Protein/Carbs/Fat horizontal progress bars
    ├── MealCategory.tsx     # Collapsible meal section with header + food list
    ├── FoodItem.tsx         # Food row with drag handle, swipe-to-delete, tap-to-edit
    ├── PortionSelector.tsx  # Dual sliders + keypad toggle + live macro preview
    ├── AddFoodTab.tsx       # Food search (USDA + custom foods) + create custom
    ├── AddMealTab.tsx       # Saved meals list + create new meal
    ├── CustomFoodForm.tsx   # Form to create a custom food (qty/unit + auto-calories)
    ├── CreateMealFlow.tsx   # Name meal + search/add foods to it
    └── ProfilePrompt.tsx    # CTA card when profile or weight is missing

context/AppContext.tsx       # Global state (weight, nutrition, custom foods, saved meals)
storage/storage.ts           # AsyncStorage read/write helpers
types/index.ts               # All TypeScript interfaces and type unions
constants/theme.ts           # Colors, Typography, Spacing, Radius tokens
utils/
├── dateUtils.ts             # getToday, formatDisplayDate, formatShortDate, addDays
├── unitConversion.ts        # lbsToKg, kgToLbs, convertWeight
├── generateId.ts            # Shared UUID v4 generator
└── tdeeCalculation.ts       # Mifflin-St Jeor BMR, TDEE, goal calorie calculation
```

---

## USDA API Key Setup

Food search uses the USDA FoodData Central API. A free key is required:

1. Register at [https://fdc.nal.usda.gov/api-key-signup.html](https://fdc.nal.usda.gov/api-key-signup.html)
2. Create a `.env` file in the project root:
   ```
   EXPO_PUBLIC_USDA_API_KEY=your_key_here
   ```
3. Restart Metro after adding the key

---

## Data Model

```ts
interface WeightEntry {
  id: string;        // UUID
  date: string;      // ISO date "YYYY-MM-DD"
  weight: number;    // stored in the user's selected unit
  unit: 'lbs' | 'kg';
  createdAt: string; // ISO timestamp
}

interface UserPreferences {
  unit: 'lbs' | 'kg';
  profile?: UserProfile;       // age, sex, height, activity, goal
  macroPreset?: MacroPreset;   // 'balanced' | 'high_protein' | 'keto' | 'custom'
  macroSplit?: MacroSplit;     // { protein, carbs, fat } percentages
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

interface CustomFood { /* id, name, calories, protein, carbs, fat, servingSize, createdAt */ }
interface SavedMeal  { /* id, name, foods: NutritionFoodItem[], createdAt */ }
```

AsyncStorage keys: `weight_entries`, `user_preferences`, `nutrition_log`, `custom_foods`, `saved_meals`

---

## Local Development (Mac)

All dependencies and scripts work identically on a local Mac — none of the Codespace fixes were environment-specific.

### Prerequisites

- **Node.js 20+** — required by Expo SDK 54. Check with `node -v`; install from [nodejs.org](https://nodejs.org/) if needed
- **Expo Go (SDK 54)** on your phone — the same app used for Codespace development
- **Xcode** (optional) — for iOS Simulator; install from the Mac App Store
- **Android Studio** (optional) — for Android Emulator; install from [developer.android.com](https://developer.android.com/studio)

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

> **Different network?** If your phone isn't on the same Wi-Fi as your Mac, use `npm run tunnel` instead of `npm start`. This spins up an ngrok tunnel exactly like the Codespace workflow.

### Live development (same as Codespace)

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

**GitHub Codespaces** runs the Expo development server in the cloud. **Expo tunnel** (`--tunnel`) creates a public URL via ngrok so your phone can reach that server from anywhere. **Expo Go** (free app) connects to that URL and renders the app natively.

### Prerequisites

1. **GitHub account** with this repository
2. **Expo Go** installed on your phone — must be **SDK 54**:
   - iOS: [App Store → Expo Go](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play → Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Starting a dev session

1. Go to `github.com/[your-username]/HealthTracker`
2. Tap **Code** → **Codespaces** tab → **Create codespace on main**
   - If you have an existing Codespace, reopen it instead
3. Wait ~30 seconds for the Codespace to finish setting up (the `postCreateCommand` runs `npm install --legacy-peer-deps` automatically)
4. Open the **Terminal** panel (hamburger menu → Terminal → New Terminal)
5. Run:
   ```bash
   npm run tunnel
   ```
6. Wait ~20–30 seconds for a QR code and a URL starting with `exp://`
7. Open **Expo Go** → tap **Scan QR Code** → point at the QR code in the terminal

> **If reopening an existing Codespace** (not creating fresh): `postCreateCommand` does not re-run. Just open the terminal and run `npm run tunnel` directly — packages are already installed.

### Live development

- **Hot reload**: code changes apply automatically within a few seconds
- **Force full reload**: press `r` in the terminal
- **Open JS debugger**: press `j` in the terminal
- **Redisplay QR code**: press `c` in the terminal

### Ending a session

1. Press `Ctrl+C` to stop Expo
2. To pause billing: GitHub profile → **Codespaces** → `...` → **Stop codespace**

> **Free tier:** GitHub Free gets ~60 core-hours/month (roughly 60 hours on a 2-core Codespace). You'll receive an email warning before hitting the limit.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| QR code won't scan | Press `c` in the terminal to redisplay it |
| App not updating after a change | Press `r` in terminal, or shake your phone → **Reload** |
| Tunnel is slow to start | Wait up to 60 seconds — ngrok can take a moment to initialise |
| `@expo/ngrok` not found | Run `npm install --legacy-peer-deps` first, then retry `npm run tunnel` |
| Codespace went to sleep | Reopen it at github.com → Codespaces, then run `npm run tunnel` again |
| "Something went wrong" in Expo Go | Stop Expo (`Ctrl+C`), run `npm run tunnel` again, rescan QR code |
