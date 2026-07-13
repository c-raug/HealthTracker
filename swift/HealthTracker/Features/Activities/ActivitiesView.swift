import SwiftUI

/// Activities tab (Phase 9). Port of `expo/app/(tabs)/activities.tsx`.
///
/// Date-nav → auto-mode reference warning → a 2-page pager (the burn **flame** ↔ the 7-day activity
/// graph) → mode-specific logging (**Smart Watch** = a single calories field; otherwise collapsible
/// **Log Exercise** duration wheels + **Log Steps**) → the **Today's Activities** list with a
/// per-row "logged under a different mode" warning. All the non-UI math lives in the pure
/// `ActivityStats` / `ActivityCalories`; writes go through `store.addActivity` / `deleteActivity` /
/// `dismissActivityWarning`. No XP is granted here (a Phase-12 gamification-watcher concern).
struct ActivitiesView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    var onXpTap: () -> Void

    @State private var pagerPage = 0
    @State private var didInitCollapse = false
    @State private var exerciseCollapsed = true
    @State private var stepsCollapsed = true

    // Exercise form
    @State private var selectedHours = 0
    @State private var selectedMinutes = 30

    // Steps form
    @State private var stepsInput = ""
    @FocusState private var stepsFocused: Bool

    // Smartwatch form
    @State private var smartwatchInput = ""
    @State private var showSavedConfirmation = false
    @State private var savedHideTask: Task<Void, Never>?
    @FocusState private var smartwatchFocused: Bool

    private var profile: UserProfile? { store.preferences.profile }
    private var latestWeight: WeightEntry? { NutritionStats.latestWeight(store.entries) }
    private var activityMode: ActivityMode { store.preferences.activityMode ?? .auto }

    private var dayActivity: DayActivity? {
        store.activityLog.first { $0.date == store.selectedDate }
    }
    private var totalBurned: Int { ActivityStats.totalBurned(dayActivity) }
    private var totalDurationMinutes: Int { selectedHours * 60 + selectedMinutes }

    var body: some View {
        CollapsibleScreen(title: "Activities", onXpTap: onXpTap) {
            DateNavBar()

            if profile == nil || latestWeight == nil {
                ProfilePromptView(message: "Set up your profile and log a weight entry to start tracking activity calories.")
                    .padding(.top, Spacing.md)
            } else {
                if activityMode == .auto { autoWarning }
                pager
                if activityMode == .smartwatch {
                    smartwatchCard
                } else {
                    exerciseCard
                    stepsCard
                    activityList
                }
            }
        }
        .onAppear {
            pagerPage = 0
            if !didInitCollapse {
                let expanded = store.preferences.sectionsExpanded ?? false
                exerciseCollapsed = !expanded
                stepsCollapsed = !expanded
                didInitCollapse = true
            }
            prefillSmartwatch()
        }
        .onDisappear {
            if store.preferences.sectionsExpanded != true {
                exerciseCollapsed = true
                stepsCollapsed = true
            }
        }
        .onChange(of: store.selectedDate) { prefillSmartwatch() }
    }

    // MARK: - Auto-mode warning

    private var autoWarning: some View {
        HStack(alignment: .top, spacing: Spacing.xs) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 13))
                .foregroundStyle(colors.danger)
            Text("You're in Auto mode — activities logged here are for reference only and won't affect your calorie target.")
                .font(Typography.small)
                .foregroundStyle(colors.danger)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(Spacing.sm)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(colors.dangerLight, in: RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
    }

    // MARK: - Pager (flame ↔ weekly graph)

    private var pager: some View {
        VStack(spacing: Spacing.sm) {
            TabView(selection: $pagerPage) {
                CalorieFlameView(totalBurned: totalBurned)
                    .frame(maxWidth: .infinity)
                    .tag(0)

                WeeklyBarChart(
                    title: "Calories Burned — 7 Days",
                    points: ActivityStats.weeklyActivitySeries(
                        activityLog: store.activityLog,
                        selectedDate: store.selectedDate
                    ),
                    goalLine: nil,
                    coloring: .fixed(colors.primary)
                )
                .frame(maxWidth: .infinity)
                .tag(1)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: 260)

            HStack(spacing: 6) {
                ForEach(0..<2, id: \.self) { i in
                    Circle()
                        .fill(pagerPage == i ? colors.primary : colors.border)
                        .frame(width: 6, height: 6)
                }
            }
        }
    }

    // MARK: - Smart Watch card

    private var smartwatchCard: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Calories Burned")
                .font(Typography.h3)
                .foregroundStyle(colors.text)

            HStack(spacing: Spacing.sm) {
                TextField("e.g. 450", text: $smartwatchInput)
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.center)
                    .focused($smartwatchFocused)
                    .submitLabel(.done)
                    .onSubmit(saveSmartwatch)
                    .font(Typography.h3)
                    .foregroundStyle(colors.text)
                    .padding(.horizontal, Spacing.md)
                    .padding(.vertical, Spacing.sm)
                    .background(colors.background, in: RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                            .strokeBorder(colors.border, lineWidth: 1)
                    )

                Button(action: saveSmartwatch) {
                    Text("Save")
                        .font(Typography.body.weight(.semibold))
                        .foregroundStyle(colors.white)
                        .frame(width: 74)
                        .padding(.vertical, Spacing.sm)
                        .background(colors.primary, in: RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(smartwatchSaveDisabled)
                .opacity(smartwatchSaveDisabled ? 0.5 : 1)
            }

            if showSavedConfirmation {
                HStack(spacing: Spacing.xs) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(colors.primary)
                    Text("Entry saved")
                        .font(Typography.small)
                        .foregroundStyle(colors.primary)
                }
                .padding(.horizontal, Spacing.sm)
                .padding(.vertical, Spacing.xs)
                .background(colors.primaryLight, in: RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .featureCardStyle()
    }

    private var smartwatchSaveDisabled: Bool {
        ActivityStats.smartwatchSaveDisabled(
            input: smartwatchInput,
            existingCalories: ActivityStats.smartwatchEntry(dayActivity)?.caloriesBurned
        )
    }

    // MARK: - Log Exercise card

    private var exerciseCard: some View {
        VStack(spacing: 0) {
            sectionHeader(title: "Log Exercise", collapsed: exerciseCollapsed) {
                withAnimation(.easeInOut(duration: 0.2)) { exerciseCollapsed.toggle() }
            }

            if !exerciseCollapsed {
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Exercise Type")
                        .font(Typography.small)
                        .foregroundStyle(colors.textSecondary)
                    Text("Weight Lifting")
                        .font(Typography.body.weight(.semibold))
                        .foregroundStyle(colors.white)
                        .padding(.vertical, Spacing.xs)
                        .padding(.horizontal, Spacing.md)
                        .background(colors.primary, in: RoundedRectangle(cornerRadius: Radius.md, style: .continuous))

                    Text("Duration")
                        .font(Typography.small)
                        .foregroundStyle(colors.textSecondary)
                    HStack(spacing: Spacing.lg) {
                        durationWheel(label: "Hours", selection: $selectedHours, range: 0...5)
                        durationWheel(label: "Minutes", selection: $selectedMinutes, range: 0...59)
                    }
                    .frame(maxWidth: .infinity)

                    let preview = ActivityStats.exercisePreview(durationMinutes: totalDurationMinutes, latestWeight: latestWeight)
                    if preview > 0 { burnPreview(preview) }

                    addButton(title: "Add Exercise", disabled: totalDurationMinutes == 0, action: addExercise)
                }
                .padding(.horizontal, Spacing.md)
                .padding(.bottom, Spacing.md)
            }
        }
        .featureCardStyle(padding: 0)
    }

    private func durationWheel(label: String, selection: Binding<Int>, range: ClosedRange<Int>) -> some View {
        VStack(spacing: Spacing.xs) {
            Text(label)
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
            Picker(label, selection: selection) {
                ForEach(range, id: \.self) { Text("\($0)").tag($0) }
            }
            .pickerStyle(.wheel)
            .frame(width: 90, height: 132)
            .background(colors.background)
            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
        }
    }

    // MARK: - Log Steps card

    private var stepsCard: some View {
        VStack(spacing: 0) {
            sectionHeader(title: "Log Steps", collapsed: stepsCollapsed) {
                withAnimation(.easeInOut(duration: 0.2)) { stepsCollapsed.toggle() }
            }

            if !stepsCollapsed {
                VStack(spacing: Spacing.sm) {
                    let stepsCount = ActivityStats.jsParseInt(stepsInput)
                    let stepsInvalid = (stepsCount ?? 0) <= 0
                    HStack(spacing: Spacing.sm) {
                        TextField("Enter step count", text: $stepsInput)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.center)
                            .focused($stepsFocused)
                            .font(Typography.h3)
                            .foregroundStyle(colors.text)
                            .padding(.horizontal, Spacing.md)
                            .padding(.vertical, Spacing.sm)
                            .background(colors.background, in: RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                                    .strokeBorder(colors.border, lineWidth: 1)
                            )

                        Button(action: addSteps) {
                            Text("Add Steps")
                                .font(Typography.body.weight(.semibold))
                                .foregroundStyle(colors.white)
                                .frame(width: 90)
                                .padding(.vertical, Spacing.sm)
                                .background(colors.primary, in: RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                        }
                        .buttonStyle(.plain)
                        .disabled(stepsInvalid)
                        .opacity(stepsInvalid ? 0.5 : 1)
                    }

                    let preview = ActivityStats.stepsPreview(stepsInput: stepsInput, latestWeight: latestWeight)
                    if preview > 0 { burnPreview(preview) }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.bottom, Spacing.md)
            }
        }
        .featureCardStyle(padding: 0)
    }

    // MARK: - Today's Activities list

    private var activityList: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Today's Activities")
                    .font(Typography.h3)
                    .foregroundStyle(colors.text)
                Spacer()
            }
            .padding(Spacing.md)

            if let day = dayActivity, !day.activities.isEmpty {
                ForEach(Array(day.activities.enumerated()), id: \.element.id) { index, activity in
                    let isLast = index == day.activities.count - 1
                    let warn = ActivityStats.showWarning(for: activity, mode: activityMode)
                    activityRow(activity, showBottomBorder: warn || !isLast)
                    if warn { warningRow(activity, showBottomBorder: !isLast) }
                }
            } else {
                Text("No activities logged")
                    .font(Typography.body)
                    .foregroundStyle(colors.textSecondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Spacing.lg)
            }
        }
        .featureCardStyle(padding: 0)
    }

    private func activityRow(_ activity: ActivityEntry, showBottomBorder: Bool) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(ActivityStats.label(for: activity))
                    .font(Typography.body.weight(.medium))
                    .foregroundStyle(colors.text)
                Text(ActivityStats.detail(for: activity))
                    .font(Typography.small)
                    .foregroundStyle(colors.textSecondary)
            }
            Spacer()
            Text("\(activity.caloriesBurned) cal")
                .font(Typography.body.weight(.semibold))
                .foregroundStyle(colors.primary)
            Button {
                store.deleteActivity(date: store.selectedDate, activityId: activity.id)
            } label: {
                Image(systemName: "trash")
                    .font(.system(size: 18))
                    .foregroundStyle(colors.danger)
            }
            .buttonStyle(.plain)
            .padding(.leading, Spacing.xs)
        }
        .padding(.vertical, Spacing.sm)
        .padding(.horizontal, Spacing.md)
        .overlay(alignment: .bottom) {
            if showBottomBorder { Rectangle().fill(colors.border).frame(height: 1) }
        }
    }

    private func warningRow(_ activity: ActivityEntry, showBottomBorder: Bool) -> some View {
        HStack {
            Text("⚠ Logged under \(ActivityStats.modeLabel(activity.loggedWithMode ?? .auto)) mode — data may no longer be accurate")
                .font(Typography.small)
                .foregroundStyle(colors.danger)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: Spacing.xs)
            Button {
                store.dismissActivityWarning(date: store.selectedDate, activityId: activity.id)
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(colors.danger)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, Spacing.md)
        .padding(.vertical, Spacing.xs)
        .background(colors.dangerLight)
        .overlay(alignment: .bottom) {
            if showBottomBorder { Rectangle().fill(colors.border).frame(height: 1) }
        }
    }

    // MARK: - Shared bits

    private func sectionHeader(title: String, collapsed: Bool, toggle: @escaping () -> Void) -> some View {
        Button(action: toggle) {
            HStack {
                Text(title)
                    .font(Typography.h3)
                    .foregroundStyle(colors.text)
                Spacer()
                Image(systemName: collapsed ? "chevron.right" : "chevron.down")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(colors.textSecondary)
            }
            .padding(Spacing.md)
        }
        .buttonStyle(.plain)
    }

    private func burnPreview(_ cals: Int) -> some View {
        HStack(spacing: Spacing.xs) {
            Image(systemName: "flame")
                .font(.system(size: 15))
                .foregroundStyle(colors.primary)
            Text("~\(cals) cal burned")
                .font(Typography.body.weight(.semibold))
                .foregroundStyle(colors.primary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.sm)
        .background(colors.primaryLight, in: RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
    }

    private func addButton(title: String, disabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(Typography.body.weight(.semibold))
                .foregroundStyle(colors.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.sm)
                .background(colors.primary, in: RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(disabled)
        .opacity(disabled ? 0.5 : 1)
    }

    // MARK: - Actions

    private func addExercise() {
        guard totalDurationMinutes > 0, let w = latestWeight else { return }
        let cals = ActivityCalories.exercise(durationMinutes: Double(totalDurationMinutes), weightValue: w.weight, weightUnit: w.unit)
        let entry = ActivityEntry(
            id: Identifiers.generate(),
            type: .exercise,
            exerciseType: .weightLifting,
            durationMinutes: totalDurationMinutes,
            steps: nil,
            caloriesBurned: cals,
            loggedWithMode: nil,
            warningDismissed: nil
        )
        store.addActivity(date: store.selectedDate, activity: entry)
        selectedHours = 0
        selectedMinutes = 30
    }

    private func addSteps() {
        stepsFocused = false
        guard let steps = ActivityStats.jsParseInt(stepsInput), steps > 0, let w = latestWeight else { return }
        let cals = ActivityCalories.steps(Double(steps), weightValue: w.weight, weightUnit: w.unit)
        let entry = ActivityEntry(
            id: Identifiers.generate(),
            type: .steps,
            exerciseType: nil,
            durationMinutes: nil,
            steps: steps,
            caloriesBurned: cals,
            loggedWithMode: nil,
            warningDismissed: nil
        )
        store.addActivity(date: store.selectedDate, activity: entry)
        stepsInput = ""
    }

    private func saveSmartwatch() {
        smartwatchFocused = false
        guard let cals = ActivityStats.jsParseInt(smartwatchInput), cals >= 0 else { return }

        // One smartwatch entry per day: remove the existing one first, then add if non-zero.
        if let existing = ActivityStats.smartwatchEntry(dayActivity) {
            store.deleteActivity(date: store.selectedDate, activityId: existing.id)
        }
        if cals > 0 {
            let entry = ActivityEntry(
                id: Identifiers.generate(),
                type: .smartwatch,
                exerciseType: nil,
                durationMinutes: nil,
                steps: nil,
                caloriesBurned: cals,
                loggedWithMode: nil,
                warningDismissed: nil
            )
            store.addActivity(date: store.selectedDate, activity: entry)
        }

        savedHideTask?.cancel()
        showSavedConfirmation = true
        savedHideTask = Task {
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            if !Task.isCancelled { showSavedConfirmation = false }
        }
    }

    private func prefillSmartwatch() {
        smartwatchInput = ActivityStats.smartwatchEntry(dayActivity).map { String($0.caloriesBurned) } ?? ""
    }
}
