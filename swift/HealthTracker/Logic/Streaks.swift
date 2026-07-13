import Foundation

/// Verbatim port of `expo/utils/streakCalculation.ts`.
///
/// `current` = consecutive days counting back from today (inclusive); `longest` = the longest
/// consecutive run across all recorded dates. All variants (food / calorie-goal / weight /
/// activity) reduce to a set of qualifying `"YYYY-MM-DD"` dates fed to `computeStreak`.
enum Streaks {

    struct Result: Equatable {
        var current: Int
        var longest: Int
    }

    /// Current + longest streak from a set of qualifying dates.
    static func computeStreak(_ activeDates: Set<String>) -> Result {
        let today = Dates.getToday()
        var current = 0
        var date = today

        // Count the current streak backwards from today.
        while activeDates.contains(date) {
            current += 1
            date = Dates.addDays(date, -1)
        }

        if activeDates.isEmpty { return Result(current: 0, longest: 0) }

        // Longest run across all dates (lexicographic sort == chronological for zero-padded keys).
        let sorted = activeDates.sorted()
        var longest = 1
        var run = 1
        for i in 1..<sorted.count {
            if Dates.addDays(sorted[i - 1], 1) == sorted[i] {
                run += 1
                if run > longest { longest = run }
            } else {
                run = 1
            }
        }
        if current > longest { longest = current }

        return Result(current: current, longest: longest)
    }

    /// Consecutive days with at least 1 food logged.
    static func food(_ nutritionLog: [DayNutrition]) -> Result {
        var dates = Set<String>()
        for day in nutritionLog where totalFoods(day.meals) > 0 {
            dates.insert(day.date)
        }
        return computeStreak(dates)
    }

    /// Consecutive days within ±10% of the calorie target.
    static func calorieGoal(_ nutritionLog: [DayNutrition], calorieTarget: Int?) -> Result {
        guard let target = calorieTarget, target > 0 else { return Result(current: 0, longest: 0) }
        let targetD = Double(target)
        var dates = Set<String>()
        for day in nutritionLog {
            let consumed = consumedCalories(day.meals)
            if consumed > 0 && abs(consumed - targetD) <= targetD * 0.1 {
                dates.insert(day.date)
            }
        }
        return computeStreak(dates)
    }

    /// Consecutive days with at least 1 weight entry.
    static func weight(_ entries: [WeightEntry]) -> Result {
        computeStreak(Set(entries.map(\.date)))
    }

    /// Consecutive days with at least 1 activity logged.
    static func activity(_ activityLog: [DayActivity]) -> Result {
        var dates = Set<String>()
        for day in activityLog where !day.activities.isEmpty {
            dates.insert(day.date)
        }
        return computeStreak(dates)
    }

    // MARK: - Meal helpers (shared shape with WeeklyRating)

    static func totalFoods(_ meals: Meals) -> Int {
        meals.breakfast.count + meals.lunch.count + meals.dinner.count + meals.snacks.count
    }

    static func consumedCalories(_ meals: Meals) -> Double {
        [meals.breakfast, meals.lunch, meals.dinner, meals.snacks]
            .flatMap { $0 }
            .reduce(0) { $0 + ($1.calories ?? 0) }
    }
}
