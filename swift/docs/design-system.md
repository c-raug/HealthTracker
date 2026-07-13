# Design system spec

Source: `expo/constants/theme.ts`, `expo/.claude/documentation/style_guide.md`,
`expo/utils/calorieColor.ts`, `expo/utils/flameColor.ts`.
**Phase 1 already ported this** to `swift/HealthTracker/Design/` — this doc is the reference for
values and the remaining visual rules. If a value here disagrees with the Swift code, the Swift
code (and the RN source) win; fix the doc.

## Palettes (`AppColors.swift`)
| Token | Light | Dark |
|---|---|---|
| primary | `#4CAF50` | `#4CAF50` |
| primaryLight | `#E8F5E9` | `#1A3D20` |
| background | `#F7F8FA` | `#1C1C1E` |
| card | `#FFFFFF` | `#2C2C2E` |
| text | `#1A1A2E` | `#F2F2F7` |
| textSecondary | `#6B7280` | `#8E8E93` |
| border | `#E5E7EB` | `#3A3A3C` |
| danger | `#EF4444` | `#FF453A` |
| dangerLight | `#FEE2E2` | `#3D1919` |

`primary`/`primaryLight` are overridden at runtime by the selected accent.

## Accent presets (6) — `AccentPresets`
green `#4CAF50` / `#E8F5E9` / `#1A3D20`; blue `#2196F3` / `#E3F2FD` / `#1A2D4A`;
orange `#FF9800` / `#FFF3E0` / `#3D2A10`; purple `#9C27B0` / `#F3E5F5` / `#2A1A3D`;
red `#F44336` / `#FFEBEE` / `#3D1919`; teal `#009688` / `#E0F2F1` / `#1A3333`.
(cols: primary / primaryLight-light / primaryLight-dark). Stored as `preferences.themeColor` = the primary hex.

## Tokens
- **Typography** (`Typography.swift`): h1 28/700, h2 22/600, h3 18/600, body 16/400, small 13/400. Weights used: 400/500/600/700. LCD digits → `.monospacedDigit()`.
- **Spacing** (`Metrics.swift`): xs 4, sm 8, md 16, lg 24, xl 32.
- **Radius:** sm 8, md 12, lg 16 (progress bars raw 4; pill tab bar height/2 = 28).

## Shadows / elevation (`CardStyles.swift`)
- **Standard card:** black, offset (0,1), opacity 0.06, radius 4.
- **iOS-26 feature card:** black, offset (0,4), opacity 0.12, radius 12 + 1px `border` + top→bottom
  `LinearGradient` fill (light `['#FFFFFF','#F4F4F8']`, dark `['#3A3A3C','#2C2C2E']`), clipped.
  Used by Home cards, ProfileCard, weekly graphs.
- **Colored glows** (iOS `shadowColor`): water goal-met `#64B5F6` op .85 r10; DigitalScale `primary` op .6 r10;
  CalorieFlame = current flame color, op `0.25 + intensity*0.65`, radius `6 + intensity*18`.
- Dark-mode shortcut in RN = `colors.card === '#2C2C2E'` → Swift uses `AppColors.isDark`.

## Fixed colors (never themed) — `FixedColors`
water `#2196F3`, waterLight `#E3F2FD`, waterGlow `#64B5F6`, fill overlay `#2196F388`;
macros protein `#3B82F6` / carbs `#F59E0B` / fat `#EF4444`; modal overlay `rgba(0,0,0,0.35)`.

## Derived color ramps (ported)
- **Calorie proximity** (`CalorieProximityColor.swift`): by `|consumed−target|` — ≤25 `#2E7D32`, ≤50 `#4CAF50`, ≤100 `#FFC107`, ≤200 `#FF9800`, else `#F44336`.
- **Flame** (`FlameColor.swift`): 6-stop RGB lerp `[0,120,240,300,420,540]` → yellow→orange→red→blue→purple→green, clamp 0–600; glow `cal/600`.

## Appearance + accent mechanism (`AppTheme.swift`)
- `appearanceMode` (light/dark/system) + `accentHex` persisted (Phase 1: UserDefaults; Phase 2+: bridge to `AppStore.preferences`).
- Resolution mirrors `useColors()`: base palette for scheme + accent override of primary/primaryLight.
- Root (`AppRoot`) injects `\.appColors`, applies `.tint(accentPrimary)` + `.preferredColorScheme`.
- Effective scheme computed directly for forced modes (not dependent on `\.colorScheme` propagation).

## Verify
Phase 1 checkpoint = the **Design Gallery** (`Features/DesignGallery/DesignGalleryView.swift`): swatches,
type scale, both card styles, proximity + flame ramps — correct in light/dark across all 6 accents.
