import Foundation

/// The portable backup envelope. 1:1 with `BackupData` in `expo/storage/backupStorage.ts`.
///
/// This is the migration bridge for the user's existing Expo data: the Swift app must read and
/// write the *identical* JSON shape. Required keys (`entries`, `preferences`, `nutritionLog`,
/// `customFoods`, `savedMeals`, `activityLog`) are non-optional, so a payload missing any of them
/// fails to decode — exactly reproducing `REQUIRED_KEYS` validation. `waterLog` and `exportedAt`
/// are optional so older backups are still accepted.
struct BackupData: Codable, Hashable {
    var entries: [WeightEntry]
    var preferences: UserPreferences
    var nutritionLog: [DayNutrition]
    var customFoods: [CustomFood]
    var savedMeals: [SavedMeal]
    var activityLog: [DayActivity]
    var waterLog: [DayWater]?
    var exportedAt: String?
}
