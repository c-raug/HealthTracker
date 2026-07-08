# Component Notes

Detailed implementation notes for components, screens, modals, and utilities. Loaded on demand — read this file when modifying or referencing a specific component listed in the CLAUDE.md index.

## Table of Contents

- [`PortionSelector`](#portionselector)
- [`FoodItem`](#fooditem)
- [Tab header style](#tab-header-style)
- [`CollapsibleTabHeader`](#collapsibletabheader)
- [`HeaderXpBar`](#headerxpbar)
- [`PillTabBar`](#pilltabbar)
- [`MoreMenuPopover`](#moremenupopover)
- [`MoreMenuContext`](#moremenucontext)
- [`ProfileCard`](#profilecard)
- [`BadgesSection`](#badgessection)
- [Streak calculation](#streak-calculation)
- [`MacroSection`](#macrosection)
- [`CustomFoodForm`](#customfoodform)
- [`EditMealFlow`](#editmealflow)
- [`AddMealTab`](#addmealtab)
- [`AddFoodTab`](#addfoodtab)
- [`FloatingPillBar`](#floatingpillbar)
- [`CreateMealFlow`](#createmealflow)
- [Swipe-left to save meal](#swipe-left-to-save-meal)
- [Saved meal groups in MealCategory](#saved-meal-groups-in-mealcategory)
- [`AddMealTab`](#addmealtab)
- [`QuickAddTab`](#quickaddtab)
- [`CustomFood`](#customfood)
- [`NutritionFoodItem`](#nutritionfooditem)
- [`SavedMeal`](#savedmeal)
- [Home screen](#home-screen)
- [Activities screen](#activities-screen)
- [Profile tab](#profile-tab)
- [Settings tab](#settings-tab)
- [App Settings sub-screen](#app-settings-sub-screen)
- [`ErrorBoundary`](#errorboundary)
- [`utils/crashReporting.ts`](#utils-crashreporting-ts)
- [Nutrition Goals modal](#nutrition-goals-modal)
- [Appearance modal](#appearance-modal)
- [`WaterTracker`](#watertracker)
- [`ThemeColorPicker`](#themecolorpicker)
- [`AppearanceModePicker`](#appearancemodepicker)
- [`AndroidGlowBackdrop`](#androidglowbackdrop)
- [`CalorieFlame`](#calorieflame)
- [`DigitalScale`](#digitalscale)
- [Weight tab pager](#weight-tab-pager)
- [`CalorieRing`](#caloriering)
- [`WeeklyCalorieGraph` / `WeeklyWaterGraph` / `WeeklyActivityGraph`](#weeklycaloriegraph-weeklywatergraph-weeklyactivitygraph)
- [`WeightChart`](#weightchart)
- [`WaterBottleVisual`](#waterbottlevisual)
- [`ToastNotification`](#toastnotification)
- [`GamificationWatcher`](#gamificationwatcher)
- [`ToastContext`](#toastcontext)
- [Achievement definitions](#achievement-definitions)
- [XP/level definitions](#xp-level-definitions)
- [`UserPreferences` gamification fields](#userpreferences-gamification-fields)
- [Weekly Recap modal](#weekly-recap-modal)
- [`RecapWeightPage`](#recapweightpage)
- [`RecapNutritionPage`](#recapnutritionpage)
- [`RecapStreaksPage`](#recapstreakspage)
- [`RecapRatingPage`](#recapratingpage)
- [`utils/weeklyRatingCalculation.ts`](#utils-weeklyratingcalculation-ts)
- [Leveling Tutorial modal](#leveling-tutorial-modal)
- [`TutorialXpPage`](#tutorialxppage)
- [`TutorialLevelsPage`](#tutoriallevelspage)
- [`TutorialPrestigePage`](#tutorialprestigepage)
- [`FeedbackSection`](#feedbacksection)
- [`FavoritePillRow`](#favoritepillrow)
- [`FoodFilterModal`](#foodfiltermodal)
- [Food Library modal](#food-library-modal)
- [Profile modal](#profile-modal)
- [Stats & Achievements modal](#stats-achievements-modal)

---

### `PortionSelector`

(`components/nutrition/PortionSelector.tsx`): two drum scroll wheels (whole number 0–250 + fraction in ⅛ increments) + live macro preview. Accepts optional `foodName?: string` prop — when provided, displays the food name as a heading above the drum wheels. Used in `AddFoodTab` (before adding), `CreateMealFlow` and `EditMealFlow` (before adding food to a saved meal), and `FoodItem` (bottom-sheet edit modal after adding). All call sites pass `foodName`.

### `FoodItem`

(`components/nutrition/FoodItem.tsx`): tapping the food info area opens a bottom-sheet `Modal` with `PortionSelector`; long-pressing the reorder icon drags; swiping right deletes. Requires `date` and `category` props (passed down from `MealCategory`). When `item.quickAdd` is true: the food name renders italic with a small "Quick" badge pill (`colors.textSecondary` background, `colors.white` text); tapping opens a simplified editor modal with just calories and name inputs (no `PortionSelector`). The quick-edit modal wraps `modalOverlay` in a `KeyboardAvoidingView` (`behavior="padding"` on iOS, `undefined` on Android) so the bottom sheet rises above the keyboard — keeping Calories and Name inputs visible while typing.

### Tab header style

Profile and Settings hidden tabs use the native transparent Expo Router header — `headerStyle: { backgroundColor: colors.background, borderBottomWidth: 0, elevation: 0, shadowOpacity: 0 }` with `headerShadowVisible: false`, `headerTitleAlign: 'left'`, `Typography.h2 + colors.text`. Both have `BackHeaderButton` (chevron-back) in `headerLeft` and `HeaderXpBar` in `headerRight`. **Home, Weight, Nutrition, and Activities** suppress the native header entirely (`headerShown: false` via `<Stack.Screen options={{ headerShown: false }} />`) and instead use `CollapsibleTabHeader` — a custom animated header that slides up on scroll.

### `CollapsibleTabHeader`

(`components/navigation/CollapsibleTabHeader.tsx`): collapsible animated header used by the four data tabs (Home, Weight, Nutrition, Activities) in place of the native Expo Router header. Absolutely positioned at `top: 0`, covers `insets.top + COLLAPSIBLE_HEADER_HEIGHT` (52pt) height. `backgroundColor: colors.background`, `paddingTop: insets.top`. Contains tab title (`Typography.h2`, `flex: 1`) + `<HeaderXpBar />` in a `flexDirection: 'row'`. Slides up with `Animated.Value` driven by the parent's `Animated.ScrollView.onScroll` — `translateY` interpolates from `0` to `-(insets.top + COLLAPSIBLE_HEADER_HEIGHT)` as scroll goes from `0` to `insets.top + COLLAPSIBLE_HEADER_HEIGHT`. `zIndex: 10, elevation: 10`. Exports `COLLAPSIBLE_HEADER_HEIGHT = 52` constant. Props: `title: string`, `scrollY: Animated.Value`. Each data tab creates its own `scrollY = useRef(new Animated.Value(0)).current` and passes it to both `CollapsibleTabHeader` and its `Animated.ScrollView` via `onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}`. Content `paddingTop = insets.top + COLLAPSIBLE_HEADER_HEIGHT` ensures it starts below the header. Two `LinearGradient` overlays (`pointerEvents="none"`, `zIndex: 9`) provide content edge fades: top fade (`colors.background → transparent`, `height: 60`, positioned at `top: insets.top`) and bottom fade (`transparent → colors.background`, `height: 60`, positioned at `bottom: PILL_TOTAL_HEIGHT + insets.bottom`). **Date nav bar uses the iOS 26 nav-bar styling — see style guide §15** for shadow values, gradient stops, and radius.

### `HeaderXpBar`

(`components/navigation/HeaderXpBar.tsx`): XP progress pill shown in `headerRight` on every tab screen. Horizontal `TouchableOpacity` with `marginRight: Spacing.md`: a rounded-square **XP badge** (`width: 22`, `height: 22`, `borderRadius: 6`, `backgroundColor: colors.primary`, centered white bold "XP" `Text` using `Typography.small + fontWeight: '700'`) + pill (`height: 22`, `borderRadius: 11`, `minWidth: 72`, `backgroundColor: colors.primaryLight`, `overflow: 'hidden'`). Absolute-positioned fill inside the pill is an `Animated.View` (`backgroundColor: colors.primary`) whose `width` is driven by `progressAnim` (an `Animated.Value` interpolated 0→1 to `'0%'→'100%'`). Centered text overlay (`Typography.small`, `fontWeight: '600'`, `colors.text`) shows `"Level N"` or `"MAX"` at max level. Tapping navigates to `/stats-achievements-modal`. Reads `preferences.totalXp` via `useApp()` and computes progress via `getLevelProgress()` from `utils/xpCalculation.ts`. **XP gain animation**: when `totalXp` increases, a `useEffect` runs `Animated.sequence` — badge fades out (200ms) → `+N xp` label fades in over the badge position (150ms) → holds 600ms → label fades out + `progressAnim` spring-animates to new value (parallel) → badge fades back in (200ms). When XP decreases (prestige), `progressAnim` is set immediately via `.setValue()` with no animation.

### `PillTabBar`

(`components/navigation/PillTabBar.tsx`): custom floating pill tab bar passed to `<Tabs tabBar={...}>` in `app/(tabs)/_layout.tsx`. Layered structure: a `LinearGradient` (from `expo-linear-gradient`) sits behind the pill — a 3-stop gradient (`transparent → rgba(bg, 0.35) → rgba(bg, 0.75)`) confined to the pill height with no overhang above it — as a soft fade over the scroll content; a `BlurView` (from `expo-blur`, `intensity={50}`) wraps the pill row on iOS; Android uses an rgba fallback. Pill: `height: 56`, `borderRadius: 28`, horizontally centered with `marginHorizontal: Spacing.md`. 5 equal `TouchableOpacity` sections map to tabs (Home, Weight, Nutrition, Activities, More); `profile` and `settings` routes are filtered from `state.routes` before rendering so they never appear in the pill even though they are registered tab routes with `href: null`; the More section calls `toggle()` from `MoreMenuContext` instead of navigating. Active tab uses `colors.primary`, inactive uses `colors.textSecondary`. Exports `PILL_TOTAL_HEIGHT` constant (`PILL_HEIGHT + Spacing.sm`) used by `MoreMenuPopover` and tab screen scroll padding.

### `MoreMenuPopover`

(`components/navigation/MoreMenuPopover.tsx`): anchored popover rendered as a sibling of `<Tabs>` inside `MoreMenuProvider` in `app/(tabs)/_layout.tsx`. When `visible`, renders a full-screen transparent `Pressable` backdrop (calls `hide()`) plus an absolutely-positioned `Animated.View` above the pill tab bar near the right edge (`bottom: PILL_TOTAL_HEIGHT + insets.bottom + 8`, `right: Spacing.md`). Popover card: `width: 180`, `backgroundColor: colors.card`, `borderRadius: Radius.lg`, standard shadow. Two rows with `person-outline` (Profile) and `settings-outline` (Settings) icons; tapping either calls `hide()` then `router.push()`. Animates open with `Animated.timing` (opacity 0→1 + translateY 10→0, 150ms).

### `MoreMenuContext`

(`context/MoreMenuContext.tsx`): provides `{ visible, show(), hide(), toggle() }`. `MoreMenuProvider` wraps the entire tabs layout in `app/(tabs)/_layout.tsx`. The More tab press is intercepted in `PillTabBar` via `toggle()` from this context.

### `ProfileCard`

(`components/profile/ProfileCard.tsx`): always-visible read-only card at the top of the Home and Profile screens. Uses the **iOS 26 feature card** pattern (deep shadow, `borderWidth: 1`, `LinearGradient` background — see style guide Section 15). Left: circular avatar wrapped in a persistent 3px `colors.primary` ring with a small inner gap (Instagram-style, always visible). A small red dot badge (`#FF3B30`, 12px) sits at the top-right of the ring when `preferences.lastRecapShownWeek !== currentISOWeek` (computed via `getISOWeekString(getToday())`); the badge clears as soon as the recap modal mounts (existing `SET_LAST_RECAP_WEEK` dispatch). **Tapping the avatar (inside the ring) navigates to `weekly-recap-modal`** — picture editing has been moved to the Edit Profile modal. Right: user's name (or "Your Profile" placeholder) and level label (`⭐ P1 · Level 4 · Dedicated` or `⭐ Level 4 · Dedicated` format, using `getLevelLabel(totalXp)` from `utils/xpCalculation.ts`) + `chevron-forward`. Height, weight, and activity level are not shown — those details are viewable in Edit Profile. **Tapping the info area or the chevron-forward navigates to `app/profile-modal.tsx`** — the card has no inline edit form. Level label styled with `Typography.small` + `colors.textSecondary`, with `numberOfLines={1} ellipsizeMode="tail"` to prevent overflow. Ring color is `colors.primary` (theme-aware, updates live with accent changes).

### `BadgesSection`

(`components/profile/BadgesSection.tsx`): simple tappable nav row below `ProfileCard` on the Profile screen. Navigates to `app/stats-achievements-modal.tsx`. Styled consistently with other nav rows on the Profile tab (Food Library, Nutrition Goals, etc.) — `backgroundColor: colors.card`, `borderRadius: Radius.lg`, standard shadow, chevron-forward icon.

### Streak calculation

(`utils/streakCalculation.ts`): exports `foodStreak()`, `calorieGoalStreak()`, `weightStreak()`, `activityStreak()` — each returns `{ current: number, longest: number }`. Counts backwards from today for current streak; scans all sorted dates for longest streak.

### `MacroSection`

(`components/settings/MacroSection.tsx`): accepts `goalCalories: number | null` and `activityAdjusted?: boolean` props from `settings.tsx`. Displays gram equivalents below each preset button and custom % input. Shows `—g` when no goal calories are available. Shows an ⓘ icon (taps to `Alert.alert()`) explaining that grams factor in profile, weight, and activity average. `settings.tsx` passes `adjustedGoalCalories = TDEE + Math.round(avgActivityCalories)` where `avgActivityCalories` is the average `caloriesBurned` across days that have activity entries (up to last 7 days) filtered by `activityMode` — days with no activity are excluded from the divisor.

### `CustomFoodForm`

(`components/nutrition/CustomFoodForm.tsx`): has a **Required / Optional tab switcher** below the header. **Required tab** contains all existing fields: name, serving size (quantity + unit picker: g, oz, cup, qty), calories (auto-computed from macros via `useEffect`; manual override shows an `Alert` warning), and protein/carbs/fat. **Optional tab** contains: **Food type** (multi-select chips from `preferences.foodTypeCategories` — tapping toggles on/off, selected chips use `colors.primary` bg + white text; each chip has a `×` remove button + `+` Add button that shows an inline TextInput for cross-platform compat). Removing a food type category is handled by the `SET_FOOD_TYPE_CATEGORIES` reducer (automatically clears the removed type from all custom foods' `foodTypes` arrays). Tab state defaults to Required; switching preserves all form data. Accepts optional `initialFood?: CustomFood`, `mode?: 'create' | 'edit'`, and `initialName?: string` props — in edit mode pre-populates all fields including food types. `onDone` prop type is `(createdFood?: CustomFood) => void`.

### `EditMealFlow`

(`components/nutrition/EditMealFlow.tsx`): edit an existing saved meal template. Pre-populated from a `SavedMeal` prop; supports renaming, adding foods (search + PortionSelector), removing foods (× button), and adjusting portions of already-added foods (tap row → bottom-sheet PortionSelector). Dispatches `UPDATE_SAVED_MEAL` on save. Launched from `AddMealTab` via the pencil icon. Uses a unified `SectionList` (`stickySectionHeadersEnabled={false}`) with sections: "In Meal" (current meal foods, hidden while searching), "Pinned" (pinned custom foods), "Recent" when not searching (top 7 non-pinned by frequency), "My Foods" when searching (all matching unpinned custom foods). Foods are always visible without needing to focus the search box.

### `AddMealTab`

(`components/nutrition/AddMealTab.tsx`): lists saved meals with a "Pinned" section (meals where `pinnedCategories` includes the current `category`) and an "All Meals" section. Bottom controls are a shared `FloatingPillBar` providing Create / Search / Filter pills — Create opens `CreateMealFlow`, Search expands into a text filter over meal names, Filter opens `FoodFilterModal` and applies food-type filters with OR-over-foods logic (a meal passes if ANY of its foods has a matching `foodTypes` entry; since `NutritionFoodItem` does not carry `foodTypes`, a lookup is built from `customFoods` keyed by lowercased+trimmed name). **When search is expanded with an empty query** (`searchExpanded === true && searchQuery.trim() === ''`): the list area is blank — no Pinned, no All Meals — until the user types. Once a query is typed, Pinned (filtered) + All Meals (filtered) appear as usual. The "Pinned" section header has an "Edit" text button on the right (hidden if no pinned meals). Tapping "Edit" enters edit mode (`editingPinned` state): hides the "All Meals" section and action buttons (pin/pencil/trash), shows only pinned meals with drag handles for reordering; the button changes to "Done" to exit. In edit mode, tapping a meal row is a no-op (only drag is active). Dragging dispatches `REORDER_PINNED_MEALS`. Outside edit mode, each row has pin (pin), pencil (edit), and trash (delete) buttons. Tapping the pin icon opens a modal with multi-select checkboxes for all 4 `MealCategory` values; on save dispatches `UPDATE_SAVED_MEAL` with updated `pinnedCategories`. Props: `date`, `category`, `onDone`.

### `AddFoodTab`

(`components/nutrition/AddFoodTab.tsx`): custom food search with **category filtering**. Bottom controls are a shared `FloatingPillBar` providing Create / Search / Filter pills — Create opens `CustomFoodForm`, Search expands into a text filter over custom food names, Filter opens `FoodFilterModal`; active filters show a colored badge dot on the Filter pill. Filters apply to Pinned, Recent, and My Foods sections (food type multi-select OR logic). **When search is collapsed** (`searchExpanded === false`): shows "Pinned" section (foods whose `pinnedCategories` includes the current `category`) + "Recent" section (top 7 non-pinned custom foods by logging frequency, foods logged at least once, sorted desc by count). "My Foods" is hidden when not searching. **When search is expanded with an empty query** (`searchExpanded === true && query.trim() === ''`): the list area is blank — no Pinned, no Recent, no My Foods, no empty message — until the user types. **When a query is typed**: shows "Pinned" + "My Foods" (all matching non-pinned foods). The "Pinned" section header has an "Edit" text button on the right (hidden if no pinned foods). Tapping "Edit" enters edit mode (`editingPinned` state): shows only pinned foods with drag handles for reordering; the button changes to "Done" to exit. On drag end, dispatches `REORDER_PINNED_FOODS` with `category`. Outside edit mode, each row has a **pin icon** (`pin`/`pin-outline`) — tapping opens a modal with multi-select checkboxes for all 4 `MealCategory` values; saving dispatches `UPDATE_CUSTOM_FOOD` with updated `pinnedCategories`. Pinned foods are sorted by `pinnedOrder[category]` (ascending, fallback to Infinity). Also has pencil and trash icon buttons. Tapping the food info area **replaces the entire tab content** with a full-view `PortionSelector`. After creating a new custom food via `CustomFoodForm`, the user is automatically taken to the `PortionSelector` for the new food (auto-select flow). Food frequency is computed on the fly from `nutritionLog` using `useMemo` (by food name, case-insensitive).

### `FloatingPillBar`

(`components/nutrition/FloatingPillBar.tsx`): shared Apple Music-style floating controls pinned to the bottom of Add Food/Add Meal surfaces and both Food Library tabs. Absolutely positioned with `bottom: insets.bottom` (flush with safe-area — no extra offset). **Default state** shows three pills in a `flexDirection: 'row'` with `gap: Spacing.sm` and `paddingHorizontal: Spacing.md`: a **Create** oval pill (translucent `colors.primary + '33'` background + `1.5px colors.primary` border, `+` icon + "Create" label in `colors.primary`, `flex: 1`), a **Search** oval pill (translucent neutral background — `rgba(255,255,255,0.12)` dark / `rgba(0,0,0,0.06)` light — + `colors.border` border, `search` icon + "Search" label, `flex: 1`), and a **Filter** circle pill (same translucent neutral background + `colors.border` border, `filter-outline` icon, `width/height: PILL_SIZE (48)`, `flex: 0`) with an 8×8 `colors.primary` dot badge when `hasActiveFilter`. **Expanded search state**: the Create pill is **fully removed from the render tree** (not collapsed to a circle); the Search pill becomes `flex: 1` and shows `[search-icon] [TextInput]`; the Filter pill is replaced by a 48px **X** circle (same translucent neutral style) that calls `handleClose` to clear the query, dismiss the keyboard, and collapse. **Gradient backdrop**: the component returns a React Fragment containing a `LinearGradient` (from `expo-linear-gradient`) and the pill row. The gradient is `position: absolute, bottom: 0, left: 0, right: 0, height: PILL_SIZE + insets.bottom` — spanning from the top of the pill buttons to the physical screen edge — using the same 3-stop colors as the nav bar (`transparent → rgba(bg, 0.35) → rgba(bg, 0.75)`). It has `pointerEvents="none"` and does NOT move with the keyboard. **BlurView backdrop**: the pill row itself is wrapped in a `<BlurView intensity={60} tint={isDark ? 'dark' : 'light'}>` (`expo-blur`) with `borderRadius: PILL_SIZE / 2` and `overflow: 'hidden'`, giving a frosted-glass effect behind the pills. Android fallback: `backgroundColor: 'rgba(44,44,46,0.75)'` (dark) or `'rgba(255,255,255,0.75)'` (light) applied when `Platform.OS === 'android'`. **Keyboard avoidance**: a `Keyboard.addListener` tracks keyboard height; on iOS the bar's `bottom` is set to `keyboardHeight + Spacing.sm` when the keyboard is open; on Android Expo defaults to `adjustResize` — no manual lift needed. Uses `useSafeAreaInsets()`. Props: `onCreate`, `searchExpanded`, `searchValue`, `onSearchChange`, `onSearchToggle`, `onFilterPress`, `hasActiveFilter` (unchanged). Consumers own the `searchExpanded` / `searchValue` / filter state and should set their list `contentContainerStyle.paddingBottom` to ~80 to clear the footer.

### `CreateMealFlow`

(`components/nutrition/CreateMealFlow.tsx`): uses a unified `SectionList` (`stickySectionHeadersEnabled={false}`) with sections: "In Meal" (foods added so far, hidden while searching), "Pinned" (pinned custom foods), "Recent" when not searching (top 7 non-pinned by frequency), "My Foods" when searching (all matching unpinned custom foods). Foods are always visible without needing to focus the search box. Rows are tap-to-select only (no management buttons). A `PortionSelector` panel appears below the list when a food is selected; "Add to Meal" scales and appends it. Uses a discriminated union type `SectionItem = { kind: 'meal'; food: NutritionFoodItem } | { kind: 'custom'; food: CustomFood }` so both food types share one `renderItem`. Accepts optional `initialFoods?: NutritionFoodItem[]` and `initialName?: string` props to pre-populate the meal (used by `create-meal-modal`).

### Swipe-left to save meal

`MealCategory` header is wrapped in `Swipeable` (from `react-native-gesture-handler`); swiping left reveals a "Save as Meal" action button showing only a `bookmark-outline` icon (no text label). The action button background is always fixed blue `#2196F3` (not the user's accent color). If foods exist, shows `Alert.alert()` confirmation; on confirm, maps foods to fresh IDs via `generateId()` and navigates to `create-meal-modal` with `initialFoodsJson` (JSON) and `initialMealName` params. No-op when the category has no foods.

### Saved meal groups in MealCategory

`MealCategory` separates foods into ungrouped (no `mealGroupId`) and grouped (same `mealGroupId`). Ungrouped foods render in a plain `.map()` (no drag-to-reorder — foods within meal categories are not reorderable by the user). Grouped foods render under a collapsible group header (chevron + meal name + total calories) wrapped in `Swipeable` — swiping left reveals a red trash "Remove Meal" action that shows `Alert.alert()` and dispatches `DELETE_FOOD_FROM_MEAL` for each food in the group. Individual foods within an expanded group use the existing `FoodItem` component. Group collapse state is tracked in `collapsedGroups: Record<string, boolean>` (defaults to collapsed). Group refs stored in `groupSwipeableRefs` (a `useRef<Record<string, Swipeable | null>>({})`). The group header tap target uses `TouchableOpacity` imported from `react-native-gesture-handler` (aliased `GHTouchableOpacity`) — this prevents the first-tap swallowing issue caused by `Swipeable` gesture negotiation. Group header background is `colors.card` and text uses `colors.textSecondary` (with `fontWeight: '600'`) so it blends with the parent meal category card; border is `StyleSheet.hairlineWidth`.`).

### `AddMealTab`

sets `mealGroupId` (a fresh `generateId()` shared across all foods) and `mealGroupName` (the saved meal's name) on each `NutritionFoodItem` when adding a saved meal to a day's log.

### `QuickAddTab`

(`components/nutrition/QuickAddTab.tsx`): entry form with Name (optional, top field) and Calories (required, bottom field) inputs. Field order: Name first, Calories second — but Calories is auto-focused on mount via `useRef` + `useEffect` so the numeric keyboard appears immediately. `returnKeyType="next"` on Name advances focus to Calories; Calories uses `returnKeyType="done"` with `onSubmitEditing={handleAdd}`. "Add" button is disabled until calories > 0. Name defaults to "Quick Add" if left blank. Dispatches `ADD_FOOD_TO_MEAL` with a `NutritionFoodItem` where `quickAdd: true` and all macros are 0. Used as the "Quick Add" tab in `add-food-modal.tsx`.

### `CustomFood`

type (`types/index.ts`): includes optional `pinnedCategories?: MealCategory[]` (which meal categories it's pinned to), `pinnedOrder?: Record<string, number>` (per-category drag order, matching `SavedMeal` pattern), and `foodTypes?: string[]` (multi-select food type categories, e.g. `['Meat', 'Snack']`) fields. The `UPDATE_CUSTOM_FOOD` action maps over `customFoods` and replaces by id. `REORDER_PINNED_FOODS` accepts `category: MealCategory` + `ids: string[]` and writes `pinnedOrder[category]` values. Old `pinned: boolean`, `pinnedOrder: number`, `mealTags`, and `foodType` fields are migrated in `LOAD_DATA`.

### `NutritionFoodItem`

type (`types/index.ts`): includes optional `mealGroupId?: string` and `mealGroupName?: string` fields — populated when foods are added via a saved meal (from `AddMealTab`). Foods with the same `mealGroupId` form a collapsible group in `MealCategory`. Also includes optional `quickAdd?: boolean` — set to `true` for entries created via `QuickAddTab`; these entries have macros stored as 0 and render with distinct styling in `FoodItem`.

### `SavedMeal`

type (`types/index.ts`): includes optional `pinnedOrder?: Record<string, number>` field (keyed by category) used to persist per-category drag order of pinned meals. `REORDER_PINNED_MEALS` accepts `category` + `ids: string[]` and writes `pinnedOrder[category]` values.

### Home screen

(`app/(tabs)/home.tsx`): the first and default tab. Contains date navigation (`DateNav` pattern shared with Weight/Nutrition/Activities, backed by `selectedDate`), `ProfileCard` below it, and a 2-row overview grid. All four cards use the **iOS 26 feature card** pattern (deep shadow, `borderWidth: 1`, `LinearGradient` background — see style guide Section 15). Top row: full-width `TouchableOpacity` card showing `CalorieRing` + `WaterBottleVisual` side-by-side (tap → Nutrition tab). Bottom row: two half-width cards (`minHeight: 160`, content area `flex: 1` + `justifyContent: 'center'`) — Activity card showing `CalorieFlame` at `size={120}` (tap → Activities tab) and Weight card showing `DigitalScale` at `size={100}` with `hideUnit={true}` (tap → Weight tab). All computed values (calorie consumed/target, totalBurned, latest weight entry) use the same helper calculations as the respective dedicated tabs. `ScrollView` contentContainerStyle uses `paddingBottom: PILL_TOTAL_HEIGHT + insets.bottom + Spacing.md` to clear the pill tab bar.

### Activities screen

(`app/(tabs)/activities.tsx`): date navigation + 2-page swipeable pager (Page 0 = `CalorieFlame` component; Page 1 = `WeeklyActivityGraph`) with page dot indicators + collapsible "Log Exercise" section (exercise type pill + hour/minute drum pickers + calorie preview) + collapsible "Log Steps" section (numeric input + calorie preview, input and button side-by-side in `flexDirection: 'row'`) + "Calories Burned" smartwatch input (when `activityMode === 'smartwatch'`; includes instruction text "Enter your total calories burned from your smart watch" styled `Typography.small`/`colors.textSecondary`; input and Save button side-by-side in `flexDirection: 'row'`; smartwatch `TextInput` uses `keyboardType="numeric"`, `returnKeyType="done"`, `onSubmitEditing={handleSaveSmartwatch}`, and `selectTextOnFocus={true}` — tapping Done saves the entry and dismisses the keyboard; `selectTextOnFocus` highlights the pre-filled value so the next keypress replaces rather than appends it; on `onFocus`, `measureLayout` is used against `scrollViewRef` to scroll the input wrapper near the top of the visible area. The `keyboardDidShow` listener is attached **once at mount** via `useEffect` (stable `useCallback` deps) and torn down on unmount via the returned subscription's `.remove()` — no stale listeners accumulate across focus/blur cycles. The listener only calls `scrollSmartwatchIntoView` (guarded by `smartwatchFocusedRef.current`); it never calls `.focus()` on the input. `handleSaveSmartwatch` explicitly calls `smartwatchInputRef.current?.blur()` and resets `smartwatchFocusedRef.current = false` **before** `Keyboard.dismiss()` so Done → Save → blur is deterministic and subsequent outside taps don't re-focus the input. Shows "Entry saved" confirmation toast with checkmark icon using `colors.primaryLight` background + `colors.primary` text for 3 seconds after saving — managed via `showSavedConfirmation` state and `savedConfirmationTimeout` ref, cleared on unmount. The screen's root element is a `KeyboardAvoidingView` (`behavior='padding'` on iOS, `undefined` on Android) wrapping the `ScrollView`; the `ScrollView` has `keyboardShouldPersistTaps="handled"` so taps on whitespace dismiss the keyboard without needing an extra `TouchableWithoutFeedback` wrapper, and taps on buttons register as normal taps while the keyboard is open. Activity log (list of logged activities with delete + mode-change warnings) is conditionally rendered — shown when `activityMode !== 'smartwatch'` (i.e. visible in both `'manual'` and `'auto'` modes); hidden only in `'smartwatch'` mode. Pager resets to page 0 on tab focus via `useFocusEffect`. Requires profile + weight entry (shows `ProfilePrompt` otherwise). Dispatches `ADD_ACTIVITY`, `DELETE_ACTIVITY`, and `DISMISS_ACTIVITY_WARNING`. Default `activityMode` fallback is `'auto'`.

### Profile tab

(`app/(tabs)/profile.tsx`): hidden tab route (`href: null`), accessed via the "…" popover menu in the bottom tab bar. Header shows chevron-back (left) + "Profile" title + `HeaderXpBar` (right, inherited from global `screenOptions`). Reads `focusActivityMode` search param via `useLocalSearchParams()`; when present, clears the param and pushes `nutrition-goals-modal`. Section order: ProfileCard (always visible; avatar tap → `weekly-recap-modal`; info area or chevron-forward → `profile-modal`) → Stats & Achievements (tappable row → `stats-achievements-modal`) → Food Library (tappable row → `food-library-modal`) → Nutrition Goals (tappable row → `nutrition-goals-modal`).

### Settings tab

(`app/(tabs)/settings.tsx`): hidden tab route (`href: null`), accessed via the "…" popover menu in the bottom tab bar. Header shows chevron-back (left) + "Settings" title + `HeaderXpBar` (right, inherited from global `screenOptions`). Reads `focusFeedback` search param; when present, scrolls to the FeedbackSection card and focuses the input inline (150ms scroll delay + 350ms focus delay), then clears the param. Section order: Appearance (tappable row → `appearance-modal`) → App Settings (tappable row → `app-settings-modal`) → Send Feedback (`FeedbackSection` card with `feedbackRef` and `feedbackSectionY` layout tracking) → Footer version string.

### App Settings sub-screen

(`app/app-settings-modal.tsx`): modal route with custom header (chevron-back + "App Settings" title) matching the Appearance modal pattern. Contains settings: Weight Unit, Expand sections by default, Data Backup, and Debug Info. The **Debug Info** card loads the last crash log from AsyncStorage (`CRASH_LOG_KEY` from `utils/crashReporting.ts`) on mount and displays it in a scrollable monospace view with Copy (to clipboard) and Clear buttons. Accessed via "App Settings >" row on the Settings tab.

### `ErrorBoundary`

(`components/ErrorBoundary.tsx`): React class component that wraps the entire app in `app/_layout.tsx` (outside `AppProvider`). Catches unhandled JS exceptions via `static getDerivedStateFromError` + `componentDidCatch`. On catch: writes a JSON crash log `{ message, stack, componentStack, timestamp }` to AsyncStorage under `CRASH_LOG_KEY`; calls `captureCrash()` from `utils/crashReporting.ts`. Renders an `ErrorFallback` functional component (uses static `LightColors` — not `useColors()` — since ThemeContext may be unavailable) showing error message in a red box + "Try Again" button that resets error state. Props: `children: React.ReactNode`.

### `utils/crashReporting.ts`

Crash reporting utility. Exports `CRASH_LOG_KEY` (AsyncStorage key for crash logs), `initCrashReporting()` (called once at module level in `_layout.tsx`; initialises Sentry when `SENTRY_DSN` is set), and `captureCrash(error, extras?)` (sends to Sentry when initialised; no-op otherwise). Sentry is loaded via dynamic `require('@sentry/react-native')` inside try/catch — the app compiles and runs without `@sentry/react-native` installed. Set `SENTRY_DSN` constant to enable remote reporting.

### Nutrition Goals modal

(`app/nutrition-goals-modal.tsx`): modal route with custom header (chevron-back + "Nutrition Goals" title). Contains three cards: Goals & Calorie Target (`GoalsSection` — no props needed, reads `activityMode` from context), Macros (`MacroSection`), and Daily Water Goal (auto/manual toggle + creatine adjustment). Computes `adjustedGoalCalories` and `activityAdjusted` from the last 7 days of activity log (same logic as previously in `settings.tsx`). Accessed via "Nutrition Goals >" row on the Profile tab and via the `focusActivityMode` deep-link from Activities.

### Appearance modal

(`app/appearance-modal.tsx`): modal route with custom header (chevron-back + "Appearance" title styled with `useColors()`). Contains two cards: "Color Mode" (renders `AppearanceModePicker`) and "Accent Color" (renders `ThemeColorPicker`). Uses `SafeAreaView` with `edges={['top', 'bottom']}` + `ScrollView`. Accessed via "Appearance >" tappable row on the Settings tab.

### `WaterTracker`

(`components/nutrition/WaterTracker.tsx`): collapsible card on the Nutrition screen (below MacroProgressBars), **defaults to collapsed on mount**. All water UI elements use fixed blue `#2196F3` / `#E3F2FD` (light) instead of the user's accent color. Header matches `MealCategory` style (`Typography.h3`, chevron size 18, `justifyContent: 'space-between'`). The **entire header row** is wrapped in a `TouchableOpacity` to toggle collapse/expand. Header right side shows a pill button labeled `+{presets[1]} {unit}` **only when collapsed** — taps log the middle preset without expanding; pill is hidden when expanded. Shows three customisable quick-add preset buttons (long-press to edit; defaults `[8, 16, 32]` oz or `[250, 500, 750]` mL stored in `preferences.waterPresets`); buttons use solid `#2196F3` background with white text; all three buttons are identical in size — all share the same fixed `height: 56` (no `paddingVertical`) with `justifyContent: 'center'`; the middle button (index 1) has a white border (`#FFFFFF`, 2px) and a small "Quick Add" text label (9px, white, semi-transparent, `marginTop: 0`) rendered **inside** the `TouchableOpacity` (below the amount text). Custom amount input and a grouped entry list follow. Entries with the same amount are grouped into one row — the `(Nx)` badge is omitted for single entries. Each grouped row shows two red action buttons on the right: a `trash-outline` Ionicons icon (size 22) for "Remove 1" (removes most recent entry via `DELETE_WATER_ENTRY`) and a `Text` element labeled `'Clear'` wrapped in `TouchableOpacity` for "Clear All" (shows `Alert.alert()` confirmation then dispatches `DELETE_WATER_ENTRY` for each entry in the group). All `ADD_WATER_ENTRY` dispatches include `loggedAt: new Date().toISOString()`. Respects `preferences.waterGoalMode` (auto/manual) and `preferences.waterCreatineAdjustment`. Props: `date: string`, `expandKey?: number`, `onFocusInput?: () => void`.

### `ThemeColorPicker`

(`components/settings/ThemeColorPicker.tsx`): horizontal row of 6 color swatches from `ACCENT_PRESETS`; selected swatch shows a checkmark; dispatches `SET_THEME_COLOR` on tap. Reads `preferences.themeColor` (defaults to green preset if unset). Rendered inside `app/appearance-modal.tsx`.

### `AppearanceModePicker`

(`components/settings/AppearanceModePicker.tsx`): 3-card horizontal row for choosing Light / Dark / System appearance mode. Each card shows an icon (`sunny-outline`, `moon-outline`, `phone-portrait-outline`), label, and short description. Selected card has `colors.primary` border; unselected uses `colors.border`. Dispatches `SET_APPEARANCE_MODE` on tap. Reads `preferences.appearanceMode` (defaults to `'system'`). Rendered inside `app/appearance-modal.tsx`.

### `AndroidGlowBackdrop`

(`components/glow/AndroidGlowBackdrop.tsx`): Android-only colored glow halo rendered behind components to simulate the iOS `shadowColor` effect on Android APKs. Returns `null` on iOS or when `intensity === 0`. On Android, renders 1–3 concentric semi-transparent colored `View`s with increasing size and decreasing opacity to approximate a radial colored halo. Always `position: 'absolute'` with `pointerEvents="none"` (parent must not have `overflow: 'hidden'`). Props: `{ color: string, intensity: number, shape: 'circle' | 'rect', size: { width: number, height: number }, borderRadius?: number }`. `intensity` scales both spread (outward by `4 + intensity * 12` dp for outer layer) and opacity. Used by `DigitalScale`, `WaterBottleVisual`, and `CalorieFlame` for Android glow effects.

### `CalorieFlame`

(`components/activities/CalorieFlame.tsx`): Borderless flame rendered as Page 0 of the Activities pager. At full size (192px), wrapper has **no card chrome** — transparent background, no border, no horizontal padding — and reserves outer space via `paddingVertical: Spacing.sm` + `marginBottom: Spacing.md`. When `size < 192` (compact mode), padding and marginBottom are removed so the flame sits flush in its container. Rendered as the Ionicons `flame-outline` glyph (`FLAME_OUTLINE_PATH`) inside `viewBox="0 0 512 600"`. **Flame color is dynamic**: `flameColorForBurn(totalBurned)` from `utils/flameColor.ts` interpolates across 6 color stops (yellow → orange → red → blue → purple → green) as `totalBurned` rises 0 → 600; 600+ caps at green. Outer `<Path>` uses `stroke={color}`, `fill={color + '33'}` (20% opacity tint). Inner `<G transform="translate(128,128) scale(0.5)">` `<Path>` uses `fill={color}` at `fillOpacity={0.3}` for depth. **Glow**: `glowIntensityForBurn(totalBurned)` returns 0–1; on iOS the `flameWrapper` View gets `shadowColor: color, shadowOpacity: 0.25 + intensity * 0.65, shadowRadius: 6 + intensity * 18, elevation: Math.round(4 + intensity * 12)` (all zero at 0 cal). On Android, `<AndroidGlowBackdrop color={color} intensity={intensity} shape="circle" size={{ width: dim, height: dim }} />` is rendered as the first child of `flameWrapper` (where `dim = size ?? 192`). At exactly 0 cal no glow is shown; at 1+ cal it grows proportionally. Calorie number + unit label overlay uses `colors.text`; font sizes scale proportionally when compact (`calFontSize = max(16, round(28 * size/192))`, `labelFontSize = max(9, round(13 * size/192))`). Props: `totalBurned: number`, `size?: number` (default 192; pass a smaller value for compact rendering, e.g. `size={120}` on the Home screen). Follows `useColors()` + `makeStyles(colors, compact)` pattern.

### `DigitalScale`

(`components/weight/DigitalScale.tsx`): Square bathroom-scale visual rendered as Page 0 of the Weight tab pager. Accepts a `size?: number` prop (default 280); both `scaleBody` width and height equal `size`. The parent passes `size={chartHeight}` so the square matches the chart page height. Outer `scaleBody` has `borderWidth: 3, borderColor: colors.primary`, `backgroundColor: colors.primaryLight`, and `overflow: 'hidden'`. A thin **inset border** (`position: 'absolute', top/left/right/bottom: 8, borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md`) is drawn inside the body to suggest the platform stepping surface. **LCD recess** is absolutely positioned in the upper-third of the square: `top: size * 0.08`, `left: size * 0.25 - 3` (the `−3` compensates for the 3px `borderWidth` so the box is visually centered in the inner content area), `width: size * 0.50`, `height: size * 0.20`. LCD shows the weight number (`fontSize: Math.round(size * 0.13)`, `fontVariant: ['tabular-nums']`, `textAlign: 'center'`) + optional unit label (`fontSize: Math.round(size * 0.065)`). **`hideUnit?: boolean` prop** — when `true`, suppresses the unit label and increases the value font coefficient from `0.13` to `0.15` so the number fills the LCD recess better; `unit` prop must still be passed as it drives the placeholder value (`'175.5'` lbs / `'80.0'` kg). **LCD never mirrors the live TextInput value** — the `weight` prop is the committed entry value. The LCD displays: animated count-up value (during/after Save) → committed entry value (when no animation) → greyed-out placeholder. Supports a 1500ms count-up animation with cubic ease-out (`1 - (1-progress)^3`) driven by `requestAnimationFrame`. `animationDone` state becomes true when animation completes. **Themed glow** when `showGlow = animationDone || (hasSavedValue && !showAnimated)`: on iOS, `scaleOuter` gets `shadowColor: colors.primary, shadowRadius: 10, shadowOpacity: 0.6, elevation: 10`; on Android, `<AndroidGlowBackdrop color={colors.primary} intensity={1} shape="rect" size={{ width: size, height: size }} borderRadius={Radius.lg} />` is rendered as first child of `scaleOuter`. Glow clears on a blank date. Props: `weight: string`, `unit: string`, `animateToValue: number | null`, `size?: number`, `hideUnit?: boolean`. Follows `useColors()` + `makeStyles(colors, size, hideUnit)` pattern.

### Weight tab pager

(`app/(tabs)/index.tsx`): 2-page horizontal swipeable pager modeled on the Nutrition and Activities pagers. Page 0 = `DigitalScale` centered in a `scalePage` container (no `paddingVertical` — the scale square fills the full page height); Page 1 = `WeightChart` (same dropdown range selector, line chart, and summary row). Page width = `windowWidth - Spacing.md * 2`. Page dot indicators (2 dots) sit below; active uses `colors.primary`, inactive uses `colors.border`. `activePagerPage` updates on `onMomentumScrollEnd`. **Height sync**: the chart page's wrapping View uses `onLayout` to measure its natural height into `chartHeight` state (default 280); this value is passed as `size={chartHeight}` to `DigitalScale` so the square matches the chart page height. Pager resets to Page 0 on tab focus via `useFocusEffect`. **Animation fix**: the `useEffect` that resets `animateToValue` runs only on `selectedDate` change (not on `entries` change) — this prevents the save animation from being cancelled when the new entry lands in context. `DigitalScale` receives `weight={existingEntry ? String(convertWeight(...)) : ''}` (the committed DB value, not `weightInput`) so the LCD never mirrors live typing. Below the pager sits the **Log Weight card**: `sectionHeader` titled `Log Weight ({preferences.unit})` + `sectionBody` with TextInput + fixed-width Save button. Followed by `savedMessage` (when present) and `<WeightInsights />`.

### `CalorieRing`

(`components/nutrition/CalorieRing.tsx`): SVG ring showing consumed vs target calories. Progress ring color is computed by `ringColorForProximity()` from `utils/calorieColor.ts` — dark green when within ±25 cal of goal, transitioning through green/yellow/orange/red as the delta grows; falls back to `colors.primary` when no target is set. Props: `consumed: number`, `target: number`.

### `WeeklyCalorieGraph` / `WeeklyWaterGraph` / `WeeklyActivityGraph`

(`components/nutrition/WeeklyIntakeGraph.tsx`): Named exports for the three separate 7-day graphs. Each graph renders inside a `colors.card` rounded card with standard shadow (`Spacing.md` padding, `Radius.lg` border radius). Title uses `Typography.h3 + colors.text`, left-aligned. `WeeklyCalorieGraph` accepts `width`, `calorieData: DayEntry[]`, `macroData?: DayMacro[]` (for tooltip macro breakdown), `calorieGoal?`, `activePageIndex?: number`; shows calorie bars with proximity colors. `WeeklyWaterGraph` accepts `width`, `waterData: DayEntry[]`, `waterGoal?`, `waterUnit?`, `activePageIndex?: number`; shows water bars in fixed blue `#2196F3`. Both components run `useEffect(() => { setSelectedBar(null); }, [activePageIndex])` to auto-dismiss any open tooltip when the pager page changes — `activePagerPage` from `nutrition.tsx` is passed as `activePageIndex`. Each graph supports **tap-to-tooltip**: tapping a bar shows a floating tooltip with date + value (calorie graph also shows colored P/C/F macro breakdown); tapping the bar again or pressing × dismisses. Tooltip has a fixed `width` (matching the `TOOLTIP_WIDTH_CALORIE=160` or `TOOLTIP_WIDTH_WATER=120` constant) for predictable rendering, and is clamped with a `TOOLTIP_CLAMP_BUFFER=4` extra right-side buffer to prevent the border/× button from clipping at the card edge. Outside-bar taps dismiss via a full-SVG transparent background `Rect` (rendered first, `fill="rgba(0,0,0,0.001)"`); bar `G` elements render on top and capture their own touches. Bar area height is 160px (`CHART_HEIGHT=160`). Y-axis: 3 ticks, `Y_AXIS_WIDTH=36` left margin; X-axis: 20px bottom margin for day labels; faint dashed grid lines at each Y tick; dashed goal line with "Goal: X" label at right end. Bar tap areas use `fill="rgba(0,0,0,0.001)"` (not `"transparent"`) to capture touches in SVG. `innerWidth = width - Spacing.md * 2` (accounts for card padding); passed to `BarChart`; tooltip positions computed against `innerWidth`. The file also exports a default `WeeklyIntakeGraph` (stacked, for backward compat). Rendered as Pages 0 and 2 of the swipeable pager in `nutrition.tsx`. `weeklyMacroData` (per-day P/C/F totals) is computed in `nutrition.tsx` alongside `weeklyCalorieData` and passed to `WeeklyCalorieGraph`. `WeeklyActivityGraph` accepts `width`, `activityData: DayEntry[]`, `dailyBurnGoal?`, `activePageIndex?`; uses `colors.primary` for bars; tooltip shows date + calories burned. Rendered as Page 1 of the swipeable pager in `activities.tsx`; `weeklyActivityData` is computed from `activityLog` for the 7 days ending on `selectedDate` (caloriesBurned as `consumed`, goal=0).

### `WeightChart`

(`components/WeightChart.tsx`): Line chart showing weight trend with a **dropdown range selector** (1W / 1M / 3M / 1Y / All). Tapping the dropdown pill opens an `Alert.alert()` action sheet with the range options; currently selected range is marked with ✓. Filters entries to the selected window by comparing dates against a cutoff computed from `getToday()`. Falls back to the last 2 entries if fewer than 2 are in the selected range. Shows a summary row below the chart with Start weight, net Change (colored green for loss, danger for gain), and Current weight. Uses `react-native-chart-kit` `LineChart`. Default range is `1M`.

### `WaterBottleVisual`

(`components/nutrition/WaterBottleVisual.tsx`): animated bottle fill visual rendered to the right of `CalorieRing` in `nutrition.tsx`. Reads `waterLog` for the given `date` and computes goal via `calculateWaterGoal()` (same logic as `WaterTracker`). Fill level animates with `Animated.spring` on consumed/goal change; always uses fixed blue `#2196F3` for the fill color regardless of the user's accent theme. The fill animation is clamped to [0, 1] but the percentage label shows the real unclamped value (e.g. `120%` when over goal). Bottle dimensions: `BOTTLE_WIDTH=68`, `BOTTLE_BODY_HEIGHT=115`, `CAP_WIDTH=36`, `CAP_HEIGHT=14`, `NECK_HEIGHT=8` (total height ≈137px, proportional to the 160px calorie ring). When `rawPct >= 1.0` (goal met or exceeded), a glow is applied to the full bottle container: on iOS, `shadowColor: '#64B5F6'`, `shadowRadius: 10`, `shadowOpacity: 0.85`, `elevation: 10`; on Android, `<AndroidGlowBackdrop color="#64B5F6" intensity={1} shape="rect" size={{ width: 68, height: 137 }} borderRadius={13} />` is rendered as the first child of the bottle container. No border color is applied to `bottleBody` on goal completion — only the glow effect. Tapping calls `onPress` prop (used to expand `WaterTracker` via `expandKey`). Props: `date: string`, `onPress: () => void`.

### `ToastNotification`

(`components/ToastNotification.tsx`): absolute-positioned top-of-screen banner rendered at root level inside `app/_layout.tsx` (inside `ThemeColorSync`, after `GamificationWatcher`). Reads `current` toast from `ToastContext`; slides in from top with `Animated.spring` + opacity fade, auto-dismisses after 3 s (timer managed in `ToastContext`). Shows optional emoji + message text + `✕` dismiss button. Uses `useSafeAreaInsets()` for correct top offset. Follows `useColors()` + `makeStyles(colors)` pattern.

### `GamificationWatcher`

(`components/GamificationWatcher.tsx`): invisible (`return null`) component rendered inside `ThemeColorSync` in `app/_layout.tsx`. Watches app state reactively via `useEffect` and dispatches gamification actions: achievement unlocks (`UNLOCK_ACHIEVEMENT`) and XP grants (`ADD_XP`). Achievements are unlocked silently on first mount (no toast), then with toast on subsequent unlocks. XP is granted for: food logging (+5/entry, capped 25/day), hitting calorie goal ±10% (+20/day), hitting water goal (+15/day), logging weight (+10/day), logging activity (+10/day), crossing 7-day streak (+50, one-time via `xp_streak_7` guard), crossing 30-day streak (+200, one-time via `xp_streak_30` guard). Shows level-up toast (e.g. "Level Up! Level 5 · Committed") via `useToast()` when `getLevelFromXp(totalXp)` increases. All daily XP grants are idempotent — guarded by `preferences.xpLog[date]` per source.

### `ToastContext`

(`context/ToastContext.tsx`): provides `showToast(text, emoji?)` + `dismiss()` + `current: ToastMessage | null`. Timer is managed inside the provider (3 s `setTimeout`). `ToastProvider` wraps the entire app inside `AppProvider` in `app/_layout.tsx`.

### Achievement definitions

(`utils/achievementCalculation.ts`): exports `ACHIEVEMENTS` (typed constant array of 8 milestones: 4 streak × {7,30,100,365 days}, 4 food-logged × {10,50,100,500 entries}) and `checkNewAchievements(unlockedIds, longestStreak, totalFoodsLogged)` which returns newly unlockable IDs.

### XP/level definitions

(`utils/xpCalculation.ts`): exports `XP_FOOD` (5), `XP_FOOD_CAP` (25), `XP_CALORIE_GOAL` (20), `XP_WATER_GOAL` (15), `XP_WEIGHT` (10), `XP_ACTIVITY` (10), `XP_STREAK_7` (50), `XP_STREAK_30` (200); `LEVEL_THRESHOLDS` (10-element array); `LEVEL_NAMES` (Novice→Legend); `getLevelFromXp(xp)`, `getLevelName(xp)` (name only), `getLevelLabel(xp)` (returns `"Level N · Name"` format with number), `getLevelProgress(xp)` → `{ level, name, currentLevelXp, nextLevelXp, isMax }`.

### `UserPreferences` gamification fields

(in `types/index.ts`): `unlockedAchievements?: string[]` (persisted list of unlocked achievement/guard IDs), `totalXp?: number`, `prestige?: number`, `xpLog?: Record<string, XpDayLog>` where `XpDayLog = { food: number, calorieGoal: boolean, waterGoal: boolean, weight: boolean, activity: boolean }` — guards against duplicate daily XP grants. Also includes `lastRecapShownWeek?: string` (ISO week string e.g. `"2026-W15"`) — updated by `SET_LAST_RECAP_WEEK` when the weekly recap modal is opened, preventing the auto-show from firing more than once per week. Also includes `foodTypeCategories?: string[]` — user's list of food type categories; initialized with 8 defaults (`Meat`, `Fruit`, `Vegetable`, `Grain`, `Dairy`, `Snack`, `Beverage`, `Other`) on `LOAD_DATA` if unset. Managed via `SET_FOOD_TYPE_CATEGORIES` action — when categories are removed, the reducer automatically filters them out of all custom foods' `foodTypes` arrays. Also includes `favoriteFilterTypes?: string[]` — up to 4 food type strings shown as quick-access pills in `FavoritePillRow`; initialized to `[]` on `LOAD_DATA` if unset. Managed via `SET_FAVORITE_FILTER_TYPES` action.

### Weekly Recap modal

(`app/weekly-recap-modal.tsx`): full-screen `fullScreenModal` presentation with story-style layout. Uses `useSafeAreaInsets()` + plain `View` (not `SafeAreaView`) for reliable Dynamic Island/notch avoidance on first open. Top progress bar (4 equal segments, fills as pages advance). Tap right half of screen → advance; tap left half → go back; ✕ button closes. 4 pages rendered conditionally by `currentPage` state: `RecapWeightPage` (weight start/end/change), `RecapNutritionPage` (avg daily calories vs goal, weekly macro totals), `RecapStreaksPage` (current streaks + unlocked achievements), `RecapRatingPage` (1–5 star rating with factor progress bars). Week covered = the most recently completed ISO week (last Mon–Sun) — always computed as `getISOWeekMonday(today) − 7 days` (weekStart) through `weekStart + 6 days` (weekEnd), so the full prior week is shown regardless of which day the recap is opened. Footer shows human-readable date range + "Next"/"Done" button. On mount, dispatches `SET_LAST_RECAP_WEEK` with current ISO week so auto-show doesn't repeat. Auto-show logic lives in `RootNavigator` in `app/_layout.tsx`: runs when `isLoading` is false, user is on a tabs screen, today is Monday (`dayOfWeek === 1`), and `preferences.lastRecapShownWeek !== currentISOWeek`.

### `RecapWeightPage`

(`components/recap/RecapWeightPage.tsx`): shows weight entries from the recap week. Displays start-of-week entry, end-of-week entry, and net change with a colored arrow (green for loss, red for gain). Shows "No weight entries this week" when data is absent.

### `RecapNutritionPage`

(`components/recap/RecapNutritionPage.tsx`): computes average daily calories across days that had food logged + weekly totals for protein/carbs/fat. Macro totals displayed as colored pills (Protein `#3B82F6`, Carbs `#F59E0B`, Fat `#EF4444`). Shows "No nutrition data logged this week" when data is absent.

### `RecapStreaksPage`

(`components/recap/RecapStreaksPage.tsx`): displays current food/calorie-goal/weight/activity streaks in a 2×2 grid, plus unlocked achievements from `preferences.unlockedAchievements` (up to 3 shown). Uses `foodStreak`, `calorieGoalStreak`, `weightStreak`, `activityStreak` from `utils/streakCalculation.ts`.

### `RecapRatingPage`

(`components/recap/RecapRatingPage.tsx`): shows 1–5 star rating (gold `#F59E0B` filled stars) computed by `calculateWeeklyRating()`. Below the stars, a labeled progress bar for each of the 4 factors (Calorie Goal, Water Goal, Weight Logged, Food Logged) shows the 0–100% fraction for that factor using `colors.primary` fill.

### `utils/weeklyRatingCalculation.ts`

exports `calculateWeeklyRating(weekStart, weightEntries, nutritionLog, waterLog, preferences, calorieTarget)` → `{ stars: number, factors: { calories, water, weight, food } }`. Each factor is 0–1 (fraction of 7 days meeting the condition). Average of all 4 factors maps linearly to 1–5 stars via `Math.round(1 + avg * 4)`. Water goal uses `calculateWaterGoal()` from `utils/waterCalculation.ts` (respects `waterGoalMode`/`waterGoalOverride`/`waterCreatineAdjustment`).

### Leveling Tutorial modal

(`app/leveling-tutorial-modal.tsx`): full-screen `fullScreenModal` presentation with story-style layout matching `weekly-recap-modal.tsx`. Uses `useSafeAreaInsets()` + plain `View` (not `SafeAreaView`) for reliable Dynamic Island/notch avoidance on first open. Top progress bar (3 equal segments, fills as pages advance). Tap right half → advance; tap left half → go back; ✕ button closes. 3 pages rendered conditionally by `currentPage` state: `TutorialXpPage`, `TutorialLevelsPage`, `TutorialPrestigePage`. Footer shows "Next" on pages 1–2 and "Done" on page 3. Opened from the ⓘ icon in the Level card header of `stats-achievements-modal.tsx`.

### `TutorialXpPage`

(`components/tutorial/TutorialXpPage.tsx`): lists all XP sources with amounts read from `utils/xpCalculation.ts` constants. Two sections: Daily Actions (food logging, calorie goal, water goal, weight, activity) and Streak Bonuses (7-day, 30-day).

### `TutorialLevelsPage`

(`components/tutorial/TutorialLevelsPage.tsx`): visual ladder of all 10 levels showing level number, name, and XP threshold from `LEVEL_THRESHOLDS` and `LEVEL_NAMES`. Highlights the user's current level with `colors.primaryLight` background. Accepts `totalXp: number` prop.

### `TutorialPrestigePage`

(`components/tutorial/TutorialPrestigePage.tsx`): explains the prestige system — reaching Level 10 unlocks prestige, resets XP to 0 and level to 1, grants a prestige badge (P1, P2, etc.). Shows an example label format.

### `FeedbackSection`

(`components/settings/FeedbackSection.tsx`): multi-line `TextInput` (min 5–6 visible lines) + disabled-until-filled Submit button; on submit does a standard `fetch()` POST (no `mode: 'no-cors'`) to the Google Forms `formResponse` endpoint using hardcoded `GOOGLE_FORM_ID` and `GOOGLE_FORM_ENTRY` constants (no env vars); checks `response.ok` and shows an error `Alert` on non-ok responses; shows "Thanks for your feedback!" confirmation for 4 s and clears input on success; calls `Keyboard.dismiss()` in the `finally` block. Shows "Sending…" label while in-flight. In `__DEV__` mode, `console.warn` logs the request URL, payload, and response status (or error) on every submit attempt. Implemented with `forwardRef` + `useImperativeHandle` exposing `FeedbackSectionHandle { focus(): void }` — allows `settings.tsx` to call `feedbackRef.current?.focus()` programmatically (used by `focusFeedback` deep-link). Accepts optional `onFocusInput?: () => void` prop called when the TextInput is focused.

### `FavoritePillRow`

(`components/nutrition/FavoritePillRow.tsx`): a full-width row of up to 4 quick-access filter pills rendered above the food/meal list in `AddFoodTab`, `AddMealTab`, and `food-library-modal`. Props: `favorites: string[]` (from `preferences.favoriteFilterTypes`), `activeFilters: string[]`, `onToggle: (type: string) => void`. Each pill has `flex: 1`, `height: 32`, `borderRadius: 16`, `marginHorizontal: 2`. Active: `backgroundColor: colors.primary` + white text. Inactive: `backgroundColor: colors.card`, `borderWidth: 1`, `borderColor: colors.border`. Returns `null` when `favorites.length === 0`. Hidden in `AddFoodTab`/`AddMealTab` when search is expanded with no query typed (list is blank anyway).

### `FoodFilterModal`

(`components/nutrition/FoodFilterModal.tsx`): bottom-sheet modal for filtering foods by food type. Two stacked sections: **Selected** (highlighted with `colors.primary` background) at top and **Available** (neutral) below — tapping a type moves it between sections with `LayoutAnimation`. Header shows an **Edit Favorites** button that toggles `editMode`: in edit mode, pills that are already favorites shake with a looping ±2° rotation (`Animated.loop`) and show a `remove-circle` × badge to remove from favorites; non-favorite pills show an `add-circle` + badge to add (capped at 4, greys out when at limit). Favorites are persisted via `SET_FAVORITE_FILTER_TYPES` dispatch. Has "Clear Filters" and "Apply" buttons. Exports `FoodFilters` type: `{ foodTypes: string[] }`. Props: `visible`, `onClose`, `onApply(filters)`, `currentFilters`. Used in Food Library modal (both tabs), `AddFoodTab`, and `AddMealTab`.

### Food Library modal

(`app/food-library-modal.tsx`): modal route accessible from the Profile screen (below Stats & Achievements) with a chevron-back header titled "Food Library". Contains two tabs: **Foods** and **Meals**. Both tabs render an alphabetical `FlatList` and a shared `FloatingPillBar` (Create / Search / Filter) pinned above the safe-area bottom inset. Foods tab: Create opens `CustomFoodForm`; Search text-filters `customFoods` by name; Filter opens `FoodFilterModal` (food-type multi-select OR logic); each row has pencil (opens `CustomFoodForm` edit mode, panel-replacement pattern) and trash (dispatches `DELETE_CUSTOM_FOOD`) icons; tapping the row itself is a no-op. Meals tab: Create opens `CreateMealFlow`; Search text-filters `savedMeals` by name; Filter applies OR-over-foods logic (a meal passes if ANY of its foods has a matching `foodTypes` entry, looked up from `customFoods` by lowercased+trimmed name); each row shows meal name + food count + total calories + pencil (opens `EditMealFlow`) + trash (dispatches `DELETE_SAVED_MEAL`). Independent search/expand/filter state per tab (`foodQuery`/`mealQuery`, `foodsSearchExpanded`/`mealsSearchExpanded`, `foodFilters`/`mealFilters`); the single `FoodFilterModal` routes `onApply`/`currentFilters` based on `activeTab`. `FlatList` uses `contentContainerStyle: { paddingBottom: 80 }` so the last row is not hidden behind the floating pill bar. Both create/edit flows replace the tab content (panel-replacement pattern: `foodsView`/`mealsView` state switches between `'list' | 'create' | 'edit'`); the tab switcher and pill bar are hidden while in a sub-panel. Back button in header returns to list from any sub-panel; pressing back from the list closes the modal. Uses `SafeAreaView` with `edges={['top', 'bottom']}`. Follows `useColors()` + `makeStyles(colors)` pattern.

### Profile modal

(`app/profile-modal.tsx`): modal route opened by tapping `ProfileCard`. **Avatar section at the very top** (above the Name card, not wrapped in a card): a 120px centered circular avatar (photo / initials / default `person-circle-outline` icon) with a centered "Edit" pill button below it. Tapping "Edit" opens an `Alert.alert('Profile Picture', ...)` action sheet with three options: **Choose Photo** (lazy-loads `expo-image-picker` + `expo-file-system`, `allowsEditing: true`, `aspect: [1, 1]`, saves to `FileSystem.documentDirectory + 'avatar.jpg'`, dispatches `SET_AVATAR`), **Remove Photo** (lazy-deletes the file, dispatches `SET_AVATAR` with `undefined`), and **Cancel**. **`expo-image-picker` and `expo-file-system` imports are dynamic (lazy `import()`)** to preserve the Android APK crash fix. Below the avatar section: Name (optional), Date of Birth (button that opens the DOB picker), Sex (Male/Female toggle), Height (ft+in or cm depending on unit), Activity Tracking Mode (Auto/Manual/Smart Watch pills with ⓘ icons + `InfoModal`, dispatches `SET_ACTIVITY_MODE` immediately), Activity Level (only shown when mode is Auto). Save button validates height, dispatches `SET_PROFILE`, and calls `router.back()`. Save button is disabled (`opacity: 0.5`) when no fields have changed from their initial values; all fields (name, dob, sex, height, activityMode, activityLevel) are tracked for change detection via a `useRef` snapshot + `useMemo`. Back chevron shows an unsaved-changes confirmation alert (`Alert.alert('Discard changes?')`) when `hasChanges` is true; navigates back silently when no changes. No Cancel button — removed. DOB picker: Android uses inline `DateTimePicker`; iOS uses `Modal` + `display="spinner"` + `themeVariant={resolvedScheme}`. Header: chevron-back + "Edit Profile" title. Uses `SafeAreaView edges={['top', 'bottom']}` + `ScrollView`.

### Stats & Achievements modal

(`app/stats-achievements-modal.tsx`): modal route opened from the `BadgesSection` nav row. Three clearly labeled sections in cards: **Level** — header row with "Level" label + tappable `information-circle-outline` icon that opens `leveling-tutorial-modal`, `⭐ Level N · Name` text (uses `getLevelLabel`), XP progress bar (`colors.primary` fill on `colors.border` bg) with "Level N → Level N+1" hint below, XP numbers, or "Prestige →" button at Level 10 (same `Alert.alert()` confirmation + `PRESTIGE` dispatch as old `BadgesSection`). **Badges** — 4 streak cards (Calorie Goal, Weight, Food, Activity) each showing current streak + longest streak using `foodStreak`, `calorieGoalStreak`, `weightStreak`, `activityStreak` from `utils/streakCalculation.ts`. **Achievements** — 8-tile 2-column `flexWrap` grid from `ACHIEVEMENTS` in `utils/achievementCalculation.ts`; unlocked tiles have `colors.primary` border, locked tiles are `opacity: 0.5` with `lock-closed` icon overlay. Header: chevron-back + "Stats & Achievements" title. Uses `SafeAreaView edges={['top', 'bottom']}` + `ScrollView`.

