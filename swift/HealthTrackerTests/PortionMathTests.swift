import XCTest
@testable import HealthTracker

/// Phase 7b parity checks for `PortionMath` — the portion selector's number logic and the food-row
/// rescale. Mirrors `expo/components/nutrition/PortionSelector.tsx` and `FoodItem.tsx`.
final class PortionMathTests: XCTestCase {

    func testDecomposeCompose() {
        let (w1, f1) = PortionMath.decompose(1.25)
        XCTAssertEqual(w1, 1)
        XCTAssertEqual(f1, 2)                       // ¼ = index 2
        XCTAssertEqual(PortionMath.compose(whole: 1, fractionIndex: 2), 1.25)

        let (w2, f2) = PortionMath.decompose(1.5)
        XCTAssertEqual(w2, 1)
        XCTAssertEqual(f2, 4)                       // ½ = index 4
        XCTAssertEqual(PortionMath.compose(whole: w2, fractionIndex: f2), 1.5)
    }

    func testScaleAndPreview() {
        // Per-serving base (baseServings 1); 1.5 servings.
        let p = PortionMath.preview(total: 1.5, baseCalories: 100, baseProtein: 10, baseCarbs: 20, baseFat: 5, baseServings: 1)
        XCTAssertEqual(p.calories, 150)
        XCTAssertEqual(p.protein, 15)
        XCTAssertEqual(p.carbs, 30)
        XCTAssertEqual(p.fat, 7.5)
    }

    func testOneDecimal() {
        XCTAssertEqual(PortionMath.oneDecimal(7.46), 7.5)
        XCTAssertEqual(PortionMath.oneDecimal(7.44), 7.4)
    }

    func testServingCountLabel() {
        XCTAssertEqual(PortionMath.servingCountLabel(1.25), "1.25")
        XCTAssertEqual(PortionMath.servingCountLabel(1), "1")
        XCTAssertEqual(PortionMath.servingCountLabel(0), "0")
        XCTAssertEqual(PortionMath.servingCountLabel(2.5), "2.5")
    }

    func testTotalDisplay() {
        XCTAssertEqual(PortionMath.totalDisplay(whole: 0, fractionIndex: 0), "0")
        XCTAssertEqual(PortionMath.totalDisplay(whole: 1, fractionIndex: 0), "1")
        XCTAssertEqual(PortionMath.totalDisplay(whole: 0, fractionIndex: 4), "½")
        XCTAssertEqual(PortionMath.totalDisplay(whole: 1, fractionIndex: 4), "1 ½")
    }

    func testPerServingBase() {
        XCTAssertEqual(PortionMath.perServingBase(stored: 300, baseServings: 2), 150)
        XCTAssertEqual(PortionMath.perServingBase(stored: nil, baseServings: 2), 0)
        XCTAssertEqual(PortionMath.perServingBase(stored: 100, baseServings: 0), 100) // guard
    }

    func testRescale() {
        let food = NutritionFoodItem(id: "x", name: "Rice", calories: 300, protein: 20, carbs: 40, fat: 10,
                                     servingSize: "1 cup", servings: 2, mealGroupId: nil, mealGroupName: nil, quickAdd: nil)
        let scaled = PortionMath.rescale(food, toServings: 1)   // ratio 0.5
        XCTAssertEqual(scaled.servings, 1)
        XCTAssertEqual(scaled.calories, 150)
        XCTAssertEqual(scaled.protein, 10)
        XCTAssertEqual(scaled.carbs, 20)
        XCTAssertEqual(scaled.fat, 5)
    }
}
