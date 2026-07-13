import XCTest
@testable import HealthTracker

/// Verifies the decode-time custom-food migration reproduces the `LOAD_DATA` branch from
/// `expo/context/AppContext.tsx` (legacy `pinned`/`pinnedOrder`/`foodType`/`mealTags`).
final class CustomFoodMigrationTests: XCTestCase {

    private func decode(_ json: String) throws -> CustomFood {
        try JSONDecoder().decode(CustomFood.self, from: json.data(using: .utf8)!)
    }

    func testLegacyPinnedAndNumericOrderMigrate() throws {
        let food = try decode("""
        {"id":"c1","name":"Chicken","calories":200,"protein":30,"carbs":0,"fat":8,
         "servingSize":"100g","createdAt":"2026-07-01T00:00:00.000Z",
         "pinned":true,"pinnedOrder":3,"foodType":"Meat","mealTags":["a","b"]}
        """)

        XCTAssertEqual(food.pinnedCategories, MealCategory.allCases)
        XCTAssertEqual(food.pinnedOrder, ["breakfast": 3, "lunch": 3, "dinner": 3, "snacks": 3])
        XCTAssertEqual(food.foodTypes, ["Meat"])
        // Legacy keys are not re-emitted on encode.
        let reencoded = try JSONEncoder().encode(food)
        let obj = try JSONSerialization.jsonObject(with: reencoded) as! [String: Any]
        XCTAssertNil(obj["pinned"])
        XCTAssertNil(obj["foodType"])
        XCTAssertNil(obj["mealTags"])
    }

    func testCanonicalFoodDecodesUnchanged() throws {
        let food = try decode("""
        {"id":"c2","name":"Rice","calories":130,"protein":3,"carbs":28,"fat":0,
         "servingSize":"1 cup","createdAt":"2026-07-01T00:00:00.000Z",
         "pinnedCategories":["lunch","dinner"],"pinnedOrder":{"lunch":0,"dinner":1},"foodTypes":["Grain"]}
        """)

        XCTAssertEqual(food.pinnedCategories, [.lunch, .dinner])
        XCTAssertEqual(food.pinnedOrder, ["lunch": 0, "dinner": 1])
        XCTAssertEqual(food.foodTypes, ["Grain"])
    }
}
