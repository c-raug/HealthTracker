import XCTest
@testable import HealthTracker

/// Phase 5 parity checks for `OnboardingDraft` — the pure form model behind the 5-step onboarding
/// wizard (port of the local state + `canProceed*` / completion logic in `expo/app/onboarding.tsx`).
final class OnboardingTests: XCTestCase {

    // MARK: - Height resolution (ft/in → inches, cm passthrough)

    func testResolvedHeightImperial() {
        var d = OnboardingDraft()
        d.unit = .lbs
        d.heightFt = "5"
        d.heightIn = "10"
        let h = d.resolvedHeight()
        XCTAssertEqual(h.value, 70)          // 5*12 + 10
        XCTAssertEqual(h.unit, .inches)
    }

    func testResolvedHeightMetric() {
        var d = OnboardingDraft()
        d.unit = .kg
        d.heightCm = "178"
        let h = d.resolvedHeight()
        XCTAssertEqual(h.value, 178)
        XCTAssertEqual(h.unit, .cm)
    }

    // MARK: - Step 2 gate (dob + height)

    func testCanProceedStep2() {
        var d = OnboardingDraft()
        XCTAssertFalse(d.canProceedStep2)          // no dob, no height
        d.dob = "1990-01-01"
        XCTAssertFalse(d.canProceedStep2)          // still no height
        d.heightFt = "5"
        XCTAssertTrue(d.canProceedStep2)           // ft counts even with blank inches

        var m = OnboardingDraft()
        m.unit = .kg
        m.dob = "1990-01-01"
        XCTAssertFalse(m.canProceedStep2)
        m.heightCm = "170"
        XCTAssertTrue(m.canProceedStep2)
    }

    // MARK: - Step 5 gate (weight range per unit)

    func testCanProceedStep5Imperial() {
        var d = OnboardingDraft()
        d.unit = .lbs
        d.weight = "49";   XCTAssertFalse(d.canProceedStep5)   // below 50
        d.weight = "150";  XCTAssertTrue(d.canProceedStep5)
        d.weight = "1001"; XCTAssertFalse(d.canProceedStep5)   // above 1000
        d.weight = "abc";  XCTAssertFalse(d.canProceedStep5)
    }

    func testCanProceedStep5Metric() {
        var d = OnboardingDraft()
        d.unit = .kg
        d.weight = "19";  XCTAssertFalse(d.canProceedStep5)
        d.weight = "70";  XCTAssertTrue(d.canProceedStep5)
        d.weight = "501"; XCTAssertFalse(d.canProceedStep5)
    }

    // MARK: - Custom-macro sum gate

    func testCustomMacroSumGate() {
        var d = OnboardingDraft()
        d.macroPreset = .custom
        d.customProtein = "30"; d.customCarbs = "40"; d.customFat = "30"
        XCTAssertEqual(d.customSum, 100)
        XCTAssertFalse(d.isNextDisabled(step: 4))

        d.customFat = "20"
        XCTAssertEqual(d.customSum, 90)
        XCTAssertTrue(d.isNextDisabled(step: 4))
    }

    func testPresetStepNotBlockedBySum() {
        var d = OnboardingDraft()
        d.macroPreset = .keto   // preset selected → step 4 never blocked
        XCTAssertFalse(d.isNextDisabled(step: 4))
    }

    // MARK: - Goal labels switch with unit

    func testGoalLabelsByUnit() {
        var d = OnboardingDraft()
        d.unit = .lbs
        XCTAssertEqual(d.goalLabels().first?.label, "Lose 2 lb/wk")
        d.unit = .kg
        XCTAssertEqual(d.goalLabels().first?.label, "Lose 0.9 kg/wk")
    }

    // MARK: - Builders

    func testMakeProfileTrimsNameAndKeepsFields() {
        var d = OnboardingDraft()
        d.name = "  Alex  "
        d.dob = "1995-06-15"
        d.sex = .female
        d.unit = .lbs
        d.heightFt = "5"; d.heightIn = "6"
        d.activityLevel = .active
        d.weightGoal = .lose1

        let p = d.makeProfile()
        XCTAssertEqual(p.name, "Alex")
        XCTAssertEqual(p.dob, "1995-06-15")
        XCTAssertEqual(p.sex, .female)
        XCTAssertEqual(p.heightValue, 66)
        XCTAssertEqual(p.heightUnit, .inches)
        XCTAssertEqual(p.activityLevel, .active)
        XCTAssertEqual(p.weightGoal, .lose1)
        XCTAssertNil(p.age)
    }

    func testMakeProfileBlankNameIsNil() {
        var d = OnboardingDraft()
        d.name = "   "
        d.dob = "1990-01-01"
        d.heightCm = "170"; d.unit = .kg
        XCTAssertNil(d.makeProfile().name)
    }

    func testMakeWeightEntry() {
        var d = OnboardingDraft()
        d.unit = .lbs
        d.weight = "165"
        let entry = d.makeWeightEntry(id: "abc", date: "2026-07-13", createdAt: "2026-07-13T00:00:00.000Z")
        XCTAssertEqual(entry?.id, "abc")
        XCTAssertEqual(entry?.date, "2026-07-13")
        XCTAssertEqual(entry?.weight, 165)
        XCTAssertEqual(entry?.unit, .lbs)
        XCTAssertEqual(entry?.createdAt, "2026-07-13T00:00:00.000Z")
    }

    func testMakeWeightEntryInvalidIsNil() {
        var d = OnboardingDraft()
        d.unit = .lbs
        d.weight = "10"   // below 50 lbs
        XCTAssertNil(d.makeWeightEntry())
    }

    // MARK: - Effective split for the summary line

    func testEffectiveSplitUsesPresetWhenNotCustom() {
        var d = OnboardingDraft()
        d.macroPreset = .keto
        let s = d.effectiveSplit
        XCTAssertEqual(s.protein, 25)
        XCTAssertEqual(s.carbs, 5)
        XCTAssertEqual(s.fat, 70)
    }
}
