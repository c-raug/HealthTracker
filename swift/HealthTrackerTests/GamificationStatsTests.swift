import XCTest
@testable import HealthTracker

/// Parity checks for `Logic/GamificationStats.swift` against the reactive effects in
/// `expo/components/GamificationWatcher.tsx` (XP-grant guards, streak-bonus gating, level-up
/// crossing, aggregate metrics).
final class GamificationStatsTests: XCTestCase {

    // MARK: - Fixtures

    private func food(_ cal: Double) -> NutritionFoodItem {
        NutritionFoodItem(id: UUID().uuidString, name: "f", calories: cal)
    }

    private func day(_ date: String, foods: Int, cal: Double = 100) -> DayNutrition {
        DayNutrition(date: date, meals: Meals(breakfast: (0..<foods).map { _ in food(cal) }))
    }

    private func baseInputs(
        foodCount: Int = 0,
        todayCalories: Double = 0,
        calorieTarget: Int = 0,
        todayWater: Double = 0,
        waterGoal: Int = 0,
        hasWeightToday: Bool = false,
        hasActivityToday: Bool = false,
        longestStreak: Int = 0
    ) -> GamificationStats.DayInputs {
        GamificationStats.DayInputs(
            foodCount: foodCount, todayCalories: todayCalories, calorieTarget: calorieTarget,
            todayWater: todayWater, waterGoal: waterGoal, hasWeightToday: hasWeightToday,
            hasActivityToday: hasActivityToday, longestStreak: longestStreak
        )
    }

    // MARK: - Aggregate metrics

    func testTotalFoodsLoggedSumsAcrossAllDaysAndMeals() {
        let log = [
            DayNutrition(date: "2026-07-12", meals: Meals(breakfast: [food(70)], lunch: [food(200), food(50)])),
            DayNutrition(date: "2026-07-13", meals: Meals(dinner: [food(400)])),
        ]
        XCTAssertEqual(GamificationStats.totalFoodsLogged(log), 4)
    }

    // MARK: - Food XP (capped delta)

    func testFoodGrantsUncreditedDeltaUpToCap() {
        // 3 foods → earned min(15,25)=15, already 5 logged → grant 10.
        let grants = GamificationStats.pendingGrants(
            dayLog: XpDayLog(food: 5), unlockedAchievements: [],
            inputs: baseInputs(foodCount: 3)
        )
        XCTAssertEqual(grants, [.food(10)])
    }

    func testFoodCapsAt25AndNoOpWhenAlreadyMaxed() {
        // 10 foods → earned min(50,25)=25, already 25 → nothing.
        let grants = GamificationStats.pendingGrants(
            dayLog: XpDayLog(food: 25), unlockedAchievements: [],
            inputs: baseInputs(foodCount: 10)
        )
        XCTAssertTrue(grants.isEmpty)
    }

    // MARK: - Calorie goal (±10% of a positive target)

    func testCalorieGoalWithinTenPercentGrantsOnce() {
        let within = GamificationStats.pendingGrants(
            dayLog: XpDayLog(), unlockedAchievements: [],
            inputs: baseInputs(todayCalories: 1950, calorieTarget: 2000)
        )
        XCTAssertEqual(within, [.calorieGoal])

        let already = GamificationStats.pendingGrants(
            dayLog: XpDayLog(calorieGoal: true), unlockedAchievements: [],
            inputs: baseInputs(todayCalories: 1950, calorieTarget: 2000)
        )
        XCTAssertTrue(already.isEmpty)
    }

    func testCalorieGoalOutsideBandOrZeroConsumedDoesNotGrant() {
        let outside = GamificationStats.pendingGrants(
            dayLog: XpDayLog(), unlockedAchievements: [],
            inputs: baseInputs(todayCalories: 1700, calorieTarget: 2000) // 300 > 200 band
        )
        XCTAssertTrue(outside.isEmpty)

        let zeroConsumed = GamificationStats.pendingGrants(
            dayLog: XpDayLog(), unlockedAchievements: [],
            inputs: baseInputs(todayCalories: 0, calorieTarget: 2000)
        )
        XCTAssertTrue(zeroConsumed.isEmpty)
    }

    // MARK: - Water / weight / activity guards

    func testWaterGoalMetGrantsOncePositiveGoalOnly() {
        XCTAssertEqual(
            GamificationStats.pendingGrants(dayLog: XpDayLog(), unlockedAchievements: [],
                inputs: baseInputs(todayWater: 80, waterGoal: 64)),
            [.waterGoal]
        )
        // Goal not yet met.
        XCTAssertTrue(
            GamificationStats.pendingGrants(dayLog: XpDayLog(), unlockedAchievements: [],
                inputs: baseInputs(todayWater: 40, waterGoal: 64)).isEmpty
        )
        // No goal → no grant.
        XCTAssertTrue(
            GamificationStats.pendingGrants(dayLog: XpDayLog(), unlockedAchievements: [],
                inputs: baseInputs(todayWater: 80, waterGoal: 0)).isEmpty
        )
    }

    func testWeightAndActivityGrantOncePerDay() {
        let both = GamificationStats.pendingGrants(
            dayLog: XpDayLog(), unlockedAchievements: [],
            inputs: baseInputs(hasWeightToday: true, hasActivityToday: true)
        )
        XCTAssertEqual(both, [.weight, .activity])

        let alreadyLogged = GamificationStats.pendingGrants(
            dayLog: XpDayLog(weight: true, activity: true), unlockedAchievements: [],
            inputs: baseInputs(hasWeightToday: true, hasActivityToday: true)
        )
        XCTAssertTrue(alreadyLogged.isEmpty)
    }

    // MARK: - Streak bonuses (one-time, gated by synthetic ids)

    func testStreakBonusesFireOnceGatedByGuardIds() {
        let both = GamificationStats.pendingGrants(
            dayLog: XpDayLog(), unlockedAchievements: [],
            inputs: baseInputs(longestStreak: 30)
        )
        XCTAssertEqual(both, [.streak7, .streak30])

        let sevenOnly = GamificationStats.pendingGrants(
            dayLog: XpDayLog(), unlockedAchievements: ["xp_streak_7"],
            inputs: baseInputs(longestStreak: 30)
        )
        XCTAssertEqual(sevenOnly, [.streak30])

        let none = GamificationStats.pendingGrants(
            dayLog: XpDayLog(), unlockedAchievements: ["xp_streak_7", "xp_streak_30"],
            inputs: baseInputs(longestStreak: 30)
        )
        XCTAssertTrue(none.isEmpty)
    }

    // MARK: - Level-up crossing

    func testDidLevelUpOnlyWhenBoundaryCrossedUpward() {
        XCTAssertTrue(GamificationStats.didLevelUp(from: 90, to: 100))  // L1 → L2
        XCTAssertFalse(GamificationStats.didLevelUp(from: 100, to: 150)) // same level
        XCTAssertFalse(GamificationStats.didLevelUp(from: 100, to: 100)) // no gain
        XCTAssertFalse(GamificationStats.didLevelUp(from: 200, to: 0))   // prestige reset (down)
    }
}
