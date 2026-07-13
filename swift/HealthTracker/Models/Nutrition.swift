import Foundation

/// A logged food item. 1:1 with `NutritionFoodItem` in `expo/types/index.ts`.
/// Most nutrition fields are optional (`quickAdd` entries carry only calories).
struct NutritionFoodItem: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var calories: Double?
    var protein: Double?
    var carbs: Double?
    var fat: Double?
    var servingSize: String?
    var servings: Double?
    var mealGroupId: String?
    var mealGroupName: String?
    var quickAdd: Bool?
}

/// The four meal buckets for a day. Modeled as a struct (not `[MealCategory: …]`)
/// so JSON stays `{"breakfast":[…],"lunch":[…],…}` — Swift would otherwise encode
/// an enum-keyed dictionary as a flat array. Mirrors `EMPTY_MEALS()`.
struct Meals: Codable, Hashable {
    var breakfast: [NutritionFoodItem]
    var lunch: [NutritionFoodItem]
    var dinner: [NutritionFoodItem]
    var snacks: [NutritionFoodItem]

    init(
        breakfast: [NutritionFoodItem] = [],
        lunch: [NutritionFoodItem] = [],
        dinner: [NutritionFoodItem] = [],
        snacks: [NutritionFoodItem] = []
    ) {
        self.breakfast = breakfast
        self.lunch = lunch
        self.dinner = dinner
        self.snacks = snacks
    }

    // Tolerate older/partial payloads that omit a category — default it to `[]`.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        breakfast = try c.decodeIfPresent([NutritionFoodItem].self, forKey: .breakfast) ?? []
        lunch = try c.decodeIfPresent([NutritionFoodItem].self, forKey: .lunch) ?? []
        dinner = try c.decodeIfPresent([NutritionFoodItem].self, forKey: .dinner) ?? []
        snacks = try c.decodeIfPresent([NutritionFoodItem].self, forKey: .snacks) ?? []
    }

    subscript(_ category: MealCategory) -> [NutritionFoodItem] {
        get {
            switch category {
            case .breakfast: return breakfast
            case .lunch: return lunch
            case .dinner: return dinner
            case .snacks: return snacks
            }
        }
        set {
            switch category {
            case .breakfast: breakfast = newValue
            case .lunch: lunch = newValue
            case .dinner: dinner = newValue
            case .snacks: snacks = newValue
            }
        }
    }
}

/// One day's nutrition log. 1:1 with `DayNutrition`.
struct DayNutrition: Codable, Identifiable, Hashable {
    var id: String { date }
    var date: String
    var meals: Meals

    init(date: String, meals: Meals = Meals()) {
        self.date = date
        self.meals = meals
    }
}

/// Macro percentage split (0–100). 1:1 with `MacroSplit`.
struct MacroSplit: Codable, Hashable {
    var protein: Double
    var carbs: Double
    var fat: Double
}
