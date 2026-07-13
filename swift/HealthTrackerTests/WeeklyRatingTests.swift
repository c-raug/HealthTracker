import XCTest
@testable import HealthTracker

/// Parity checks for `Logic/WeeklyRating.swift` against `expo/utils/weeklyRatingCalculation.ts`.
/// `weekStart` is an explicit Monday, so these fixtures are fully deterministic.
final class WeeklyRatingTests: XCTestCase {

    private let weekStart = "2026-07-06" // a Monday; week runs 07-06 … 07-12

    private func profilePrefs() -> UserPreferences {
        let profile = UserProfile(sex: .male, heightValue: 70, heightUnit: .inches,
                                  activityLevel: .sedentary, weightGoal: .maintain)
        var prefs = UserPreferences(unit: .lbs)
        prefs.profile = profile
        return prefs
    }

    private func weekDays() -> [String] { (0..<7).map { Dates.addDays(weekStart, $0) } }

    func testPerfectWeekIsFiveStars() {
        let days = weekDays()
        let nutrition = days.map {
            DayNutrition(date: $0, meals: Meals(breakfast: [
                NutritionFoodItem(id: "\($0)-f", name: "f", calories: 2000)
            ]))
        }
        let weights = days.map { WeightEntry(id: "w-\($0)", date: $0, weight: 100, unit: .lbs, createdAt: "t") }
        // Sedentary, 100 lbs → water goal = round(50) = 50 oz. Log exactly 50 each day.
        let water = days.map { DayWater(date: $0, entries: [WaterEntry(id: "\($0)-w", amount: 50)]) }

        let r = WeeklyRating.calculate(
            weekStart: weekStart, weightEntries: weights, nutritionLog: nutrition,
            waterLog: water, preferences: profilePrefs(), calorieTarget: 2000)

        XCTAssertEqual(r.stars, 5)
        XCTAssertEqual(r.factors.food, 1, accuracy: 0.0001)
        XCTAssertEqual(r.factors.calories, 1, accuracy: 0.0001)
        XCTAssertEqual(r.factors.weight, 1, accuracy: 0.0001)
        XCTAssertEqual(r.factors.water, 1, accuracy: 0.0001)
    }

    func testEmptyWeekIsOneStar() {
        let r = WeeklyRating.calculate(
            weekStart: weekStart, weightEntries: [], nutritionLog: [],
            waterLog: [], preferences: profilePrefs(), calorieTarget: nil)
        XCTAssertEqual(r.stars, 1)
        XCTAssertEqual(r.factors.calories, 0, accuracy: 0.0001)
        XCTAssertEqual(r.factors.food, 0, accuracy: 0.0001)
    }

    func testFoodOnlyWeekRoundsToTwoStars() {
        // Food logged all 7 days but calories far from target; no weight/water.
        let days = weekDays()
        let nutrition = days.map {
            DayNutrition(date: $0, meals: Meals(breakfast: [
                NutritionFoodItem(id: "\($0)-f", name: "f", calories: 100)
            ]))
        }
        let r = WeeklyRating.calculate(
            weekStart: weekStart, weightEntries: [], nutritionLog: nutrition,
            waterLog: [], preferences: profilePrefs(), calorieTarget: 2000)
        // avg = (0 + 0 + 0 + 1) / 4 = 0.25 → round(1 + 0.25*4) = round(2) = 2
        XCTAssertEqual(r.factors.food, 1, accuracy: 0.0001)
        XCTAssertEqual(r.factors.calories, 0, accuracy: 0.0001)
        XCTAssertEqual(r.stars, 2)
    }

    func testWaterGoalUsesManualOverrideWhenSet() {
        let days = weekDays()
        var prefs = profilePrefs()
        prefs.waterGoalMode = .manual
        prefs.waterGoalOverride = 200 // manual target; auto would be 50
        let weights = days.map { WeightEntry(id: "w-\($0)", date: $0, weight: 100, unit: .lbs, createdAt: "t") }
        // Log 100 oz/day: clears auto-50 but falls short of the manual 200 → water factor 0.
        let water = days.map { DayWater(date: $0, entries: [WaterEntry(id: "\($0)-w", amount: 100)]) }

        let r = WeeklyRating.calculate(
            weekStart: weekStart, weightEntries: weights, nutritionLog: [],
            waterLog: water, preferences: prefs, calorieTarget: nil)
        XCTAssertEqual(r.factors.water, 0, accuracy: 0.0001)
    }
}
