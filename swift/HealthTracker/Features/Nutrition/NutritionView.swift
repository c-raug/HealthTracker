import SwiftUI

/// Nutrition tab. Port of `expo/app/(tabs)/nutrition.tsx`.
///
/// Overview, meals, add-food, and water are all live now: profile/weight prompts, the **3-page pager**
/// (calorie graph ↔ ring+bottle ↔ water graph), the **macro bars**, the meal-category cards, and the
/// collapsible **Water Tracker**. Calorie math lives in the pure `NutritionStats`; water math (goal
/// resolution, weekly series, bottle fill) in `WaterStats`.
struct NutritionView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    var onXpTap: () -> Void

    /// Default page is the ring+bottle (index 1), matching the RN center-page default. Page 2 is the
    /// 7-day water graph.
    @State private var pagerPage = 1
    /// Bumped when the water bottle is tapped, telling the `WaterTrackerView` to expand (RN `expandKey`).
    @State private var waterExpandKey = 0
    /// Add-food / save-as-meal presentation is owned here so the meal cards stay thin. Phase 7c
    /// replaces the placeholder sheet bodies with the real Add-Food and Create-Meal flows.
    @State private var addFoodTarget: AddFoodTarget?
    @State private var saveMealDraft: SaveMealDraft?

    private var profile: UserProfile? { store.preferences.profile }
    private var latestWeight: WeightEntry? { NutritionStats.latestWeight(store.entries) }
    private var activityMode: ActivityMode { store.preferences.activityMode ?? .manual }

    private var meals: Meals {
        store.nutritionLog.first { $0.date == store.selectedDate }?.meals ?? Meals()
    }
    private var split: MacroSplit { store.preferences.macroSplit ?? NutritionStats.defaultSplit }
    private var baseTdee: Int {
        NutritionStats.baseTdee(profile: profile, latestWeight: latestWeight, activityMode: activityMode)
    }
    private var caloriesBurned: Int {
        NutritionStats.caloriesBurned(store.activityLog.first { $0.date == store.selectedDate }, mode: activityMode)
    }
    private var calorieTarget: Int { baseTdee + caloriesBurned }

    private var waterGoal: Int {
        WaterStats.resolveGoal(preferences: store.preferences, profile: profile, latestWeight: latestWeight)
    }
    private var waterConsumed: Double {
        WaterStats.consumed(store.waterLog.first { $0.date == store.selectedDate })
    }

    var body: some View {
        CollapsibleScreen(title: "Nutrition", onXpTap: onXpTap) {
            DateNavBar()

            if profile == nil {
                ProfilePromptView(message: "Set up your profile in Settings to calculate your daily calorie target.")
                    .padding(.top, Spacing.md)
            } else if latestWeight == nil {
                ProfilePromptView(message: "Log your first weight entry on the Weight tab to calculate your TDEE.")
                    .padding(.top, Spacing.md)
            } else {
                pager
                MacroProgressBarsView(
                    consumed: NutritionStats.consumedMacros(meals),
                    goalCalories: Double(calorieTarget),
                    split: split
                )
                WaterTrackerView(date: store.selectedDate, expandKey: waterExpandKey)
                mealSections
            }
        }
        .onChange(of: store.selectedDate) { pagerPage = 1 }
        .sheet(item: $addFoodTarget) { target in
            AddFoodModal(date: store.selectedDate, category: target.category)
        }
        .sheet(item: $saveMealDraft) { draft in
            NavigationStack {
                CreateMealFlowView(onDone: { saveMealDraft = nil }, initialFoods: draft.foods, initialName: draft.name)
                    .navigationTitle("Save Meal")
                    .navigationBarTitleDisplayMode(.inline)
            }
        }
    }

    // MARK: - Meal sections

    private var mealSections: some View {
        ForEach(MealCategory.allCases, id: \.self) { category in
            MealCategoryView(
                category: category,
                foods: meals[category],
                date: store.selectedDate,
                sectionsExpanded: store.preferences.sectionsExpanded ?? false,
                onAdd: { addFoodTarget = AddFoodTarget(category: $0) },
                onSaveAsMeal: { foods, name in saveMealDraft = SaveMealDraft(foods: foods, name: name) }
            )
        }
    }

    // MARK: - Pager (calorie graph ↔ ring)

    private var pager: some View {
        VStack(spacing: Spacing.sm) {
            TabView(selection: $pagerPage) {
                WeeklyBarChart(
                    title: "Calories — 7 Days",
                    points: NutritionStats.weeklyCalorieSeries(
                        nutritionLog: store.nutritionLog,
                        activityLog: store.activityLog,
                        selectedDate: store.selectedDate,
                        baseTdee: baseTdee,
                        mode: activityMode
                    ),
                    goalLine: NutritionStats.adjustedCalorieGoal(
                        activityLog: store.activityLog,
                        selectedDate: store.selectedDate,
                        baseTdee: baseTdee,
                        mode: activityMode
                    ),
                    coloring: .proximity
                )
                .frame(maxWidth: .infinity)
                .tag(0)

                ringPage
                    .frame(maxWidth: .infinity)
                    .tag(1)

                WeeklyBarChart(
                    title: "Water — 7 Days",
                    points: WaterStats.weeklyWaterSeries(
                        waterLog: store.waterLog,
                        selectedDate: store.selectedDate,
                        goal: waterGoal
                    ),
                    goalLine: waterGoal > 0 ? waterGoal : nil,
                    coloring: .fixed(FixedColors.water)
                )
                .frame(maxWidth: .infinity)
                .tag(2)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: 300)

            HStack(spacing: 6) {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(pagerPage == i ? colors.primary : colors.border)
                        .frame(width: 6, height: 6)
                }
            }
        }
    }

    /// Page 1: calorie ring + water bottle side by side, with the exercise-burn note below (RN `ringRow`).
    private var ringPage: some View {
        VStack(spacing: Spacing.sm) {
            HStack(alignment: .center, spacing: Spacing.lg) {
                CalorieRingView(consumed: NutritionStats.consumedCalories(meals), target: Double(calorieTarget))
                WaterBottleVisual(
                    consumed: waterConsumed,
                    goal: waterGoal,
                    unitLabel: WaterStats.unitLabel(store.preferences.unit),
                    onTap: { waterExpandKey += 1 }
                )
            }
            if caloriesBurned > 0 {
                Text("+\(caloriesBurned) cal from \(activityMode == .smartwatch ? "smart watch" : "exercise")")
                    .font(Typography.small)
                    .foregroundStyle(colors.primary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.lg)
    }
}

/// Identifiable wrapper so the add-food sheet can be presented per meal category.
struct AddFoodTarget: Identifiable {
    let id = UUID()
    let category: MealCategory
}

/// Foods + suggested name captured from a "save this meal as a custom meal" swipe.
struct SaveMealDraft: Identifiable {
    let id = UUID()
    let foods: [NutritionFoodItem]
    let name: String
}
