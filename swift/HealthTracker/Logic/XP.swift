import Foundation

/// Verbatim port of `expo/utils/xpCalculation.ts` — XP amounts, the 10-level ladder, and helpers.
enum XP {

    // XP amounts per action.
    static let food = 5           // per food entry, capped at 25/day
    static let foodCap = 25       // daily food XP cap
    static let calorieGoal = 20   // hit daily calorie goal ±10%
    static let waterGoal = 15     // hit daily water goal
    static let weight = 10        // log weight
    static let activity = 10      // log any activity
    static let streak7 = 50       // 7-day streak bonus
    static let streak30 = 200     // 30-day streak bonus

    /// Cumulative XP needed to reach each level (index = level − 1).
    static let levelThresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000]

    static let levelNames = [
        "Novice", "Apprentice", "Journeyman", "Dedicated", "Committed",
        "Veteran", "Elite", "Expert", "Master", "Legend",
    ]

    static let maxLevel = 10

    /// Level (1…10) for a given total XP.
    static func level(forXp totalXp: Int) -> Int {
        var level = 1
        for i in 1..<levelThresholds.count {
            if totalXp >= levelThresholds[i] {
                level = i + 1
            } else {
                break
            }
        }
        return level
    }

    /// Level name (without number), e.g. "Dedicated".
    static func levelName(forXp totalXp: Int) -> String {
        levelNames[level(forXp: totalXp) - 1]
    }

    /// Level label with number, e.g. "Level 4 · Dedicated".
    static func levelLabel(forXp totalXp: Int) -> String {
        let lvl = level(forXp: totalXp)
        return "Level \(lvl) · \(levelNames[lvl - 1])"
    }

    struct Progress: Equatable {
        var level: Int
        var name: String
        var currentLevelXp: Int
        var nextLevelXp: Int
        var isMax: Bool
    }

    /// XP progress toward the next level. At max level, `nextLevelXp` clamps to the level-10 threshold.
    static func progress(forXp totalXp: Int) -> Progress {
        let lvl = level(forXp: totalXp)
        let isMax = lvl == maxLevel
        let currentLevelXp = levelThresholds[lvl - 1]
        let nextLevelXp = isMax ? levelThresholds[maxLevel - 1] : levelThresholds[lvl]
        return Progress(
            level: lvl,
            name: levelNames[lvl - 1],
            currentLevelXp: currentLevelXp,
            nextLevelXp: nextLevelXp,
            isMax: isMax
        )
    }
}
