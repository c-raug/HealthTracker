import XCTest
@testable import HealthTracker

/// Behavioral parity checks for the store's port of the RN reducer: newest-first prepend,
/// once-per-day XP guards, and the load-time migrations.
@MainActor
final class AppStoreTests: XCTestCase {

    /// A store backed by a throwaway temp directory so tests never touch real app storage.
    private func makeStore() -> AppStore {
        let dir = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let store = AppStore(jsonStore: JSONStore(baseURL: dir, documentsURL: dir))
        store.load() // empty dir → empty slices, isLoading = false
        return store
    }

    func testUpsertEntryReplacesSameDateAndPrepends() {
        let store = makeStore()
        store.upsertEntry(WeightEntry(id: "1", date: "2026-07-10", weight: 180, unit: .lbs, createdAt: "t1"))
        store.upsertEntry(WeightEntry(id: "2", date: "2026-07-11", weight: 179, unit: .lbs, createdAt: "t2"))
        // Same date as id 1 → replaces it, and lands at the front.
        store.upsertEntry(WeightEntry(id: "3", date: "2026-07-10", weight: 178, unit: .lbs, createdAt: "t3"))

        XCTAssertEqual(store.entries.map(\.id), ["3", "2"])
        XCTAssertEqual(store.entries.first?.weight, 178)
    }

    func testFoodXPIsCappedAt25PerDay() {
        let store = makeStore()
        let day = "2026-07-13"
        for _ in 0..<10 { store.addXP(amount: 5, date: day, source: .food) } // 50 requested
        XCTAssertEqual(store.preferences.totalXp, 25)
        XCTAssertEqual(store.preferences.xpLog?[day]?.food, 25)
    }

    func testBooleanXPSourceGrantsOncePerDay() {
        let store = makeStore()
        let day = "2026-07-13"
        store.addXP(amount: 20, date: day, source: .calorieGoal)
        store.addXP(amount: 20, date: day, source: .calorieGoal) // no-op
        XCTAssertEqual(store.preferences.totalXp, 20)
        XCTAssertEqual(store.preferences.xpLog?[day]?.calorieGoal, true)
    }

    func testAddWaterEntryMovesDayToFront() {
        let store = makeStore()
        store.addWaterEntry(date: "2026-07-10", entry: WaterEntry(id: "w1", amount: 8))
        store.addWaterEntry(date: "2026-07-11", entry: WaterEntry(id: "w2", amount: 8))
        store.addWaterEntry(date: "2026-07-10", entry: WaterEntry(id: "w3", amount: 16))

        XCTAssertEqual(store.waterLog.first?.date, "2026-07-10")
        XCTAssertEqual(store.waterLog.first?.entries.map(\.id), ["w1", "w3"])
    }

    func testImportRunsOnboardingAndCategorySeedMigrations() throws {
        let store = makeStore()
        // Backup: has a profile + a weight entry but no onboardingComplete and no food categories.
        let profile = UserProfile(sex: .female, heightValue: 165, heightUnit: .cm,
                                  activityLevel: .active, weightGoal: .maintain)
        var prefs = UserPreferences(unit: .kg)
        prefs.profile = profile
        let backup = BackupData(
            entries: [WeightEntry(id: "1", date: "2026-07-13", weight: 70, unit: .kg, createdAt: "t")],
            preferences: prefs, nutritionLog: [], customFoods: [], savedMeals: [],
            activityLog: [], waterLog: nil, exportedAt: nil
        )
        try store.importBackup(JSONStore.encoder.encode(backup))

        XCTAssertEqual(store.preferences.onboardingComplete, true)
        XCTAssertEqual(store.preferences.foodTypeCategories, UserPreferences.defaultFoodTypeCategories)
        XCTAssertEqual(store.preferences.favoriteFilterTypes, [])
    }
}
