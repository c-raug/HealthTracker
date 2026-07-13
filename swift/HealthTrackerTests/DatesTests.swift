import XCTest
@testable import HealthTracker

/// Parity checks for `Logic/Dates.swift` against `expo/utils/dateUtils.ts`.
final class DatesTests: XCTestCase {

    func testAddDaysCrossesMonthAndYearBoundaries() {
        XCTAssertEqual(Dates.addDays("2026-02-28", 1), "2026-03-01") // 2026 is not a leap year
        XCTAssertEqual(Dates.addDays("2026-03-01", -1), "2026-02-28")
        XCTAssertEqual(Dates.addDays("2026-12-31", 1), "2027-01-01")
        XCTAssertEqual(Dates.addDays("2026-07-13", 0), "2026-07-13")
        XCTAssertEqual(Dates.addDays("2024-02-28", 1), "2024-02-29") // 2024 leap year
    }

    func testGetTodayIsWellFormedAndSelfConsistent() {
        let today = Dates.getToday()
        XCTAssertEqual(today.count, 10)
        XCTAssertEqual(Dates.addDays(today, 0), today)
        // Round-trip: +1 then −1 lands back on today.
        XCTAssertEqual(Dates.addDays(Dates.addDays(today, 1), -1), today)
    }

    func testFormatDisplayDate() {
        // Feb 27, 2026 is a Friday.
        XCTAssertEqual(Dates.formatDisplayDate("2026-02-27"), "Friday, February 27, 2026")
    }

    func testFormatShortDate() {
        XCTAssertEqual(Dates.formatShortDate("2026-02-27"), "Feb 27")
        XCTAssertEqual(Dates.formatShortDate("2026-12-05"), "Dec 5")
    }

    func testGetISOWeekString() {
        XCTAssertEqual(Dates.getISOWeekString("2026-01-01"), "2026-W1")   // Thursday → week 1
        XCTAssertEqual(Dates.getISOWeekString("2026-01-05"), "2026-W2")   // Monday of week 2
        XCTAssertEqual(Dates.getISOWeekString("2026-07-13"), "2026-W29")
        XCTAssertEqual(Dates.getISOWeekString("2026-12-31"), "2026-W53")  // 2026 is a 53-week ISO year
    }

    func testGetISOWeekMonday() {
        // 2026-07-13 is itself a Monday; a mid-week date maps back to it.
        XCTAssertEqual(Dates.getISOWeekMonday("2026-07-13"), "2026-07-13")
        XCTAssertEqual(Dates.getISOWeekMonday("2026-07-15"), "2026-07-13") // Wednesday → same Monday
        XCTAssertEqual(Dates.getISOWeekMonday("2026-07-19"), "2026-07-13") // Sunday → same Monday
    }

    func testJsDayOfWeek() {
        // JS getDay(): Sunday=0 … Saturday=6. Used by the shell's Monday auto-recap check.
        XCTAssertEqual(Dates.jsDayOfWeek("2026-07-12"), 0) // Sunday
        XCTAssertEqual(Dates.jsDayOfWeek("2026-07-13"), 1) // Monday
        XCTAssertEqual(Dates.jsDayOfWeek("2026-07-17"), 5) // Friday
        XCTAssertEqual(Dates.jsDayOfWeek("2026-07-18"), 6) // Saturday
    }
}
