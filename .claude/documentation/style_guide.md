# HealthTracker UI Style Guide

> **Purpose:** This is the single source of truth for all UI styling decisions in the HealthTracker app. Consult this guide before creating or modifying any component. All patterns documented here reflect the current codebase and must be followed exactly.

---

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [Design Tokens](#2-design-tokens)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing & Layout](#5-spacing--layout)
6. [Border Radius](#6-border-radius)
7. [Shadows & Elevation](#7-shadows--elevation)
8. [Dark Mode](#8-dark-mode)
9. [Component Patterns](#9-component-patterns)
10. [Icons](#10-icons)
11. [Fixed Color Rules](#11-fixed-color-rules)
12. [Modal Sub-Screen Header](#12-modal-sub-screen-header)
13. [Story-Style Full-Screen Modal](#13-story-style-full-screen-modal)
14. [Drag-to-Reorder Pattern](#14-drag-to-reorder-pattern)
15. [iOS 26 Feature Cards](#15-ios-26-feature-cards)

---

## 1. Core Principles

- **Always use design tokens** — never hardcode colors, spacing, font sizes, or border radii. Import from `constants/theme.ts`.
- **Always use `useColors()` + `makeStyles(colors)`** — this is the only way to create component styles. No exceptions.
- **Water UI is always fixed blue** — `#2196F3` and `#E3F2FD`. Never use `colors.primary` for water-related visuals.
- **Calorie proximity colors are computed** — use `ringColorForProximity()` from `utils/calorieColor.ts`. Never hardcode calorie indicator colors.
- **Macro colors are fixed** — Protein `#3B82F6`, Carbs `#F59E0B`, Fat `#EF4444`. These never change with theme.
- **All collapsible sections default to collapsed** — `useState(true)`.
- **One shadow style for all cards** — no variations.

---

## 2. Design Tokens

All tokens are defined in `constants/theme.ts`. Import them as:

```typescript
import { Colors, Typography, Spacing, Radius, useColors, LightColors } from '@/constants/theme';
```

---

## 3. Color System

### Theme Colors (via `useColors()`)

| Token            | Light Mode   | Dark Mode    | Usage                          |
|------------------|-------------|-------------|--------------------------------|
| `primary`        | `#4CAF50`   | `#4CAF50`   | Accent, active states, CTAs    |
| `primaryLight`   | `#E8F5E9`   | `#1A3D20`   | Accent backgrounds, highlights |
| `background`     | `#F7F8FA`   | `#1C1C1E`   | Page background                |
| `card`           | `#FFFFFF`   | `#2C2C2E`   | Card/panel backgrounds         |
| `text`           | `#1A1A2E`   | `#F2F2F7`   | Primary text                   |
| `textSecondary`  | `#6B7280`   | `#8E8E93`   | Labels, hints, muted text      |
| `border`         | `#E5E7EB`   | `#3A3A3C`   | Dividers, borders, bar backgrounds |
| `danger`         | `#EF4444`   | `#FF453A`   | Delete, errors, warnings       |
| `dangerLight`    | `#FEE2E2`   | `#3D1919`   | Error/warning backgrounds      |
| `white`          | `#FFFFFF`   | `#FFFFFF`   | Text on colored backgrounds    |

> **Note:** `primary` and `primaryLight` are overridden by the user's selected accent color via `ThemeContext`. The 6 accent presets are defined in `ACCENT_PRESETS`:
>
> | Preset | Primary   | Light (light mode) | Light (dark mode) |
> |--------|-----------|-------------------|-------------------|
> | Green  | `#4CAF50` | `#E8F5E9`        | `#1A3D20`         |
> | Blue   | `#2196F3` | `#E3F2FD`        | `#1A2D4A`         |
> | Orange | `#FF9800` | `#FFF3E0`        | `#3D2A10`         |
> | Purple | `#9C27B0` | `#F3E5F5`        | `#2A1A3D`         |
> | Red    | `#F44336` | `#FFEBEE`        | `#3D1919`         |
> | Teal   | `#009688` | `#E0F2F1`        | `#1A3333`         |

### Fixed Colors (Never Change with Theme)

| Color     | Hex       | Usage                                         |
|-----------|-----------|-----------------------------------------------|
| Water Blue      | `#2196F3` | All water UI elements (tracker, bottle, bars, presets) |
| Water Blue Light | `#E3F2FD` | Water entry badges, water light backgrounds    |
| Water Glow      | `#64B5F6` | Bottle glow shadow when goal is met            |
| Water Preset Default Border | `#FFFFFF` | White border on middle (quick-add) preset button |
| Save-as-Meal    | `#2196F3` | Swipe action button for "Save as Meal"         |
| Protein         | `#3B82F6` | Macro progress bar and label                   |
| Carbs           | `#F59E0B` | Macro progress bar and label                   |
| Fat             | `#EF4444` | Macro progress bar and label                   |

### Calorie Proximity Colors (Computed)

Use `ringColorForProximity(consumed, target, fallback)` from `utils/calorieColor.ts`:

| Delta (|consumed − target|) | Color     | Meaning    |
|-----------------------------|-----------|------------|
| ≤ 25 calories              | `#2E7D32` | Dark green (on target) |
| ≤ 50 calories              | `#4CAF50` | Green      |
| ≤ 100 calories             | `#FFC107` | Yellow     |
| ≤ 200 calories             | `#FF9800` | Orange     |
| > 200 calories             | `#F44336` | Red        |

Falls back to `fallback` (typically `colors.primary`) when `target ≤ 0`.

---

## 4. Typography

All typography is defined as style objects. Always spread them — never set `fontSize` or `fontWeight` independently.

| Token            | Font Size | Font Weight | Usage                              |
|------------------|-----------|-------------|-------------------------------------|
| `Typography.h1`  | 28        | `'700'`     | Screen titles, large numbers        |
| `Typography.h2`  | 22        | `'600'`     | Section headers, modal titles       |
| `Typography.h3`  | 18        | `'600'`     | Card headers, collapsible titles    |
| `Typography.body`| 16        | `'400'`     | Body text, input text, food names   |
| `Typography.small`| 13       | `'400'`     | Labels, hints, badges, detail text  |

### Correct Usage

```typescript
// CORRECT — spread the token, then add color
headerTitle: {
  ...Typography.h3,
  color: colors.text,
},

// CORRECT — override weight when needed
selectedItem: {
  ...Typography.body,
  color: colors.text,
  fontWeight: '700',
},
```

### Font Weight Reference

Only use these weights (do not invent others):
- `'400'` — normal body text
- `'500'` — medium emphasis (calorie values, secondary labels)
- `'600'` — semi-bold (headers, button labels, active states)
- `'700'` — bold (h1, selected drum items, preset button text)

---

## 5. Spacing & Layout

### Spacing Tokens

| Token        | Value | Usage                                        |
|-------------|-------|----------------------------------------------|
| `Spacing.xs` | 4px   | Tight gaps, icon padding, inline spacing     |
| `Spacing.sm` | 8px   | Element gaps, row spacing, small padding     |
| `Spacing.md` | 16px  | Standard padding, section margins, card padding |
| `Spacing.lg` | 24px  | Large section gaps, generous padding         |
| `Spacing.xl` | 32px  | Bottom scroll padding, page-level spacing    |

### Standard Layout Patterns

```typescript
// Card container padding
padding: Spacing.md,

// Gap between form elements
gap: Spacing.sm,

// Gap between sections / cards
marginBottom: Spacing.md,

// Content area horizontal padding
paddingHorizontal: Spacing.md,

// ScrollView bottom padding (prevent content hidden by tab bar)
paddingBottom: Spacing.xl,

// Tight icon touch areas
padding: Spacing.xs,
```

### Flex Layout Conventions

```typescript
// Row layout (header, list item, button row)
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',

// Centered content
alignItems: 'center',
justifyContent: 'center',
```

### Line Height

| Context              | Value |
|----------------------|-------|
| Body/description text | 18    |
| Warning/info banners  | 17    |
| Default (most text)   | Not set (inherits) |

---

## 6. Border Radius

| Token       | Value | Usage                                  |
|------------|-------|----------------------------------------|
| `Radius.sm` | 8px   | Small elements: badges, input fields, pills, highlight boxes |
| `Radius.md` | 12px  | Buttons, input fields, drum containers |
| `Radius.lg` | 16px  | Cards, containers, modal sheets        |

### Correct Usage

```typescript
// Card container
borderRadius: Radius.lg,

// Button
borderRadius: Radius.md,

// Badge or pill
borderRadius: Radius.sm,

// Progress bar (special case — uses raw value)
borderRadius: 4,
```

---

## 7. Shadows & Elevation

### Standard Card Shadow

Used on most cards: `MealCategory`, `MacroProgressBars`, `WaterTracker`, `WeightChart`, `WeightEntryList`, settings cards, and general content containers.

```typescript
shadowColor: '#000',
shadowOffset: { width: 0, height: 1 },
shadowOpacity: 0.06,
shadowRadius: 4,
elevation: 2,
```

### iOS 26 Feature Card Shadow

Used on prominent dashboard cards (Home screen: Profile, Nutrition, Activity, Weight). Deeper and softer — creates a "floating" appearance.

```typescript
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.12,
shadowRadius: 12,
elevation: 5,
```

These cards also require a thin border and a `LinearGradient` background layer — see **Section 15**.

### Water Bottle Glow (Special Case — Only for WaterBottleVisual)

Applied when the water goal is met (`rawPct >= 1.0`). On **iOS**, applies a shadow to the full bottle wrapper (cap + neck + body):

```typescript
shadowColor: '#64B5F6',
shadowOffset: { width: 0, height: 0 },
shadowOpacity: 0.85,
shadowRadius: 10,
elevation: 10,
```

On **Android**, uses `<AndroidGlowBackdrop color="#64B5F6" intensity={1} shape="rect" size={{ width: 68, height: 137 }} borderRadius={13} />` as first child of the bottle container instead (iOS shadow API doesn't produce colored glows on Android).

No border color is applied to `bottleBody` on goal completion — only the shadow/glow effect. Do not use this glow pattern anywhere else.

### DigitalScale Glow (Special Case — Only for DigitalScale)

Applied when `showGlow` is true (after save animation or when a saved value exists). On **iOS**, applies a shadow to `scaleOuter`:

```typescript
shadowColor: colors.primary,
shadowOffset: { width: 0, height: 0 },
shadowOpacity: 0.6,
shadowRadius: 10,
elevation: 10,
```

On **Android**, uses `<AndroidGlowBackdrop color={colors.primary} intensity={1} shape="rect" size={{ width: size, height: size }} borderRadius={Radius.lg} />` as first child of `scaleOuter`.

### CalorieFlame Glow (Special Case — Only for CalorieFlame)

Applied proportionally based on `glowIntensityForBurn(totalBurned)` (0–1 as burn rises 0→600). On **iOS**, applies dynamic shadow to `flameWrapper` with `shadowColor` matching the current flame color. On **Android**, uses `<AndroidGlowBackdrop color={flameColor} intensity={intensity} shape="circle" size={{ width: dim, height: dim }} />` as first child of `flameWrapper` (where `dim = size ?? 192` — reflects the optional `size` prop). No glow at exactly 0 cal.

---

## 8. Dark Mode

### How It Works

1. `useColors()` detects the system color scheme via `useColorScheme()`
2. Returns `DarkColors` or `LightColors` base palette
3. Overlays the user's accent color (from `ThemeContext`) onto `primary` and `primaryLight`
4. Components receive the correct colors automatically

### The `makeStyles` Pattern (Required for Every Component)

```typescript
import { useColors, LightColors, Spacing, Typography, Radius } from '@/constants/theme';

// Define styles as a function that takes colors
const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    title: {
      ...Typography.h3,
      color: colors.text,
    },
    subtitle: {
      ...Typography.small,
      color: colors.textSecondary,
    },
  });

export default function MyComponent() {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Title</Text>
      <Text style={styles.subtitle}>Subtitle</Text>
    </View>
  );
}
```

### Rules

- Never use `StyleSheet.create()` at the module level — always wrap it in `makeStyles(colors)`.
- Never hardcode `'#FFFFFF'` or `'#000000'` for backgrounds or text — use `colors.card`, `colors.background`, `colors.text`.
- The only hardcoded colors allowed are the fixed colors listed in Section 3 (water blue, macro colors, calorie proximity colors, shadow `#000`).
- SVG elements that can't use StyleSheet must receive colors as props from the component's `useColors()` call.

---

## 9. Component Patterns

### 9.1 Card Container

The standard container for any content section.

```typescript
container: {
  backgroundColor: colors.card,
  borderRadius: Radius.lg,
  padding: Spacing.md,
  marginBottom: Spacing.md,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
  overflow: 'hidden',
},
```

### 9.2 Collapsible Section

All collapsible sections follow this exact pattern:

```typescript
// State — always default to collapsed
const [collapsed, setCollapsed] = useState(true);

// Header (entire row is touchable)
<TouchableOpacity
  style={styles.header}
  onPress={() => setCollapsed(!collapsed)}
  activeOpacity={0.7}
>
  <Ionicons
    name={collapsed ? 'chevron-forward' : 'chevron-down'}
    size={18}
    color={colors.textSecondary}
  />
  <Text style={styles.headerTitle}>Section Title</Text>
</TouchableOpacity>

// Content — conditionally rendered
{!collapsed && (
  <View style={styles.content}>
    {/* section content */}
  </View>
)}
```

Header styles:

```typescript
header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: Spacing.sm,
  paddingHorizontal: Spacing.md,
  backgroundColor: colors.card,
},
headerTitle: {
  ...Typography.h3,
  color: colors.text,
},
```

### 9.3 Buttons

#### Primary Button (Call to Action)

```typescript
button: {
  backgroundColor: colors.primary,
  borderRadius: Radius.md,
  paddingVertical: Spacing.md,
  paddingHorizontal: Spacing.md,
  alignItems: 'center',
},
buttonText: {
  color: colors.white,
  fontWeight: '600',
  ...Typography.body,
},
// activeOpacity={0.8}
```

#### Secondary Button (Inactive/Toggle Off)

```typescript
button: {
  backgroundColor: colors.background,
  borderRadius: Radius.md,
  paddingVertical: Spacing.sm,
  paddingHorizontal: Spacing.md,
  alignItems: 'center',
},
buttonText: {
  color: colors.textSecondary,
  fontWeight: '600',
  ...Typography.body,
},
// activeOpacity={0.8}
```

#### Active Toggle State

Same as Primary Button — `backgroundColor: colors.primary`, `color: colors.white`.

#### Danger Button (Delete/Remove)

```typescript
button: {
  backgroundColor: colors.danger,
  paddingHorizontal: Spacing.md,
  paddingVertical: Spacing.sm,
  borderRadius: Radius.md,
  alignItems: 'center',
},
buttonText: {
  color: colors.white,
  fontWeight: '600',
},
```

#### Water Preset Button

```typescript
button: {
  backgroundColor: '#2196F3',  // fixed water blue
  borderRadius: Radius.md,
  height: 56,                  // fixed height, no paddingVertical
  justifyContent: 'center',
  alignItems: 'center',
},
buttonText: {
  color: '#FFFFFF',
  fontWeight: '700',
},
// Middle preset (index 1) adds:
defaultPreset: {
  borderWidth: 2,
  borderColor: '#FFFFFF',      // white border for the quick-add default
},
// Middle preset also shows a small "Quick Add" label (9px, white, semi-transparent)
```

#### Icon-Only Touch Area

```typescript
iconButton: {
  padding: Spacing.xs,
},
// activeOpacity={0.7}
// Icon color: colors.textSecondary (default) or colors.primary (active)
```

### 9.4 Text Inputs

```typescript
input: {
  backgroundColor: colors.background,
  borderRadius: Radius.md,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: Spacing.md,
  paddingVertical: Spacing.sm,
  ...Typography.body,
  color: colors.text,
},
// placeholderTextColor={colors.textSecondary}
// textAlign: 'center' for numeric inputs, 'left' for text inputs
```

### 9.5 List Items

```typescript
row: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.card,
  paddingVertical: Spacing.sm,
  paddingHorizontal: Spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
},
rowName: {
  ...Typography.body,
  color: colors.text,
},
rowDetail: {
  ...Typography.small,
  color: colors.textSecondary,
},
rowValue: {
  ...Typography.body,
  color: colors.textSecondary,
  fontWeight: '500',
},
```

Active/drag state:

```typescript
activeRow: {
  backgroundColor: colors.primaryLight,
  elevation: 5,
},
```

### 9.6 Modal / Bottom Sheet

```typescript
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.35)',
  justifyContent: 'flex-end',
},
sheet: {
  backgroundColor: colors.card,
  borderTopLeftRadius: Radius.lg,
  borderTopRightRadius: Radius.lg,
  maxHeight: '85%',
},
sheetHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: Spacing.md,
  paddingVertical: Spacing.md,
},
sheetTitle: {
  ...Typography.h2,
  color: colors.text,
},
// Close icon: Ionicons "close", size={22}, color={colors.text}
```

### 9.7 Drum Picker (Scroll Wheel)

```typescript
drumContainer: {
  width: 110,           // 220 for wide drums (GoalsSection)
  height: 132,          // ITEM_HEIGHT (44) × VISIBLE_ITEMS (3)
  overflow: 'hidden',
  borderRadius: Radius.md,
  backgroundColor: colors.background,
},
drumItem: {
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
},
drumItemText: {
  ...Typography.body,
  color: colors.textSecondary,
},
drumSelectedText: {
  ...Typography.h3,
  color: colors.text,
  fontWeight: '700',
},
drumHighlight: {
  position: 'absolute',
  top: 44,              // ITEM_HEIGHT × PAD_COUNT
  height: 44,
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: colors.primary,
  backgroundColor: colors.primaryLight,
  borderRadius: Radius.sm,
},
```

### 9.8 Banner / Alert Box

#### Warning Banner

```typescript
banner: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: Spacing.xs,
  backgroundColor: colors.dangerLight,
  borderRadius: Radius.sm,
  padding: Spacing.sm,
},
bannerText: {
  ...Typography.small,
  color: colors.danger,
  flex: 1,
  lineHeight: 17,
},
// Icon: Ionicons "warning-outline", size={14}, color={colors.danger}
```

#### Info Banner

```typescript
banner: {
  backgroundColor: colors.primaryLight,
  borderRadius: Radius.sm,
  padding: Spacing.sm,
},
bannerText: {
  ...Typography.small,
  color: colors.primary,
  lineHeight: 17,
},
```

### 9.9 Progress Bars (Macros)

```typescript
barContainer: {
  height: 8,
  backgroundColor: colors.border,
  borderRadius: 4,
  marginHorizontal: Spacing.sm,
  overflow: 'hidden',
},
barFill: {
  height: '100%',
  borderRadius: 4,
  backgroundColor: macroColor,  // #3B82F6, #F59E0B, or #EF4444
  // width set dynamically as percentage, clamped to 100%
},
```

### 9.10 Swipeable Actions

```typescript
actionButton: {
  justifyContent: 'center',
  alignItems: 'center',
  width: 70,
},
// Save as Meal: backgroundColor: '#2196F3' (fixed blue)
// Delete/Remove: backgroundColor: colors.danger
// overshootRight={false}
```

### 9.11 Empty State

```typescript
emptyText: {
  ...Typography.small,
  color: colors.textSecondary,
  textAlign: 'center',
  paddingVertical: Spacing.md,
},
```

---

## 10. Icons

All icons use `@expo/vector-icons` Ionicons.

### Size Guide

| Size | Usage                                         |
|------|-----------------------------------------------|
| 24   | Tab bar icons, primary action icons            |
| 22   | Header actions, close buttons, list action icons |
| 20   | Inline icons (reorder, secondary actions)      |
| 18   | Collapsible section chevrons                   |
| 16   | Meal group chevrons, small indicators          |
| 14   | Warning/info icons in banners                  |
| 12   | Dropdown indicators                            |

### Color Guide

| Context               | Color                  |
|-----------------------|------------------------|
| Active / primary      | `colors.primary`       |
| Default / secondary   | `colors.textSecondary` |
| On dark background    | `colors.white`         |
| Danger / delete       | `colors.danger`        |
| Header actions        | `colors.text`          |

### Common Icon Names

| Icon Name                    | Usage                   |
|------------------------------|-------------------------|
| `chevron-forward`            | Collapsed section       |
| `chevron-down`               | Expanded section        |
| `add-circle-outline`         | Add action              |
| `trash-outline`              | Delete action           |
| `copy-outline`               | Copy from yesterday     |
| `bookmark-outline`           | Pin / save as meal      |
| `bookmark`                   | Pinned state            |
| `close`                      | Close modal/sheet       |
| `reorder-three`              | Drag handle             |
| `settings-outline`           | Settings                |
| `information-circle-outline` | Info tooltip            |
| `chatbubble-outline`         | Feedback                |
| `trophy-outline`             | Weekly recap header     |
| `warning-outline`            | Warning banner icon     |
| `checkmark`                  | Selected/confirmed      |
| `create-outline`             | Edit (pencil)           |

---

## 11. Fixed Color Rules

These rules are absolute and must never be violated:

1. **Water UI (`#2196F3` / `#E3F2FD`)** — `WaterTracker`, `WaterBottleVisual`, water bars in `WeeklyIntakeGraph`, water entry badges, water preset buttons, and the "Save as Meal" swipe action all use fixed blue. Never use `colors.primary` for any water element.

2. **CalorieFlame color** — The `CalorieFlame` on the Activities tab uses a **dynamic** stroke color from `flameColorForBurn(totalBurned)` in `utils/flameColor.ts` — it interpolates through 6 stops (yellow → orange → red → blue → purple → green) as calories rise 0 → 600. Never use `colors.primary` for the flame stroke or fill. The text overlay uses `colors.text` for theme-aware contrast.

3. **Macro colors** — Protein `#3B82F6`, Carbs `#F59E0B`, Fat `#EF4444`. These are fixed across all screens (Nutrition, Settings macro section).

4. **Calorie proximity** — Always computed via `ringColorForProximity()`. Used in `CalorieRing` and `WeeklyIntakeGraph` calorie bars. Never hardcode calorie indicator colors inline.

5. **Modal overlay** — Always `rgba(0,0,0,0.35)`. Never change opacity.

6. **Card shadows** — Standard content cards always use the standard shadow values. Home screen feature cards (Profile, Nutrition, Activity, Weight dashboard) use the iOS 26 shadow + gradient pattern from Section 15. Never create other custom shadow variations.

7. **Accent color** — `colors.primary` and `colors.primaryLight` reflect the user's chosen accent. Use these for all interactive accent elements except water, macros, and calorie proximity indicators.

---

## Quick Reference: `activeOpacity` Values

| Element Type         | Value |
|---------------------|-------|
| Large buttons        | 0.8   |
| Standard touchables  | 0.7   |
| Small icon areas     | 0.6–0.7 |

---

---

## 12. Modal Sub-Screen Header

All modal sub-screens (Appearance, Nutrition Goals, App Settings) use an identical header bar with a back chevron and title. This pattern must be followed exactly for any new modal sub-screen.

### SafeAreaView edges

All modal sub-screens must use `edges={['top', 'bottom']}` to prevent the custom header from overlapping the Android status bar and iPhone notch / Dynamic Island:

```typescript
<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
```

### Header Styles

```typescript
header: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: Spacing.md,
  paddingVertical: Spacing.md,
  backgroundColor: colors.card,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: colors.border,
},
headerTitle: {
  ...Typography.h2,
  color: colors.text,
  marginLeft: Spacing.sm,
},
```

### Header JSX

```typescript
<View style={styles.header}>
  <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
    <Ionicons name="chevron-back" size={28} color={colors.text} />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Screen Title</Text>
</View>
```

### Key Details

| Property | Value | Rationale |
|---|---|---|
| SafeAreaView edges | `['top', 'bottom']` | Prevents header overlapping status bar / Dynamic Island |
| Vertical padding | `Spacing.md` (16px) | Adequate tap target for back button |
| Chevron size | 28 | Larger than default (24) for easier tapping |
| Title typography | `Typography.h2` (22px, 600) | Distinct from card headers (`Typography.h3`) |
| Title left margin | `Spacing.sm` (8px) | Consistent gap between chevron and title |
| Back button hitSlop | 8px all sides | Extends tap target beyond visible icon |
| Background | `colors.card` | Matches card surfaces |
| Bottom border | `StyleSheet.hairlineWidth` + `colors.border` | Subtle separator |

---

## 13. Story-Style Full-Screen Modal

Used by `app/weekly-recap-modal.tsx`. A full-screen modal (`presentation: 'fullScreenModal'`) with an Instagram-style story layout: top progress bar, page content, invisible tap zones for navigation, and a footer button.

### SafeAreaView edges

```typescript
<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
```

Use `edges={['top', 'bottom']}` (both edges) for all modals that manage their own header, including sub-screen modals (Appearance, Nutrition Goals, App Settings) and full-screen story modals (Weekly Recap).

### Progress Bar

```typescript
progressBar: {
  flexDirection: 'row',
  gap: Spacing.xs,
  flex: 1,
  marginRight: Spacing.sm,
},
progressSegment: {
  flex: 1,
  height: 3,
  borderRadius: 2,
  backgroundColor: colors.border,
},
progressSegmentFilled: {
  backgroundColor: colors.primary,
},
```

Filled segments: `i <= currentPage` (fills all segments up to and including the current page).

### Tap Zones (Invisible Navigation)

Absolute-positioned `View` with `pointerEvents="box-none"` overlaid on the page content. Left half goes back; right half advances.

```typescript
tapZones: {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  flexDirection: 'row',
},
```

---

## 14. Drag-to-Reorder Pattern

> **Read this entire section before touching any drag-to-reorder code.** Two bugs were introduced by violating these rules.

### 13.1 Library Compatibility Rules (Critical)

The app uses `react-native-draggable-flatlist@^4.0.3` with RN 0.81 / React 19. This combination has a known breaking incompatibility:

#### ❌ NEVER use `NestableDraggableFlatList` or `NestableScrollContainer`

These nestable variants call `ref.measureLayout` on non-native component refs under RN 0.81+ / React 19, producing:

```
ERROR  Warning: ref.measureLayout must be called with a ref to a native component.
```

The drag list will appear to render but will be non-functional.

#### ✅ Always use `DraggableFlatList` (the non-nestable default export)

```typescript
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
```

If a scrollable container is needed around the list, use a standard `ScrollView` from `react-native` — not `NestableScrollContainer`.

### 13.2 Drag Activation (Critical)

#### ❌ NEVER use `onPressIn={drag}` on a `TouchableOpacity` drag handle

`onPressIn` fires immediately and causes a gesture conflict between React Native's touch responder system and `react-native-gesture-handler`. The item highlights but freezes — it never actually moves.

#### ✅ Always use `onLongPress={drag}` with `delayLongPress={100}`

```typescript
<TouchableOpacity
  style={styles.dragHandle}
  onLongPress={drag}
  delayLongPress={100}
  activeOpacity={0.4}
>
  <Ionicons name="reorder-three-outline" size={20} color={colors.textSecondary} />
</TouchableOpacity>
```

`delayLongPress={100}` (100ms) is short enough to feel responsive while giving the gesture system enough time to coordinate. Do not lower this value.

### 13.3 Full Drag List Pattern

```typescript
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';

// renderItem — must be defined outside JSX to avoid re-creation on every render
const renderItem = ({ item, drag, isActive }: RenderItemParams<MyItem>) => (
  <ScaleDecorator>
    <View style={[styles.row, isActive && { opacity: 0.8 }]}>
      {/* Drag handle — left side */}
      <TouchableOpacity
        style={styles.dragHandle}
        onLongPress={drag}
        delayLongPress={100}
        activeOpacity={0.4}
      >
        <Ionicons name="reorder-three-outline" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      {/* Item content */}
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
      </View>
    </View>
  </ScaleDecorator>
);

// In the component render
<DraggableFlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  onDragEnd={({ data }) => {
    dispatch({ type: 'REORDER_...', ...payload });
  }}
/>
```

Drag handle styles:

```typescript
dragHandle: {
  paddingRight: Spacing.xs,
  paddingVertical: Spacing.xs,
  justifyContent: 'center',
},
```

### 13.4 Edit Mode Pattern (for Pinned Lists)

When drag-to-reorder is an opt-in mode (like pinned foods/meals), use a split rendering approach:

- **Normal mode**: render items with a plain `ScrollView` + `.map()` — no dragging. Show "Edit" button in section header.
- **Edit mode**: render an early return with only the `DraggableFlatList`. Hide all other content. Show "Done" button.

```typescript
if (editingPinned) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Pinned</Text>
        <TouchableOpacity onPress={() => setEditingPinned(false)}>
          <Text style={styles.editModeBtn}>Done</Text>
        </TouchableOpacity>
      </View>
      <DraggableFlatList
        data={sortedPinned}
        keyExtractor={(item) => item.id}
        renderItem={renderPinnedItem}
        onDragEnd={({ data }) => dispatch({ type: 'REORDER_PINNED_...', ids: data.map(i => i.id) })}
      />
    </View>
  );
}

// Normal mode render (ScrollView + .map())
return (
  <View style={styles.container}>
    <ScrollView keyboardShouldPersistTaps="handled">
      ...
      {sortedPinned.length > 0 && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Pinned</Text>
            <TouchableOpacity onPress={() => setEditingPinned(true)}>
              <Text style={styles.editModeBtn}>Edit</Text>
            </TouchableOpacity>
          </View>
          {sortedPinned.map((item) => (
            // static list item
          ))}
        </>
      )}
    </ScrollView>
  </View>
);
```

**Why an early return instead of conditional rendering?** Conditionally mounting `DraggableFlatList` inside a `ScrollView` can still trigger the `measureLayout` error on some RN versions. A separate render path avoids this entirely.

### 13.5 Where Drag-to-Reorder Is Used

| Location | Type | Action |
|---|---|---|
| `MealCategory.tsx` — ungrouped foods | Inline (always visible via drag handle) | `REORDER_MEAL_FOODS` |
| `AddFoodTab.tsx` — Pinned section | Edit mode toggle | `REORDER_PINNED_FOODS` |
| `AddMealTab.tsx` — Pinned section | Edit mode toggle | `REORDER_PINNED_MEALS` |

Grouped foods (saved meal groups) in `MealCategory` are **not** draggable — only ungrouped foods are.

### 13.6 Edit Mode Button Styles

```typescript
editModeBtn: {
  ...Typography.small,
  color: colors.primary,
  fontWeight: '600',
},
sectionHeaderRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingRight: Spacing.md,
  backgroundColor: colors.background,
},
```

---

## 15. iOS 26 Feature Cards

Used for prominent dashboard cards on the Home screen (Profile, Nutrition, Activity, Weight). This pattern combines a deeper shadow, a thin border, and a subtle top-to-bottom `LinearGradient` for a "floating surface" appearance inspired by iOS 26 (as seen in Apple Music Radio).

### When to Use

- Full-width or half-width summary cards on the Home screen
- Any card that should visually "pop" off the background with depth
- **Do NOT use** for standard content cards (`MealCategory`, `WaterTracker`, settings cards, etc.) — those use the standard shadow from Section 7

### Three Changes vs a Standard Card

**1. Deeper shadow:**
```typescript
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.12,
shadowRadius: 12,
elevation: 5,
```

**2. Thin border for edge definition:**
```typescript
borderWidth: 1,
borderColor: colors.border,
```

**3. `LinearGradient` as first child** (subtle top-to-bottom tint that creates the 3D raised look):
```tsx
import { LinearGradient } from 'expo-linear-gradient';

<TouchableOpacity style={styles.featureCard}>
  <LinearGradient
    colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']}
    style={StyleSheet.absoluteFill}
  />
  {/* other card children */}
</TouchableOpacity>
```

`overflow: 'hidden'` on the card clips the gradient to `borderRadius`. iOS shadows are composited at the OS layer and are **not** affected by `overflow: 'hidden'`.

### Complete Style Example

```typescript
featureCard: {
  backgroundColor: colors.card,   // fallback before gradient renders
  borderRadius: Radius.lg,
  marginBottom: Spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 5,
  overflow: 'hidden',
},
```

### Gradient Values

| Mode  | Top       | Bottom    | Effect                                      |
|-------|-----------|-----------|---------------------------------------------|
| Light | `#FFFFFF` | `#F4F4F8` | White → very slightly cool gray             |
| Dark  | `#3A3A3C` | `#2C2C2E` | Slightly lighter than card → base card color |

### Dark Mode Detection

```typescript
// When resolvedScheme is already computed (e.g. home.tsx):
const isDark = resolvedScheme === 'dark';

// In components that only have colors (e.g. ProfileCard):
const isDark = colors.card === '#2C2C2E';
// Reliable because colors.card is always '#FFFFFF' (light) or '#2C2C2E' (dark)
```

### Components Using This Pattern

| File | Cards |
|------|-------|
| `app/(tabs)/home.tsx` | Nutrition (full-width), Activity (half), Weight (half) |
| `components/profile/ProfileCard.tsx` | Profile summary card |

---

## File Reference

| File                          | Contains                                   |
|-------------------------------|---------------------------------------------|
| `constants/theme.ts`          | All design tokens, `useColors()`, `ACCENT_PRESETS` |
| `utils/calorieColor.ts`       | `ringColorForProximity()` function          |
| `utils/waterCalculation.ts`   | Water goal logic                            |
| `utils/tdeeCalculation.ts`    | TDEE calculation                            |
| `components/nutrition/MealCategory.tsx` | Canonical card + collapsible pattern |
| `components/nutrition/WaterTracker.tsx` | Water UI color usage reference      |
| `components/nutrition/FoodItem.tsx`     | List item + bottom sheet pattern    |
| `components/nutrition/PortionSelector.tsx` | Drum picker pattern              |
| `components/nutrition/CalorieRing.tsx`  | SVG ring + proximity colors         |
| `components/nutrition/MacroProgressBars.tsx` | Progress bar pattern            |
| `components/nutrition/FoodFilterModal.tsx`  | Bottom-sheet filter modal pattern |
| `components/nutrition/CustomFoodForm.tsx`   | Tab switcher + categorization UI  |
| `components/settings/ThemeColorPicker.tsx` | Accent color swatch pattern      |
| `components/settings/AppearanceModePicker.tsx` | Light/Dark/System card picker |
| `components/profile/ProfileCard.tsx`       | Avatar + inline edit form pattern |
| `components/profile/BadgesSection.tsx`     | XP/level bar + streak pills + achievements grid |
| `utils/flameColor.ts`                      | `flameColorForBurn()` + `glowIntensityForBurn()` — 6-stop color lerp for CalorieFlame |
| `components/glow/AndroidGlowBackdrop.tsx`  | Android-only colored glow halo — `null` on iOS, concentric semi-transparent Views on Android |
| `components/activities/CalorieFlame.tsx`   | Dynamic flame: color from `flameColorForBurn()`, glow from `glowIntensityForBurn()`; iOS shadow, Android `AndroidGlowBackdrop` |
| `components/weight/DigitalScale.tsx`       | Themed bathroom-scale visual: `primary` stroke + `primaryLight` fill, recessed LCD, 1500ms count-up + iOS `primary` glow / Android `AndroidGlowBackdrop`. `hideUnit?: boolean` prop — when true, suppresses the unit label and increases LCD font coefficient (0.13 → 0.15) for better fill |
| `app/(tabs)/home.tsx`                      | Home screen dashboard — iOS 26 feature card pattern (Section 15) applied to all four cards |
| `components/ErrorBoundary.tsx`             | Error fallback using static LightColors |
| `components/ToastNotification.tsx`         | Animated top-of-screen toast banner |
| `components/GamificationWatcher.tsx`       | Invisible root-level XP/achievement watcher |
| `context/ToastContext.tsx`                 | Toast context — showToast(), dismiss(), current |
| `utils/achievementCalculation.ts`          | ACHIEVEMENTS + checkNewAchievements() |
| `utils/xpCalculation.ts`                  | XP constants, level thresholds, getLevelProgress() |
| `utils/streakCalculation.ts`              | Streak computation logic           |
| `utils/crashReporting.ts`                 | Crash logging + optional Sentry    |
