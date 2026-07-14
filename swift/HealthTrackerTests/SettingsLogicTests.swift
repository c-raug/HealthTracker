import XCTest
@testable import HealthTracker

/// Phase 11 parity checks for `SettingsLogic` — the pure helpers behind the Nutrition-Goals screen
/// (`expo/app/nutrition-goals-modal.tsx` + `components/settings/MacroSection.tsx`): the manual
/// water-goal Save rules, macro custom-split math, and the grams-for-percent label.
final class SettingsLogicTests: XCTestCase {

    // MARK: - Water goal Save

    func testWaterGoalBlankClears() {
        XCTAssertEqual(SettingsLogic.waterGoalSave(from: "   "), .clear)
        XCTAssertEqual(SettingsLogic.waterGoalSave(from: ""), .clear)
    }

    func testWaterGoalPositiveIntegerSets() {
        XCTAssertEqual(SettingsLogic.waterGoalSave(from: "128"), .set(128))
    }

    func testWaterGoalParsesLeadingDigits() {
        // parseInt("100 oz") → 100 (JS parity).
        XCTAssertEqual(SettingsLogic.waterGoalSave(from: "100 oz"), .set(100))
    }

    func testWaterGoalZeroOrNegativeInvalid() {
        XCTAssertEqual(SettingsLogic.waterGoalSave(from: "0"), .invalid)
        XCTAssertEqual(SettingsLogic.waterGoalSave(from: "-5"), .invalid)
    }

    func testWaterGoalNonNumericInvalid() {
        XCTAssertEqual(SettingsLogic.waterGoalSave(from: "abc"), .invalid)
    }

    func testWaterGoalPlaceholderAndCreatineLabelsByUnit() {
        XCTAssertEqual(SettingsLogic.waterGoalPlaceholder(unit: .lbs), "e.g. 100 oz")
        XCTAssertEqual(SettingsLogic.waterGoalPlaceholder(unit: .kg), "e.g. 3000 mL")
        XCTAssertEqual(SettingsLogic.creatineAmountLabel(unit: .lbs), "16 oz")
        XCTAssertEqual(SettingsLogic.creatineAmountLabel(unit: .kg), "500 mL")
    }

    // MARK: - Macro split

    func testCustomMacroSum() {
        XCTAssertEqual(SettingsLogic.customMacroSum(protein: "30", carbs: "40", fat: "30"), 100)
        XCTAssertEqual(SettingsLogic.customMacroSum(protein: "", carbs: "40", fat: "30"), 70)   // parseInt("")||0
    }

    func testClampPercent() {
        XCTAssertEqual(SettingsLogic.clampPercent(-5), 0)
        XCTAssertEqual(SettingsLogic.clampPercent(105), 100)
        XCTAssertEqual(SettingsLogic.clampPercent(42), 42)
    }

    func testGramsLabel() {
        // round(30/100 * 2000 / 4) = round(150) = 150.
        XCTAssertEqual(SettingsLogic.gramsLabel(pct: 30, goalCalories: 2000, calPerGram: 4), "150g")
        // fat at 9 cal/g: round(30/100 * 2000 / 9) = round(66.67) = 67.
        XCTAssertEqual(SettingsLogic.gramsLabel(pct: 30, goalCalories: 2000, calPerGram: 9), "67g")
    }

    func testGramsLabelNoGoalIsDash() {
        XCTAssertEqual(SettingsLogic.gramsLabel(pct: 30, goalCalories: nil, calPerGram: 4), "—g")
        XCTAssertEqual(SettingsLogic.gramsLabel(pct: 30, goalCalories: 0, calPerGram: 4), "—g")
    }

    // MARK: - goalCalories

    func testGoalCaloriesNilWithoutProfile() {
        XCTAssertNil(SettingsLogic.goalCalories(
            profile: nil, latestWeight: nil, activityLog: [], activityMode: .auto, today: "2026-07-14"
        ))
    }

    func testGoalCaloriesWithProfileIsPositiveAndNotAdjustedWithoutActivity() {
        let profile = UserProfile(
            name: nil, age: nil, dob: "1990-01-01", fitnessGoal: nil, sex: .male,
            heightValue: 70, heightUnit: .inches, activityLevel: .moderatelyActive, weightGoal: .maintain
        )
        let weight = WeightEntry(id: "w", date: "2026-07-14", weight: 180, unit: .lbs, createdAt: "2026-07-14T00:00:00.000Z")
        let result = SettingsLogic.goalCalories(
            profile: profile, latestWeight: weight, activityLog: [], activityMode: .auto,
            today: "2026-07-14", now: Date(timeIntervalSince1970: 1_800_000_000)
        )
        XCTAssertNotNil(result)
        XCTAssertGreaterThan(result?.adjusted ?? 0, 0)
        XCTAssertFalse(result?.activityAdjusted ?? true)   // auto mode never adds activity
    }
}
