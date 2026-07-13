import Foundation

/// Pure, testable core of the Activities tab (Phase 9). Ports the non-UI logic inlined in
/// `expo/app/(tabs)/activities.tsx` — the per-day burn totals, the 7-day activity series, the
/// exercise/steps calorie previews, the smartwatch save-disabled rule, the duration/label/detail
/// formatting, and the "logged under a different mode" warning check. The calorie formulas
/// themselves already live in `ActivityCalories`; this layer is what the screen computes around them.
///
/// Kept UI-free so `ActivityStatsTests` can assert parity against the Expo screen without SwiftUI.
enum ActivityStats {

    // MARK: - JS integer parity

    /// Lenient leading-integer parse matching JS `parseInt(str, 10)` (e.g. `"1234"` → 1234,
    /// `"12abc"` → 12, `"  -5"` → -5, `""`/`"abc"` → nil). The numeric keyboards constrain input;
    /// this mirrors the exact `isNaN(parseInt(...))` gates the RN screen uses.
    static func jsParseInt(_ str: String) -> Int? {
        var s = Substring(str.trimmingCharacters(in: .whitespaces))
        var out = ""
        if let f = s.first, f == "+" || f == "-" { out.append(f); s = s.dropFirst() }
        var seenDigit = false
        for ch in s {
            if ch.isNumber { out.append(ch); seenDigit = true } else { break }
        }
        guard seenDigit else { return nil }
        return Int(out)
    }

    // MARK: - Per-day burn

    /// Total calories burned across every activity for a day, regardless of mode (RN
    /// `dayActivity.activities.reduce((s, a) => s + a.caloriesBurned, 0)`). Drives the flame + the
    /// weekly graph — distinct from `NutritionStats.caloriesBurned`, which is mode-filtered for the
    /// calorie target.
    static func totalBurned(_ day: DayActivity?) -> Int {
        day?.activities.reduce(0) { $0 + $1.caloriesBurned } ?? 0
    }

    /// 7-day activity series ending on (and including) `selectedDate`, oldest → newest: each bar's
    /// `consumed` is that day's total burn and `goal` is 0 (RN `weeklyActivityData`). Reuses
    /// `NutritionStats.DayPoint` so the shared `WeeklyBarChart` renders it.
    static func weeklyActivitySeries(activityLog: [DayActivity], selectedDate: String) -> [NutritionStats.DayPoint] {
        NutritionStats.last7Days(endingOn: selectedDate).map { date in
            let burned = totalBurned(activityLog.first { $0.date == date })
            return NutritionStats.DayPoint(date: date, consumed: Double(burned), goal: 0)
        }
    }

    // MARK: - Previews

    /// Exercise-calorie preview for the duration wheels: 0 unless there is a weight entry and a
    /// non-zero duration (RN `exercisePreviewCals`).
    static func exercisePreview(durationMinutes: Int, latestWeight: WeightEntry?) -> Int {
        guard let w = latestWeight, durationMinutes > 0 else { return 0 }
        return ActivityCalories.exercise(durationMinutes: Double(durationMinutes), weightValue: w.weight, weightUnit: w.unit)
    }

    /// Steps-calorie preview for the steps field: 0 unless there is a weight entry and a parsed,
    /// positive step count (RN `stepsPreviewCals`).
    static func stepsPreview(stepsInput: String, latestWeight: WeightEntry?) -> Int {
        guard let w = latestWeight, let steps = jsParseInt(stepsInput), steps > 0 else { return 0 }
        return ActivityCalories.steps(Double(steps), weightValue: w.weight, weightUnit: w.unit)
    }

    // MARK: - Smartwatch save rule

    /// The existing smartwatch entry for a day, if any (one per day — RN pre-fills the field from it).
    static func smartwatchEntry(_ day: DayActivity?) -> ActivityEntry? {
        day?.activities.first { $0.type == .smartwatch }
    }

    /// Whether the smartwatch **Save** button is disabled: empty, unparseable, or unchanged from the
    /// existing entry (RN `smartwatchSaveDisabled`). `existingCalories` is the saved smartwatch value.
    static func smartwatchSaveDisabled(input: String, existingCalories: Int?) -> Bool {
        if input.isEmpty { return true }
        guard let parsed = jsParseInt(input) else { return true }
        if let existing = existingCalories, String(parsed) == String(existing) { return true }
        return false
    }

    // MARK: - Formatting

    /// `"1h 30m"` / `"2h"` / `"45m"` (RN `formatDuration`).
    static func formatDuration(_ minutes: Int) -> String {
        let h = minutes / 60
        let m = minutes % 60
        if h > 0 && m > 0 { return "\(h)h \(m)m" }
        if h > 0 { return "\(h)h" }
        return "\(m)m"
    }

    /// Row title for an activity (RN `getActivityLabel`).
    static func label(for activity: ActivityEntry) -> String {
        switch activity.type {
        case .exercise:  return activity.exerciseType == .weightLifting ? "Weight Lifting" : "Exercise"
        case .steps:     return "Steps"
        case .smartwatch: return "Smart Watch"
        }
    }

    /// Row subtitle for an activity (RN `getActivityDetail`).
    static func detail(for activity: ActivityEntry) -> String {
        if activity.type == .exercise, let mins = activity.durationMinutes {
            return formatDuration(mins)
        }
        if activity.type == .steps, let steps = activity.steps {
            return "\(groupedNumber(steps)) steps"
        }
        return "Calories from wearable"
    }

    /// Human label for an activity mode (RN `MODE_LABELS`).
    static func modeLabel(_ mode: ActivityMode) -> String {
        switch mode {
        case .auto:       return "Auto"
        case .manual:     return "Manual"
        case .smartwatch: return "Smart Watch"
        }
    }

    /// Whether to show the "logged under a different mode — data may no longer be accurate" warning
    /// for a row (RN: `loggedWithMode` set, differs from the current mode, not dismissed).
    static func showWarning(for activity: ActivityEntry, mode: ActivityMode) -> Bool {
        guard let logged = activity.loggedWithMode else { return false }
        return logged != mode && !(activity.warningDismissed ?? false)
    }

    /// Thousands-grouped integer string (RN `Number.toLocaleString()`), used for the flame count and
    /// the steps detail.
    static func groupedNumber(_ value: Int) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.locale = Locale(identifier: "en_US")
        return f.string(from: NSNumber(value: value)) ?? "\(value)"
    }
}
