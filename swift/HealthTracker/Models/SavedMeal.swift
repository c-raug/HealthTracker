import Foundation

/// A saved multi-food meal. 1:1 with `SavedMeal` in `expo/types/index.ts`.
struct SavedMeal: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var foods: [NutritionFoodItem]
    var createdAt: String
    var pinnedCategories: [MealCategory]?
    var pinnedOrder: [String: Int]?
}
