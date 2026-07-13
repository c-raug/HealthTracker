import XCTest
@testable import HealthTracker

/// Parity checks for `Logic/XP.swift` and `Logic/Achievements.swift` against
/// `expo/utils/xpCalculation.ts` and `expo/utils/achievementCalculation.ts`.
final class GamificationLogicTests: XCTestCase {

    // MARK: - XP levels

    func testLevelFromXpAtAndAroundThresholds() {
        XCTAssertEqual(XP.level(forXp: 0), 1)
        XCTAssertEqual(XP.level(forXp: 99), 1)
        XCTAssertEqual(XP.level(forXp: 100), 2)
        XCTAssertEqual(XP.level(forXp: 249), 2)
        XCTAssertEqual(XP.level(forXp: 250), 3)
        XCTAssertEqual(XP.level(forXp: 10999), 9)
        XCTAssertEqual(XP.level(forXp: 11000), 10)
        XCTAssertEqual(XP.level(forXp: 999999), 10) // clamps at max
    }

    func testLevelNameAndLabel() {
        XCTAssertEqual(XP.levelName(forXp: 0), "Novice")
        XCTAssertEqual(XP.levelName(forXp: 500), "Dedicated")
        XCTAssertEqual(XP.levelLabel(forXp: 500), "Level 4 · Dedicated")
        XCTAssertEqual(XP.levelLabel(forXp: 11000), "Level 10 · Legend")
    }

    func testLevelProgress() {
        let p0 = XP.progress(forXp: 0)
        XCTAssertEqual(p0.level, 1)
        XCTAssertEqual(p0.currentLevelXp, 0)
        XCTAssertEqual(p0.nextLevelXp, 100)
        XCTAssertFalse(p0.isMax)

        let pMid = XP.progress(forXp: 1500) // level 5 (≥1000, <2000)
        XCTAssertEqual(pMid.level, 5)
        XCTAssertEqual(pMid.currentLevelXp, 1000)
        XCTAssertEqual(pMid.nextLevelXp, 2000)
        XCTAssertFalse(pMid.isMax)

        let pMax = XP.progress(forXp: 12000)
        XCTAssertEqual(pMax.level, 10)
        XCTAssertEqual(pMax.currentLevelXp, 11000)
        XCTAssertEqual(pMax.nextLevelXp, 11000) // clamps at max
        XCTAssertTrue(pMax.isMax)
    }

    func testXpConstants() {
        XCTAssertEqual(XP.food, 5)
        XCTAssertEqual(XP.foodCap, 25)
        XCTAssertEqual(XP.calorieGoal, 20)
        XCTAssertEqual(XP.waterGoal, 15)
        XCTAssertEqual(XP.weight, 10)
        XCTAssertEqual(XP.activity, 10)
        XCTAssertEqual(XP.streak7, 50)
        XCTAssertEqual(XP.streak30, 200)
    }

    // MARK: - Achievements

    func testCheckNewReturnsMetButNotYetUnlockedInOrder() {
        let newly = Achievements.checkNew(unlockedIds: [], longestStreak: 30, totalFoodsLogged: 50)
        XCTAssertEqual(newly, ["streak_7", "streak_30", "foods_10", "foods_50"])
    }

    func testCheckNewExcludesAlreadyUnlocked() {
        let newly = Achievements.checkNew(unlockedIds: ["streak_7"], longestStreak: 7, totalFoodsLogged: 0)
        XCTAssertEqual(newly, []) // streak_7 met but already unlocked; nothing else qualifies
    }

    func testCheckNewFoodMilestones() {
        let newly = Achievements.checkNew(unlockedIds: [], longestStreak: 0, totalFoodsLogged: 100)
        XCTAssertEqual(newly, ["foods_10", "foods_50", "foods_100"])
    }

    func testAchievementCatalogIsEight() {
        XCTAssertEqual(Achievements.all.count, 8)
        XCTAssertEqual(Achievements.all.first?.id, "streak_7")
        XCTAssertEqual(Achievements.all.last?.emoji, "⭐")
    }
}
