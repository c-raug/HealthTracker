import Foundation

/// Verbatim port of `expo/utils/tdeeCalculation.ts` — Mifflin–St Jeor TDEE and calorie goals.
enum TDEE {

    /// Mifflin–St Jeor BMR. Weight in kg, height in cm.
    static func calculateBMR(weightKg: Double, heightCm: Double, age: Int, sex: Sex) -> Double {
        let base = 10 * weightKg + 6.25 * heightCm - 5 * Double(age)
        return sex == .male ? base + 5 : base - 161
    }

    static func activityMultiplier(_ level: ActivityLevel) -> Double {
        switch level {
        case .sedentary: return 1.2
        case .lightlyActive: return 1.375
        case .moderatelyActive: return 1.55
        case .active: return 1.725
        case .veryActive: return 1.9
        }
    }

    /// Applies the weight-goal calorie delta to a TDEE and rounds (±250 cal/step).
    static func goalCalories(tdee: Double, goal: WeightGoal) -> Int {
        switch goal {
        case .lose2: return jsRoundInt(tdee - 1000)
        case .lose1_5: return jsRoundInt(tdee - 750)
        case .lose1: return jsRoundInt(tdee - 500)
        case .lose0_5: return jsRoundInt(tdee - 250)
        case .maintain: return jsRoundInt(tdee)
        case .gain0_5: return jsRoundInt(tdee + 250)
        case .gain1: return jsRoundInt(tdee + 500)
        case .gain1_5: return jsRoundInt(tdee + 750)
        case .gain2: return jsRoundInt(tdee + 1000)
        }
    }

    /// Height value → cm.
    static func heightToCm(_ value: Double, unit: HeightUnit) -> Double {
        unit == .cm ? value : value * 2.54
    }

    /// Weight → kg (unrounded `0.453592` factor — the TDEE-accurate conversion).
    static func weightToKg(_ weight: Double, unit: WeightUnit) -> Double {
        unit == .kg ? weight : weight * 0.453592
    }

    /// Age from a `"YYYY-MM-DD"` date-of-birth, relative to the device's local "today".
    static func ageFromDob(_ dob: String, today: Date = Date()) -> Int {
        let parts = dob.split(separator: "-").map { Int($0) }
        guard parts.count == 3, let y = parts[0], let m = parts[1], let d = parts[2] else { return 0 }
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = .current
        let now = cal.dateComponents([.year, .month, .day], from: today)
        let curYear = now.year ?? 0
        let curMonth = now.month ?? 0
        let curDay = now.day ?? 0
        var age = curYear - y
        if curMonth < m || (curMonth == m && curDay < d) { age -= 1 }
        return age
    }

    /// Daily calorie goal from profile + current weight.
    ///
    /// `activityMode` controls the multiplier:
    ///   - `.auto`: uses `activityLevel` (chosen level baked into TDEE)
    ///   - `.manual` / `.smartwatch`: forces sedentary (×1.2); that activity's calories are added
    ///     separately at the call site (`calorieTarget = baseTdee + todayBurned`).
    static func calculateDailyCalories(
        weightValue: Double,
        weightUnit: WeightUnit,
        heightValue: Double,
        heightUnit: HeightUnit,
        age: Int,
        sex: Sex,
        activityLevel: ActivityLevel,
        weightGoal: WeightGoal,
        activityMode: ActivityMode = .manual
    ) -> Int {
        let weightKg = weightToKg(weightValue, unit: weightUnit)
        let heightCm = heightToCm(heightValue, unit: heightUnit)
        let bmr = calculateBMR(weightKg: weightKg, heightCm: heightCm, age: age, sex: sex)
        let effectiveLevel: ActivityLevel = activityMode == .auto ? activityLevel : .sedentary
        let tdee = bmr * activityMultiplier(effectiveLevel)
        return goalCalories(tdee: tdee, goal: weightGoal)
    }
}
