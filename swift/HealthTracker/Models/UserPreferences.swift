import Foundation

/// Per-day XP ledger entry that guards once-per-day grants. 1:1 with `XpDayLog`.
struct XpDayLog: Codable, Hashable {
    var food: Int          // total food XP earned today (0–25)
    var calorieGoal: Bool
    var waterGoal: Bool
    var weight: Bool
    var activity: Bool

    init(food: Int = 0, calorieGoal: Bool = false, waterGoal: Bool = false, weight: Bool = false, activity: Bool = false) {
        self.food = food
        self.calorieGoal = calorieGoal
        self.waterGoal = waterGoal
        self.weight = weight
        self.activity = activity
    }
}

/// User preferences slice. 1:1 with `UserPreferences` in `expo/types/index.ts`.
/// `unit` is the only required field (default `.lbs`, matching `{ unit: 'lbs' }`).
/// `appearanceMode` reuses the `AppearanceMode` enum already defined in the Design layer.
struct UserPreferences: Codable, Hashable {
    var unit: WeightUnit
    var profile: UserProfile?
    var macroPreset: MacroPreset?
    var macroSplit: MacroSplit?
    var activityMode: ActivityMode?
    var onboardingComplete: Bool?
    var themeColor: String?
    var waterGoalOverride: Double?
    var waterGoalMode: WaterGoalMode?
    var waterCreatineAdjustment: Bool?
    var waterPresets: [Int]?
    var sectionsExpanded: Bool?
    var appearanceMode: AppearanceMode?
    var avatarUri: String?

    // Gamification
    var unlockedAchievements: [String]?
    var totalXp: Int?
    var prestige: Int?
    var xpLog: [String: XpDayLog]?

    // Weekly recap
    var lastRecapShownWeek: String?

    // Food categorization
    var foodTypeCategories: [String]?
    var favoriteFilterTypes: [String]?

    init(unit: WeightUnit = .lbs) {
        self.unit = unit
    }

    /// The 8 seed categories applied on first load (mirrors `DEFAULT_FOOD_TYPE_CATEGORIES`).
    static let defaultFoodTypeCategories = [
        "Meat", "Fruit", "Vegetable", "Grain", "Dairy", "Snack", "Beverage", "Other",
    ]
}
