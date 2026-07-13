import XCTest
@testable import HealthTracker

/// Parity checks for `Logic/Streaks.swift` against `expo/utils/streakCalculation.ts`.
/// Streaks are anchored to "today", so fixtures are built relative to `Dates.getToday()`.
final class StreakTests: XCTestCase {

    private func daysAgo(_ n: Int) -> String { Dates.addDays(Dates.getToday(), -n) }

    private func food(_ date: String, count: Int) -> DayNutrition {
        let items = (0..<count).map {
            NutritionFoodItem(id: "\(date)-\($0)", name: "f", calories: 100)
        }
        return DayNutrition(date: date, meals: Meals(breakfast: items))
    }

    func testCurrentStreakCountsBackFromTodayInclusive() {
        let log = [food(daysAgo(0), count: 1), food(daysAgo(1), count: 1), food(daysAgo(2), count: 1)]
        let r = Streaks.food(log)
        XCTAssertEqual(r.current, 3)
        XCTAssertEqual(r.longest, 3)
    }

    func testGapBreaksCurrentStreak() {
        // today, today-1 present; today-2 missing; today-3 present.
        let log = [food(daysAgo(0), count: 1), food(daysAgo(1), count: 1), food(daysAgo(3), count: 2)]
        let r = Streaks.food(log)
        XCTAssertEqual(r.current, 2)
        XCTAssertEqual(r.longest, 2)
    }

    func testEmptyLogHasZeroStreak() {
        XCTAssertEqual(Streaks.food([]), Streaks.Result(current: 0, longest: 0))
    }

    func testLongestFromHistoricalRunWhenNotCurrent() {
        // A 4-day run that ended in the past (nothing today) → current 0, longest 4.
        let log = [food(daysAgo(10), count: 1), food(daysAgo(11), count: 1),
                   food(daysAgo(12), count: 1), food(daysAgo(13), count: 1)]
        let r = Streaks.food(log)
        XCTAssertEqual(r.current, 0)
        XCTAssertEqual(r.longest, 4)
    }

    func testFoodStreakIgnoresEmptyDays() {
        // A day present in the log but with zero foods does not count.
        let log = [food(daysAgo(0), count: 0), food(daysAgo(1), count: 1)]
        let r = Streaks.food(log)
        XCTAssertEqual(r.current, 0) // today has no food → current breaks immediately
        XCTAssertEqual(r.longest, 1)
    }

    func testCalorieGoalStreakWithinTenPercent() {
        let target = 2000
        let mk: (String, Double) -> DayNutrition = { date, cals in
            DayNutrition(date: date, meals: Meals(breakfast: [
                NutritionFoodItem(id: "\(date)-c", name: "f", calories: cals)
            ]))
        }
        // today = 2000 (ok), today-1 = 1850 (within ±10% = 1800…2200, ok), today-2 = 1700 (out).
        let log = [mk(daysAgo(0), 2000), mk(daysAgo(1), 1850), mk(daysAgo(2), 1700)]
        let r = Streaks.calorieGoal(log, calorieTarget: target)
        XCTAssertEqual(r.current, 2)
    }

    func testCalorieGoalStreakNilTargetIsZero() {
        let log = [DayNutrition(date: daysAgo(0), meals: Meals(breakfast: [
            NutritionFoodItem(id: "x", name: "f", calories: 2000)
        ]))]
        XCTAssertEqual(Streaks.calorieGoal(log, calorieTarget: nil), Streaks.Result(current: 0, longest: 0))
    }

    func testWeightStreak() {
        let entries = [
            WeightEntry(id: "1", date: daysAgo(0), weight: 180, unit: .lbs, createdAt: "t"),
            WeightEntry(id: "2", date: daysAgo(1), weight: 181, unit: .lbs, createdAt: "t"),
        ]
        XCTAssertEqual(Streaks.weight(entries).current, 2)
    }

    func testActivityStreak() {
        let log = [
            DayActivity(date: daysAgo(0), activities: [
                ActivityEntry(id: "a", type: .steps, steps: 5000, caloriesBurned: 100)
            ]),
            DayActivity(date: daysAgo(1), activities: []), // empty → breaks
        ]
        XCTAssertEqual(Streaks.activity(log).current, 1)
    }
}
