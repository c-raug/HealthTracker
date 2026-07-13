import Foundation

/// A single weight measurement. 1:1 with `WeightEntry` in `expo/types/index.ts`.
/// `date` is a local-tz `"YYYY-MM-DD"` string; `createdAt` is an ISO timestamp string.
struct WeightEntry: Codable, Identifiable, Hashable {
    var id: String
    var date: String
    var weight: Double
    var unit: WeightUnit
    var createdAt: String
}
