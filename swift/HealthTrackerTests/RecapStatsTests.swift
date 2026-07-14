import XCTest
@testable import HealthTracker

/// Parity checks for `Logic/RecapStats.swift` against the inline math in
/// `expo/app/weekly-recap-modal.tsx` + `expo/components/recap/*` — the week window, the Weight and
/// Nutrition aggregations, the current-streak wiring, the unlocked-achievement cap, and the footer
/// week label.
final class RecapStatsTests: XCTestCase {

    // MARK: - Fixtures

    private func weight(_ date: String, _ value: Double, _ unit: WeightUnit = .lbs, id: String = UUID().uuidString) -> WeightEntry {
        WeightEntry(id: id, date: date, weight: value, unit: unit, createdAt: "\(date)T12:00:00.000Z")
    }

    private func food(_ cal: Double, p: Double = 0, c: Double = 0, f: Double = 0) -> NutritionFoodItem {
        NutritionFoodItem(id: UUID().uuidString, name: "f", calories: cal, protein: p, carbs: c, fat: f)
    }

    private func nutritionDay(_ date: String, _ foods: [NutritionFoodItem]) -> DayNutrition {
        DayNutrition(date: date, meals: Meals(breakfast: foods))
    }

    // MARK: - Week window

    func testWeekStartIsPreviousISOMonday() {
        // Tue 2026-07-14 → this ISO Monday is 2026-07-13 → recap covers the prior week starting 2026-07-06.
        XCTAssertEqual(RecapStats.weekStart(today: "2026-07-14"), "2026-07-06")
    }

    func testWeekStartFromAMonday() {
        // On Mon 2026-07-13, the recap still covers the *previous* completed week (starts 2026-07-06).
        XCTAssertEqual(RecapStats.weekStart(today: "2026-07-13"), "2026-07-06")
    }

    func testWeekLabelSpansSevenDays() {
        XCTAssertEqual(RecapStats.weekLabel(weekStart: "2026-07-06"), "Jul 6 – Jul 12")
    }

    // MARK: - Weight page

    func testWeightPageStartEndAndChange() {
        let entries = [
            weight("2026-07-06", 180.0),
            weight("2026-07-09", 178.5),
            weight("2026-07-12", 177.0),
            weight("2026-07-13", 200.0), // outside the week → ignored
        ]
        let page = RecapStats.weightPage(weekStart: "2026-07-06", entries: entries)
        XCTAssertTrue(page.hasData)
        XCTAssertEqual(page.startWeight, 180.0)
        XCTAssertEqual(page.endWeight, 177.0)
        XCTAssertEqual(page.change, -3.0)
        XCTAssertEqual(page.unit, .lbs)
    }

    func testWeightPageSingleEntryHasNoChange() {
        let page = RecapStats.weightPage(weekStart: "2026-07-06", entries: [weight("2026-07-08", 165.0, .kg)])
        XCTAssertTrue(page.hasData)
        XCTAssertEqual(page.startWeight, 165.0)
        XCTAssertEqual(page.endWeight, 165.0)
        XCTAssertNil(page.change) // same id start == end → no change shown
        XCTAssertEqual(page.unit, .kg)
    }

    func testWeightPageNoEntriesThisWeek() {
        let page = RecapStats.weightPage(weekStart: "2026-07-06", entries: [weight("2026-06-01", 190.0)])
        XCTAssertFalse(page.hasData)
        XCTAssertNil(page.change)
        XCTAssertEqual(page.unit, .lbs) // default fallback
    }

    func testWeightPageGainIsPositiveChange() {
        let entries = [weight("2026-07-06", 170.0, id: "a"), weight("2026-07-12", 172.5, id: "b")]
        let page = RecapStats.weightPage(weekStart: "2026-07-06", entries: entries)
        XCTAssertEqual(page.change, 2.5)
    }

    // MARK: - Nutrition page

    func testNutritionPageAveragesOverLoggedDaysOnly() {
        let log = [
            nutritionDay("2026-07-06", [food(500, p: 30, c: 40, f: 10), food(300, p: 10, c: 20, f: 5)]), // 800 cal
            nutritionDay("2026-07-07", []),  // empty → not a logging day
            nutritionDay("2026-07-09", [food(600, p: 20, c: 50, f: 15)]), // 600 cal
        ]
        let page = RecapStats.nutritionPage(weekStart: "2026-07-06", nutritionLog: log)
        XCTAssertEqual(page.loggingDays, 2)         // only the 2 non-empty days
        XCTAssertEqual(page.avgCalories, 700)       // (800 + 600) / 2
        XCTAssertEqual(page.totalProtein, 60)       // 30 + 10 + 20
        XCTAssertEqual(page.totalCarbs, 110)        // 40 + 20 + 50
        XCTAssertEqual(page.totalFat, 30)           // 10 + 5 + 15
    }

    func testNutritionPageNoDataIsAllZero() {
        let page = RecapStats.nutritionPage(weekStart: "2026-07-06", nutritionLog: [])
        XCTAssertEqual(page.loggingDays, 0)
        XCTAssertEqual(page.avgCalories, 0)
        XCTAssertEqual(page.totalProtein, 0)
    }

    func testNutritionPageIgnoresDaysOutsideWindow() {
        let log = [nutritionDay("2026-07-13", [food(999)])] // Monday of the *next* week
        let page = RecapStats.nutritionPage(weekStart: "2026-07-06", nutritionLog: log)
        XCTAssertEqual(page.loggingDays, 0)
    }

    // MARK: - Streaks & achievements

    func testCurrentStreaksWireThroughToStreakHelpers() {
        // Weight logged today + yesterday → current weight streak of 2 (Streaks counts back from today).
        let today = Dates.getToday()
        let entries = [weight(today, 180), weight(Dates.addDays(today, -1), 181)]
        let summary = RecapStats.currentStreaks(
            nutritionLog: [], entries: entries, activityLog: [], calorieTarget: nil
        )
        XCTAssertEqual(summary.weight, 2)
        XCTAssertEqual(summary.food, 0)
        XCTAssertEqual(summary.activity, 0)
        XCTAssertEqual(summary.calorie, 0)
    }

    func testUnlockedThisWeekCapsAtThreeInCanonicalOrder() {
        let ids = ["foods_10", "streak_7", "foods_50", "streak_30", "foods_100"]
        let shown = RecapStats.unlockedThisWeek(unlockedIds: ids)
        XCTAssertEqual(shown.count, 3)
        // Canonical order is the `Achievements.all` order: streak_7, streak_30, …, foods_10, foods_50…
        XCTAssertEqual(shown.map(\.id), ["streak_7", "streak_30", "foods_10"])
    }

    func testUnlockedThisWeekEmptyWhenNoneUnlocked() {
        XCTAssertTrue(RecapStats.unlockedThisWeek(unlockedIds: nil).isEmpty)
        XCTAssertTrue(RecapStats.unlockedThisWeek(unlockedIds: []).isEmpty)
    }
}
