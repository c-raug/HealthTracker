import Foundation

/// Pure, testable core of the Nutrition tab — the calorie/macro math and the 7-day series that the
/// RN `expo/app/(tabs)/nutrition.tsx` screen computes inline. Kept out of the view so the numbers can
/// be unit-tested for parity against the Expo app (see `NutritionStatsTests`).
///
/// Nothing here touches SwiftUI; the view (`NutritionView`) reads these values and renders them.
enum NutritionStats {

    // MARK: - Macro constants (mirror `CAL_PER_GRAM` in MacroProgressBars.tsx)

    static let calPerGramProtein = 4.0
    static let calPerGramCarbs = 4.0
    static let calPerGramFat = 9.0

    /// The default macro split when the user hasn't picked one (RN `?? { protein:30, carbs:40, fat:30 }`).
    static let defaultSplit = MacroSplit(protein: 30, carbs: 40, fat: 30)

    // MARK: - Consumed totals

    /// Total calories logged across all four meal buckets for a day (`food.calories ?? 0`).
    static func consumedCalories(_ meals: Meals) -> Double {
        MealCategory.allCases.reduce(0) { total, cat in
            total + meals[cat].reduce(0) { $0 + ($1.calories ?? 0) }
        }
    }

    /// Summed protein / carbs / fat grams for a day (each `?? 0`).
    static func consumedMacros(_ meals: Meals) -> Macros {
        var m = Macros(protein: 0, carbs: 0, fat: 0)
        for cat in MealCategory.allCases {
            for food in meals[cat] {
                m.protein += food.protein ?? 0
                m.carbs += food.carbs ?? 0
                m.fat += food.fat ?? 0
            }
        }
        return m
    }

    struct Macros: Equatable {
        var protein: Double
        var carbs: Double
        var fat: Double
    }

    /// Macro gram targets from the goal calories + split:
    /// `round(pct/100 * goalCalories / calPerGram)` (RN `MacroProgressBars` / `MacroSection`).
    static func macroTargets(goalCalories: Double, split: MacroSplit) -> (protein: Int, carbs: Int, fat: Int) {
        (
            protein: jsRoundInt(split.protein / 100 * goalCalories / calPerGramProtein),
            carbs: jsRoundInt(split.carbs / 100 * goalCalories / calPerGramCarbs),
            fat: jsRoundInt(split.fat / 100 * goalCalories / calPerGramFat)
        )
    }

    // MARK: - Latest weight / TDEE base

    /// The newest weight entry by date (RN sorts `entries` desc and takes `[0]`).
    static func latestWeight(_ entries: [WeightEntry]) -> WeightEntry? {
        entries.max { $0.date < $1.date }
    }

    /// Age used for TDEE: `dob` (computed) if present, else the legacy numeric `age`, else `nil`.
    static func resolvedAge(_ profile: UserProfile?, today: Date = Date()) -> Int? {
        guard let profile else { return nil }
        if let dob = profile.dob, !dob.isEmpty {
            return TDEE.ageFromDob(dob, today: today)
        }
        return profile.age
    }

    /// Base TDEE-derived daily calorie goal (0 when profile / weight / age are incomplete).
    /// `activityMode` is passed straight through to `TDEE.calculateDailyCalories`.
    static func baseTdee(profile: UserProfile?, latestWeight: WeightEntry?, activityMode: ActivityMode, today: Date = Date()) -> Int {
        guard let profile, let latestWeight, let age = resolvedAge(profile, today: today) else { return 0 }
        return TDEE.calculateDailyCalories(
            weightValue: latestWeight.weight,
            weightUnit: latestWeight.unit,
            heightValue: profile.heightValue,
            heightUnit: profile.heightUnit,
            age: age,
            sex: profile.sex,
            activityLevel: profile.activityLevel,
            weightGoal: profile.weightGoal,
            activityMode: activityMode
        )
    }

    // MARK: - Activity burn (mode-aware)

    /// Calories burned counted toward the calorie target for one day's activity log, per mode:
    /// manual → non-smartwatch entries; smartwatch → smartwatch entries; auto → 0 (TDEE already
    /// bakes in the activity level).
    static func caloriesBurned(_ day: DayActivity?, mode: ActivityMode) -> Int {
        guard let day else { return 0 }
        switch mode {
        case .manual:
            return day.activities.filter { $0.type != .smartwatch }.reduce(0) { $0 + $1.caloriesBurned }
        case .smartwatch:
            return day.activities.filter { $0.type == .smartwatch }.reduce(0) { $0 + $1.caloriesBurned }
        case .auto:
            return 0
        }
    }

    // MARK: - Weekly series

    /// One bar in a weekly graph: the day's consumed value and that day's goal.
    struct DayPoint: Identifiable, Equatable {
        var date: String
        var consumed: Double
        var goal: Double
        var id: String { date }
    }

    /// The 7 day-keys ending on (and including) `selectedDate`, oldest → newest.
    static func last7Days(endingOn selectedDate: String) -> [String] {
        (0..<7).map { Dates.addDays(selectedDate, -(6 - $0)) }
    }

    /// 7-day calorie series (consumed vs `baseTdee + that day's burn`), oldest → newest.
    static func weeklyCalorieSeries(
        nutritionLog: [DayNutrition],
        activityLog: [DayActivity],
        selectedDate: String,
        baseTdee: Int,
        mode: ActivityMode
    ) -> [DayPoint] {
        last7Days(endingOn: selectedDate).map { date in
            let meals = nutritionLog.first { $0.date == date }?.meals
            let consumed = meals.map(consumedCalories) ?? 0
            let burned = caloriesBurned(activityLog.first { $0.date == date }, mode: mode)
            return DayPoint(date: date, consumed: consumed, goal: Double(baseTdee + burned))
        }
    }

    /// Activity-adjusted goal line for the calorie graph: `baseTdee + round(avg burn over the days in
    /// the window that actually had activity)`. `nil` when there is no base TDEE.
    static func adjustedCalorieGoal(
        activityLog: [DayActivity],
        selectedDate: String,
        baseTdee: Int,
        mode: ActivityMode
    ) -> Int? {
        guard baseTdee > 0 else { return nil }
        let burns = last7Days(endingOn: selectedDate)
            .map { date in caloriesBurned(activityLog.first { $0.date == date }, mode: mode) }
            .filter { $0 > 0 }
        guard !burns.isEmpty else { return baseTdee }
        let avg = Double(burns.reduce(0, +)) / Double(burns.count)
        return baseTdee + jsRoundInt(avg)
    }
}
