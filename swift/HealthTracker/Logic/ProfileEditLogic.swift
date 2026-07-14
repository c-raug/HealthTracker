import Foundation

/// Pure, testable core for the Edit-Profile screen (port of the inline logic in
/// `expo/app/profile-modal.tsx`). Keeps the height ft/in ↔ total-inches conversion, the
/// change-detection snapshot, and the profile builder out of the view so they can be unit-tested for
/// parity with the RN handlers.
enum ProfileEditLogic {

    /// The mutable field set the Edit-Profile form edits. Height is kept as the raw text fields
    /// (`ft`/`in` when imperial, `cm` when metric) so change-detection is byte-for-byte with RN's
    /// string comparison.
    struct Snapshot: Equatable {
        var name: String
        var dob: String?
        var sex: Sex
        var heightFt: String
        var heightIn: String
        var heightCm: String
        var activityMode: ActivityMode
        var activityLevel: ActivityLevel
    }

    /// Seed the form from the stored profile + activity mode, exactly like the RN `initialValues`
    /// ref + the height-field `useEffect` (imperial → ft/in split, metric → cm; the unused unit's
    /// fields stay empty strings).
    static func initialSnapshot(profile: UserProfile?, activityMode: ActivityMode) -> Snapshot {
        let isImperial = profile?.heightUnit == .inches
        let heightValue = profile?.heightValue ?? 0
        return Snapshot(
            name: profile?.name ?? "",
            dob: profile?.dob,
            sex: profile?.sex ?? .male,
            heightFt: isImperial ? String(Int(heightValue) / 12) : "",
            heightIn: isImperial ? String(Int(heightValue) % 12) : "",
            heightCm: profile?.heightUnit == .cm ? WeightStats.jsNumberString(heightValue) : "",
            activityMode: activityMode,
            activityLevel: profile?.activityLevel ?? .moderatelyActive
        )
    }

    /// RN `hasChanges` — any tracked field differs from the initial snapshot. Save is enabled only
    /// when this is true.
    static func hasChanges(_ current: Snapshot, from initial: Snapshot) -> Bool {
        current != initial
    }

    /// Resolve the height from the raw fields (RN `handleSave`): imperial → `ft*12 + in` inches,
    /// metric → `cm`. Uses JS `parseInt(x)||0` / `parseFloat(x)||0` parity. Returns `nil` when the
    /// resolved value is `< 1` (RN's "Invalid Height" guard).
    static func resolveHeight(isImperial: Bool, ft: String, inches: String, cm: String)
        -> (value: Double, unit: HeightUnit)? {
        if isImperial {
            let f = ActivityStats.jsParseInt(ft) ?? 0
            let i = ActivityStats.jsParseInt(inches) ?? 0
            let value = Double(f * 12 + i)
            return value < 1 ? nil : (value, .inches)
        } else {
            let value = WeightStats.jsParseFloat(cm) ?? 0
            return value < 1 ? nil : (value, .cm)
        }
    }

    /// Build the updated profile to persist (RN `handleSave`): empty name → `nil`, height resolved
    /// from the raw fields, `weightGoal`/`fitnessGoal` preserved from the previous profile
    /// (Nutrition Goals owns the weight goal). Returns `nil` when the height is invalid.
    static func makeProfile(from snapshot: Snapshot, isImperial: Bool, previous: UserProfile?)
        -> UserProfile? {
        guard let (heightValue, heightUnit) = resolveHeight(
            isImperial: isImperial,
            ft: snapshot.heightFt, inches: snapshot.heightIn, cm: snapshot.heightCm
        ) else { return nil }
        let trimmedName = snapshot.name.trimmingCharacters(in: .whitespaces)
        return UserProfile(
            name: trimmedName.isEmpty ? nil : snapshot.name,
            age: nil,
            dob: snapshot.dob,
            fitnessGoal: previous?.fitnessGoal,
            sex: snapshot.sex,
            heightValue: heightValue,
            heightUnit: heightUnit,
            activityLevel: snapshot.activityLevel,
            weightGoal: previous?.weightGoal ?? .maintain
        )
    }

    // MARK: - Activity-mode copy (RN `ACTIVITY_MODE_INFO` / `ACTIVITY_MODE_LABELS`)

    static func modeLabel(_ mode: ActivityMode) -> String {
        switch mode {
        case .auto: return "Auto"
        case .manual: return "Manual"
        case .smartwatch: return "Smart Watch"
        }
    }

    static func modeInfo(_ mode: ActivityMode) -> (title: String, description: String) {
        switch mode {
        case .auto:
            return ("Auto Mode",
                    "Your activity level multiplier is built into your daily calorie target. Exercise you log on the Activity tab is tracked for reference only — it won't increase your calorie target. Best for people with a consistent activity routine.")
        case .manual:
            return ("Manual Mode",
                    "Your base calorie target assumes a sedentary lifestyle. Every workout and step count you log on the Activity tab is added directly to your daily calorie target. Best for people with variable activity day to day.")
        case .smartwatch:
            return ("Smart Watch Mode",
                    "Your base calorie target assumes a sedentary lifestyle. Enter the total calories burned from your smart watch each day on the Activity tab, and that amount is added to your calorie target.")
        }
    }
}
