import Foundation

/// Pure, testable helpers shared by the Nutrition-Goals and App-Settings screens (ports of the
/// inline handlers in `expo/app/nutrition-goals-modal.tsx` + `components/settings/MacroSection.tsx`).
enum SettingsLogic {

    // MARK: - Daily water goal (manual override input)

    /// The three outcomes of tapping **Save** on the manual water-goal field (RN's Save handler):
    /// a blank field clears the override, a positive integer sets it, anything else is invalid.
    enum WaterGoalSave: Equatable {
        case clear
        case set(Double)
        case invalid
    }

    /// RN: `val = parseInt(input,10)`; blank → clear; `!isNaN && val > 0` → set; else invalid.
    static func waterGoalSave(from input: String) -> WaterGoalSave {
        if input.trimmingCharacters(in: .whitespaces).isEmpty { return .clear }
        guard let val = ActivityStats.jsParseInt(input), val > 0 else { return .invalid }
        return .set(Double(val))
    }

    /// Placeholder digits + unit label for the manual field (RN `e.g. 100 oz` / `3000 mL`).
    static func waterGoalPlaceholder(unit: WeightUnit) -> String {
        unit == .lbs ? "e.g. 100 oz" : "e.g. 3000 mL"
    }

    /// Creatine-adjustment description suffix (RN `Adds +16 oz` / `+500 mL`).
    static func creatineAmountLabel(unit: WeightUnit) -> String {
        unit == .lbs ? "16 oz" : "500 mL"
    }

    // MARK: - Macro split (custom %)

    /// JS `parseInt(x) || 0` for a macro % field.
    static func macroInt(_ text: String) -> Int { ActivityStats.jsParseInt(text) ?? 0 }

    /// Sum of the three custom % fields (RN `customSum`); the split is valid at exactly 100.
    static func customMacroSum(protein: String, carbs: String, fat: String) -> Int {
        macroInt(protein) + macroInt(carbs) + macroInt(fat)
    }

    /// Clamp a stepped % into 0…100 (RN `clamp`).
    static func clampPercent(_ value: Int) -> Int { max(0, min(100, value)) }

    /// Grams-for-percent label used in the split preview (RN `gramsFor`):
    /// `round(pct/100 * goalCalories / calPerGram)`; `—g` when there is no goal.
    static func gramsLabel(pct: Int, goalCalories: Int?, calPerGram: Double) -> String {
        guard let goalCalories, goalCalories > 0 else { return "—g" }
        return "\(jsRoundInt(Double(pct) / 100 * Double(goalCalories) / calPerGram))g"
    }

    /// The adjusted goal-calories used by the Macros preview: base TDEE + rounded average of the
    /// days in the last 7 that actually had (mode-relevant) activity. Reuses the Phase-7a
    /// `NutritionStats.adjustedCalorieGoal` (which mirrors the RN `avgActivityCalories` math).
    /// Returns `nil` when there is no base TDEE (no profile / weight). `activityAdjusted` is true
    /// when the adjustment moved the goal above the base.
    static func goalCalories(
        profile: UserProfile?,
        latestWeight: WeightEntry?,
        activityLog: [DayActivity],
        activityMode: ActivityMode,
        today: String,
        now: Date = Date()
    ) -> (adjusted: Int, activityAdjusted: Bool)? {
        let base = NutritionStats.baseTdee(
            profile: profile, latestWeight: latestWeight, activityMode: activityMode, today: now
        )
        guard base > 0 else { return nil }
        let adjusted = NutritionStats.adjustedCalorieGoal(
            activityLog: activityLog, selectedDate: today, baseTdee: base, mode: activityMode
        ) ?? base
        return (adjusted, adjusted > base)
    }
}
