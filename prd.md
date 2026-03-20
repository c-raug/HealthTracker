# HealthTracker — Product Requirements

## Phase 2: UI Style Guide Consistency Fixes [IN PROGRESS]

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
- `app/(tabs)/index.tsx` (line 109): `fontSize: 32, fontWeight: '600'` on weight input → `...Typography.h1` (fontSize 28, fontWeight '700'). Accept this as a large-number input exception OR use `Typography.h1`.
- `components/WeightEntryItem.tsx` (line 36): `fontSize: 20, fontWeight: '700'` → `...Typography.h2` (closest match at fontSize 22)
- `components/WeightEntryItem.tsx` (line 41): `fontSize: 14` → `...Typography.small` (fontSize 13)
- `components/nutrition/WaterTracker.tsx` (line 108): `fontSize: 10` for edit hint → `...Typography.small` (fontSize 13, smallest available token)

### 2.4 — Hardcoded Spacing Values (8 files)

Raw pixel values that should use `Spacing` tokens. Two categories:

**`paddingVertical: 4` → `paddingVertical: Spacing.xs`** (value matches but should use token for consistency):
- `app/(tabs)/nutrition.tsx` — todayPill
- `app/(tabs)/activities.tsx` — todayPill
- `app/(tabs)/index.tsx` — todayPill
- `components/WeightChart.tsx` — rangeDropdown
- `components/nutrition/WaterTracker.tsx` — quickAddBtn

**`marginBottom: 2` or `marginTop: 2` → `Spacing.xs` (4px)** (closest token — 2px has no token):
- `components/WeightChart.tsx` — summaryLabel `marginBottom: 2`
- `components/WeightEntryItem.tsx` — `paddingVertical: Spacing.sm + 2` (mixed token + raw) → `paddingVertical: Spacing.sm`
- `components/nutrition/WaterTracker.tsx` — editHint `marginTop: 2`
- `components/nutrition/AddFoodTab.tsx` — resultName `marginBottom: 2`
- `components/nutrition/AddMealTab.tsx` — mealName `marginBottom: 2`
- `app/(tabs)/activities.tsx` — activityDetail `marginTop: 2`
- `app/(tabs)/settings.tsx` — creatine label `marginBottom: 2`

### 2.5 — Non-Standard Icon Sizes (1 file)

Standard sizes: 24 (primary), 22 (header/close), 20 (inline), 18 (chevrons), 16 (group/info), 14 (banner), 12 (dropdown). Size 17 is non-standard.

**Changes:**
- `components/settings/GoalsSection.tsx` (line 360): `information-circle-outline` `size={17}` → `size={16}`
- `components/settings/GoalsSection.tsx` (line 410): `information-circle-outline` `size={17}` → `size={16}`

### 2.6 — Empty State Typography (2 files)

Style guide requires `Typography.small` for empty state text. Two components incorrectly use `Typography.body`.

**Changes:**
- `components/nutrition/AddMealTab.tsx`: empty style uses `...Typography.body` → `...Typography.small`
- `components/nutrition/AddFoodTab.tsx`: empty style uses `...Typography.body` → `...Typography.small`

### 2.7 — Intentional Exceptions (No Changes Needed)

These use non-token values but are intentional design choices for decorative micro-elements:
- `app/(tabs)/nutrition.tsx`: pager dots `gap: 6, borderRadius: 3, width: 6, height: 6` — decorative dots
- `app/onboarding.tsx`: progress dots `width: 10, height: 10, borderRadius: 5` — decorative dots
- `components/settings/ThemeColorPicker.tsx`: `borderRadius: 20` — intentional circle (width/2)
- `components/nutrition/WaterBottleVisual.tsx`: `borderRadius: 4` on cap — documented exception

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
