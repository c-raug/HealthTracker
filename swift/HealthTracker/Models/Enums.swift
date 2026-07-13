import Foundation

// Enums / string unions — verbatim from `expo/types/index.ts`.
// All raw values match the exact strings the Expo app writes to JSON so the
// backup envelope round-trips byte-for-byte.

enum WeightUnit: String, Codable, CaseIterable, Hashable {
    case lbs, kg
}

enum HeightUnit: String, Codable, CaseIterable, Hashable {
    case inches = "in"
    case cm
}

enum Sex: String, Codable, CaseIterable, Hashable {
    case male, female
}

enum ActivityLevel: String, Codable, CaseIterable, Hashable {
    case sedentary
    case lightlyActive = "lightly_active"
    case moderatelyActive = "moderately_active"
    case active
    case veryActive = "very_active"
}

/// Weight goals — raw values include a `.` (`lose_1.5`) which is not a legal
/// Swift case name, so every case declares its exact string explicitly.
enum WeightGoal: String, Codable, CaseIterable, Hashable {
    case lose2 = "lose_2"
    case lose1_5 = "lose_1.5"
    case lose1 = "lose_1"
    case lose0_5 = "lose_0.5"
    case maintain
    case gain0_5 = "gain_0.5"
    case gain1 = "gain_1"
    case gain1_5 = "gain_1.5"
    case gain2 = "gain_2"
}

enum ActivityMode: String, Codable, CaseIterable, Hashable {
    case auto, manual, smartwatch
}

enum MealCategory: String, Codable, CaseIterable, Hashable {
    case breakfast, lunch, dinner, snacks
}

enum MacroPreset: String, Codable, CaseIterable, Hashable {
    case balanced
    case highProtein = "high_protein"
    case keto
    case custom
}

enum ExerciseType: String, Codable, CaseIterable, Hashable {
    case weightLifting = "weight_lifting"
}

/// The `type` discriminator on an `ActivityEntry`.
enum ActivityEntryType: String, Codable, CaseIterable, Hashable {
    case exercise, steps, smartwatch
}

enum WaterGoalMode: String, Codable, CaseIterable, Hashable {
    case auto, manual
}
