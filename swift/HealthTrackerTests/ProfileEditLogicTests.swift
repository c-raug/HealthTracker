import XCTest
@testable import HealthTracker

/// Phase 11 parity checks for `ProfileEditLogic` — the pure core behind the Edit-Profile screen
/// (`expo/app/profile-modal.tsx`): the initial-snapshot seeding, height ft/in ↔ total-inches
/// resolution, change detection, and the profile builder.
final class ProfileEditLogicTests: XCTestCase {

    private func profile(
        name: String? = "Ada",
        dob: String? = "1990-05-01",
        sex: Sex = .female,
        heightValue: Double = 66,
        heightUnit: HeightUnit = .inches,
        activityLevel: ActivityLevel = .active,
        weightGoal: WeightGoal = .lose1,
        fitnessGoal: String? = "tone"
    ) -> UserProfile {
        UserProfile(
            name: name, age: nil, dob: dob, fitnessGoal: fitnessGoal, sex: sex,
            heightValue: heightValue, heightUnit: heightUnit,
            activityLevel: activityLevel, weightGoal: weightGoal
        )
    }

    // MARK: - initialSnapshot

    func testInitialSnapshotImperialSplitsFeetAndInches() {
        let s = ProfileEditLogic.initialSnapshot(profile: profile(heightValue: 70, heightUnit: .inches), activityMode: .manual)
        XCTAssertEqual(s.heightFt, "5")
        XCTAssertEqual(s.heightIn, "10")
        XCTAssertEqual(s.heightCm, "")
        XCTAssertEqual(s.activityMode, .manual)
        XCTAssertEqual(s.sex, .female)
    }

    func testInitialSnapshotMetricUsesCmOnly() {
        let s = ProfileEditLogic.initialSnapshot(profile: profile(heightValue: 178, heightUnit: .cm), activityMode: .auto)
        XCTAssertEqual(s.heightCm, "178")
        XCTAssertEqual(s.heightFt, "")
        XCTAssertEqual(s.heightIn, "")
    }

    func testInitialSnapshotNilProfileDefaults() {
        let s = ProfileEditLogic.initialSnapshot(profile: nil, activityMode: .auto)
        XCTAssertEqual(s.name, "")
        XCTAssertNil(s.dob)
        XCTAssertEqual(s.sex, .male)
        XCTAssertEqual(s.activityLevel, .moderatelyActive)
        XCTAssertEqual(s.heightFt, "")
        XCTAssertEqual(s.heightCm, "")
    }

    // MARK: - resolveHeight

    func testResolveHeightImperialCombinesFeetInches() {
        let r = ProfileEditLogic.resolveHeight(isImperial: true, ft: "5", inches: "11", cm: "")
        XCTAssertEqual(r?.value, 71)
        XCTAssertEqual(r?.unit, .inches)
    }

    func testResolveHeightImperialEmptyFieldsParseAsZeroAndFail() {
        // parseInt("")||0 → 0; 0 < 1 → invalid.
        XCTAssertNil(ProfileEditLogic.resolveHeight(isImperial: true, ft: "", inches: "", cm: ""))
    }

    func testResolveHeightMetricParsesCm() {
        let r = ProfileEditLogic.resolveHeight(isImperial: false, ft: "", inches: "", cm: "180.5")
        XCTAssertEqual(r?.value, 180.5)
        XCTAssertEqual(r?.unit, .cm)
    }

    func testResolveHeightMetricBelowOneIsInvalid() {
        XCTAssertNil(ProfileEditLogic.resolveHeight(isImperial: false, ft: "", inches: "", cm: "0"))
    }

    // MARK: - hasChanges

    func testHasChangesFalseWhenIdentical() {
        let s = ProfileEditLogic.initialSnapshot(profile: profile(), activityMode: .auto)
        XCTAssertFalse(ProfileEditLogic.hasChanges(s, from: s))
    }

    func testHasChangesTrueOnAnyFieldEdit() {
        let base = ProfileEditLogic.initialSnapshot(profile: profile(), activityMode: .auto)
        var edited = base
        edited.name = "Bob"
        XCTAssertTrue(ProfileEditLogic.hasChanges(edited, from: base))
    }

    // MARK: - makeProfile

    func testMakeProfilePreservesWeightAndFitnessGoal() {
        let prev = profile(weightGoal: .gain2, fitnessGoal: "bulk")
        var snap = ProfileEditLogic.initialSnapshot(profile: prev, activityMode: .auto)
        snap.name = "Grace"
        snap.sex = .female
        let built = ProfileEditLogic.makeProfile(from: snap, isImperial: true, previous: prev)
        XCTAssertEqual(built?.weightGoal, .gain2)         // owned by Nutrition Goals, preserved here
        XCTAssertEqual(built?.fitnessGoal, "bulk")
        XCTAssertEqual(built?.name, "Grace")
    }

    func testMakeProfileEmptyNameBecomesNil() {
        let prev = profile()
        var snap = ProfileEditLogic.initialSnapshot(profile: prev, activityMode: .auto)
        snap.name = "   "
        let built = ProfileEditLogic.makeProfile(from: snap, isImperial: true, previous: prev)
        XCTAssertNil(built?.name)
    }

    func testMakeProfileInvalidHeightReturnsNil() {
        let prev = profile()
        var snap = ProfileEditLogic.initialSnapshot(profile: prev, activityMode: .auto)
        snap.heightFt = ""
        snap.heightIn = ""
        XCTAssertNil(ProfileEditLogic.makeProfile(from: snap, isImperial: true, previous: prev))
    }

    // MARK: - Mode copy

    func testModeLabels() {
        XCTAssertEqual(ProfileEditLogic.modeLabel(.auto), "Auto")
        XCTAssertEqual(ProfileEditLogic.modeLabel(.manual), "Manual")
        XCTAssertEqual(ProfileEditLogic.modeLabel(.smartwatch), "Smart Watch")
    }

    func testModeInfoTitles() {
        XCTAssertEqual(ProfileEditLogic.modeInfo(.auto).title, "Auto Mode")
        XCTAssertEqual(ProfileEditLogic.modeInfo(.smartwatch).title, "Smart Watch Mode")
    }
}
