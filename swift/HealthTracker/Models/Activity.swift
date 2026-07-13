import Foundation

/// A single logged activity. 1:1 with `ActivityEntry` in `expo/types/index.ts`.
struct ActivityEntry: Codable, Identifiable, Hashable {
    var id: String
    var type: ActivityEntryType
    var exerciseType: ExerciseType?
    var durationMinutes: Int?
    var steps: Int?
    var caloriesBurned: Int
    var loggedWithMode: ActivityMode?
    var warningDismissed: Bool?
}

/// One day's activity log. 1:1 with `DayActivity`.
struct DayActivity: Codable, Identifiable, Hashable {
    var id: String { date }
    var date: String
    var activities: [ActivityEntry]

    init(date: String, activities: [ActivityEntry] = []) {
        self.date = date
        self.activities = activities
    }
}
