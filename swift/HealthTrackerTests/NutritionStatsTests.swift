import XCTest
@testable import HealthTracker

/// Phase 7a parity checks for `NutritionStats` — the pure calorie/macro math behind the Nutrition
/// tab. Mirrors the inline derivations in `expo/app/(tabs)/nutrition.tsx`,
/// `expo/components/nutrition/MacroProgressBars.tsx`, and `WeeklyIntakeGraph.tsx`.
final class NutritionStatsTests: XCTestCase {

    private func food(_ cal: Double?, p: Double? = nil, c: Double? = nil, f: Double? = nil, quick: Bool = false) -> NutritionFoodItem {
        NutritionFoodItem(id: UUID().uuidString, name: "x", calories: cal, protein: p, carbs: c, fat: f,
                          servingSize: nil, servings: nil, mealGroupId: nil, mealGroupName: nil, quickAdd: quick ? true : nil)
    }

    private func profile(age: Int? = nil, dob: String? = nil) -> UserProfile {
        UserProfile(name: "T", age: age, dob: dob, fitnessGoal: nil, sex: .male,
                    heightValue: 70, heightUnit: .inches, activityLevel: .moderatelyActive, weightGoal: .maintain)
    }

    private func weight(_ date: String, _ w: Double, _ unit: WeightUnit = .lbs) -> WeightEntry {
        WeightEntry(id: date, date: date, weight: w, unit: unit, createdAt: "\(date)T00:00:00.000Z")
    }

    // MARK: - Consumed totals

    func testConsumedCalories() {
        let meals = Meals(
            breakfast: [food(300), food(nil)],  // nil calories count as 0
            lunch: [food(500)],
            dinner: [],
            snacks: [food(120)]
        )
        XCTAssertEqual(NutritionStats.consumedCalories(meals), 920)
    }

    func testConsumedMacros() {
        let meals = Meals(
            breakfast: [food(300, p: 20, c: 30, f: 10)],
            lunch: [food(500, p: 40, c: 50, f: 15)],
            dinner: [],
            snacks: [food(120, p: 5, c: nil, f: 3)]  // nil carbs → 0
        )
        let m = NutritionStats.consumedMacros(meals)
        XCTAssertEqual(m.protein, 65)
        XCTAssertEqual(m.carbs, 80)
        XCTAssertEqual(m.fat, 28)
    }

    // MARK: - Macro targets

    func testMacroTargets() {
        // round(pct/100 * goalCal / calPerGram); balanced 30/40/30 @ 2000 cal.
        let t = NutritionStats.macroTargets(goalCalories: 2000, split: MacroSplit(protein: 30, carbs: 40, fat: 30))
        XCTAssertEqual(t.protein, 150)  // 0.30*2000/4 = 150
        XCTAssertEqual(t.carbs, 200)    // 0.40*2000/4 = 200
        XCTAssertEqual(t.fat, 67)       // 0.30*2000/9 = 66.67 → 67
    }

    // MARK: - Latest weight & TDEE base

    func testLatestWeightPicksNewestDate() {
        let entries = [weight("2026-07-01", 180), weight("2026-07-10", 175), weight("2026-07-05", 178)]
        XCTAssertEqual(NutritionStats.latestWeight(entries)?.date, "2026-07-10")
        XCTAssertNil(NutritionStats.latestWeight([]))
    }

    func testResolvedAgePrefersDob() {
        let today = isoDay("2026-07-13")
        XCTAssertEqual(NutritionStats.resolvedAge(profile(dob: "1990-01-01"), today: today), 36)
        // No dob → legacy numeric age.
        XCTAssertEqual(NutritionStats.resolvedAge(profile(age: 42), today: today), 42)
        XCTAssertNil(NutritionStats.resolvedAge(nil))
    }

    func testBaseTdeeZeroWhenIncomplete() {
        // No weight → 0; no profile → 0.
        XCTAssertEqual(NutritionStats.baseTdee(profile: profile(age: 30), latestWeight: nil, activityMode: .manual), 0)
        XCTAssertEqual(NutritionStats.baseTdee(profile: nil, latestWeight: weight("2026-07-13", 175), activityMode: .manual), 0)
    }

    func testBaseTdeeMatchesTdeeCalc() {
        let p = profile(age: 30)
        let w = weight("2026-07-13", 175)
        // manual mode forces sedentary (×1.2) inside calculateDailyCalories.
        let expected = TDEE.calculateDailyCalories(
            weightValue: 175, weightUnit: .lbs, heightValue: 70, heightUnit: .inches,
            age: 30, sex: .male, activityLevel: .moderatelyActive, weightGoal: .maintain, activityMode: .manual)
        XCTAssertEqual(NutritionStats.baseTdee(profile: p, latestWeight: w, activityMode: .manual), expected)
    }

    // MARK: - Calories burned (mode-aware)

    func testCaloriesBurnedByMode() {
        let day = DayActivity(date: "2026-07-13", activities: [
            ActivityEntry(id: "1", type: .exercise, exerciseType: .weightLifting, durationMinutes: 60, steps: nil, caloriesBurned: 200, loggedWithMode: .manual, warningDismissed: nil),
            ActivityEntry(id: "2", type: .smartwatch, exerciseType: nil, durationMinutes: nil, steps: nil, caloriesBurned: 350, loggedWithMode: .smartwatch, warningDismissed: nil),
        ])
        XCTAssertEqual(NutritionStats.caloriesBurned(day, mode: .manual), 200)      // non-smartwatch
        XCTAssertEqual(NutritionStats.caloriesBurned(day, mode: .smartwatch), 350)  // smartwatch only
        XCTAssertEqual(NutritionStats.caloriesBurned(day, mode: .auto), 0)          // baked into TDEE
        XCTAssertEqual(NutritionStats.caloriesBurned(nil, mode: .manual), 0)
    }

    // MARK: - Weekly series

    func testLast7DaysInclusiveOldestToNewest() {
        let days = NutritionStats.last7Days(endingOn: "2026-07-13")
        XCTAssertEqual(days.count, 7)
        XCTAssertEqual(days.first, "2026-07-07")
        XCTAssertEqual(days.last, "2026-07-13")
    }

    func testWeeklyCalorieSeriesGoalIncludesBurn() {
        let nutrition = [DayNutrition(date: "2026-07-13", meals: Meals(breakfast: [food(400)]))]
        let activity = [DayActivity(date: "2026-07-13", activities: [
            ActivityEntry(id: "1", type: .exercise, exerciseType: .weightLifting, durationMinutes: 60, steps: nil, caloriesBurned: 200, loggedWithMode: .manual, warningDismissed: nil),
        ])]
        let series = NutritionStats.weeklyCalorieSeries(nutritionLog: nutrition, activityLog: activity, selectedDate: "2026-07-13", baseTdee: 2000, mode: .manual)
        let last = series.last!
        XCTAssertEqual(last.date, "2026-07-13")
        XCTAssertEqual(last.consumed, 400)
        XCTAssertEqual(last.goal, 2200)  // baseTdee + burn
        // Empty earlier day: consumed 0, goal = baseTdee (no burn).
        XCTAssertEqual(series.first!.consumed, 0)
        XCTAssertEqual(series.first!.goal, 2000)
    }

    func testAdjustedCalorieGoal() {
        // No base TDEE → nil.
        XCTAssertNil(NutritionStats.adjustedCalorieGoal(activityLog: [], selectedDate: "2026-07-13", baseTdee: 0, mode: .manual))
        // No activity days → just baseTdee.
        XCTAssertEqual(NutritionStats.adjustedCalorieGoal(activityLog: [], selectedDate: "2026-07-13", baseTdee: 2000, mode: .manual), 2000)
        // Averages only days with burn > 0: (200 + 400)/2 = 300 → 2300.
        let activity = [
            DayActivity(date: "2026-07-12", activities: [ActivityEntry(id: "a", type: .exercise, exerciseType: .weightLifting, durationMinutes: nil, steps: nil, caloriesBurned: 200, loggedWithMode: .manual, warningDismissed: nil)]),
            DayActivity(date: "2026-07-13", activities: [ActivityEntry(id: "b", type: .exercise, exerciseType: .weightLifting, durationMinutes: nil, steps: nil, caloriesBurned: 400, loggedWithMode: .manual, warningDismissed: nil)]),
        ]
        XCTAssertEqual(NutritionStats.adjustedCalorieGoal(activityLog: activity, selectedDate: "2026-07-13", baseTdee: 2000, mode: .manual), 2300)
    }

    // MARK: - Helpers

    private func isoDay(_ key: String) -> Date {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = .current
        let parts = key.split(separator: "-").map { Int($0)! }
        return cal.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))!
    }
}
