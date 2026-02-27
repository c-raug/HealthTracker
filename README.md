# HealthTracker

A cross-platform mobile app (iOS & Android) built with React Native (Expo) for tracking daily weight and visualizing progress over time.

## Features

- Log your weight for any date with a clean, keyboard-friendly form
- View your history as a line chart (last 30 entries) and a scrollable list
- Delete any past entry with a confirmation prompt
- Switch between **lbs** and **kg** — preference saved locally
- All data stored on-device (no accounts or internet required)

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo (SDK 52, managed workflow) |
| Language | TypeScript |
| Routing | Expo Router v4 (file-based) |
| Storage | AsyncStorage (on-device) |
| Charts | react-native-chart-kit |
| State | React Context + useReducer |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo Go](https://expo.dev/go) app on your iOS or Android device, **or** an iOS Simulator / Android Emulator

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd HealthTracker

# Install dependencies
npm install

# Start the development server
npm start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS) to open the app on your device.

### Running on Simulators

```bash
# iOS Simulator (macOS only)
npm run ios

# Android Emulator
npm run android
```

## Project Structure

```
app/
├── _layout.tsx          # Root Stack layout (wraps AppProvider)
├── (tabs)/
│   ├── _layout.tsx      # Tab bar (Home, History, Settings)
│   ├── index.tsx        # Home / Dashboard screen
│   ├── history.tsx      # History screen (chart + list)
│   └── settings.tsx     # Settings screen (unit preference)
└── log-weight.tsx       # Log Weight modal

components/
├── WeightChart.tsx      # Line chart (react-native-chart-kit)
├── WeightEntryList.tsx  # FlatList of all entries
└── WeightEntryItem.tsx  # Single entry row with delete

context/AppContext.tsx   # Global state (entries + preferences)
storage/storage.ts       # AsyncStorage read/write helpers
types/index.ts           # TypeScript interfaces
utils/
├── dateUtils.ts         # Date formatting helpers
└── unitConversion.ts    # lbs ↔ kg conversion
```

## Roadmap

See [prd.md](./prd.md) for the full product requirements and future phases (caloric intake, activity tracking, and more).
