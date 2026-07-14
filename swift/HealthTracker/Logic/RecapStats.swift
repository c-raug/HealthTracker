import Foundation

/// Pure, testable core of the weekly-recap feature — the week-window math and the per-page
/// aggregations that the RN `expo/app/weekly-recap-modal.tsx` + `components/recap/*` pages compute
/// inline. Kept out of the views so the numbers can be unit-tested for parity (see `RecapStatsTests`).
///
/// The recap always covers the **most recently completed ISO week** (the previous Mon–Sun).
enum RecapStats {

    // MARK: - Week window

    /// `"YYYY-MM-DD"` Monday that begins the recap week: `getISOWeekMonday(today) − 7 days`.
    static func weekStart(today: String = Dates.getToday()) -> String {
        Dates.addDays(Dates.getISOWeekMonday(today), -7)
    }

    /// The shared calorie target for the recap pages: base TDEE from the newest weight entry,
    /// activity-mode-aware (no per-day burn). `nil` when profile / weight / age are incomplete —
    /// matching the RN modal, where `calorieTarget` stays `null` and the pages hide the goal row.
    static func calorieTarget(entries: [WeightEntry], preferences: UserPreferences, today: Date = Date()) -> Int? {
        let base = NutritionStats.baseTdee(
            profile: preferences.profile,
            latestWeight: NutritionStats.latestWeight(entries),
            activityMode: preferences.activityMode ?? .auto,
            today: today
        )
        return base > 0 ? base : nil
    }

    // MARK: - Page 1: Weight

    /// Port of the inline math in `RecapWeightPage.tsx`.
    struct WeightPage: Equatable {
        var startWeight: Double?
        var endWeight: Double?
        var unit: WeightUnit
        /// End − start, only when there are ≥2 distinct entries in the week; else `nil`.
        var change: Double?
        var hasData: Bool
    }

    static func weightPage(weekStart: String, entries: [WeightEntry]) -> WeightPage {
        let weekEnd = Dates.addDays(weekStart, 6)
        let weekEntries = entries
            .filter { $0.date >= weekStart && $0.date <= weekEnd }
            .sorted { $0.date < $1.date }

        let startEntry = weekEntries.first
        let endEntry = weekEntries.last
        let unit = startEntry?.unit ?? endEntry?.unit ?? .lbs

        var change: Double?
        if let s = startEntry, let e = endEntry, s.id != e.id {
            change = e.weight - s.weight
        }

        return WeightPage(
            startWeight: startEntry?.weight,
            endWeight: endEntry?.weight,
            unit: unit,
            change: change,
            hasData: !weekEntries.isEmpty
        )
    }

    // MARK: - Page 2: Nutrition

    /// Port of the inline math in `RecapNutritionPage.tsx`. Totals/averages count only the days
    /// that actually had food logged.
    struct NutritionPage: Equatable {
        var loggingDays: Int
        var avgCalories: Int
        var totalProtein: Int
        var totalCarbs: Int
        var totalFat: Int
    }

    static func nutritionPage(weekStart: String, nutritionLog: [DayNutrition]) -> NutritionPage {
        let weekDays = (0..<7).map { Dates.addDays(weekStart, $0) }
        let daysWithData = weekDays.compactMap { date in
            nutritionLog.first { $0.date == date }
        }.filter { Streaks.totalFoods($0.meals) > 0 }

        var totalCalories = 0.0
        var totalProtein = 0.0
        var totalCarbs = 0.0
        var totalFat = 0.0
        for day in daysWithData {
            for cat in MealCategory.allCases {
                for food in day.meals[cat] {
                    totalCalories += food.calories ?? 0
                    totalProtein += food.protein ?? 0
                    totalCarbs += food.carbs ?? 0
                    totalFat += food.fat ?? 0
                }
            }
        }

        let loggingDays = daysWithData.count
        let avgCalories = loggingDays > 0 ? jsRoundInt(totalCalories / Double(loggingDays)) : 0

        return NutritionPage(
            loggingDays: loggingDays,
            avgCalories: avgCalories,
            totalProtein: jsRoundInt(totalProtein),
            totalCarbs: jsRoundInt(totalCarbs),
            totalFat: jsRoundInt(totalFat)
        )
    }

    // MARK: - Page 3: Streaks & Milestones

    /// The four current-streak values shown on `RecapStreaksPage.tsx` (order: food, calorie, weight,
    /// activity — the grid order in the RN page).
    struct StreakSummary: Equatable {
        var food: Int
        var calorie: Int
        var weight: Int
        var activity: Int
    }

    static func currentStreaks(
        nutritionLog: [DayNutrition],
        entries: [WeightEntry],
        activityLog: [DayActivity],
        calorieTarget: Int?
    ) -> StreakSummary {
        StreakSummary(
            food: Streaks.food(nutritionLog).current,
            calorie: Streaks.calorieGoal(nutritionLog, calorieTarget: calorieTarget).current,
            weight: Streaks.weight(entries).current,
            activity: Streaks.activity(activityLog).current
        )
    }

    /// The achievements shown as "unlocked" on the recap: all currently-unlocked ones (the RN page
    /// lacks unlock timestamps, so it shows all), in canonical order, capped at 3.
    static func unlockedThisWeek(unlockedIds: [String]?) -> [Achievements.Achievement] {
        let unlocked = Set(unlockedIds ?? [])
        return Achievements.all.filter { unlocked.contains($0.id) }.prefix(3).map { $0 }
    }

    // MARK: - Footer week label

    /// `"MMM d – MMM d"` (en-US) spanning `weekStart … weekStart + 6` (RN `toLocaleDateString`).
    static func weekLabel(weekStart: String) -> String {
        let start = Dates.formatShortDate(weekStart)
        let end = Dates.formatShortDate(Dates.addDays(weekStart, 6))
        return "\(start) – \(end)"
    }
}
