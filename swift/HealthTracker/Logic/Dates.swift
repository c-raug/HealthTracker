import Foundation

/// Verbatim port of `expo/utils/dateUtils.ts`.
///
/// All day keys are **local-timezone** `"YYYY-MM-DD"` strings compared lexicographically —
/// never UTC/ISO. Reproduces the Expo app's behavior with a fixed Gregorian calendar in the
/// device's current time zone (mirrors `new Date(year, month-1, day)` = local midnight and
/// `now.getFullYear()/getMonth()/getDate()` = local components).
enum Dates {

    /// Gregorian calendar pinned to the device's current time zone, matching JS `Date` locals.
    private static var calendar: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = .current
        return c
    }

    /// `"YYYY-MM-DD"` key formatter (stable, locale-independent).
    private static let keyFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    /// Long human-readable formatter, e.g. "Monday, February 27, 2026" (mirrors `toLocaleDateString('en-US', …)`).
    private static let displayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US")
        f.timeZone = .current
        f.dateFormat = "EEEE, MMMM d, yyyy"
        return f
    }()

    /// Short label formatter, e.g. "Feb 27".
    private static let shortFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US")
        f.timeZone = .current
        f.dateFormat = "MMM d"
        return f
    }()

    /// Parse a `"YYYY-MM-DD"` string into local midnight (like `new Date(y, m-1, d)`).
    /// Returns `nil` only for malformed input; callers pass well-formed keys.
    private static func date(from dateStr: String) -> Date? {
        let parts = dateStr.split(separator: "-").map { Int($0) }
        guard parts.count == 3, let y = parts[0], let m = parts[1], let d = parts[2] else { return nil }
        var comps = DateComponents()
        comps.year = y
        comps.month = m
        comps.day = d
        return calendar.date(from: comps)
    }

    /// Today's date as `"YYYY-MM-DD"` in the device's local time zone.
    static func getToday() -> String {
        keyFormatter.string(from: Date())
    }

    /// Long human-readable string, e.g. "Monday, February 27, 2026".
    static func formatDisplayDate(_ dateStr: String) -> String {
        guard let d = date(from: dateStr) else { return dateStr }
        return displayFormatter.string(from: d)
    }

    /// Short label, e.g. "Feb 27". Used for chart x-axis.
    static func formatShortDate(_ dateStr: String) -> String {
        guard let d = date(from: dateStr) else { return dateStr }
        return shortFormatter.string(from: d)
    }

    /// ISO week string, e.g. "2026-W15" — **un-padded** week number.
    /// ISO week 1 is the week containing the first Thursday of the year. Mirrors the JS
    /// implementation: shift to the nearest Thursday, then `ceil((dayOfYear)/7)`.
    static func getISOWeekString(_ dateStr: String) -> String {
        guard let d = date(from: dateStr) else { return dateStr }
        // JS `getDay()`: Sunday=0…Saturday=6; `|| 7` maps Sunday→7 (Mon=1…Sun=7).
        let isoDow = jsIsoDayOfWeek(d)
        let thursday = calendar.date(byAdding: .day, value: 4 - isoDow, to: d)!
        let thursdayYear = calendar.component(.year, from: thursday)
        var startComps = DateComponents()
        startComps.year = thursdayYear
        startComps.month = 1
        startComps.day = 1
        let yearStart = calendar.date(from: startComps)!
        let dayDiff = calendar.dateComponents([.day], from: yearStart, to: thursday).day ?? 0
        // Match JS `Math.ceil((dayDiff + 1) / 7)`.
        let weekNum = Int(ceil((Double(dayDiff) + 1) / 7.0))
        return "\(thursdayYear)-W\(weekNum)"
    }

    /// Monday (`"YYYY-MM-DD"`) of the ISO week containing `dateStr`.
    static func getISOWeekMonday(_ dateStr: String) -> String {
        guard let d = date(from: dateStr) else { return dateStr }
        let isoDow = jsIsoDayOfWeek(d)
        let monday = calendar.date(byAdding: .day, value: -(isoDow - 1), to: d)!
        return keyFormatter.string(from: monday)
    }

    /// Adds (or subtracts) `days` from `"YYYY-MM-DD"`, returning the new `"YYYY-MM-DD"`.
    static func addDays(_ dateStr: String, _ days: Int) -> String {
        guard let d = date(from: dateStr) else { return dateStr }
        let shifted = calendar.date(byAdding: .day, value: days, to: d)!
        return keyFormatter.string(from: shifted)
    }

    /// ISO day-of-week (Mon=1…Sun=7), matching JS `date.getDay() || 7`.
    private static func jsIsoDayOfWeek(_ d: Date) -> Int {
        // Swift weekday: Sunday=1…Saturday=7. JS getDay: Sunday=0…Saturday=6.
        let swiftWeekday = calendar.component(.weekday, from: d) // 1…7, Sun=1
        let jsGetDay = swiftWeekday - 1                          // 0…6, Sun=0
        return jsGetDay == 0 ? 7 : jsGetDay
    }
}
