import Foundation

/// Pure, testable core of the water widgets — the goal resolution, entry grouping, weekly series,
/// bottle-fill math, and the input-parsing rules that the RN `WaterBottleVisual` / `WaterTracker`
/// components and `expo/app/(tabs)/nutrition.tsx` compute inline. Kept out of the views so the numbers
/// can be unit-tested for parity against the Expo app (see `WaterStatsTests`).
///
/// Nothing here touches SwiftUI; the views (`WaterBottleVisual`, `WaterTrackerView`) read these values
/// and render them. Amounts are in the user's current unit (oz when `.lbs`, mL when `.kg`).
enum WaterStats {

    // MARK: - Presets & units (mirror `DEFAULT_PRESETS_OZ/ML` in WaterTracker.tsx)

    static let defaultPresetsOz = [8, 16, 32]
    static let defaultPresetsMl = [250, 500, 750]

    static func defaultPresets(unit: WeightUnit) -> [Int] {
        unit == .lbs ? defaultPresetsOz : defaultPresetsMl
    }

    /// The effective presets: the stored override, else the unit's defaults (RN `?? defaultPresets`).
    static func presets(preferences: UserPreferences) -> [Int] {
        preferences.waterPresets ?? defaultPresets(unit: preferences.unit)
    }

    static func unitLabel(_ unit: WeightUnit) -> String {
        unit == .lbs ? "oz" : "mL"
    }

    // MARK: - Consumed / goal

    /// Total water logged for a day (sum of entry amounts), 0 when the day is missing.
    static func consumed(_ day: DayWater?) -> Double {
        day?.entries.reduce(0) { $0 + $1.amount } ?? 0
    }

    /// The resolved daily water goal, ported verbatim from the `waterGoalValue` IIFE in
    /// `nutrition.tsx`: a manual override (explicit `.manual`, or legacy override with no mode) wins;
    /// otherwise the auto `WaterGoal.calculate` from the latest weight + activity level; else 0.
    /// On the Nutrition tab `profile` and `latestWeight` are guaranteed non-nil (the pager is gated
    /// behind them), so the auto branch always has its inputs there.
    static func resolveGoal(
        preferences: UserPreferences,
        profile: UserProfile?,
        latestWeight: WeightEntry?
    ) -> Int {
        let mode = preferences.waterGoalMode
        if mode == .manual || (mode == nil && preferences.waterGoalOverride != nil) {
            return jsRoundInt(preferences.waterGoalOverride ?? 0)
        }
        if let latestWeight, let profile {
            return WaterGoal.calculate(
                weightValue: latestWeight.weight,
                weightUnit: latestWeight.unit,
                activityLevel: profile.activityLevel,
                creatine: preferences.waterCreatineAdjustment ?? false
            )
        }
        return 0
    }

    // MARK: - Grouped entries (display-only; underlying state stays individual)

    /// One row in the tracker's entry list: all entries sharing an `amount`, in first-seen order.
    struct Group: Identifiable, Equatable {
        var amount: Double
        var ids: [String]
        var count: Int { ids.count }
        var id: Double { amount }
    }

    /// Group entries by amount, preserving the first-appearance order (RN `reduce`).
    static func grouped(_ entries: [WaterEntry]) -> [Group] {
        var groups: [Group] = []
        for entry in entries {
            if let idx = groups.firstIndex(where: { $0.amount == entry.amount }) {
                groups[idx].ids.append(entry.id)
            } else {
                groups.append(Group(amount: entry.amount, ids: [entry.id]))
            }
        }
        return groups
    }

    /// The id of the most-recently-logged entry in a group — the one "remove one" deletes.
    /// Matches RN: sort the group's ids by `loggedAt` descending (missing → ""), take the first.
    static func mostRecentId(_ group: Group, entries: [WaterEntry]) -> String? {
        group.ids.sorted { a, b in
            let la = entries.first { $0.id == a }?.loggedAt ?? ""
            let lb = entries.first { $0.id == b }?.loggedAt ?? ""
            return la > lb
        }.first
    }

    // MARK: - Weekly series (7-day water graph)

    /// 7-day water series (consumed vs the shared `goal`), oldest → newest — reuses the calorie
    /// graph's `DayPoint` so `WeeklyBarChart` can render it with `.fixed(FixedColors.water)`.
    static func weeklyWaterSeries(
        waterLog: [DayWater],
        selectedDate: String,
        goal: Int
    ) -> [NutritionStats.DayPoint] {
        NutritionStats.last7Days(endingOn: selectedDate).map { date in
            NutritionStats.DayPoint(
                date: date,
                consumed: consumed(waterLog.first { $0.date == date }),
                goal: Double(goal)
            )
        }
    }

    // MARK: - Bottle fill math (port of WaterBottleVisual.tsx)

    /// Raw fraction consumed/goal (can exceed 1); 0 when the goal is non-positive.
    static func rawFraction(consumed: Double, goal: Int) -> Double {
        goal > 0 ? consumed / Double(goal) : 0
    }

    /// Fill fraction clamped to [0, 1] for the bottle height (RN `Math.min(rawPct, 1)`).
    static func fillFraction(consumed: Double, goal: Int) -> Double {
        min(rawFraction(consumed: consumed, goal: goal), 1)
    }

    /// Percentage text shown inside the bottle (RN `Math.round(rawPct * 100)`), un-clamped.
    static func pctDisplay(consumed: Double, goal: Int) -> Int {
        jsRoundInt(rawFraction(consumed: consumed, goal: goal) * 100)
    }

    // MARK: - Input rules

    /// Parse the custom-amount field (RN `parseFloat` → NaN/≤0 rejected → `Math.round`).
    /// Returns the rounded amount to add, or nil to ignore the input.
    static func parseCustomAmount(_ text: String) -> Int? {
        guard let val = WeightStats.jsParseFloat(text), val > 0 else { return nil }
        return jsRoundInt(val)
    }

    /// The new presets array after editing preset `index` to `text` (RN `savePreset`):
    /// blank / non-int / ≤0 resets that slot to the unit default; otherwise stores the int.
    static func savePreset(_ text: String, index: Int, current: [Int], defaults: [Int]) -> [Int] {
        var next = current
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        if let val = Int(trimmed), !trimmed.isEmpty, val > 0 {
            next[index] = val
        } else {
            next[index] = defaults[index]
        }
        return next
    }
}
