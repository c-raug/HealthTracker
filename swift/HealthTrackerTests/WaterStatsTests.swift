import XCTest
@testable import HealthTracker

/// Phase 8 parity checks for `WaterStats` — the pure water math behind the bottle, tracker, and 7-day
/// graph. Mirrors `expo/components/nutrition/WaterBottleVisual.tsx`, `WaterTracker.tsx`, and the
/// `waterGoalValue` / `weeklyWaterData` derivations in `expo/app/(tabs)/nutrition.tsx`.
final class WaterStatsTests: XCTestCase {

    private func profile(_ activity: ActivityLevel = .moderatelyActive) -> UserProfile {
        UserProfile(name: "T", age: 30, dob: nil, fitnessGoal: nil, sex: .male,
                    heightValue: 70, heightUnit: .inches, activityLevel: activity, weightGoal: .maintain)
    }

    private func weight(_ w: Double, _ unit: WeightUnit = .lbs) -> WeightEntry {
        WeightEntry(id: "d", date: "2026-07-13", weight: w, unit: unit, createdAt: "2026-07-13T00:00:00.000Z")
    }

    private func entry(_ id: String, _ amount: Double, _ loggedAt: String? = nil) -> WaterEntry {
        WaterEntry(id: id, amount: amount, loggedAt: loggedAt)
    }

    // MARK: - Presets & units

    func testDefaultPresets() {
        XCTAssertEqual(WaterStats.defaultPresets(unit: .lbs), [8, 16, 32])
        XCTAssertEqual(WaterStats.defaultPresets(unit: .kg), [250, 500, 750])
    }

    func testPresetsOverride() {
        var prefs = UserPreferences(unit: .lbs)
        XCTAssertEqual(WaterStats.presets(preferences: prefs), [8, 16, 32])
        prefs.waterPresets = [10, 20, 40]
        XCTAssertEqual(WaterStats.presets(preferences: prefs), [10, 20, 40])
    }

    func testUnitLabel() {
        XCTAssertEqual(WaterStats.unitLabel(.lbs), "oz")
        XCTAssertEqual(WaterStats.unitLabel(.kg), "mL")
    }

    // MARK: - Consumed

    func testConsumed() {
        XCTAssertEqual(WaterStats.consumed(nil), 0)
        let day = DayWater(date: "2026-07-13", entries: [entry("a", 8), entry("b", 16), entry("c", 8)])
        XCTAssertEqual(WaterStats.consumed(day), 32)
    }

    // MARK: - Goal resolution

    func testResolveGoalManual() {
        var prefs = UserPreferences(unit: .lbs)
        prefs.waterGoalMode = .manual
        prefs.waterGoalOverride = 100
        XCTAssertEqual(WaterStats.resolveGoal(preferences: prefs, profile: profile(), latestWeight: weight(180)), 100)
    }

    func testResolveGoalLegacyOverrideNoMode() {
        var prefs = UserPreferences(unit: .lbs)
        prefs.waterGoalOverride = 80  // mode unset → treated as manual
        XCTAssertEqual(WaterStats.resolveGoal(preferences: prefs, profile: profile(), latestWeight: weight(180)), 80)
    }

    func testResolveGoalAuto() {
        var prefs = UserPreferences(unit: .lbs)
        prefs.waterGoalMode = .auto
        // 180 lbs × 0.5, moderatelyActive (not active) → 90
        XCTAssertEqual(WaterStats.resolveGoal(preferences: prefs, profile: profile(), latestWeight: weight(180)), 90)
    }

    func testResolveGoalAutoIgnoresStaleOverride() {
        var prefs = UserPreferences(unit: .lbs)
        prefs.waterGoalMode = .auto
        prefs.waterGoalOverride = 200  // present but mode is auto → ignored
        XCTAssertEqual(WaterStats.resolveGoal(preferences: prefs, profile: profile(.active), latestWeight: weight(180)), 108)
    }

    func testResolveGoalNoInputs() {
        var prefs = UserPreferences(unit: .lbs)
        prefs.waterGoalMode = .auto
        XCTAssertEqual(WaterStats.resolveGoal(preferences: prefs, profile: nil, latestWeight: nil), 0)
    }

    // MARK: - Grouping

    func testGroupedPreservesFirstSeenOrder() {
        let entries = [entry("a", 16), entry("b", 8), entry("c", 16), entry("d", 8), entry("e", 8)]
        let groups = WaterStats.grouped(entries)
        XCTAssertEqual(groups.map { $0.amount }, [16, 8])
        XCTAssertEqual(groups[0].count, 2)
        XCTAssertEqual(groups[0].ids, ["a", "c"])
        XCTAssertEqual(groups[1].count, 3)
        XCTAssertEqual(groups[1].ids, ["b", "d", "e"])
    }

    func testMostRecentIdPicksLatestLoggedAt() {
        let entries = [
            entry("a", 8, "2026-07-13T08:00:00.000Z"),
            entry("b", 8, "2026-07-13T12:00:00.000Z"),
            entry("c", 8, "2026-07-13T10:00:00.000Z"),
        ]
        let group = WaterStats.grouped(entries)[0]
        XCTAssertEqual(WaterStats.mostRecentId(group, entries: entries), "b")
    }

    func testMostRecentIdMissingTimestamps() {
        // Missing loggedAt sorts as "" (oldest); the one with a timestamp wins.
        let entries = [entry("a", 8, nil), entry("b", 8, "2026-07-13T09:00:00.000Z")]
        let group = WaterStats.grouped(entries)[0]
        XCTAssertEqual(WaterStats.mostRecentId(group, entries: entries), "b")
    }

    // MARK: - Weekly series

    func testWeeklyWaterSeries() {
        let log = [
            DayWater(date: "2026-07-13", entries: [entry("a", 8), entry("b", 16)]),
            DayWater(date: "2026-07-11", entries: [entry("c", 32)]),
        ]
        let series = WaterStats.weeklyWaterSeries(waterLog: log, selectedDate: "2026-07-13", goal: 64)
        XCTAssertEqual(series.count, 7)
        XCTAssertEqual(series.first?.date, "2026-07-07")
        XCTAssertEqual(series.last?.date, "2026-07-13")
        XCTAssertEqual(series.last?.consumed, 24)
        XCTAssertEqual(series.first(where: { $0.date == "2026-07-11" })?.consumed, 32)
        XCTAssertEqual(series.first(where: { $0.date == "2026-07-12" })?.consumed, 0)
        XCTAssertTrue(series.allSatisfy { $0.goal == 64 })
    }

    // MARK: - Bottle fill math

    func testFillFractionClamps() {
        XCTAssertEqual(WaterStats.fillFraction(consumed: 32, goal: 64), 0.5, accuracy: 0.0001)
        XCTAssertEqual(WaterStats.fillFraction(consumed: 80, goal: 64), 1, accuracy: 0.0001)  // clamped
        XCTAssertEqual(WaterStats.fillFraction(consumed: 10, goal: 0), 0)  // no goal
    }

    func testPctDisplayUnclamped() {
        XCTAssertEqual(WaterStats.pctDisplay(consumed: 32, goal: 64), 50)
        XCTAssertEqual(WaterStats.pctDisplay(consumed: 80, goal: 64), 125)  // can exceed 100
        XCTAssertEqual(WaterStats.pctDisplay(consumed: 10, goal: 0), 0)
    }

    // MARK: - Input rules

    func testParseCustomAmount() {
        XCTAssertEqual(WaterStats.parseCustomAmount("12"), 12)
        XCTAssertEqual(WaterStats.parseCustomAmount("12.6"), 13)  // Math.round
        XCTAssertNil(WaterStats.parseCustomAmount(""))
        XCTAssertNil(WaterStats.parseCustomAmount("abc"))
        XCTAssertNil(WaterStats.parseCustomAmount("0"))
        XCTAssertNil(WaterStats.parseCustomAmount("-5"))
    }

    func testSavePreset() {
        let defaults = [8, 16, 32]
        XCTAssertEqual(WaterStats.savePreset("20", index: 1, current: [8, 16, 32], defaults: defaults), [8, 20, 32])
        XCTAssertEqual(WaterStats.savePreset("", index: 0, current: [8, 16, 32], defaults: defaults), [8, 16, 32])
        XCTAssertEqual(WaterStats.savePreset("0", index: 2, current: [8, 16, 99], defaults: defaults), [8, 16, 32])
        XCTAssertEqual(WaterStats.savePreset("abc", index: 2, current: [8, 16, 99], defaults: defaults), [8, 16, 32])
    }
}
