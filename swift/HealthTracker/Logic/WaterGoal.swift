import Foundation

/// Verbatim port of `expo/utils/waterCalculation.ts`.
///
/// Imperial: body weight (lbs) × 0.5 oz/day. Metric: body weight (kg) × 35 mL/day.
/// Scaled ×1.2 for Active / Very Active users. Optional creatine bump: +16 oz / +500 mL.
enum WaterGoal {
    static func calculate(
        weightValue: Double,
        weightUnit: WeightUnit,
        activityLevel: ActivityLevel,
        creatine: Bool = false
    ) -> Int {
        let isActive = activityLevel == .active || activityLevel == .veryActive
        if weightUnit == .lbs {
            let base = weightValue * 0.5
            let adjusted = isActive ? base * 1.2 : base
            return jsRoundInt(adjusted + (creatine ? 16 : 0))
        } else {
            let base = weightValue * 35
            let adjusted = isActive ? base * 1.2 : base
            return jsRoundInt(adjusted + (creatine ? 500 : 0))
        }
    }
}
