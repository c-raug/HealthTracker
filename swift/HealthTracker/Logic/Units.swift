import Foundation

/// Verbatim port of `expo/utils/unitConversion.ts`.
///
/// These are **display** conversions rounded to 1 decimal place. TDEE math uses the unrounded
/// `0.453592` factor in `TDEE.weightToKg` — do not use these there.
enum Units {

    /// Pounds → kilograms, rounded to 1 dp.
    static func lbsToKg(_ lbs: Double) -> Double {
        jsRound(lbs * 0.453592 * 10) / 10
    }

    /// Kilograms → pounds, rounded to 1 dp.
    static func kgToLbs(_ kg: Double) -> Double {
        jsRound(kg * 2.20462 * 10) / 10
    }

    /// Convert between units; identity when `from == to`.
    static func convertWeight(_ weight: Double, from: WeightUnit, to: WeightUnit) -> Double {
        if from == to { return weight }
        return from == .lbs ? lbsToKg(weight) : kgToLbs(weight)
    }
}
