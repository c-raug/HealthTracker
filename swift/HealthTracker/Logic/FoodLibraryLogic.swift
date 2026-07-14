import Foundation

/// Pure ranking / scaling / search helpers behind the Add-Food flow (`AddFoodTabView`,
/// `AddMealTabView`, `CreateMealFlowView`). Ports the inline `useMemo`s and dispatch payload builders
/// in `expo/components/nutrition/{AddFoodTab,AddMealTab,CreateMealFlow,CustomFoodForm}.tsx`.
/// No SwiftUI — everything here is unit-tested for parity (`FoodLibraryLogicTests`).
enum FoodLibraryLogic {

    private static func key(_ name: String) -> String {
        name.lowercased().trimmingCharacters(in: .whitespaces)
    }

    // MARK: - Frequency (how often each food name has been logged)

    /// Count of every logged food across all days, keyed by lowercased/trimmed name. Drives "Recent".
    static func frequencyMap(_ nutritionLog: [DayNutrition]) -> [String: Int] {
        var map: [String: Int] = [:]
        for day in nutritionLog {
            for cat in MealCategory.allCases {
                for food in day.meals[cat] {
                    map[key(food.name), default: 0] += 1
                }
            }
        }
        return map
    }

    // MARK: - Custom-food sections

    /// Foods matching a case-insensitive name query (empty query → all).
    static func matches(_ foods: [CustomFood], query: String) -> [CustomFood] {
        let q = query.lowercased().trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return foods }
        return foods.filter { $0.name.lowercased().contains(q) }
    }

    static func isPinnedHere(_ food: CustomFood, category: MealCategory) -> Bool {
        food.pinnedCategories?.contains(category) ?? false
    }

    /// Foods pinned to `category`, ordered by `pinnedOrder[category]` (unset → last).
    static func pinned(_ foods: [CustomFood], category: MealCategory) -> [CustomFood] {
        foods
            .filter { isPinnedHere($0, category: category) }
            .sorted { ($0.pinnedOrder?[category.rawValue] ?? .max) < ($1.pinnedOrder?[category.rawValue] ?? .max) }
    }

    /// Top-7 non-pinned foods logged at least once, most-frequent first (RN "Recent").
    static func recent(_ foods: [CustomFood], category: MealCategory, frequency: [String: Int]) -> [CustomFood] {
        foods
            .filter { !isPinnedHere($0, category: category) && (frequency[key($0.name)] ?? 0) > 0 }
            .sorted { (frequency[key($0.name)] ?? 0) > (frequency[key($1.name)] ?? 0) }
            .prefix(7)
            .map { $0 }
    }

    /// Non-pinned matches shown under "My Foods" while searching.
    static func unpinned(_ matches: [CustomFood], category: MealCategory) -> [CustomFood] {
        matches.filter { !isPinnedHere($0, category: category) }
    }

    // MARK: - Food-type filtering (Phase 14)

    /// Whether any food-type filter is active (RN `hasActiveFilters`).
    static func hasActiveFoodTypeFilter(_ activeTypes: [String]) -> Bool { !activeTypes.isEmpty }

    /// Foods passing the active food-type filter (RN `applyFoodFilters`, OR logic): with no active
    /// types every food passes; otherwise a food passes only if it has at least one `foodTypes`
    /// value present in `activeTypes` (foods with no `foodTypes` are excluded while a filter is on).
    static func applyFoodTypeFilter(_ foods: [CustomFood], activeTypes: [String]) -> [CustomFood] {
        guard !activeTypes.isEmpty else { return foods }
        let active = Set(activeTypes)
        return foods.filter { food in
            guard let types = food.foodTypes, !types.isEmpty else { return false }
            return types.contains { active.contains($0) }
        }
    }

    /// Toggle a type in the active-filter list (RN `handleToggleFavoriteFilter` / pill tap).
    static func toggleFoodTypeFilter(_ activeTypes: [String], type: String) -> [String] {
        activeTypes.contains(type) ? activeTypes.filter { $0 != type } : activeTypes + [type]
    }

    // MARK: - Custom food → logged food

    /// A custom food as a to-log `NutritionFoodItem` at 1 serving (RN `toNutritionItem`).
    static func toNutritionItem(_ f: CustomFood) -> NutritionFoodItem {
        NutritionFoodItem(id: f.id, name: f.name, calories: f.calories, protein: f.protein,
                          carbs: f.carbs, fat: f.fat, servingSize: f.servingSize, servings: 1,
                          mealGroupId: nil, mealGroupName: nil, quickAdd: nil)
    }

    /// Scale a to-log base by `servings` and stamp a fresh id (RN `handleConfirmAdd`): calories round
    /// to Int, macros to 1 dp, over `servings / (base.servings ?? 1)`.
    static func logged(base: NutritionFoodItem, servings: Double) -> NutritionFoodItem {
        let baseServings = base.servings ?? 1
        let scale = baseServings > 0 ? servings / baseServings : servings
        var f = base
        f.id = Identifiers.generate()
        f.calories = Double(jsRoundInt((base.calories ?? 0) * scale))
        f.protein = PortionMath.oneDecimal((base.protein ?? 0) * scale)
        f.carbs = PortionMath.oneDecimal((base.carbs ?? 0) * scale)
        f.fat = PortionMath.oneDecimal((base.fat ?? 0) * scale)
        f.servings = servings
        return f
    }

    // MARK: - Saved meals

    static func isMealPinnedHere(_ meal: SavedMeal, category: MealCategory) -> Bool {
        meal.pinnedCategories?.contains(category) ?? false
    }

    static func mealMatches(_ meals: [SavedMeal], query: String) -> [SavedMeal] {
        let q = query.lowercased().trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return meals }
        return meals.filter { $0.name.lowercased().contains(q) }
    }

    static func pinnedMeals(_ meals: [SavedMeal], category: MealCategory) -> [SavedMeal] {
        meals
            .filter { isMealPinnedHere($0, category: category) }
            .sorted { ($0.pinnedOrder?[category.rawValue] ?? .max) < ($1.pinnedOrder?[category.rawValue] ?? .max) }
    }

    static func otherMeals(_ meals: [SavedMeal], category: MealCategory) -> [SavedMeal] {
        meals.filter { !isMealPinnedHere($0, category: category) }
    }

    static func mealCalories(_ meal: SavedMeal) -> Int {
        jsRoundInt(meal.foods.reduce(0) { $0 + ($1.calories ?? 0) })
    }

    /// Explode a saved meal into fresh logged foods that share one `mealGroupId` (RN `handleAddMeal`).
    static func mealGroupFoods(_ meal: SavedMeal) -> [NutritionFoodItem] {
        let groupId = Identifiers.generate()
        return meal.foods.map { food in
            var f = food
            f.id = Identifiers.generate()
            f.mealGroupId = groupId
            f.mealGroupName = meal.name
            return f
        }
    }

    // MARK: - Custom-food form helpers

    /// Auto-computed calories from macros: `round(p*4 + c*4 + f*9)` (RN CustomFoodForm effect).
    static func autoCalories(protein: Double, carbs: Double, fat: Double) -> Int {
        jsRoundInt(protein * 4 + carbs * 4 + fat * 9)
    }

    static let portionUnits = ["g", "oz", "cup", "qty"]

    /// Split a `"qty unit"` serving-size string into its parts (RN `parsedQty`/`parsedUnit`), falling
    /// back to `1` / `g` and validating the unit against `portionUnits`.
    static func parseServingSize(_ servingSize: String) -> (qty: String, unit: String) {
        let parts = servingSize.split(separator: " ", maxSplits: 1).map(String.init)
        let qty = parts.first ?? "1"
        let rawUnit = parts.count > 1 ? parts[1] : "g"
        let unit = portionUnits.contains(rawUnit) ? rawUnit : "g"
        return (qty.isEmpty ? "1" : qty, unit)
    }

    /// Whether stored calories differ from what the macros would auto-compute — the RN rule for
    /// starting an *edited* food in manual-calorie mode.
    static func caloriesAreManual(_ food: CustomFood) -> Bool {
        autoCalories(protein: food.protein, carbs: food.carbs, fat: food.fat) != jsRoundInt(food.calories)
    }
}
