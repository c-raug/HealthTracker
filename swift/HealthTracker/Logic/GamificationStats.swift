import Foundation

/// Pure, testable core of the Phase-12 gamification watcher — the derived day metrics and the
/// XP-grant / achievement-unlock decisions that `expo/components/GamificationWatcher.tsx` makes
/// inside its reactive effects. Kept out of the view so the reconcile rules can be unit-tested for
/// parity (see `GamificationStatsTests`). `GamificationWatcher` feeds these back into `AppStore`.
enum GamificationStats {

    // MARK: - Aggregate metrics

    /// Every food logged across every day (RN `nutritionLog.reduce(... foods.length)`).
    static func totalFoodsLogged(_ nutritionLog: [DayNutrition]) -> Int {
        nutritionLog.reduce(0) { $0 + Streaks.totalFoods($1.meals) }
    }

    /// Longest streak across all four streak types — the threshold the streak achievements + the
    /// one-time streak XP bonuses check against (RN `Math.max(food, weight, activity, calorieGoal)`).
    static func longestStreak(
        nutritionLog: [DayNutrition],
        entries: [WeightEntry],
        activityLog: [DayActivity],
        calorieTarget: Int
    ) -> Int {
        max(
            Streaks.food(nutritionLog).longest,
            Streaks.weight(entries).longest,
            Streaks.activity(activityLog).longest,
            Streaks.calorieGoal(nutritionLog, calorieTarget: calorieTarget > 0 ? calorieTarget : nil).longest
        )
    }

    // MARK: - XP reconcile

    /// One pending XP grant the watcher should dispatch. `.food` carries the delta to add (already
    /// `earned − logged`); the boolean/streak cases carry no amount (the store uses the fixed
    /// `XP.*` constant).
    enum Grant: Equatable {
        case food(Int)
        case calorieGoal
        case waterGoal
        case weight
        case activity
        case streak7
        case streak30
    }

    /// Inputs derived from state for the currently-*today* reconcile.
    struct DayInputs: Equatable {
        var foodCount: Int
        var todayCalories: Double
        var calorieTarget: Int      // baseTdee + today's burn (mode-aware)
        var todayWater: Double
        var waterGoal: Int
        var hasWeightToday: Bool
        var hasActivityToday: Bool
        var longestStreak: Int
    }

    /// The XP grants due right now given the day's ledger + inputs, mirroring the five per-day
    /// effects + the streak-bonus effect in `GamificationWatcher`. Boolean sources no-op once their
    /// ledger flag is set; food grants only the uncredited delta; streak bonuses fire once (gated by
    /// the synthetic `xp_streak_*` ids in `unlockedAchievements`).
    static func pendingGrants(
        dayLog: XpDayLog,
        unlockedAchievements: [String],
        inputs: DayInputs
    ) -> [Grant] {
        var grants: [Grant] = []

        // Food — grant the difference between earned (capped 25) and already-logged.
        let earned = min(inputs.foodCount * XP.food, XP.foodCap)
        let toGrant = earned - dayLog.food
        if toGrant > 0 { grants.append(.food(toGrant)) }

        // Calorie goal — within ±10% of a positive target.
        if inputs.calorieTarget > 0, !dayLog.calorieGoal {
            let target = Double(inputs.calorieTarget)
            if inputs.todayCalories > 0 && abs(inputs.todayCalories - target) <= target * 0.1 {
                grants.append(.calorieGoal)
            }
        }

        // Water goal — met a positive goal.
        if inputs.waterGoal > 0, !dayLog.waterGoal, inputs.todayWater >= Double(inputs.waterGoal) {
            grants.append(.waterGoal)
        }

        // Weight — an entry exists for today.
        if !dayLog.weight, inputs.hasWeightToday { grants.append(.weight) }

        // Activity — at least one activity today.
        if !dayLog.activity, inputs.hasActivityToday { grants.append(.activity) }

        // One-time streak bonuses (gated by the synthetic guard ids).
        let unlocked = Set(unlockedAchievements)
        if inputs.longestStreak >= 7, !unlocked.contains("xp_streak_7") { grants.append(.streak7) }
        if inputs.longestStreak >= 30, !unlocked.contains("xp_streak_30") { grants.append(.streak30) }

        return grants
    }

    /// True when a rise in total XP crossed a level boundary (RN level-up toast check).
    static func didLevelUp(from oldXp: Int, to newXp: Int) -> Bool {
        newXp > oldXp && XP.level(forXp: newXp) > XP.level(forXp: oldXp)
    }
}
