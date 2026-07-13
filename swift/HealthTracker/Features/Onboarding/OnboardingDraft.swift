import Foundation

/// Pure, testable form model for the 5-step onboarding flow (port of the local state in
/// `expo/app/onboarding.tsx`). Holds every field the wizard collects and derives the
/// validation + the objects handed to the store on completion. Keeping this UI-free lets the
/// Phase-5 parity tests assert the ft/in → inches math, weight-range gates, and macro-sum rule
/// without driving SwiftUI.
struct OnboardingDraft {
    static let totalSteps = 5

    // Step 1
    var unit: WeightUnit = .lbs
    var name: String = ""

    // Step 2
    var dob: String?                 // "YYYY-MM-DD"
    var sex: Sex = .male
    var heightFt: String = ""
    var heightIn: String = ""
    var heightCm: String = ""

    // Step 3
    var activityLevel: ActivityLevel = .moderatelyActive
    var weightGoal: WeightGoal = .maintain

    // Step 4
    var macroPreset: MacroPreset = .balanced
    var macroSplit: MacroSplit = MacroSplit(protein: 30, carbs: 40, fat: 30)
    var customProtein: String = "30"
    var customCarbs: String = "40"
    var customFat: String = "30"

    // Step 5
    var weight: String = ""

    var isImperial: Bool { unit == .lbs }

    // MARK: - Custom macro helpers

    /// Sum of the three custom-macro text fields (0 for blank/invalid entries).
    var customSum: Int {
        (Int(customProtein) ?? 0) + (Int(customCarbs) ?? 0) + (Int(customFat) ?? 0)
    }

    /// The split shown in the summary line — the live custom values when `.custom`, else the preset.
    var effectiveSplit: MacroSplit {
        macroPreset == .custom ? macroSplit : (Self.presetSplit(macroPreset) ?? macroSplit)
    }

    // MARK: - Validation (mirrors the RN `canProceed*` gates)

    var canProceedStep2: Bool {
        guard dob != nil else { return false }
        if isImperial {
            let ft = Int(heightFt) ?? 0
            let inches = Int(heightIn) ?? 0
            return ft * 12 + inches > 0
        }
        return (Double(heightCm) ?? 0) > 0
    }

    var canProceedStep5: Bool {
        guard let w = Double(weight), w > 0 else { return false }
        return isImperial ? (w >= 50 && w <= 1000) : (w >= 20 && w <= 500)
    }

    /// Whether the footer's Next/Complete button is disabled for a given 1-based step.
    func isNextDisabled(step: Int) -> Bool {
        switch step {
        case 2: return !canProceedStep2
        case 4: return macroPreset == .custom && customSum != 100
        case 5: return !canProceedStep5
        default: return false
        }
    }

    // MARK: - Builders (used by completion)

    /// Height as (value, unit): `ft*12 + in` inches when imperial, else raw cm.
    func resolvedHeight() -> (value: Double, unit: HeightUnit) {
        if isImperial {
            let ft = Int(heightFt) ?? 0
            let inches = Int(heightIn) ?? 0
            return (Double(ft * 12 + inches), .inches)
        }
        return (Double(heightCm) ?? 0, .cm)
    }

    func makeProfile() -> UserProfile {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let h = resolvedHeight()
        return UserProfile(
            name: trimmed.isEmpty ? nil : trimmed,
            age: nil,
            dob: dob,
            fitnessGoal: nil,
            sex: sex,
            heightValue: h.value,
            heightUnit: h.unit,
            activityLevel: activityLevel,
            weightGoal: weightGoal
        )
    }

    /// The starting weight entry for today. Returns `nil` if the weight field is invalid.
    func makeWeightEntry(id: String = Identifiers.generate(),
                         date: String = Dates.getToday(),
                         createdAt: String = Dates.nowTimestamp()) -> WeightEntry? {
        guard let w = Double(weight), canProceedStep5 else { return nil }
        return WeightEntry(id: id, date: date, weight: w, unit: unit, createdAt: createdAt)
    }

    // MARK: - Static tables (mirror the RN label/preset constants)

    static let activityLabels: [(value: ActivityLevel, label: String)] = [
        (.sedentary, "Sedentary"),
        (.lightlyActive, "Lightly Active"),
        (.moderatelyActive, "Moderately Active"),
        (.active, "Active"),
        (.veryActive, "Very Active"),
    ]

    static let goalLabelsLbs: [(value: WeightGoal, label: String)] = [
        (.lose2, "Lose 2 lb/wk"),
        (.lose1_5, "Lose 1.5 lb/wk"),
        (.lose1, "Lose 1 lb/wk"),
        (.lose0_5, "Lose 0.5 lb/wk"),
        (.maintain, "Maintain"),
        (.gain0_5, "Gain 0.5 lb/wk"),
        (.gain1, "Gain 1 lb/wk"),
        (.gain1_5, "Gain 1.5 lb/wk"),
        (.gain2, "Gain 2 lb/wk"),
    ]

    static let goalLabelsKg: [(value: WeightGoal, label: String)] = [
        (.lose2, "Lose 0.9 kg/wk"),
        (.lose1_5, "Lose 0.7 kg/wk"),
        (.lose1, "Lose 0.5 kg/wk"),
        (.lose0_5, "Lose 0.25 kg/wk"),
        (.maintain, "Maintain"),
        (.gain0_5, "Gain 0.25 kg/wk"),
        (.gain1, "Gain 0.5 kg/wk"),
        (.gain1_5, "Gain 0.7 kg/wk"),
        (.gain2, "Gain 0.9 kg/wk"),
    ]

    func goalLabels() -> [(value: WeightGoal, label: String)] {
        isImperial ? Self.goalLabelsLbs : Self.goalLabelsKg
    }

    static let macroPresets: [(value: MacroPreset, label: String, split: MacroSplit)] = [
        (.balanced, "Balanced", MacroSplit(protein: 30, carbs: 40, fat: 30)),
        (.highProtein, "High Protein", MacroSplit(protein: 40, carbs: 30, fat: 30)),
        (.keto, "Keto", MacroSplit(protein: 25, carbs: 5, fat: 70)),
    ]

    static func presetSplit(_ preset: MacroPreset) -> MacroSplit? {
        macroPresets.first { $0.value == preset }?.split
    }
}
