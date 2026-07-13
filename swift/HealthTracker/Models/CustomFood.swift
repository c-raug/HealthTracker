import Foundation

/// A reusable custom food. 1:1 with `CustomFood` in `expo/types/index.ts`.
///
/// The decoder reproduces the `LOAD_DATA` custom-food migration from
/// `expo/context/AppContext.tsx` so a backup written by an *older* Expo build
/// still loads cleanly:
///   - legacy `pinned: true` (+ no `pinnedCategories`) → `pinnedCategories` = all 4 categories;
///     a legacy numeric `pinnedOrder` → per-category record with that index.
///   - legacy `foodType: string` (+ no `foodTypes`) → `foodTypes: [foodType]`.
///   - legacy `mealTags` → dropped.
/// Current backups are already in canonical form, so the migration is a no-op for them.
struct CustomFood: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var calories: Double
    var protein: Double
    var carbs: Double
    var fat: Double
    var servingSize: String
    var createdAt: String
    var pinnedCategories: [MealCategory]?
    var pinnedOrder: [String: Int]?
    var foodTypes: [String]?

    init(
        id: String,
        name: String,
        calories: Double,
        protein: Double,
        carbs: Double,
        fat: Double,
        servingSize: String,
        createdAt: String,
        pinnedCategories: [MealCategory]? = nil,
        pinnedOrder: [String: Int]? = nil,
        foodTypes: [String]? = nil
    ) {
        self.id = id
        self.name = name
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
        self.servingSize = servingSize
        self.createdAt = createdAt
        self.pinnedCategories = pinnedCategories
        self.pinnedOrder = pinnedOrder
        self.foodTypes = foodTypes
    }

    private enum CodingKeys: String, CodingKey {
        // canonical
        case id, name, calories, protein, carbs, fat, servingSize, createdAt
        case pinnedCategories, pinnedOrder, foodTypes
        // legacy (decode-only)
        case pinned, foodType
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        calories = try c.decode(Double.self, forKey: .calories)
        protein = try c.decode(Double.self, forKey: .protein)
        carbs = try c.decode(Double.self, forKey: .carbs)
        fat = try c.decode(Double.self, forKey: .fat)
        servingSize = try c.decode(String.self, forKey: .servingSize)
        createdAt = try c.decode(String.self, forKey: .createdAt)

        var categories = try c.decodeIfPresent([MealCategory].self, forKey: .pinnedCategories)
        var foods = try c.decodeIfPresent([String].self, forKey: .foodTypes)

        // `pinnedOrder` was historically a single number; today it is a per-category record.
        let orderRecord = try? c.decodeIfPresent([String: Int].self, forKey: .pinnedOrder)
        let legacyOrder = (orderRecord == nil)
            ? (try? c.decodeIfPresent(Int.self, forKey: .pinnedOrder)) ?? nil
            : nil
        var order = orderRecord ?? nil

        // Legacy migration (mirrors the reducer's LOAD_DATA branch).
        let legacyPinned = (try? c.decodeIfPresent(Bool.self, forKey: .pinned)) ?? nil
        if legacyPinned == true, categories == nil {
            let allCats = MealCategory.allCases
            categories = allCats
            if let legacyOrder {
                var record: [String: Int] = [:]
                for cat in allCats { record[cat.rawValue] = legacyOrder }
                order = record
            }
        }

        let legacyFoodType = (try? c.decodeIfPresent(String.self, forKey: .foodType)) ?? nil
        if let legacyFoodType, foods == nil {
            foods = [legacyFoodType]
        }

        pinnedCategories = categories
        pinnedOrder = order
        foodTypes = foods
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(name, forKey: .name)
        try c.encode(calories, forKey: .calories)
        try c.encode(protein, forKey: .protein)
        try c.encode(carbs, forKey: .carbs)
        try c.encode(fat, forKey: .fat)
        try c.encode(servingSize, forKey: .servingSize)
        try c.encode(createdAt, forKey: .createdAt)
        try c.encodeIfPresent(pinnedCategories, forKey: .pinnedCategories)
        try c.encodeIfPresent(pinnedOrder, forKey: .pinnedOrder)
        try c.encodeIfPresent(foodTypes, forKey: .foodTypes)
    }
}
