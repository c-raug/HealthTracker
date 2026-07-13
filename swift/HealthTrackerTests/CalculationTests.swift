import XCTest
@testable import HealthTracker

/// Parity checks for the pure numeric utilities: TDEE, water, activity, units, IDs, and the
/// JS-round helper — against `expo/utils/{tdee,water,activity,unitConversion,generateId}.ts`.
final class CalculationTests: XCTestCase {

    private let acc = 0.0001

    // MARK: - jsRound (Math.round parity: half up toward +∞)

    func testJsRoundMatchesJavaScript() {
        XCTAssertEqual(jsRound(2.5), 3)
        XCTAssertEqual(jsRound(2.4), 2)
        XCTAssertEqual(jsRound(-0.5), 0)   // JS Math.round(-0.5) === 0
        XCTAssertEqual(jsRound(-1.5), -1)  // JS Math.round(-1.5) === -1
        XCTAssertEqual(jsRound(0.5), 1)
    }

    // MARK: - Units

    func testUnitConversions() {
        XCTAssertEqual(Units.lbsToKg(180), 81.6, accuracy: acc)   // round(816.4656)/10
        XCTAssertEqual(Units.kgToLbs(80), 176.4, accuracy: acc)   // round(1763.696)/10
        XCTAssertEqual(Units.convertWeight(150, from: .lbs, to: .lbs), 150, accuracy: acc)
        XCTAssertEqual(Units.convertWeight(100, from: .kg, to: .lbs), 220.5, accuracy: acc)
    }

    // MARK: - TDEE

    func testBMR() {
        // male: 10*80 + 6.25*180 - 5*30 + 5
        XCTAssertEqual(TDEE.calculateBMR(weightKg: 80, heightCm: 180, age: 30, sex: .male), 1780, accuracy: acc)
        // female: same base − 161
        XCTAssertEqual(TDEE.calculateBMR(weightKg: 80, heightCm: 180, age: 30, sex: .female), 1614, accuracy: acc)
    }

    func testActivityMultipliers() {
        XCTAssertEqual(TDEE.activityMultiplier(.sedentary), 1.2, accuracy: acc)
        XCTAssertEqual(TDEE.activityMultiplier(.lightlyActive), 1.375, accuracy: acc)
        XCTAssertEqual(TDEE.activityMultiplier(.moderatelyActive), 1.55, accuracy: acc)
        XCTAssertEqual(TDEE.activityMultiplier(.active), 1.725, accuracy: acc)
        XCTAssertEqual(TDEE.activityMultiplier(.veryActive), 1.9, accuracy: acc)
    }

    func testGoalCalories() {
        XCTAssertEqual(TDEE.goalCalories(tdee: 2000, goal: .lose2), 1000)
        XCTAssertEqual(TDEE.goalCalories(tdee: 2000, goal: .lose0_5), 1750)
        XCTAssertEqual(TDEE.goalCalories(tdee: 2000, goal: .maintain), 2000)
        XCTAssertEqual(TDEE.goalCalories(tdee: 2000, goal: .gain1_5), 2750)
        XCTAssertEqual(TDEE.goalCalories(tdee: 2000, goal: .gain2), 3000)
    }

    func testHeightAndWeightConversion() {
        XCTAssertEqual(TDEE.heightToCm(70, unit: .inches), 177.8, accuracy: acc)
        XCTAssertEqual(TDEE.heightToCm(180, unit: .cm), 180, accuracy: acc)
        XCTAssertEqual(TDEE.weightToKg(180, unit: .lbs), 81.64656, accuracy: acc) // unrounded factor
        XCTAssertEqual(TDEE.weightToKg(75, unit: .kg), 75, accuracy: acc)
    }

    func testAgeFromDob() {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = .current
        let today = cal.date(from: DateComponents(year: 2026, month: 7, day: 13))!
        XCTAssertEqual(TDEE.ageFromDob("1990-01-15", today: today), 36) // birthday already passed
        XCTAssertEqual(TDEE.ageFromDob("2000-12-25", today: today), 25) // birthday not yet this year
        XCTAssertEqual(TDEE.ageFromDob("2026-07-13", today: today), 0)  // born today
    }

    func testCalculateDailyCaloriesAutoVsManualMode() {
        // weightKg = 81.64656, heightCm = 177.8, bmr = 1782.7156
        // auto + active: bmr * 1.725 = 3075.18441 → 3075
        XCTAssertEqual(
            TDEE.calculateDailyCalories(
                weightValue: 180, weightUnit: .lbs, heightValue: 70, heightUnit: .inches,
                age: 30, sex: .male, activityLevel: .active, weightGoal: .maintain, activityMode: .auto),
            3075)
        // manual forces sedentary ×1.2: 1782.7156 * 1.2 = 2139.25872 → 2139
        XCTAssertEqual(
            TDEE.calculateDailyCalories(
                weightValue: 180, weightUnit: .lbs, heightValue: 70, heightUnit: .inches,
                age: 30, sex: .male, activityLevel: .active, weightGoal: .maintain, activityMode: .manual),
            2139)
        // smartwatch also forces sedentary.
        XCTAssertEqual(
            TDEE.calculateDailyCalories(
                weightValue: 180, weightUnit: .lbs, heightValue: 70, heightUnit: .inches,
                age: 30, sex: .male, activityLevel: .active, weightGoal: .maintain, activityMode: .smartwatch),
            2139)
    }

    // MARK: - Water

    func testWaterGoal() {
        XCTAssertEqual(WaterGoal.calculate(weightValue: 180, weightUnit: .lbs, activityLevel: .sedentary), 90)
        // active scales ×1.2: 90 * 1.2 = 108
        XCTAssertEqual(WaterGoal.calculate(weightValue: 180, weightUnit: .lbs, activityLevel: .active), 108)
        // + creatine 16 oz
        XCTAssertEqual(WaterGoal.calculate(weightValue: 180, weightUnit: .lbs, activityLevel: .active, creatine: true), 124)
        // metric: 70 * 35 = 2450
        XCTAssertEqual(WaterGoal.calculate(weightValue: 70, weightUnit: .kg, activityLevel: .sedentary), 2450)
        // metric very-active + creatine: 2450*1.2 + 500 = 3440
        XCTAssertEqual(WaterGoal.calculate(weightValue: 70, weightUnit: .kg, activityLevel: .veryActive, creatine: true), 3440)
    }

    // MARK: - Activity

    func testActivityCalories() {
        // 5.0 MET * 81.64656 kg * 1h = 408.2328 → 408
        XCTAssertEqual(ActivityCalories.exercise(durationMinutes: 60, weightValue: 180, weightUnit: .lbs), 408)
        // 10000 * (81.64656/70) * 0.04 = 466.55 → 467
        XCTAssertEqual(ActivityCalories.steps(10000, weightValue: 180, weightUnit: .lbs), 467)
    }

    // MARK: - IDs

    func testGenerateIdShapeIsLowercasedUUID() {
        let id = Identifiers.generate()
        XCTAssertEqual(id.count, 36)
        XCTAssertEqual(id, id.lowercased())
        XCTAssertEqual(id.filter { $0 == "-" }.count, 4)
        XCTAssertNotEqual(id, Identifiers.generate()) // unique
    }
}
