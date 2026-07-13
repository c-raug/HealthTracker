import XCTest
@testable import HealthTracker

/// Phase 6 parity checks for `WeightStats` — the pure logic behind the Weight tab
/// (save validation, trend series, and 7-day progress insights). Mirrors the derivations in
/// `expo/app/(tabs)/index.tsx`, `expo/components/WeightChart.tsx`, and `expo/components/WeightInsights.tsx`.
final class WeightStatsTests: XCTestCase {

    private func entry(_ date: String, _ weight: Double, _ unit: WeightUnit = .lbs) -> WeightEntry {
        WeightEntry(id: date, date: date, weight: weight, unit: unit, createdAt: "\(date)T00:00:00.000Z")
    }

    // MARK: - JS number parity

    func testJsParseFloat() {
        XCTAssertEqual(WeightStats.jsParseFloat("175.5"), 175.5)
        XCTAssertEqual(WeightStats.jsParseFloat("175."), 175)     // trailing dot tolerated
        XCTAssertEqual(WeightStats.jsParseFloat("150abc"), 150)   // leading numeric prefix
        XCTAssertEqual(WeightStats.jsParseFloat(".5"), 0.5)
        XCTAssertNil(WeightStats.jsParseFloat("."))
        XCTAssertNil(WeightStats.jsParseFloat("abc"))
        XCTAssertNil(WeightStats.jsParseFloat(""))
    }

    func testJsNumberString() {
        XCTAssertEqual(WeightStats.jsNumberString(175), "175")     // no trailing .0
        XCTAssertEqual(WeightStats.jsNumberString(175.5), "175.5")
        XCTAssertEqual(WeightStats.jsNumberString(80), "80")
    }

    func testDisplayString() {
        XCTAssertEqual(WeightStats.displayString(for: nil, unit: .lbs), "")
        XCTAssertEqual(WeightStats.displayString(for: entry("2026-07-13", 175.5), unit: .lbs), "175.5")
        // Cross-unit: 175.5 lbs → 79.6 kg (1-dp display conversion).
        XCTAssertEqual(WeightStats.displayString(for: entry("2026-07-13", 175.5, .lbs), unit: .kg), "79.6")
    }

    // MARK: - Validation

    func testRange() {
        XCTAssertEqual(WeightStats.range(for: .lbs).min, 50)
        XCTAssertEqual(WeightStats.range(for: .lbs).max, 1000)
        XCTAssertEqual(WeightStats.range(for: .kg).min, 20)
        XCTAssertEqual(WeightStats.range(for: .kg).max, 500)
    }

    func testValidate() {
        XCTAssertEqual(WeightStats.validate("", unit: .lbs), .invalidNumber)
        XCTAssertEqual(WeightStats.validate("0", unit: .lbs), .invalidNumber)
        XCTAssertEqual(WeightStats.validate("49", unit: .lbs), .outOfRange(min: 50, max: 1000))
        XCTAssertEqual(WeightStats.validate("1001", unit: .lbs), .outOfRange(min: 50, max: 1000))
        XCTAssertEqual(WeightStats.validate("175.5", unit: .lbs), .valid(175.5))
        XCTAssertEqual(WeightStats.validate("19", unit: .kg), .outOfRange(min: 20, max: 500))
        XCTAssertEqual(WeightStats.validate("70", unit: .kg), .valid(70))
    }

    func testSaveDisabled() {
        // Empty / unparseable → disabled.
        XCTAssertTrue(WeightStats.isSaveDisabled(input: "", existing: nil, unit: .lbs))
        XCTAssertTrue(WeightStats.isSaveDisabled(input: "abc", existing: nil, unit: .lbs))
        // Changed value → enabled.
        XCTAssertFalse(WeightStats.isSaveDisabled(input: "180", existing: nil, unit: .lbs))
        // Unchanged from existing entry's display value → disabled.
        let e = entry("2026-07-13", 175.5)
        XCTAssertTrue(WeightStats.isSaveDisabled(input: "175.5", existing: e, unit: .lbs))
        XCTAssertFalse(WeightStats.isSaveDisabled(input: "176", existing: e, unit: .lbs))
    }

    // MARK: - Chart series

    func testChartSeriesNeedsTwoEntries() {
        XCTAssertNil(WeightStats.chartSeries(entries: [], unit: .lbs, range: .all))
        XCTAssertNil(WeightStats.chartSeries(entries: [entry("2026-07-13", 175)], unit: .lbs, range: .all))
    }

    func testChartSeriesAllRangeAndNetChange() {
        let entries = [
            entry("2026-07-10", 180),
            entry("2026-07-13", 175),   // intentionally out of order
            entry("2026-07-01", 185),
        ]
        let series = WeightStats.chartSeries(entries: entries, unit: .lbs, range: .all)
        XCTAssertNotNil(series)
        XCTAssertEqual(series?.points.map(\.date), ["2026-07-01", "2026-07-10", "2026-07-13"])
        XCTAssertEqual(series?.startWeight, 185)
        XCTAssertEqual(series?.endWeight, 175)
        XCTAssertEqual(series?.netChange, -10)
    }

    func testChartSeriesRangeFilterFallsBackToLastTwo() {
        // Only one entry within 1W of today → fall back to the last 2 sorted entries.
        let today = "2026-07-13"
        let entries = [
            entry("2026-01-01", 200),
            entry("2026-07-12", 176),
        ]
        let series = WeightStats.chartSeries(entries: entries, unit: .lbs, range: .oneWeek, today: today)
        XCTAssertEqual(series?.points.count, 2)
        XCTAssertEqual(series?.points.map(\.date), ["2026-01-01", "2026-07-12"])
    }

    // MARK: - Insights

    func testInsightsNoGoal() {
        XCTAssertEqual(
            WeightStats.insights(entries: [entry("2026-07-13", 175)], unit: .lbs, goal: nil),
            .noGoal
        )
    }

    func testInsightsInsufficient() {
        let today = "2026-07-13"
        // Only one entry in the window → insufficient.
        XCTAssertEqual(
            WeightStats.insights(entries: [entry("2026-07-13", 175)], unit: .lbs, goal: .lose1, today: today),
            .insufficient
        )
        // Two entries on the same day → daySpan 0 → insufficient.
        XCTAssertEqual(
            WeightStats.insights(
                entries: [entry("2026-07-13", 175), entry("2026-07-13", 176)],
                unit: .lbs, goal: .lose1, today: today
            ),
            .insufficient
        )
    }

    func testInsightsOnTrack() {
        // 7-day span, −1 lb/wk goal, actual −1 lb over 7 days → weeklyRate −1, on track.
        let today = "2026-07-13"
        let entries = [entry("2026-07-06", 176), entry("2026-07-13", 175)]
        let result = WeightStats.insights(entries: entries, unit: .lbs, goal: .lose1, today: today)
        guard case let .ready(totalChange, weeklyRate, status) = result else {
            return XCTFail("expected .ready, got \(result)")
        }
        XCTAssertEqual(totalChange, -1, accuracy: 0.0001)
        XCTAssertEqual(weeklyRate, -1, accuracy: 0.0001)
        XCTAssertEqual(status, .onTrack)
    }

    func testInsightsBehind() {
        // Goal lose 1/wk but actually gained → behind.
        let today = "2026-07-13"
        let entries = [entry("2026-07-06", 175), entry("2026-07-13", 177)]
        let result = WeightStats.insights(entries: entries, unit: .lbs, goal: .lose1, today: today)
        guard case let .ready(_, _, status) = result else {
            return XCTFail("expected .ready, got \(result)")
        }
        XCTAssertEqual(status, .behind)
    }

    func testInsightsAhead() {
        // Goal lose 1/wk but losing much faster (−3/wk) → ahead of target.
        let today = "2026-07-13"
        let entries = [entry("2026-07-06", 178), entry("2026-07-13", 175)]
        let result = WeightStats.insights(entries: entries, unit: .lbs, goal: .lose1, today: today)
        guard case let .ready(_, weeklyRate, status) = result else {
            return XCTFail("expected .ready, got \(result)")
        }
        XCTAssertEqual(weeklyRate, -3, accuracy: 0.0001)
        XCTAssertEqual(status, .ahead)
    }
}
