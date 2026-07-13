import XCTest
@testable import HealthTracker

/// Phase 9 parity checks for `ActivityStats` — the pure math/formatting behind the Activities tab.
/// Mirrors the inline derivations in `expo/app/(tabs)/activities.tsx` (burn totals, weekly series,
/// exercise/steps previews, the smartwatch save-disabled gate, duration/label/detail formatting, and
/// the mode-mismatch warning check).
final class ActivityStatsTests: XCTestCase {

    private func weight(_ w: Double, _ unit: WeightUnit = .lbs) -> WeightEntry {
        WeightEntry(id: "w", date: "2026-07-13", weight: w, unit: unit, createdAt: "2026-07-13T00:00:00.000Z")
    }

    private func activity(
        _ id: String,
        _ type: ActivityEntryType,
        calories: Int,
        exerciseType: ExerciseType? = nil,
        durationMinutes: Int? = nil,
        steps: Int? = nil,
        loggedWithMode: ActivityMode? = nil,
        warningDismissed: Bool? = nil
    ) -> ActivityEntry {
        ActivityEntry(id: id, type: type, exerciseType: exerciseType, durationMinutes: durationMinutes,
                      steps: steps, caloriesBurned: calories, loggedWithMode: loggedWithMode,
                      warningDismissed: warningDismissed)
    }

    // MARK: - jsParseInt

    func testJsParseInt() {
        XCTAssertEqual(ActivityStats.jsParseInt("1234"), 1234)
        XCTAssertEqual(ActivityStats.jsParseInt("12abc"), 12)
        XCTAssertEqual(ActivityStats.jsParseInt("  -5"), -5)
        XCTAssertEqual(ActivityStats.jsParseInt("0"), 0)
        XCTAssertNil(ActivityStats.jsParseInt(""))
        XCTAssertNil(ActivityStats.jsParseInt("abc"))
        XCTAssertNil(ActivityStats.jsParseInt("."))
    }

    // MARK: - Total burned & weekly series

    func testTotalBurned() {
        XCTAssertEqual(ActivityStats.totalBurned(nil), 0)
        let day = DayActivity(date: "2026-07-13", activities: [
            activity("a", .exercise, calories: 100),
            activity("b", .steps, calories: 50),
            activity("c", .smartwatch, calories: 400),
        ])
        // Mode-independent — every entry counts (unlike NutritionStats.caloriesBurned).
        XCTAssertEqual(ActivityStats.totalBurned(day), 550)
    }

    func testWeeklyActivitySeries() {
        let log = [
            DayActivity(date: "2026-07-13", activities: [activity("a", .exercise, calories: 200)]),
            DayActivity(date: "2026-07-10", activities: [activity("b", .steps, calories: 75)]),
        ]
        let series = ActivityStats.weeklyActivitySeries(activityLog: log, selectedDate: "2026-07-13")
        XCTAssertEqual(series.count, 7)
        XCTAssertEqual(series.first?.date, "2026-07-07")
        XCTAssertEqual(series.last?.date, "2026-07-13")
        XCTAssertEqual(series.last?.consumed, 200)
        XCTAssertEqual(series.first(where: { $0.date == "2026-07-10" })?.consumed, 75)
        XCTAssertEqual(series.first(where: { $0.date == "2026-07-11" })?.consumed, 0)
        XCTAssertTrue(series.allSatisfy { $0.goal == 0 })
    }

    // MARK: - Previews (verbatim ActivityCalories)

    func testExercisePreview() {
        // MET 5 × (175·0.453592) kg × (90/60) h = 595.34 → 595.
        XCTAssertEqual(ActivityStats.exercisePreview(durationMinutes: 90, latestWeight: weight(175)), 595)
        // Zero duration or no weight → 0.
        XCTAssertEqual(ActivityStats.exercisePreview(durationMinutes: 0, latestWeight: weight(175)), 0)
        XCTAssertEqual(ActivityStats.exercisePreview(durationMinutes: 90, latestWeight: nil), 0)
    }

    func testStepsPreview() {
        // 10000 × (79.3786/70) × 0.04 = 453.59 → 454.
        XCTAssertEqual(ActivityStats.stepsPreview(stepsInput: "10000", latestWeight: weight(175)), 454)
        XCTAssertEqual(ActivityStats.stepsPreview(stepsInput: "0", latestWeight: weight(175)), 0)
        XCTAssertEqual(ActivityStats.stepsPreview(stepsInput: "abc", latestWeight: weight(175)), 0)
        XCTAssertEqual(ActivityStats.stepsPreview(stepsInput: "10000", latestWeight: nil), 0)
    }

    // MARK: - Smartwatch save gate

    func testSmartwatchSaveDisabled() {
        // Empty / unparseable → disabled.
        XCTAssertTrue(ActivityStats.smartwatchSaveDisabled(input: "", existingCalories: nil))
        XCTAssertTrue(ActivityStats.smartwatchSaveDisabled(input: "abc", existingCalories: nil))
        // Fresh valid value, no existing → enabled.
        XCTAssertFalse(ActivityStats.smartwatchSaveDisabled(input: "450", existingCalories: nil))
        // Unchanged from existing → disabled; changed → enabled.
        XCTAssertTrue(ActivityStats.smartwatchSaveDisabled(input: "450", existingCalories: 450))
        XCTAssertFalse(ActivityStats.smartwatchSaveDisabled(input: "500", existingCalories: 450))
    }

    func testSmartwatchEntry() {
        let day = DayActivity(date: "2026-07-13", activities: [
            activity("a", .exercise, calories: 100),
            activity("s", .smartwatch, calories: 320),
        ])
        XCTAssertEqual(ActivityStats.smartwatchEntry(day)?.id, "s")
        XCTAssertNil(ActivityStats.smartwatchEntry(nil))
    }

    // MARK: - Formatting

    func testFormatDuration() {
        XCTAssertEqual(ActivityStats.formatDuration(90), "1h 30m")
        XCTAssertEqual(ActivityStats.formatDuration(120), "2h")
        XCTAssertEqual(ActivityStats.formatDuration(45), "45m")
        XCTAssertEqual(ActivityStats.formatDuration(0), "0m")
    }

    func testLabelAndDetail() {
        let ex = activity("a", .exercise, calories: 100, exerciseType: .weightLifting, durationMinutes: 90)
        XCTAssertEqual(ActivityStats.label(for: ex), "Weight Lifting")
        XCTAssertEqual(ActivityStats.detail(for: ex), "1h 30m")

        let st = activity("b", .steps, calories: 50, steps: 12345)
        XCTAssertEqual(ActivityStats.label(for: st), "Steps")
        XCTAssertEqual(ActivityStats.detail(for: st), "12,345 steps")

        let sw = activity("c", .smartwatch, calories: 400)
        XCTAssertEqual(ActivityStats.label(for: sw), "Smart Watch")
        XCTAssertEqual(ActivityStats.detail(for: sw), "Calories from wearable")
    }

    func testModeLabel() {
        XCTAssertEqual(ActivityStats.modeLabel(.auto), "Auto")
        XCTAssertEqual(ActivityStats.modeLabel(.manual), "Manual")
        XCTAssertEqual(ActivityStats.modeLabel(.smartwatch), "Smart Watch")
    }

    // MARK: - Warning check

    func testShowWarning() {
        // No loggedWithMode → never warns.
        XCTAssertFalse(ActivityStats.showWarning(for: activity("a", .exercise, calories: 100), mode: .manual))
        // Same mode → no warning.
        XCTAssertFalse(ActivityStats.showWarning(for: activity("b", .exercise, calories: 100, loggedWithMode: .manual), mode: .manual))
        // Different mode, not dismissed → warns.
        XCTAssertTrue(ActivityStats.showWarning(for: activity("c", .exercise, calories: 100, loggedWithMode: .smartwatch), mode: .manual))
        // Different mode but dismissed → no warning.
        XCTAssertFalse(ActivityStats.showWarning(for: activity("d", .exercise, calories: 100, loggedWithMode: .smartwatch, warningDismissed: true), mode: .manual))
    }
}
