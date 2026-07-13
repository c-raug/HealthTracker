# RN / Expo → native iOS mapping

Reference when replacing an Expo/RN construct with its native equivalent. Source deps:
`expo/package.json`, `expo/app.json`. Bundle id `com.healthtracker.app` (dev: `.native`), iOS 26,
portrait, iPhone-only, local-only (no backend).

| RN / Expo construct | Where used | Native iOS / SwiftUI |
|---|---|---|
| expo-router Stack + modal presentations | `expo/app/**` | `NavigationStack` + `.sheet` / `.fullScreenCover` |
| PillTabBar (custom BottomTabBar) | `components/navigation/PillTabBar.tsx` | Custom bar over `.ultraThinMaterial` / iOS 26 Liquid Glass, or styled `TabView` |
| AsyncStorage (7 blobs) + `useReducer` | `storage/storage.ts`, `context/AppContext.tsx` | `@Observable AppStore` + Codable → 7 JSON files; UserDefaults for tiny prefs |
| expo-file-system (backup + avatar) | `storage/backupStorage.ts`, `app/profile-modal.tsx` | `FileManager` (Documents/Caches), atomic writes |
| expo-sharing | `storage/backupStorage.ts` | `ShareLink` / UIActivityViewController |
| expo-document-picker | `storage/backupStorage.ts` | `.fileImporter` |
| expo-image-picker (avatar) | `app/profile-modal.tsx` | PhotosUI `PhotosPicker` (+ crop) |
| @react-native-community/datetimepicker | index/activities/nutrition/home/profile/onboarding/ProfileSection | `DatePicker` |
| react-native-svg (ring, flame, bars) | CalorieRing, CalorieFlame, WeeklyIntakeGraph | `Path`/`Shape`/`Canvas`; **Swift Charts** for bar/line |
| react-native-chart-kit (LineChart) | `components/WeightChart.tsx` | Swift Charts `LineMark` |
| expo-linear-gradient | feature cards, charts, many | `LinearGradient` |
| expo-blur `BlurView` | PillTabBar, HeaderXpBar, CollapsibleTabHeader, EdgeBlurFade, FloatingPillBar | `.ultraThinMaterial` / `.regularMaterial` |
| gesture-handler `Swipeable` | `FoodItem.tsx`, `MealCategory.tsx` | `.swipeActions` |
| react-native-draggable-flatlist | AddFoodTab, AddMealTab, MealCategory | `List` `.onMove` (edit mode) / `.draggable` |
| RN `Animated` / `requestAnimationFrame` | ToastNotification, WaterBottleVisual, MoreMenuPopover, HeaderXpBar, FoodFilterModal, DigitalScale | `withAnimation` / `.animation` / `Animatable` / `TimelineView` |
| @expo/vector-icons (Ionicons) | throughout | SF Symbols (`Image(systemName:)`) |
| expo-status-bar | `app/_layout.tsx` | automatic / `.preferredColorScheme` |
| @sentry/react-native | `utils/crashReporting.ts` (dynamic, DSN present) | Sentry Cocoa (same DSN, 0.2 sample) or MetricKit/OSLog; keep local crash-log fallback |
| useColors() + ThemeContext | `constants/theme.ts`, `_layout.tsx` | `@Observable AppTheme` in Environment + `.tint` + `.preferredColorScheme` (**done in Phase 1**) |

## Notable
- **No haptics** in the RN app (no `expo-haptics`) — CoreHaptics is a net-new Phase 14 nicety.
- **@react-native-community/slider** is declared but unused — nothing to port.
- **react-native-reanimated / worklets** are transitive only (not imported) — ignore.
- Animation is all RN-core `Animated` + `rAF` (no Reanimated in source) → all map to SwiftUI native animation.
- `react-native-safe-area-context` → `safeAreaInsets` / `GeometryReader`.

## Crash reporting
`SENTRY_DSN = https://94fe48e74add1c8ad27e2d9e440552e3@o4511175437647872.ingest.us.sentry.io/4511175443480576`,
`tracesSampleRate 0.2`, local key `@crash_log`. Phase 14 decision: Sentry Cocoa vs MetricKit/OSLog.
