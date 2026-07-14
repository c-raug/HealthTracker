import SwiftUI

/// Nutrition Goals sub-screen — port of `expo/app/nutrition-goals-modal.tsx`: a `GoalsSection`
/// (weight-goal wheel + activity level in Auto mode), a `MacroSection` (preset / custom split with
/// live grams), and a Daily Water Goal card (Auto/Manual + creatine). The grams preview uses the
/// activity-adjusted goal calories from `SettingsLogic.goalCalories`.
struct NutritionGoalsView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.sm) {
                SettingsCard { GoalsSectionView() }
                SettingsCard {
                    MacroSectionView(goal: SettingsLogic.goalCalories(
                        profile: store.preferences.profile,
                        latestWeight: NutritionStats.latestWeight(store.entries),
                        activityLog: store.activityLog,
                        activityMode: store.preferences.activityMode ?? .auto,
                        today: Dates.getToday()
                    ))
                }
                SettingsCard { DailyWaterGoalView() }
            }
            .padding(Spacing.md)
        }
        .pillBottomClearance()
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("Nutrition Goals")
        .navigationBarTitleDisplayMode(.large)
    }
}

// MARK: - Goals section

/// Port of `components/settings/GoalsSection.tsx`. Weight goal via a wheel picker (the rn-to-swift
/// drum replacement); activity level shown only in Auto mode, each with an info sheet.
private struct GoalsSectionView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    @State private var info: InfoContent?

    private var profile: UserProfile? { store.preferences.profile }
    private var isImperial: Bool { store.preferences.unit == .lbs }
    private var activityMode: ActivityMode { store.preferences.activityMode ?? .auto }
    private var activityLevelActive: Bool { activityMode == .auto }

    private var goalLabels: [(value: WeightGoal, label: String)] {
        isImperial ? OnboardingDraft.goalLabelsLbs : OnboardingDraft.goalLabelsKg
    }

    private var weightGoalBinding: Binding<WeightGoal> {
        Binding(
            get: { profile?.weightGoal ?? .maintain },
            set: { setWeightGoal($0) }
        )
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            FieldLabel("Weight Goal")
            Picker("Weight Goal", selection: weightGoalBinding) {
                ForEach(goalLabels, id: \.value) { Text($0.label).tag($0.value) }
            }
            .pickerStyle(.wheel)
            .frame(height: 132)
            .clipped()

            if activityLevelActive {
                FieldLabel("Activity Level")
                VStack(spacing: Spacing.xs) {
                    ForEach(OnboardingDraft.activityLabels, id: \.value) { item in
                        HStack(spacing: Spacing.sm) {
                            OptionButton(
                                label: item.label,
                                active: (profile?.activityLevel ?? .moderatelyActive) == item.value
                            ) { setActivity(item.value) }
                            Button {
                                info = InfoContent(title: item.label, description: Self.activityInfo[item.value] ?? "")
                            } label: {
                                Image(systemName: "info.circle")
                                    .font(.system(size: 16))
                                    .foregroundStyle(colors.textSecondary)
                                    .padding(Spacing.xs)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
        .padding(Spacing.md)
        .infoSheet($info)
    }

    private func setActivity(_ level: ActivityLevel) {
        guard activityLevelActive, var p = profile else { return }
        p.activityLevel = level
        store.setProfile(p)
    }

    private func setWeightGoal(_ goal: WeightGoal) {
        guard var p = profile else { return }
        p.weightGoal = goal
        store.setProfile(p)
    }

    static let activityInfo: [ActivityLevel: String] = [
        .sedentary: "Little or no exercise; mostly desk work or minimal daily movement. Calorie multiplier: ×1.2",
        .lightlyActive: "Light exercise 1–3 days/week, e.g. walking, light gym sessions. Calorie multiplier: ×1.375",
        .moderatelyActive: "Moderate exercise 3–5 days/week, e.g. jogging, cycling, gym. Calorie multiplier: ×1.55",
        .active: "Hard exercise 6–7 days/week or a physically demanding job. Calorie multiplier: ×1.725",
        .veryActive: "Very hard exercise daily or twice a day; athlete-level training. Calorie multiplier: ×1.9",
    ]
}

// MARK: - Macro section

/// Port of `components/settings/MacroSection.tsx`: preset row + Custom split (steppers + validation)
/// + a live grams preview. Writes the split via `store.setMacroPreset` (only when a custom split
/// totals 100, matching RN).
private struct MacroSectionView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    /// `(adjustedGoalCalories, activityAdjusted)`, or `nil` when there is no base TDEE.
    let goal: (adjusted: Int, activityAdjusted: Bool)?

    @State private var customProtein = ""
    @State private var customCarbs = ""
    @State private var customFat = ""
    @State private var showCalcInfo = false

    private var preset: MacroPreset { store.preferences.macroPreset ?? .balanced }
    private var split: MacroSplit { store.preferences.macroSplit ?? NutritionStats.defaultSplit }
    private var isCustom: Bool { preset == .custom }

    private var goalCalories: Int? { goal?.adjusted }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SettingLabel("Macro Split")
            SettingDescription("Choose how your daily calories are divided between protein, carbs, and fat.")

            HStack(spacing: Spacing.xs) {
                ForEach(OnboardingDraft.macroPresets, id: \.value) { item in
                    OptionButton(label: item.label, active: preset == item.value) {
                        store.setMacroPreset(item.value, split: item.split)
                    }
                }
            }

            OptionButton(label: "Custom", active: isCustom) {
                if !isCustom {
                    store.setMacroPreset(.custom, split: MacroSplit(
                        protein: Double(SettingsLogic.macroInt(customProtein)),
                        carbs: Double(SettingsLogic.macroInt(customCarbs)),
                        fat: Double(SettingsLogic.macroInt(customFat))
                    ))
                }
            }

            if isCustom {
                HStack(spacing: Spacing.sm) {
                    stepper("Protein %", text: $customProtein)
                    stepper("Carbs %", text: $customCarbs)
                    stepper("Fat %", text: $customFat)
                }
                let sum = SettingsLogic.customMacroSum(protein: customProtein, carbs: customCarbs, fat: customFat)
                if sum != 100 {
                    Text("Total must equal 100% (currently \(sum)%)")
                        .font(Typography.small)
                        .foregroundStyle(colors.danger)
                        .frame(maxWidth: .infinity)
                }
            }

            HStack(spacing: Spacing.xs) {
                Text(splitPreview)
                    .font(Typography.small)
                    .foregroundStyle(colors.textSecondary)
                    .frame(maxWidth: .infinity)
                if goalCalories != nil {
                    Button { showCalcInfo = true } label: {
                        Image(systemName: "info.circle").font(.system(size: 16)).foregroundStyle(colors.textSecondary)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(Spacing.md)
        .onAppear { syncCustomFields() }
        .onChange(of: split) { _, _ in syncCustomFields() }
        .alert("How are these calculated?", isPresented: $showCalcInfo) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(goal?.activityAdjusted == true
                 ? "Gram targets are based on your profile, latest weight, and your average calories burned across days with activity in the last 7 days."
                 : "Gram targets are based on your profile and latest weight. Log activity to include exercise calories.")
        }
    }

    private var splitPreview: String {
        let p = Int(split.protein), c = Int(split.carbs), f = Int(split.fat)
        return "P: \(p)% (\(SettingsLogic.gramsLabel(pct: p, goalCalories: goalCalories, calPerGram: 4)))"
             + " · C: \(c)% (\(SettingsLogic.gramsLabel(pct: c, goalCalories: goalCalories, calPerGram: 4)))"
             + " · F: \(f)% (\(SettingsLogic.gramsLabel(pct: f, goalCalories: goalCalories, calPerGram: 9)))"
    }

    private func stepper(_ label: String, text: Binding<String>) -> some View {
        VStack(spacing: Spacing.xs) {
            Text(label).font(Typography.small).foregroundStyle(colors.textSecondary)
            HStack(spacing: 4) {
                stepButton("minus") { step(text, by: -1) }
                TextField("", text: text)
                    .font(Typography.body)
                    .foregroundStyle(colors.text)
                    .multilineTextAlignment(.center)
                    .keyboardType(.numberPad)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Spacing.sm)
                    .background(colors.background)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                    .onChange(of: text.wrappedValue) { _, _ in commitCustom() }
                stepButton("plus") { step(text, by: 1) }
            }
        }
    }

    private func stepButton(_ icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(colors.primary)
                .frame(width: 32, height: 36)
                .background(colors.background)
                .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func step(_ text: Binding<String>, by delta: Int) {
        text.wrappedValue = String(SettingsLogic.clampPercent(SettingsLogic.macroInt(text.wrappedValue) + delta))
        commitCustom()
    }

    /// RN: dispatch the custom split only when the three fields total exactly 100.
    private func commitCustom() {
        let p = SettingsLogic.macroInt(customProtein)
        let c = SettingsLogic.macroInt(customCarbs)
        let f = SettingsLogic.macroInt(customFat)
        if p + c + f == 100 {
            store.setMacroPreset(.custom, split: MacroSplit(protein: Double(p), carbs: Double(c), fat: Double(f)))
        }
    }

    private func syncCustomFields() {
        customProtein = String(Int(split.protein))
        customCarbs = String(Int(split.carbs))
        customFat = String(Int(split.fat))
    }
}

// MARK: - Daily water goal

/// Port of the Daily Water Goal card in `nutrition-goals-modal.tsx`: Auto/Manual toggle, the
/// creatine adjustment (Auto), and the manual override field + transient "Saved!" state.
private struct DailyWaterGoalView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    @State private var input: String
    @State private var saved = false
    @State private var invalidAlert = false

    init() {
        // Seed from the stored override; re-seeded implicitly on appear via the store reads below.
        _input = State(initialValue: "")
    }

    private var unit: WeightUnit { store.preferences.unit }
    private var mode: WaterGoalMode {
        store.preferences.waterGoalMode ?? (store.preferences.waterGoalOverride != nil ? .manual : .auto)
    }

    private var modeBinding: Binding<WaterGoalMode> {
        Binding(get: { mode }, set: { store.setWaterGoalMode($0) })
    }
    private var creatineBinding: Binding<Bool> {
        Binding(get: { store.preferences.waterCreatineAdjustment ?? false }, set: { store.setWaterCreatine($0) })
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SettingLabel("Daily Water Goal")
            SettingDescription("Auto-calculates from your weight and activity level. Switch to Manual to set a custom goal.")

            SettingsToggle(options: [(.auto, "Auto"), (.manual, "Manual")], selection: modeBinding)

            if mode == .auto {
                HStack(alignment: .top, spacing: Spacing.md) {
                    VStack(alignment: .leading, spacing: Spacing.xs) {
                        SettingLabel("Creatine Adjustment")
                        SettingDescription("Adds +\(SettingsLogic.creatineAmountLabel(unit: unit)) to your daily goal.")
                    }
                    SettingsToggle(options: [(false, "Off"), (true, "On")], selection: creatineBinding)
                        .frame(width: 100)
                }
                .padding(.top, Spacing.xs)
            }

            if mode == .manual {
                HStack(spacing: Spacing.sm) {
                    TextField(SettingsLogic.waterGoalPlaceholder(unit: unit), text: $input)
                        .font(Typography.body)
                        .foregroundStyle(colors.text)
                        .keyboardType(.numberPad)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(colors.background)
                        .overlay(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous).strokeBorder(colors.border, lineWidth: 1))
                        .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                    SettingsActionButton(title: saved ? "Saved!" : "Save", tint: saved ? Color(hex: "#2E7D32") : nil) { save() }
                        .frame(width: 96)
                }
                .padding(.top, Spacing.xs)
            }
        }
        .padding(Spacing.md)
        .onAppear {
            if let override = store.preferences.waterGoalOverride { input = WeightStats.jsNumberString(override) }
        }
        .alert("Invalid", isPresented: $invalidAlert) {
            Button("OK", role: .cancel) {}
        } message: { Text("Please enter a positive number.") }
    }

    private func save() {
        switch SettingsLogic.waterGoalSave(from: input) {
        case .clear:
            store.setWaterGoalOverride(nil)
            flashSaved()
        case .set(let value):
            store.setWaterGoalOverride(value)
            flashSaved()
        case .invalid:
            invalidAlert = true
        }
    }

    private func flashSaved() {
        saved = true
        Task {
            try? await Task.sleep(for: .seconds(1.2))
            saved = false
        }
    }
}
