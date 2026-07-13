import XCTest
@testable import HealthTracker

/// Round-trip + validation coverage for the backup envelope — the migration bridge for the
/// user's existing Expo data. Verifies Swift reads/writes the same JSON shape the RN app does.
final class BackupCodecTests: XCTestCase {

    private func sampleSnapshot() -> BackupCodec.Snapshot {
        var profile = UserProfile(
            sex: .male, heightValue: 70, heightUnit: .inches,
            activityLevel: .moderatelyActive, weightGoal: .lose1
        )
        profile.name = "Test"
        profile.dob = "1990-01-01"

        var prefs = UserPreferences(unit: .lbs)
        prefs.profile = profile
        prefs.onboardingComplete = true
        prefs.totalXp = 120
        prefs.xpLog = ["2026-07-13": XpDayLog(food: 15, calorieGoal: true)]
        prefs.foodTypeCategories = UserPreferences.defaultFoodTypeCategories

        return BackupCodec.Snapshot(
            entries: [WeightEntry(id: "a1", date: "2026-07-13", weight: 180.5, unit: .lbs, createdAt: "2026-07-13T08:00:00.000Z")],
            preferences: prefs,
            nutritionLog: [
                DayNutrition(date: "2026-07-13", meals: Meals(
                    breakfast: [NutritionFoodItem(id: "f1", name: "Eggs", calories: 140, protein: 12, carbs: 1, fat: 10)],
                    snacks: [NutritionFoodItem(id: "f2", name: "Water", quickAdd: true)]
                ))
            ],
            customFoods: [CustomFood(
                id: "c1", name: "Chicken", calories: 200, protein: 30, carbs: 0, fat: 8,
                servingSize: "100g", createdAt: "2026-07-01T00:00:00.000Z",
                pinnedCategories: [.lunch, .dinner], pinnedOrder: ["lunch": 0, "dinner": 1], foodTypes: ["Meat"]
            )],
            savedMeals: [SavedMeal(id: "m1", name: "Combo", foods: [], createdAt: "2026-07-01T00:00:00.000Z", pinnedCategories: nil, pinnedOrder: nil)],
            activityLog: [DayActivity(date: "2026-07-13", activities: [
                ActivityEntry(id: "act1", type: .exercise, exerciseType: .weightLifting, durationMinutes: 45, steps: nil, caloriesBurned: 250, loggedWithMode: .auto, warningDismissed: nil)
            ])],
            waterLog: [DayWater(date: "2026-07-13", entries: [WaterEntry(id: "w1", amount: 16, loggedAt: "2026-07-13T09:00:00.000Z")])]
        )
    }

    func testBackupRoundTripPreservesAllSlices() throws {
        let snapshot = sampleSnapshot()
        let data = try BackupCodec.encodePretty(snapshot)
        let decoded = try BackupCodec.decode(data)

        XCTAssertEqual(decoded.entries, snapshot.entries)
        XCTAssertEqual(decoded.preferences, snapshot.preferences)
        XCTAssertEqual(decoded.nutritionLog, snapshot.nutritionLog)
        XCTAssertEqual(decoded.customFoods, snapshot.customFoods)
        XCTAssertEqual(decoded.savedMeals, snapshot.savedMeals)
        XCTAssertEqual(decoded.activityLog, snapshot.activityLog)
        XCTAssertEqual(decoded.waterLog, snapshot.waterLog)
        XCTAssertNotNil(decoded.exportedAt)
    }

    func testDecodeRejectsPayloadMissingRequiredKey() {
        // Missing `activityLog` (a required key) → invalid.
        let json = """
        {"entries":[],"preferences":{"unit":"lbs"},"nutritionLog":[],"customFoods":[],"savedMeals":[]}
        """.data(using: .utf8)!
        XCTAssertThrowsError(try BackupCodec.decode(json)) { error in
            XCTAssertTrue(error is BackupCodec.BackupError)
        }
    }

    func testDecodeAcceptsOlderBackupWithoutWaterLog() throws {
        // `waterLog` + `exportedAt` are optional — older backups must still load.
        let json = """
        {"entries":[],"preferences":{"unit":"lbs"},"nutritionLog":[],"customFoods":[],"savedMeals":[],"activityLog":[]}
        """.data(using: .utf8)!
        let decoded = try BackupCodec.decode(json)
        XCTAssertNil(decoded.waterLog)
        XCTAssertEqual(decoded.preferences.unit, .lbs)
    }
}
