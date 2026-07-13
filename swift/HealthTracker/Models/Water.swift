import Foundation

/// A single water log entry. 1:1 with `WaterEntry` in `expo/types/index.ts`.
/// `amount` unit is implicit from `preferences.unit` (oz when lbs, mL when kg).
struct WaterEntry: Codable, Identifiable, Hashable {
    var id: String
    var amount: Double
    var loggedAt: String?
}

/// One day's water log. 1:1 with `DayWater`.
struct DayWater: Codable, Identifiable, Hashable {
    var id: String { date }
    var date: String
    var entries: [WaterEntry]

    init(date: String, entries: [WaterEntry] = []) {
        self.date = date
        self.entries = entries
    }
}
