import XCTest
@testable import HealthTracker

/// Phase 10 parity checks for `HomeStats` — the pure helpers behind the Home dashboard's
/// `ProfileCard` (initials, gamified level label, recap badge) and the scale value for the viewed
/// date. Mirrors `expo/components/profile/ProfileCard.tsx` and the `latestEntryForDate` lookup in
/// `expo/app/(tabs)/home.tsx`.
final class HomeStatsTests: XCTestCase {

    private func entry(_ date: String, _ weight: Double, _ unit: WeightUnit = .lbs) -> WeightEntry {
        WeightEntry(id: date, date: date, weight: weight, unit: unit, createdAt: "\(date)T00:00:00.000Z")
    }

    // MARK: - Initials

    func testInitialsTwoNames() {
        XCTAssertEqual(HomeStats.initials(from: "Ada Lovelace"), "AL")
    }

    func testInitialsSingleName() {
        XCTAssertEqual(HomeStats.initials(from: "Ada"), "A")
    }

    func testInitialsThreeNamesUsesFirstAndLast() {
        XCTAssertEqual(HomeStats.initials(from: "John Fitzgerald Kennedy"), "JK")
    }

    func testInitialsCollapsesExtraWhitespace() {
        XCTAssertEqual(HomeStats.initials(from: "  ada   lovelace  "), "AL")
    }

    func testInitialsEmptyAndNil() {
        XCTAssertNil(HomeStats.initials(from: nil))
        XCTAssertNil(HomeStats.initials(from: ""))
        XCTAssertNil(HomeStats.initials(from: "   "))
    }

    // MARK: - Level label

    func testLevelLabelNoPrestige() {
        // 500 XP → Level 4 · Dedicated (thresholds [0,100,250,500,…]).
        XCTAssertEqual(HomeStats.levelLabel(prestige: 0, totalXp: 500), "⭐ Level 4 · Dedicated")
    }

    func testLevelLabelWithPrestige() {
        XCTAssertEqual(HomeStats.levelLabel(prestige: 2, totalXp: 0), "⭐ P2 · Level 1 · Novice")
    }

    // MARK: - Latest entry on or before date

    func testLatestEntryOnOrBeforePicksNewestWithinWindow() {
        let entries = [entry("2026-07-10", 180), entry("2026-07-12", 179), entry("2026-07-14", 178)]
        XCTAssertEqual(HomeStats.latestEntry(onOrBefore: "2026-07-13", in: entries)?.date, "2026-07-12")
        XCTAssertEqual(HomeStats.latestEntry(onOrBefore: "2026-07-14", in: entries)?.date, "2026-07-14")
    }

    func testLatestEntryOnOrBeforeNoneQualify() {
        let entries = [entry("2026-07-12", 179)]
        XCTAssertNil(HomeStats.latestEntry(onOrBefore: "2026-07-01", in: entries))
    }

    // MARK: - Recap badge

    func testRecapBadgeShownWhenWeekNotYetSeen() {
        let today = "2026-07-14" // some ISO week
        let week = Dates.getISOWeekString(today)
        XCTAssertTrue(HomeStats.showRecapBadge(lastRecapShownWeek: nil, today: today))
        XCTAssertTrue(HomeStats.showRecapBadge(lastRecapShownWeek: "2020-W01", today: today))
        XCTAssertFalse(HomeStats.showRecapBadge(lastRecapShownWeek: week, today: today))
    }
}
