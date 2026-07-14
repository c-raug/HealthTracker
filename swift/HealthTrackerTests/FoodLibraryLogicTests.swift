import XCTest
@testable import HealthTracker

/// Phase 7c parity checks for `FoodLibraryLogic` — the Add-Food ranking/scaling/search core.
/// Mirrors the `useMemo`s and dispatch builders in `AddFoodTab.tsx`, `AddMealTab.tsx`,
/// `CreateMealFlow.tsx`, and `CustomFoodForm.tsx`.
final class FoodLibraryLogicTests: XCTestCase {

    private func cf(_ name: String, cal: Double = 100, p: Double = 0, c: Double = 0, f: Double = 0,
                    serving: String = "1 g", pinned: [MealCategory]? = nil, order: [String: Int]? = nil) -> CustomFood {
        CustomFood(id: name, name: name, calories: cal, protein: p, carbs: c, fat: f,
                   servingSize: serving, createdAt: "2026-01-01T00:00:00.000Z",
                   pinnedCategories: pinned, pinnedOrder: order, foodTypes: nil)
    }

    private func logged(_ name: String, cal: Double) -> NutritionFoodItem {
        NutritionFoodItem(id: UUID().uuidString, name: name, calories: cal, protein: nil, carbs: nil, fat: nil,
                          servingSize: nil, servings: nil, mealGroupId: nil, mealGroupName: nil, quickAdd: nil)
    }

    func testFrequencyMap() {
        let log = [
            DayNutrition(date: "2026-07-12", meals: Meals(breakfast: [logged("Egg", cal: 70)], lunch: [logged("Rice", cal: 200)])),
            DayNutrition(date: "2026-07-13", meals: Meals(breakfast: [logged("egg ", cal: 70)])),  // same key
        ]
        let map = FoodLibraryLogic.frequencyMap(log)
        XCTAssertEqual(map["egg"], 2)
        XCTAssertEqual(map["rice"], 1)
    }

    func testMatches() {
        let foods = [cf("Chicken Breast"), cf("Rice"), cf("Chicken Thigh")]
        XCTAssertEqual(FoodLibraryLogic.matches(foods, query: "chick").map(\.name), ["Chicken Breast", "Chicken Thigh"])
        XCTAssertEqual(FoodLibraryLogic.matches(foods, query: "").count, 3)
    }

    func testPinnedSorting() {
        let foods = [
            cf("B", pinned: [.lunch], order: ["lunch": 1]),
            cf("A", pinned: [.lunch], order: ["lunch": 0]),
            cf("C", pinned: [.dinner]),           // pinned elsewhere
            cf("D"),                              // not pinned
        ]
        XCTAssertEqual(FoodLibraryLogic.pinned(foods, category: .lunch).map(\.name), ["A", "B"])
    }

    func testRecentTop7ByFrequencyExcludesPinnedAndZero() {
        var foods: [CustomFood] = []
        for i in 1...9 { foods.append(cf("F\(i)")) }
        foods.append(cf("Pinned", pinned: [.breakfast]))
        var freq: [String: Int] = ["pinned": 100]
        for i in 1...9 { freq["f\(i)"] = i }           // F9 most frequent … F1 least
        let recent = FoodLibraryLogic.recent(foods, category: .breakfast, frequency: freq)
        XCTAssertEqual(recent.count, 7)                 // capped at 7
        XCTAssertEqual(recent.first?.name, "F9")        // most frequent first
        XCTAssertFalse(recent.contains { $0.name == "Pinned" })  // pinned excluded
    }

    func testLoggedScalesAndFreshId() {
        let base = FoodLibraryLogic.toNutritionItem(cf("Oats", cal: 150, p: 5, c: 27, f: 3))
        XCTAssertEqual(base.servings, 1)
        let out = FoodLibraryLogic.logged(base: base, servings: 2)
        XCTAssertEqual(out.calories, 300)
        XCTAssertEqual(out.protein, 10)
        XCTAssertEqual(out.carbs, 54)
        XCTAssertEqual(out.fat, 6)
        XCTAssertEqual(out.servings, 2)
        XCTAssertNotEqual(out.id, base.id)              // fresh id
    }

    func testMealGroupFoods() {
        let meal = SavedMeal(id: "m", name: "Shake", foods: [logged("Milk", cal: 100), logged("Whey", cal: 120)],
                             createdAt: "2026-01-01T00:00:00.000Z", pinnedCategories: nil, pinnedOrder: nil)
        let out = FoodLibraryLogic.mealGroupFoods(meal)
        XCTAssertEqual(out.count, 2)
        XCTAssertEqual(Set(out.map { $0.mealGroupId }).count, 1)      // one shared group id
        XCTAssertEqual(out.allSatisfy { $0.mealGroupName == "Shake" }, true)
        XCTAssertNotEqual(out[0].id, meal.foods[0].id)               // fresh ids
    }

    func testAutoCalories() {
        XCTAssertEqual(FoodLibraryLogic.autoCalories(protein: 10, carbs: 20, fat: 5), 165) // 40+80+45
    }

    func testParseServingSize() {
        XCTAssertEqual(FoodLibraryLogic.parseServingSize("2 cup").qty, "2")
        XCTAssertEqual(FoodLibraryLogic.parseServingSize("2 cup").unit, "cup")
        XCTAssertEqual(FoodLibraryLogic.parseServingSize("100 kg").unit, "g")  // invalid unit → g
        XCTAssertEqual(FoodLibraryLogic.parseServingSize("").qty, "1")
    }

    func testCaloriesAreManual() {
        // 10p+20c+5f auto = 165. Stored 165 → not manual; stored 200 → manual.
        XCTAssertFalse(FoodLibraryLogic.caloriesAreManual(cf("A", cal: 165, p: 10, c: 20, f: 5)))
        XCTAssertTrue(FoodLibraryLogic.caloriesAreManual(cf("B", cal: 200, p: 10, c: 20, f: 5)))
    }

    // MARK: - Food-type filter (Phase 14)

    private func typed(_ name: String, _ types: [String]?) -> CustomFood {
        CustomFood(id: name, name: name, calories: 100, protein: 0, carbs: 0, fat: 0,
                   servingSize: "1 g", createdAt: "2026-01-01T00:00:00.000Z",
                   pinnedCategories: nil, pinnedOrder: nil, foodTypes: types)
    }

    func testApplyFoodTypeFilterOrLogicAndUntyped() {
        let foods = [
            typed("Steak", ["Meat"]),
            typed("Apple", ["Fruit"]),
            typed("Yogurt Bowl", ["Dairy", "Fruit"]),
            typed("Mystery", nil),        // untyped → excluded while a filter is active
        ]
        // No active filter → everything passes.
        XCTAssertEqual(FoodLibraryLogic.applyFoodTypeFilter(foods, activeTypes: []).count, 4)
        // OR logic: "Fruit" matches Apple + Yogurt Bowl (shares Fruit), excludes Steak/untyped.
        XCTAssertEqual(FoodLibraryLogic.applyFoodTypeFilter(foods, activeTypes: ["Fruit"]).map(\.name),
                       ["Apple", "Yogurt Bowl"])
        // Multi-select is a union: Meat OR Dairy.
        XCTAssertEqual(FoodLibraryLogic.applyFoodTypeFilter(foods, activeTypes: ["Meat", "Dairy"]).map(\.name),
                       ["Steak", "Yogurt Bowl"])
    }

    func testHasActiveAndToggleFilter() {
        XCTAssertFalse(FoodLibraryLogic.hasActiveFoodTypeFilter([]))
        XCTAssertTrue(FoodLibraryLogic.hasActiveFoodTypeFilter(["Meat"]))
        XCTAssertEqual(FoodLibraryLogic.toggleFoodTypeFilter(["Meat"], type: "Fruit"), ["Meat", "Fruit"])
        XCTAssertEqual(FoodLibraryLogic.toggleFoodTypeFilter(["Meat", "Fruit"], type: "Meat"), ["Fruit"])
    }
}
