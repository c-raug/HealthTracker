import Foundation

/// Verbatim port of `expo/utils/activityCalculation.ts`.
enum ActivityCalories {

    /// MET for weight lifting (the only exercise type today).
    private static let weightLiftingMET = 5.0

    /// Calories burned lifting: `MET × weight_kg × hours`.
    static func exercise(durationMinutes: Double, weightValue: Double, weightUnit: WeightUnit) -> Int {
        let weightKg = TDEE.weightToKg(weightValue, unit: weightUnit)
        return jsRoundInt(weightLiftingMET * weightKg * (durationMinutes / 60))
    }

    /// Calories burned from steps: `steps × (weight_kg / 70) × 0.04`.
    static func steps(_ steps: Double, weightValue: Double, weightUnit: WeightUnit) -> Int {
        let weightKg = TDEE.weightToKg(weightValue, unit: weightUnit)
        return jsRoundInt(steps * (weightKg / 70) * 0.04)
    }
}
