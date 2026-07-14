import Foundation

/// Pure, testable helpers for the Home dashboard. The Home screen (`expo/app/(tabs)/home.tsx`) mostly
/// reuses numbers already computed by `NutritionStats` / `WaterStats` / `ActivityStats`; the only
/// Home-specific bits are the `ProfileCard` label helpers and the "weight shown on the scale for the
/// viewed date" lookup. Kept out of the view for parity tests (see `HomeStatsTests`).
enum HomeStats {

    /// Avatar initials from a display name. Ports `ProfileCard.getInitials`:
    /// trim → split on whitespace → two-or-more parts give first+last initials, one part gives the
    /// first initial, empty/absent gives `nil`. Always uppercased.
    static func initials(from name: String?) -> String? {
        guard let name else { return nil }
        let parts = name.split(whereSeparator: { $0.isWhitespace })
        guard let first = parts.first, let firstChar = first.first else { return nil }
        if parts.count >= 2, let lastChar = parts[parts.count - 1].first {
            return "\(firstChar)\(lastChar)".uppercased()
        }
        return String(firstChar).uppercased()
    }

    /// The ProfileCard level label. Ports the RN expression
    /// `prestige > 0 ? "⭐ P{prestige} · {getLevelLabel}" : "⭐ {getLevelLabel}"`, where the inner
    /// label is `XP.levelLabel(forXp:)` (e.g. "Level 4 · Dedicated").
    static func levelLabel(prestige: Int, totalXp: Int) -> String {
        let base = XP.levelLabel(forXp: totalXp)
        return prestige > 0 ? "⭐ P\(prestige) · \(base)" : "⭐ \(base)"
    }

    /// The newest weight entry dated on or before `date` — the value the Home scale shows for the
    /// currently viewed day. Ports `sortedEntries.find(e => e.date <= selectedDate)` over the
    /// date-descending list (returns the max-date entry within the window). `nil` when none qualify.
    static func latestEntry(onOrBefore date: String, in entries: [WeightEntry]) -> WeightEntry? {
        entries.filter { $0.date <= date }.max { $0.date < $1.date }
    }

    /// Whether the ProfileCard shows its red recap dot: true when this ISO week's recap hasn't been
    /// shown yet (`lastRecapShownWeek !== getISOWeekString(getToday())`).
    static func showRecapBadge(lastRecapShownWeek: String?, today: String = Dates.getToday()) -> Bool {
        lastRecapShownWeek != Dates.getISOWeekString(today)
    }
}
