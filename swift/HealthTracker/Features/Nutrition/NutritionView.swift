import SwiftUI

/// Nutrition tab. Port of `expo/app/(tabs)/nutrition.tsx`.
///
/// **Phase 7a (this checkpoint):** profile/weight prompts, the calorie **pager** (calorie graph ↔
/// ring), and the **macro bars**. The 7-day water graph + water bottle + water tracker are **Phase 8**
/// and the per-meal sections are **Phase 7b** — both are honest placeholders here so the screen's
/// shape is in place. The calorie-target math lives in the pure `NutritionStats`.
struct NutritionView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    var onXpTap: () -> Void

    /// Default page is the ring (index 1), matching the RN center-page default. Phase 8 appends the
    /// water graph as a third page.
    @State private var pagerPage = 1
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
                PlaceholderCard(systemImage: "drop.fill", title: "Water Tracker", phase: "Phase 8")
                mealSections
            }
        }
        .onChange(of: store.selectedDate) { pagerPage = 1 }
        .sheet(item: $addFoodTarget) { target in
            AddFoodPlaceholderSheet(category: target.category)
        }
        .sheet(item: $saveMealDraft) { draft in
            CreateMealPlaceholderSheet(name: draft.name, foodCount: draft.foods.count)
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
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: 300)

            HStack(spacing: 6) {
                ForEach(0..<2, id: \.self) { i in
                    Circle()
                        .fill(pagerPage == i ? colors.primary : colors.border)
                        .frame(width: 6, height: 6)
                }
            }
        }
    }

    private var ringPage: some View {
        VStack(spacing: Spacing.sm) {
            CalorieRingView(consumed: NutritionStats.consumedCalories(meals), target: Double(calorieTarget))
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

/// Placeholder for the Phase 7c Add-Food modal (Add Food · Add Meal · Quick Add).
private struct AddFoodPlaceholderSheet: View {
    let category: MealCategory
    var body: some View {
        NavigationStack {
            PlaceholderCard(systemImage: "plus.circle", title: "Add to \(category.rawValue.capitalized)", phase: "Phase 7c")
                .padding()
                .navigationTitle("Add Food")
                .navigationBarTitleDisplayMode(.inline)
        }
    }
}

/// Placeholder for the Phase 7c Create-Meal flow.
private struct CreateMealPlaceholderSheet: View {
    let name: String
    let foodCount: Int
    var body: some View {
        NavigationStack {
            PlaceholderCard(systemImage: "bookmark", title: "Save \(name) (\(foodCount) foods)", phase: "Phase 7c")
                .padding()
                .navigationTitle("Save Meal")
                .navigationBarTitleDisplayMode(.inline)
        }
    }
}
