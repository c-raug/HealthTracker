import Foundation

/// Verbatim port of `expo/utils/achievementCalculation.ts` — the 8 visible achievements and the
/// newly-unlocked check. `icon` keeps the original Ionicons glyph name; a later UI phase maps it
/// to an SF Symbol.
enum Achievements {

    enum Category: String, Equatable {
        case streak
        case foods
    }

    struct Achievement: Identifiable, Equatable {
        let id: String
        let category: Category
        let threshold: Int
        let icon: String   // Ionicons glyph name (from the Expo app)
        let label: String
        let emoji: String
    }

    static let all: [Achievement] = [
        // Streak milestones
        Achievement(id: "streak_7", category: .streak, threshold: 7, icon: "flame-outline", label: "7-Day Streak", emoji: "🔥"),
        Achievement(id: "streak_30", category: .streak, threshold: 30, icon: "flame-outline", label: "30-Day Streak", emoji: "⚡"),
        Achievement(id: "streak_100", category: .streak, threshold: 100, icon: "medal-outline", label: "100-Day Streak", emoji: "🏅"),
        Achievement(id: "streak_365", category: .streak, threshold: 365, icon: "trophy-outline", label: "365-Day Streak", emoji: "🏆"),
        // Food-logged milestones
        Achievement(id: "foods_10", category: .foods, threshold: 10, icon: "restaurant-outline", label: "10 Foods Logged", emoji: "🍎"),
        Achievement(id: "foods_50", category: .foods, threshold: 50, icon: "restaurant-outline", label: "50 Foods Logged", emoji: "🥗"),
        Achievement(id: "foods_100", category: .foods, threshold: 100, icon: "restaurant-outline", label: "100 Foods Logged", emoji: "🍽️"),
        Achievement(id: "foods_500", category: .foods, threshold: 500, icon: "star-outline", label: "500 Foods Logged", emoji: "⭐"),
    ]

    /// Achievement IDs whose threshold is now met but which are not yet in `unlockedIds`.
    static func checkNew(unlockedIds: [String], longestStreak: Int, totalFoodsLogged: Int) -> [String] {
        let unlocked = Set(unlockedIds)
        return all.filter { a in
            if unlocked.contains(a.id) { return false }
            switch a.category {
            case .streak: return longestStreak >= a.threshold
            case .foods: return totalFoodsLogged >= a.threshold
            }
        }.map(\.id)
    }
}
