import Foundation

/// Pure helpers behind the portion selector (`PortionSelectorView`) and the food-row edit sheet.
/// Ports the number logic in `expo/components/nutrition/PortionSelector.tsx` and the portion-scaling
/// in `FoodItem.tsx` so it can be unit-tested for parity. No SwiftUI here.
///
/// A serving count is modeled as a **whole** part plus an **eighth** fraction index (0…7), matching
/// the RN two-drum design.
enum PortionMath {

    /// Eighth fractions and their glyphs, verbatim from RN.
    static let fractions: [Double] = [0, 1.0/8, 2.0/8, 3.0/8, 4.0/8, 5.0/8, 6.0/8, 7.0/8]
    static let fractionLabels = ["0", "⅛", "¼", "⅜", "½", "⅝", "¾", "⅞"]
    static let wholeMax = 250

    /// Split a serving value into (whole, fractionIndex). RN: `floor(value)` + `round((value−whole)*8)`.
    static func decompose(_ value: Double) -> (whole: Int, fractionIndex: Int) {
        let whole = Int(value.rounded(.down))
        let idx = jsRoundInt((value - Double(whole)) * 8)
        return (whole, min(max(idx, 0), fractions.count - 1))
    }

    /// Recombine a (whole, fractionIndex) into a serving value.
    static func compose(whole: Int, fractionIndex: Int) -> Double {
        Double(whole) + fractions[min(max(fractionIndex, 0), fractions.count - 1)]
    }

    /// Scale factor applied to the per-serving base values: `total / baseServings` (or `total` when
    /// `baseServings <= 0`).
    static func scale(total: Double, baseServings: Double) -> Double {
        baseServings > 0 ? total / baseServings : total
    }

    /// Live macro preview for a given serving `total`. Calories round to an Int; macros to 1 dp
    /// (`round(x*10)/10`) — exactly as RN computes and as the row stores on confirm.
    static func preview(total: Double, baseCalories: Double, baseProtein: Double, baseCarbs: Double, baseFat: Double, baseServings: Double)
        -> (calories: Int, protein: Double, carbs: Double, fat: Double) {
        let s = scale(total: total, baseServings: baseServings)
        return (
            calories: jsRoundInt(baseCalories * s),
            protein: oneDecimal(baseProtein * s),
            carbs: oneDecimal(baseCarbs * s),
            fat: oneDecimal(baseFat * s)
        )
    }

    /// `round(x * 10) / 10` (JS half-up), used for macro grams.
    static func oneDecimal(_ x: Double) -> Double {
        jsRound(x * 10) / 10
    }

    /// The "1.25 × 1 cup" serving-count label: `toFixed(3)` with trailing zeros (and a dangling dot)
    /// stripped, empty → "0".
    static func servingCountLabel(_ total: Double) -> String {
        var s = String(format: "%.3f", total)
        if s.contains(".") {
            while s.hasSuffix("0") { s.removeLast() }
            if s.hasSuffix(".") { s.removeLast() }
        }
        return s.isEmpty ? "0" : s
    }

    /// The big "1 ½ servings" display built from the two drum values (RN `totalDisplay`).
    static func totalDisplay(whole: Int, fractionIndex: Int) -> String {
        let frac = fractionLabels[min(max(fractionIndex, 0), fractionLabels.count - 1)]
        if whole == 0 && fractionIndex == 0 { return "0" }
        if fractionIndex == 0 { return "\(whole)" }
        if whole == 0 { return frac }
        return "\(whole) \(frac)"
    }

    // MARK: - Food-row edit (FoodItem.tsx)

    /// Per-serving base values reconstructed from an already-scaled logged food:
    /// `stored / baseServings` (RN divides the stored, servings-scaled values back out).
    static func perServingBase(stored: Double?, baseServings: Double) -> Double {
        let value = stored ?? 0
        return baseServings > 0 ? value / baseServings : value
    }

    /// Apply a new serving count to a logged food, scaling its stored calories/macros by
    /// `newServings / oldServings`. Mirrors `handleConfirmEdit` (non-quick-add path) in `FoodItem.tsx`.
    static func rescale(_ food: NutritionFoodItem, toServings newServings: Double) -> NutritionFoodItem {
        let base = food.servings ?? 1
        let ratio = base > 0 ? newServings / base : newServings
        var updated = food
        updated.servings = newServings
        updated.calories = Double(jsRoundInt((food.calories ?? 0) * ratio))
        updated.protein = oneDecimal((food.protein ?? 0) * ratio)
        updated.carbs = oneDecimal((food.carbs ?? 0) * ratio)
        updated.fat = oneDecimal((food.fat ?? 0) * ratio)
        return updated
    }
}
