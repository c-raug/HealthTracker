import SwiftUI

/// 5-step profile setup — port of `expo/app/onboarding.tsx`. Pushed from `WelcomeView`. On the last
/// step, **Complete Setup** writes everything to the store (unit, profile, macro split, starting
/// weight entry, auto activity mode) and flips `onboardingComplete`, which drops the user into the
/// tab shell via `RootView`.
struct OnboardingView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    @State private var draft = OnboardingDraft()
    @State private var step = 1
    @State private var showDobPicker = false
    @FocusState private var fieldFocused: Bool

    private var isLastStep: Bool { step == OnboardingDraft.totalSteps }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    progressDots
                        .padding(.bottom, Spacing.xl)

                    stepContent
                }
                .padding(.horizontal, Spacing.lg)
                .padding(.top, Spacing.lg)
            }
            .scrollDismissesKeyboard(.interactively)

            footer
        }
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("Set Up Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { fieldFocused = false }
            }
        }
        .sheet(isPresented: $showDobPicker) { dobPickerSheet }
    }

    // MARK: - Progress dots

    private var progressDots: some View {
        HStack(spacing: Spacing.sm) {
            ForEach(0..<OnboardingDraft.totalSteps, id: \.self) { i in
                Circle()
                    .fill((i + 1) <= step ? colors.primary : colors.border)
                    .frame(width: 10, height: 10)
            }
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Step content

    @ViewBuilder
    private var stepContent: some View {
        switch step {
        case 1: step1
        case 2: step2
        case 3: step3
        case 4: step4
        default: step5
        }
    }

    private func stepHeader(_ title: String, _ subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(title)
                .font(Typography.h2)
                .foregroundStyle(colors.text)
            Text(subtitle)
                .font(Typography.body)
                .foregroundStyle(colors.textSecondary)
        }
        .padding(.bottom, Spacing.lg)
    }

    // Step 1 — unit + name
    private var step1: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            stepHeader("Welcome", "Let's get you set up. First, choose your preferred unit and optionally enter your name.")

            FieldLabel("Weight Unit")
            SegmentedToggle(
                options: [(.lbs, "lbs"), (.kg, "kg")],
                selection: $draft.unit
            )

            FieldLabel("Name (optional)")
            OnboardingTextField(
                placeholder: "Your name",
                text: $draft.name,
                autocapitalization: .words
            )
            .focused($fieldFocused)
        }
    }

    // Step 2 — dob, sex, height
    private var step2: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            stepHeader("About You", "We need some basic information to calculate your daily calorie target.")

            FieldLabel("Date of Birth")
            Button {
                fieldFocused = false
                showDobPicker = true
            } label: {
                Text(draft.dob.map(Self.formatDob) ?? "Select date of birth")
                    .font(Typography.body)
                    .foregroundStyle(draft.dob == nil ? colors.textSecondary : colors.text)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, Spacing.md)
                    .padding(.vertical, Spacing.sm + 2)
                    .background(colors.card)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
            }
            .buttonStyle(.plain)

            FieldLabel("Sex")
            SegmentedToggle(
                options: [(.male, "Male"), (.female, "Female")],
                selection: $draft.sex
            )

            FieldLabel("Height")
            if draft.isImperial {
                HStack(spacing: Spacing.sm) {
                    OnboardingTextField(placeholder: "ft", text: $draft.heightFt, keyboard: .numberPad)
                        .focused($fieldFocused)
                    OnboardingTextField(placeholder: "in", text: $draft.heightIn, keyboard: .numberPad)
                        .focused($fieldFocused)
                }
            } else {
                OnboardingTextField(placeholder: "cm", text: $draft.heightCm, keyboard: .decimalPad)
                    .focused($fieldFocused)
            }
        }
    }

    // Step 3 — activity level + weight goal
    private var step3: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            stepHeader("Your Goals", "Set your activity level and weight goal to personalize your calorie target.")

            FieldLabel("Activity Level")
            VStack(spacing: Spacing.xs) {
                ForEach(OnboardingDraft.activityLabels, id: \.value) { item in
                    OptionButton(label: item.label, active: draft.activityLevel == item.value) {
                        draft.activityLevel = item.value
                    }
                }
            }

            FieldLabel("Weight Goal")
            VStack(spacing: Spacing.xs) {
                ForEach(draft.goalLabels(), id: \.value) { item in
                    OptionButton(label: item.label, active: draft.weightGoal == item.value) {
                        draft.weightGoal = item.value
                    }
                }
            }
        }
    }

    // Step 4 — macro split
    private var step4: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            stepHeader("Nutrition", "Choose how your daily calories are divided between protein, carbs, and fat.")

            HStack(spacing: Spacing.xs) {
                ForEach(OnboardingDraft.macroPresets, id: \.value) { preset in
                    OptionButton(label: preset.label, active: draft.macroPreset == preset.value) {
                        draft.macroPreset = preset.value
                        draft.macroSplit = preset.split
                    }
                }
            }

            OptionButton(label: "Custom", active: draft.macroPreset == .custom) {
                draft.macroPreset = .custom
                draft.macroSplit = MacroSplit(
                    protein: Double(Int(draft.customProtein) ?? 0),
                    carbs: Double(Int(draft.customCarbs) ?? 0),
                    fat: Double(Int(draft.customFat) ?? 0)
                )
            }

            if draft.macroPreset == .custom {
                HStack(spacing: Spacing.sm) {
                    macroStepper("Protein %", value: $draft.customProtein, field: \.protein)
                    macroStepper("Carbs %", value: $draft.customCarbs, field: \.carbs)
                    macroStepper("Fat %", value: $draft.customFat, field: \.fat)
                }
                if draft.customSum != 100 {
                    Text("Total must equal 100% (currently \(draft.customSum)%)")
                        .font(Typography.small)
                        .foregroundStyle(colors.danger)
                        .frame(maxWidth: .infinity)
                }
            }

            Text(splitDescription)
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
                .frame(maxWidth: .infinity)

            Button {
                draft.macroPreset = .balanced
                draft.macroSplit = MacroSplit(protein: 30, carbs: 40, fat: 30)
                step = 5
            } label: {
                Text("Skip — use Balanced defaults")
                    .font(Typography.small)
                    .underline()
                    .foregroundStyle(colors.textSecondary)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.plain)
            .padding(.top, Spacing.xs)
        }
    }

    // Step 5 — starting weight
    private var step5: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            stepHeader("Starting Weight", "Enter your current weight to complete your profile setup.")

            HStack(spacing: Spacing.sm) {
                TextField(draft.isImperial ? "150" : "70", text: $draft.weight)
                    .font(Typography.h2)
                    .foregroundStyle(colors.text)
                    .multilineTextAlignment(.center)
                    .keyboardType(.decimalPad)
                    .focused($fieldFocused)
                    .padding(.horizontal, Spacing.md)
                    .padding(.vertical, Spacing.sm)
                    .background(colors.card)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                Text(draft.unit.rawValue)
                    .font(Typography.h3)
                    .foregroundStyle(colors.textSecondary)
            }
        }
    }

    // MARK: - Macro stepper

    private func macroStepper(_ label: String, value: Binding<String>, field: WritableKeyPath<MacroSplit, Double>) -> some View {
        VStack(spacing: Spacing.xs) {
            Text(label)
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
            HStack(spacing: 4) {
                stepperButton("−") { adjustMacro(value: value, field: field, delta: -1) }
                TextField("", text: value)
                    .font(Typography.body)
                    .foregroundStyle(colors.text)
                    .multilineTextAlignment(.center)
                    .keyboardType(.numberPad)
                    .focused($fieldFocused)
                    .onChange(of: value.wrappedValue) { _, newValue in
                        syncCustomMacro(value: value, field: field, raw: newValue)
                    }
                    .padding(.vertical, Spacing.sm)
                    .background(colors.card)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                stepperButton("+") { adjustMacro(value: value, field: field, delta: 1) }
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func stepperButton(_ symbol: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(symbol)
                .font(Typography.h3)
                .foregroundStyle(colors.primary)
                .frame(width: 32, height: 36)
                .background(colors.card)
                .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func adjustMacro(value: Binding<String>, field: WritableKeyPath<MacroSplit, Double>, delta: Int) {
        let current = Int(value.wrappedValue) ?? 0
        let clamped = max(0, min(100, current + delta))
        value.wrappedValue = String(clamped)
        syncCustomMacro(value: value, field: field, raw: String(clamped))
    }

    /// Keep `draft.macroSplit` in sync with the custom fields (RN `handleCustomChange`).
    private func syncCustomMacro(value: Binding<String>, field: WritableKeyPath<MacroSplit, Double>, raw: String) {
        var split = MacroSplit(
            protein: Double(Int(draft.customProtein) ?? 0),
            carbs: Double(Int(draft.customCarbs) ?? 0),
            fat: Double(Int(draft.customFat) ?? 0)
        )
        split[keyPath: field] = Double(Int(raw) ?? 0)
        draft.macroSplit = split
        if split.protein + split.carbs + split.fat == 100 {
            draft.macroPreset = .custom
        }
    }

    private var splitDescription: String {
        let s = draft.effectiveSplit
        return "P: \(Int(s.protein))% · C: \(Int(s.carbs))% · F: \(Int(s.fat))%"
    }

    // MARK: - Footer

    private var footer: some View {
        HStack {
            if step > 1 {
                Button {
                    fieldFocused = false
                    step -= 1
                } label: {
                    Text("Back")
                        .font(Typography.bodyMedium)
                        .foregroundStyle(colors.textSecondary)
                        .padding(.vertical, 12)
                        .padding(.horizontal, Spacing.lg)
                        .background(colors.card)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                }
                .buttonStyle(.plain)
            }

            Spacer()

            Button {
                handlePrimary()
            } label: {
                Text(isLastStep ? "Complete Setup" : "Next")
                    .font(Typography.bodyMedium)
                    .foregroundStyle(colors.white)
                    .padding(.vertical, 12)
                    .padding(.horizontal, Spacing.xl)
                    .background(colors.primary)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                    .shadow(color: colors.primary.opacity(0.25), radius: 4, x: 0, y: 2)
            }
            .buttonStyle(.plain)
            .opacity(draft.isNextDisabled(step: step) ? 0.5 : 1)
            .disabled(draft.isNextDisabled(step: step))
        }
        .padding(.horizontal, Spacing.lg)
        .padding(.top, Spacing.sm)
        .padding(.bottom, Spacing.lg)
    }

    private func handlePrimary() {
        fieldFocused = false
        if isLastStep {
            complete()
        } else {
            step += 1
        }
    }

    private func complete() {
        guard let entry = draft.makeWeightEntry() else { return }
        store.setUnit(draft.unit)
        store.setProfile(draft.makeProfile())
        store.setMacroPreset(draft.macroPreset, split: draft.macroSplit)
        store.upsertEntry(entry)
        store.setActivityMode(.auto)
        store.setOnboardingComplete()
    }

    // MARK: - DOB picker

    private var dobPickerSheet: some View {
        NavigationStack {
            DatePicker(
                "Date of Birth",
                selection: dobBinding,
                in: ...Self.maxDob,
                displayedComponents: .date
            )
            .datePickerStyle(.wheel)
            .labelsHidden()
            .padding()
            .frame(maxHeight: .infinity, alignment: .center)
            .navigationTitle("Date of Birth")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { showDobPicker = false }
                }
            }
        }
        .presentationDetents([.medium])
    }

    private var dobBinding: Binding<Date> {
        Binding(
            get: { draft.dob.flatMap(Self.date(from:)) ?? Self.defaultDob },
            set: { draft.dob = Self.key(from: $0) }
        )
    }

    // MARK: - Date helpers (bridge "YYYY-MM-DD" ↔ Date)

    private static let keyFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static let displayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US")
        f.timeZone = .current
        f.dateFormat = "MMM d, yyyy"
        return f
    }()

    private static func date(from key: String) -> Date? { keyFormatter.date(from: key) }
    private static func key(from date: Date) -> String { keyFormatter.string(from: date) }
    private static func formatDob(_ key: String) -> String {
        date(from: key).map { displayFormatter.string(from: $0) } ?? key
    }

    /// Latest allowed DOB — 10 years ago (RN `maxDob`).
    private static var maxDob: Date {
        Calendar.current.date(byAdding: .year, value: -10, to: Date()) ?? Date()
    }

    /// Default wheel value when no DOB is chosen — 30 years ago (RN `dobPickerValue`).
    private static var defaultDob: Date {
        Calendar.current.date(byAdding: .year, value: -30, to: Date()) ?? Date()
    }
}

#Preview {
    NavigationStack { OnboardingView() }
        .environment(AppTheme())
        .environment(AppStore())
        .environment(\.appColors, AppColors.resolve(scheme: .light, accentHex: nil))
}
