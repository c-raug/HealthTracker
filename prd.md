# HealthTracker — Product Requirements

## Phase 2: UI Style Guide Consistency Fixes [COMPLETE]

This phase addresses all UI styling inconsistencies found by auditing the codebase against the newly created style guide (`.claude/documentation/style_guide.md`). These violations cause visual inconsistencies across screens — mismatched modal dimming, non-uniform shadows, hardcoded spacing/font values, and wrong icon sizes.

---

### 2.1 — Modal Overlay Opacity (8 files)

The style guide mandates `rgba(0,0,0,0.35)` for all modal overlays. Multiple files use different opacity values, causing inconsistent dimming when modals open.

**Changes:**
- `components/InfoModal.tsx`: `rgba(0,0,0,0.45)` → `rgba(0,0,0,0.35)` ✅ DONE
- `components/settings/ProfileSection.tsx`: `rgba(0,0,0,0.3)` → `rgba(0,0,0,0.35)` ✅ DONE
- `components/nutrition/AddMealTab.tsx`: `rgba(0,0,0,0.4)` → `rgba(0,0,0,0.35)` ✅ DONE
- `components/nutrition/EditMealFlow.tsx`: `rgba(0,0,0,0.4)` → `rgba(0,0,0,0.35)` ✅ DONE
- `app/onboarding.tsx`: `rgba(0,0,0,0.3)` → `rgba(0,0,0,0.35)` ✅ DONE
- `app/(tabs)/nutrition.tsx`: `rgba(0,0,0,0.3)` → `rgba(0,0,0,0.35)` ✅ DONE
- `app/(tabs)/activities.tsx`: `rgba(0,0,0,0.3)` → `rgba(0,0,0,0.35)` ✅ DONE
- `app/(tabs)/index.tsx`: `rgba(0,0,0,0.3)` → `rgba(0,0,0,0.35)` ✅ DONE

### 2.2 — Non-Standard Card Shadows (6 files)

The style guide mandates one shadow for all cards: `shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2`. Several files use `colors.primary` as shadowColor or custom opacity/elevation values.

**Changes:**
- `components/settings/ProfileSection.tsx`: toggle active shadow uses `shadowColor: colors.primary, shadowOpacity: 0.25, elevation: 3` → standard shadow ✅ DONE
- `components/settings/FeedbackSection.tsx`: submit button shadow uses `shadowColor: colors.primary, shadowOpacity: 0.25, elevation: 3` → standard shadow ✅ DONE
- `components/WeightEntryItem.tsx`: row shadow uses `shadowOpacity: 0.04, shadowRadius: 2, elevation: 1` → standard shadow ✅ DONE
- `app/(tabs)/index.tsx`: save button uses `shadowColor: colors.primary, shadowOffset: height 4, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4` → standard shadow ✅ DONE
- `app/onboarding.tsx`: toggle active uses `shadowColor: colors.primary, shadowOpacity: 0.25, elevation: 3` → standard shadow ✅ DONE
- `app/(tabs)/settings.tsx`: toggle active uses `shadowColor: colors.primary, shadowOpacity: 0.25, elevation: 3` → standard shadow ✅ DONE

### 2.3 — Hardcoded Font Sizes (3 files)

Typography tokens should always be spread from `Typography.*`. These files set `fontSize` directly without spreading a token.

**Changes:**
- `app/(tabs)/index.tsx` (line 109): `fontSize: 32, fontWeight: '600'` on weight input → `...Typography.h1` (fontSize 28, fontWeight '700'). Accept this as a large-number input exception OR use `Typography.h1`. ✅ DONE
- `components/WeightEntryItem.tsx` (line 36): `fontSize: 20, fontWeight: '700'` → `...Typography.h2` (closest match at fontSize 22) ✅ DONE
- `components/WeightEntryItem.tsx` (line 41): `fontSize: 14` → `...Typography.small` (fontSize 13) ✅ DONE
- `components/nutrition/WaterTracker.tsx` (line 108): `fontSize: 10` for edit hint → `...Typography.small` (fontSize 13, smallest available token) ✅ DONE

### 2.4 — Hardcoded Spacing Values (8 files)

Raw pixel values that should use `Spacing` tokens. Two categories:

**`paddingVertical: 4` → `paddingVertical: Spacing.xs`** (value matches but should use token for consistency):
- `app/(tabs)/nutrition.tsx` — todayPill ✅ DONE
- `app/(tabs)/activities.tsx` — todayPill ✅ DONE
- `app/(tabs)/index.tsx` — todayPill ✅ DONE
- `components/WeightChart.tsx` — rangeDropdown ✅ DONE
- `components/nutrition/WaterTracker.tsx` — quickAddBtn ✅ DONE

**`marginBottom: 2` or `marginTop: 2` → `Spacing.xs` (4px)** (closest token — 2px has no token):
- `components/WeightChart.tsx` — summaryLabel `marginBottom: 2` ✅ DONE
- `components/WeightEntryItem.tsx` — `paddingVertical: Spacing.sm + 2` (mixed token + raw) → `paddingVertical: Spacing.sm` ✅ DONE
- `components/nutrition/WaterTracker.tsx` — editHint `marginTop: 2` ✅ DONE
- `components/nutrition/AddFoodTab.tsx` — resultName `marginBottom: 2` ✅ DONE
- `components/nutrition/AddMealTab.tsx` — mealName `marginBottom: 2` ✅ DONE
- `app/(tabs)/activities.tsx` — activityDetail `marginTop: 2` ✅ DONE
- `app/(tabs)/settings.tsx` — creatine label `marginBottom: 2` ✅ DONE

### 2.5 — Non-Standard Icon Sizes (1 file)

Standard sizes: 24 (primary), 22 (header/close), 20 (inline), 18 (chevrons), 16 (group/info), 14 (banner), 12 (dropdown). Size 17 is non-standard.

**Changes:**
- `components/settings/GoalsSection.tsx` (line 360): `information-circle-outline` `size={17}` → `size={16}` ✅ DONE
- `components/settings/GoalsSection.tsx` (line 410): `information-circle-outline` `size={17}` → `size={16}` ✅ DONE

### 2.6 — Empty State Typography (2 files)

Style guide requires `Typography.small` for empty state text. Two components incorrectly use `Typography.body`.

**Changes:**
- `components/nutrition/AddMealTab.tsx`: empty style uses `...Typography.body` → `...Typography.small` ✅ DONE
- `components/nutrition/AddFoodTab.tsx`: empty style uses `...Typography.body` → `...Typography.small` ✅ DONE

### 2.7 — Intentional Exceptions (No Changes Needed)

These use non-token values but are intentional design choices for decorative micro-elements:
- `app/(tabs)/nutrition.tsx`: pager dots `gap: 6, borderRadius: 3, width: 6, height: 6` — decorative dots
- `app/onboarding.tsx`: progress dots `width: 10, height: 10, borderRadius: 5` — decorative dots
- `components/settings/ThemeColorPicker.tsx`: `borderRadius: 20` — intentional circle (width/2)
- `components/nutrition/WaterBottleVisual.tsx`: `borderRadius: 4` on cap — documented exception

---

## Phase 3: Split & Enhanced Weekly Graphs [IN PROGRESS]

The `WeeklyIntakeGraph` currently stacks calorie and water charts on a single pager page. Axis labels clip, values are hard to read, and there is no per-day detail. This phase splits the graphs onto their own dedicated pages, surrounds each in a proper card, adds readable axes, a goal line label, and a tap-to-tooltip interaction for per-day detail.

---

### 3.1 — 3-Page Nutrition Pager with Graph Cards

**Pager order (left → right):**
- **Page 0** — `WeeklyCalorieGraph` (reached by swiping left from the ring)
- **Page 1** — CalorieRing + WaterBottleVisual (center / default, shown on tab focus)
- **Page 2** — `WeeklyWaterGraph` (reached by swiping right from the ring)

On `useFocusEffect`, reset pager to index 1 via `scrollTo({ x: pagerWidth, animated: false })` and set `activePagerPage` to 1.

Dot indicators: 3 dots, all same size, active dot filled (`colors.primary`), inactive dots dimmed (`colors.border`). Update the dot render in `nutrition.tsx` (currently 2 dots, map over `[0,1,2]`).

**Changes:**
- `app/(tabs)/nutrition.tsx`: expand `ScrollView` pager to 3 pages in [CalorieGraph, Ring+Bottle, WaterGraph] order; update dot count to 3; change focus-reset `scrollTo` to `x: pagerWidth` (index 1); pass `calorieData`, `waterData`, `calorieGoal`, and `waterGoal` to the two new graph components.

### 3.2 — WeeklyCalorieGraph Component

Split out from `WeeklyIntakeGraph.tsx` (keep file, rename/add export). Renders a `colors.card` rounded card with standard shadow.

**Card structure:**
- `backgroundColor: colors.card`, `borderRadius: Radius.lg`, standard shadow (style guide Section 7), `padding: Spacing.md`
- Title row: `"Calories — 7 Days"` in `Typography.h3` + `colors.text`, left-aligned

**SVG chart internals:**
- Left margin: 36px reserved for Y-axis labels (so bars are never clipped)
- Bottom margin: 20px reserved for X-axis day labels (Mon, Tue… formatted from date string)
- Bar area height: ~160px (increased from current since chart no longer shares space)
- Y-axis: compute 3–4 evenly spaced ticks from 0 → `maxCalories` (round up to nearest 100 or 500). Render each as `SvgText` right-aligned within the 36px margin, `fontSize: Typography.caption.fontSize`, `fill: colors.textSecondary`
- Grid lines: horizontal `Line` at each Y-tick spanning the full bar area width; `stroke={colors.border}`, `strokeOpacity={0.3}`, `strokeDasharray="4 4"`
- Bars: proximity colors via `ringColorForProximity(consumed, goal, colors.primary)` — unchanged
- Goal line: dashed `Line` across full bar area width; right-end label `"Goal: {value}"` in `SvgText`, `fontSize: Typography.caption.fontSize`, `fill: colors.textSecondary`
- Tappable bars: each bar is wrapped in a `<TouchableOpacity>` (or `Pressable`). Tapping sets `selectedBar: string | null` state (date string of tapped bar); tapping same bar or the tooltip × clears it.

**Tooltip (calorie):**
Positioned absolutely above the tapped bar. Contains:
- Date label: `"Mon Mar 18"` format — `Typography.small`, `colors.textSecondary`
- Calories: `"{n} cal"` — `Typography.body`, `fontWeight: '600'`, `colors.text`
- Macro row: three colored chips — `■ P: {n}g` (`#3B82F6`), `■ C: {n}g` (`#F59E0B`), `■ F: {n}g` (`#EF4444`) — `Typography.caption`
- × close button: top-right corner, `Ionicons` `close` size 14, `colors.textSecondary`
- Background: `colors.card`, `borderRadius: Radius.md`, standard shadow, `padding: Spacing.sm`
- Dismissed by: tapping × OR tapping anywhere outside the bars (outer `TouchableWithoutFeedback` wrapping the chart)
- If the day has no log entry, tooltip shows `"No data logged"` instead of macros

**Props:** `width: number`, `calorieData: DayEntry[]`, `mealData: DayNutrition[]` (for macros — sourced from `state.entries` in `nutrition.tsx`), `calorieGoal?: number | null`

**Changes:**
- `components/nutrition/WeeklyIntakeGraph.tsx`: add `WeeklyCalorieGraph` named export with the above design.

### 3.3 — WeeklyWaterGraph Component

Same card and axis treatment as `WeeklyCalorieGraph` but for water.

**Card structure:** identical — `colors.card`, `Radius.lg`, standard shadow, `Spacing.md` padding. Title: `"Water — 7 Days"`.

**SVG chart internals:**
- Same left/bottom margins, bar area height, Y-axis tick/grid-line approach
- Bars: fixed `#2196F3` — unchanged
- Goal line: same dashed line + right-end `"Goal: {value} {unit}"` label

**Tooltip (water):**
- Date label + total water consumed (e.g. `"48 oz"` or `"1 200 mL"`) + × close button
- No macro breakdown for water
- Same dismiss behavior (× or tap outside)

**Props:** `width: number`, `waterData: DayWater[]`, `waterGoal?: number | null`, `waterUnit: string`

**Changes:**
- `components/nutrition/WeeklyIntakeGraph.tsx`: add `WeeklyWaterGraph` named export.

---

## Files Changed in Phase 3

- `components/nutrition/WeeklyIntakeGraph.tsx` — add `WeeklyCalorieGraph` and `WeeklyWaterGraph` named exports; split existing stacked component into two dedicated card-wrapped graph components with fixed axes, grid lines, goal line labels, and tap-to-tooltip interactions
- `app/(tabs)/nutrition.tsx` — expand pager to 3 pages; update dot indicators; fix focus-reset scroll target to index 1 (center); pass data props to new graph components

---

## Files Changed in Phase 2

- `components/InfoModal.tsx` — overlay opacity fix
- `components/settings/ProfileSection.tsx` — overlay opacity + shadow fix
- `components/settings/FeedbackSection.tsx` — shadow fix
- `components/settings/GoalsSection.tsx` — icon size fix
- `components/WeightEntryItem.tsx` — shadow + font size + spacing fix
- `components/WeightChart.tsx` — spacing fix
- `components/nutrition/AddMealTab.tsx` — overlay opacity + spacing + empty state typography fix
- `components/nutrition/AddFoodTab.tsx` — spacing + empty state typography fix
- `components/nutrition/EditMealFlow.tsx` — overlay opacity fix
- `components/nutrition/WaterTracker.tsx` — spacing + font size fix
- `app/onboarding.tsx` — overlay opacity + shadow fix
- `app/(tabs)/index.tsx` — overlay opacity + shadow + spacing + font size fix
- `app/(tabs)/nutrition.tsx` — overlay opacity + spacing fix
- `app/(tabs)/activities.tsx` — overlay opacity + spacing fix
- `app/(tabs)/settings.tsx` — shadow + spacing fix
