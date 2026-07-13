import Foundation

/// Pure, testable helpers behind the Weight tab (Phase 6). Ports the non-UI logic of
/// `expo/app/(tabs)/index.tsx` (save validation), `expo/components/WeightChart.tsx`
/// (time-range series + net change), and `expo/components/WeightInsights.tsx`
/// (7-day weekly-rate + on-track/behind/ahead status). Keeping this UI-free lets the
/// Phase-6 parity tests assert the exact formulas without driving SwiftUI.
enum WeightStats {

    // MARK: - JS number parity (parseFloat / Number→String)

    /// Lenient leading-number parse matching JS `parseFloat` (e.g. `"175."` → 175, `"150abc"` → 150,
    /// `"."` → nil). The decimal-pad keyboard already constrains input; this guards the transient
    /// states (a trailing dot) that plain `Double(_:)` would reject.
    static func jsParseFloat(_ str: String) -> Double? {
        var s = Substring(str.trimmingCharacters(in: .whitespaces))
        var out = ""
        if let f = s.first, f == "+" || f == "-" { out.append(f); s = s.dropFirst() }
        var seenDot = false
        var seenDigit = false
        for ch in s {
            if ch.isNumber { out.append(ch); seenDigit = true }
            else if ch == "." && !seenDot { out.append("."); seenDot = true }
            else { break }
        }
        guard seenDigit else { return nil }
        if out.hasSuffix(".") { out.removeLast() }
        return Double(out)
    }

    /// JS `String(number)` for weight display: no trailing `.0` on whole numbers, minimal decimals
    /// otherwise (values here are already 1-dp-rounded by `Units.convertWeight`). `%g` trims zeros.
    static func jsNumberString(_ value: Double) -> String {
        String(format: "%g", value)
    }

    /// The saved entry's weight in the user's current unit, as the exact string the input pre-fills
    /// with (`String(convertWeight(...))` in RN). Empty when there is no entry for the date.
    static func displayString(for entry: WeightEntry?, unit: WeightUnit) -> String {
        guard let entry else { return "" }
        return jsNumberString(Units.convertWeight(entry.weight, from: entry.unit, to: unit))
    }

    // MARK: - Save validation

    /// Allowed weight range for a unit: 50–1000 lbs, 20–500 kg.
    static func range(for unit: WeightUnit) -> (min: Double, max: Double) {
        unit == .lbs ? (50, 1000) : (20, 500)
    }

    enum Validation: Equatable {
        case valid(Double)
        case invalidNumber
        case outOfRange(min: Double, max: Double)
    }

    /// Validate the raw input string against the unit's range (mirrors `handleSave` in the RN tab).
    static func validate(_ input: String, unit: WeightUnit) -> Validation {
        guard let parsed = jsParseFloat(input), parsed > 0 else { return .invalidNumber }
        let r = range(for: unit)
        if parsed < r.min || parsed > r.max { return .outOfRange(min: r.min, max: r.max) }
        return .valid(parsed)
    }

    /// Whether the Save button is disabled: empty input, unparseable input, or input unchanged from
    /// the existing entry's displayed value (RN `weightSaveDisabled`).
    static func isSaveDisabled(input: String, existing: WeightEntry?, unit: WeightUnit) -> Bool {
        if input.isEmpty { return true }
        if jsParseFloat(input) == nil { return true }
        return input == displayString(for: existing, unit: unit)
    }

    // MARK: - Chart series (WeightChart.tsx)

    enum TimeRange: String, CaseIterable, Identifiable, Hashable {
        case oneWeek = "1W"
        case oneMonth = "1M"
        case threeMonths = "3M"
        case oneYear = "1Y"
        case all = "All"

        var id: String { rawValue }

        /// Look-back window in days; `nil` means "All time".
        var days: Int? {
            switch self {
            case .oneWeek: return 7
            case .oneMonth: return 30
            case .threeMonths: return 90
            case .oneYear: return 365
            case .all: return nil
            }
        }
    }

    struct ChartPoint: Identifiable, Hashable {
        let index: Int      // position on the x-axis (0…n-1)
        let date: String    // "YYYY-MM-DD"
        let value: Double   // weight in the display unit
        var id: Int { index }
    }

    struct ChartSeries: Equatable {
        let points: [ChartPoint]
        let startWeight: Double
        let endWeight: Double
        var netChange: Double { endWeight - startWeight }
    }

    /// Build the trend series for the selected range, or `nil` when there are fewer than 2 total
    /// entries (the "log at least 2 entries" placeholder). Entries are sorted ascending by date;
    /// if the range filters down to <2 points we fall back to the last 2 entries (matches RN).
    static func chartSeries(entries: [WeightEntry],
                            unit: WeightUnit,
                            range: TimeRange,
                            today: String = Dates.getToday()) -> ChartSeries? {
        let sorted = entries.sorted { $0.date < $1.date }
        guard sorted.count >= 2 else { return nil }

        let filtered: [WeightEntry]
        if let days = range.days {
            let cutoff = Dates.addDays(today, -days)
            filtered = sorted.filter { $0.date >= cutoff }
        } else {
            filtered = sorted
        }

        let chartEntries = filtered.count >= 2 ? filtered : Array(sorted.suffix(2))
        let points = chartEntries.enumerated().map { i, e in
            ChartPoint(index: i, date: e.date, value: Units.convertWeight(e.weight, from: e.unit, to: unit))
        }
        return ChartSeries(points: points,
                           startWeight: points.first?.value ?? 0,
                           endWeight: points.last?.value ?? 0)
    }

    // MARK: - Progress insights (WeightInsights.tsx)

    /// Target weekly rate in lbs for each weight goal.
    static func targetRateLbs(_ goal: WeightGoal) -> Double {
        switch goal {
        case .lose2: return -2
        case .lose1_5: return -1.5
        case .lose1: return -1
        case .lose0_5: return -0.5
        case .maintain: return 0
        case .gain0_5: return 0.5
        case .gain1: return 1
        case .gain1_5: return 1.5
        case .gain2: return 2
        }
    }

    enum InsightStatus: Equatable { case onTrack, behind, ahead }

    enum Insights: Equatable {
        case noGoal                 // "Set a weight goal in Settings…"
        case insufficient           // "Log more entries…"
        case ready(totalChange: Double, weeklyRate: Double, status: InsightStatus)
    }

    /// Compute the last-7-days progress insight (weekly rate vs. the profile's goal target).
    /// Verbatim port of the derivation in `WeightInsights.tsx`.
    static func insights(entries: [WeightEntry],
                         unit: WeightUnit,
                         goal: WeightGoal?,
                         today: String = Dates.getToday()) -> Insights {
        guard let goal else { return .noGoal }

        let sevenDaysAgo = Dates.addDays(today, -7)
        let recent = entries
            .filter { $0.date >= sevenDaysAgo && $0.date <= today }
            .sorted { $0.date < $1.date }
        guard recent.count >= 2, let oldest = recent.first, let newest = recent.last else {
            return .insufficient
        }

        let daySpan = Dates.dayDifference(from: oldest.date, to: newest.date)
        guard daySpan >= 1 else { return .insufficient }

        let oldestWeight = Units.convertWeight(oldest.weight, from: oldest.unit, to: unit)
        let newestWeight = Units.convertWeight(newest.weight, from: newest.unit, to: unit)
        let totalChange = newestWeight - oldestWeight
        let weeklyRate = (totalChange / Double(daySpan)) * 7

        let targetRateLbsValue = targetRateLbs(goal)
        let targetRate = unit == .kg ? targetRateLbsValue * 0.453592 : targetRateLbsValue
        let tolerance = unit == .kg ? 0.1 : 0.25
        let diff = weeklyRate - targetRate

        let status: InsightStatus
        if abs(diff) <= tolerance {
            status = .onTrack
        } else if (targetRate < 0 && weeklyRate > targetRate + tolerance)
                    || (targetRate > 0 && weeklyRate < targetRate - tolerance)
                    || (targetRate == 0 && abs(weeklyRate) > tolerance) {
            status = .behind
        } else {
            status = .ahead
        }
        return .ready(totalChange: totalChange, weeklyRate: weeklyRate, status: status)
    }
}
