import Foundation

/// User profile. 1:1 with `UserProfile` in `expo/types/index.ts`.
/// `age` is legacy — prefer `dob` (a `"YYYY-MM-DD"` string) from which age is computed at runtime.
struct UserProfile: Codable, Hashable {
    var name: String?
    var age: Int?
    var dob: String?
    var fitnessGoal: String?
    var sex: Sex
    var heightValue: Double
    var heightUnit: HeightUnit
    var activityLevel: ActivityLevel
    var weightGoal: WeightGoal
}
