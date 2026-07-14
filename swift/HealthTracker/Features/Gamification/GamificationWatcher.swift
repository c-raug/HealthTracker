import SwiftUI

/// Invisible reactive watcher — port of `expo/components/GamificationWatcher.tsx`. It recomputes the
/// day's gamification metrics whenever relevant state changes and:
///   1. unlocks any newly-earned achievements (silently on the first pass, with a toast afterwards),
///   2. grants the due daily / streak XP (capped + guarded via the store's `addXP`),
///   3. shows a level-up toast when total XP crosses a level threshold.
///
/// Renders nothing; mounted once in the shell. Where the RN component splits the work across several
/// `useEffect`s keyed on different deps, this uses one Equatable `Snapshot` + `.onChange` — a single
/// reconcile that converges (a post-grant re-run finds the ledger already satisfied and is a no-op).
struct GamificationWatcher: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toasts

    /// First effective pass unlocks achievements silently (RN `achievementInitializedRef`).
    @State private var initialized = false
    /// Previous total XP, for the level-up crossing check (RN `prevXpRef`). `nil` until the first pass.
    @State private var prevXp: Int?

    var body: some View {
        Color.clear
            .frame(width: 0, height: 0)
            .onAppear { reconcile() }
            .onChange(of: snapshot) { _, _ in reconcile() }
    }

    // MARK: - Snapshot (single `.onChange` trigger)

    /// An Equatable digest of everything the reconcile reads, so any relevant state change fires the
    /// single `.onChange`. Includes `isLoading` (so the load-complete flip triggers the first pass)
    /// and `totalXp` (so a level-up baseline update / prestige reset re-runs).
    private var snapshot: Snapshot {
        Snapshot(
            isLoading: store.isLoading,
            totalXp: store.preferences.totalXp ?? 0,
            unlocked: store.preferences.unlockedAchievements ?? [],
            inputs: inputs
        )
    }

    private struct Snapshot: Equatable {
        var isLoading: Bool
        var totalXp: Int
        var unlocked: [String]
        var inputs: GamificationStats.DayInputs
    }

    // MARK: - Derived inputs (mirrors the computed values in the RN watcher)

    private var inputs: GamificationStats.DayInputs {
        let today = Dates.getToday()
        let prefs = store.preferences
        let profile = prefs.profile
        let latest = NutritionStats.latestWeight(store.entries)
        let mode = prefs.activityMode ?? .auto

        let baseTdee = NutritionStats.baseTdee(profile: profile, latestWeight: latest, activityMode: mode)
        let dayActivity = store.activityLog.first { $0.date == today }
        let todayBurned = NutritionStats.caloriesBurned(dayActivity, mode: mode)
        let calorieTarget = baseTdee + todayBurned

        let todayMeals = store.nutritionLog.first { $0.date == today }?.meals
        let foodCount = todayMeals.map(Streaks.totalFoods) ?? 0
        let todayCalories = todayMeals.map(NutritionStats.consumedCalories) ?? 0

        let waterGoal = WaterStats.resolveGoal(preferences: prefs, profile: profile, latestWeight: latest)
        let todayWater = WaterStats.consumed(store.waterLog.first { $0.date == today })

        return GamificationStats.DayInputs(
            foodCount: foodCount,
            todayCalories: todayCalories,
            calorieTarget: calorieTarget,
            todayWater: todayWater,
            waterGoal: waterGoal,
            hasWeightToday: store.entries.contains { $0.date == today },
            hasActivityToday: dayActivity.map { !$0.activities.isEmpty } ?? false,
            longestStreak: GamificationStats.longestStreak(
                nutritionLog: store.nutritionLog,
                entries: store.entries,
                activityLog: store.activityLog,
                calorieTarget: calorieTarget
            )
        )
    }

    // MARK: - Reconcile

    private func reconcile() {
        guard !store.isLoading else { return }
        let today = Dates.getToday()
        let dayInputs = inputs
        let silent = !initialized

        // 1. Achievements — unlock newly-earned ones (silent on the first pass, toast after).
        let newIds = Achievements.checkNew(
            unlockedIds: store.preferences.unlockedAchievements ?? [],
            longestStreak: dayInputs.longestStreak,
            totalFoodsLogged: GamificationStats.totalFoodsLogged(store.nutritionLog)
        )
        for id in newIds {
            store.unlockAchievement(id: id)
            if !silent, let a = Achievements.all.first(where: { $0.id == id }) {
                toasts.show("Achievement Unlocked: \(a.label)", emoji: a.emoji)
            }
        }

        // 2. XP grants (capture XP before to detect a level-up crossing after).
        let xpBefore = store.preferences.totalXp ?? 0
        let dayLog = (store.preferences.xpLog ?? [:])[today] ?? XpDayLog()
        let grants = GamificationStats.pendingGrants(
            dayLog: dayLog,
            unlockedAchievements: store.preferences.unlockedAchievements ?? [],
            inputs: dayInputs
        )
        for grant in grants {
            switch grant {
            case .food(let amount): store.addXP(amount: amount, date: today, source: .food)
            case .calorieGoal: store.addXP(amount: XP.calorieGoal, date: today, source: .calorieGoal)
            case .waterGoal: store.addXP(amount: XP.waterGoal, date: today, source: .waterGoal)
            case .weight: store.addXP(amount: XP.weight, date: today, source: .weight)
            case .activity: store.addXP(amount: XP.activity, date: today, source: .activity)
            case .streak7:
                store.addXP(amount: XP.streak7, date: today, source: .streak7)
                store.unlockAchievement(id: "xp_streak_7")
            case .streak30:
                store.addXP(amount: XP.streak30, date: today, source: .streak30)
                store.unlockAchievement(id: "xp_streak_30")
            }
        }

        // 3. Level-up toast — only across reconciles (no toast on the first pass; RN `prevXpRef` null).
        let xpAfter = store.preferences.totalXp ?? 0
        if let prev = prevXp, GamificationStats.didLevelUp(from: prev, to: xpAfter) {
            toasts.show("Level Up! \(XP.levelLabel(forXp: xpAfter))", emoji: "⬆️")
        }
        prevXp = xpAfter
        initialized = true
    }
}
