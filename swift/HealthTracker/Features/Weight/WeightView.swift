import SwiftUI

/// Weight tracking tab (Phase 6). Port of `expo/app/(tabs)/index.tsx`:
/// date-nav → a 2-page pager (digital scale ↔ trend chart) → a Log Weight card → 7-day insights.
struct WeightView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    var onXpTap: () -> Void

    @State private var weightInput = ""
    @State private var showSavedConfirmation = false
    @State private var animateToValue: Double?
    @State private var pagerPage = 0
    @State private var alertMessage: String?
    @State private var savedTask: Task<Void, Never>?
    @FocusState private var inputFocused: Bool

    private static let pagerHeight: CGFloat = 360

    private var unit: WeightUnit { store.preferences.unit }
    private var existingEntry: WeightEntry? {
        store.entries.first { $0.date == store.selectedDate }
    }
    private var scaleWeightString: String {
        WeightStats.displayString(for: existingEntry, unit: unit)
    }
    private var saveDisabled: Bool {
        WeightStats.isSaveDisabled(input: weightInput, existing: existingEntry, unit: unit)
    }

    var body: some View {
        CollapsibleScreen(title: "Weight", onXpTap: onXpTap) {
            DateNavBar()
            pager
            logCard
            WeightInsightsView()
        }
        .onAppear { prefillInput() }
        .onChange(of: store.selectedDate) {
            animateToValue = nil          // reset count-up on date change (RN effect on [selectedDate])
            showSavedConfirmation = false
            prefillInput()
        }
        .onChange(of: store.entries) { prefillInput() }
        .alert("Invalid Weight", isPresented: Binding(
            get: { alertMessage != nil },
            set: { if !$0 { alertMessage = nil } }
        )) {
            Button("OK", role: .cancel) { alertMessage = nil }
        } message: {
            Text(alertMessage ?? "")
        }
    }

    // MARK: - Pager (scale ↔ chart)

    private var pager: some View {
        VStack(spacing: Spacing.sm) {
            TabView(selection: $pagerPage) {
                DigitalScaleView(
                    weight: scaleWeightString,
                    unit: unit.rawValue,
                    animateToValue: animateToValue,
                    size: (Self.pagerHeight * 0.6).rounded()
                )
                .frame(maxWidth: .infinity)
                .tag(0)

                WeightChartView()
                    .frame(maxWidth: .infinity)
                    .tag(1)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: Self.pagerHeight)

            HStack(spacing: 6) {
                ForEach(0..<2, id: \.self) { i in
                    Circle()
                        .fill(pagerPage == i ? colors.primary : colors.border)
                        .frame(width: 6, height: 6)
                }
            }
        }
    }

    // MARK: - Log Weight card

    private var logCard: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Log Weight (\(unit.rawValue))")
                .font(Typography.h3)
                .foregroundStyle(colors.text)

            HStack(spacing: Spacing.sm) {
                TextField(unit == .lbs ? "e.g. 175.5" : "e.g. 80.0", text: $weightInput)
                    .font(Typography.h3)
                    .foregroundStyle(colors.text)
                    .multilineTextAlignment(.center)
                    .keyboardType(.decimalPad)
                    .focused($inputFocused)
                    .submitLabel(.done)
                    .onChange(of: weightInput) { showSavedConfirmation = false }
                    .padding(.horizontal, Spacing.md)
                    .padding(.vertical, Spacing.sm)
                    .background(colors.background)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                            .strokeBorder(colors.border, lineWidth: 1)
                    )

                Button(action: handleSave) {
                    Text("Save")
                        .font(Typography.bodyMedium)
                        .foregroundStyle(colors.white)
                        .frame(width: 90)
                        .padding(.vertical, Spacing.sm)
                        .background(colors.primary)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                        .opacity(saveDisabled ? 0.5 : 1)
                }
                .buttonStyle(.plain)
                .disabled(saveDisabled)
            }

            if showSavedConfirmation {
                HStack(spacing: Spacing.xs) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(colors.primary)
                    Text("Weight saved")
                        .font(Typography.small.weight(.semibold))
                        .foregroundStyle(colors.primary)
                }
                .padding(.horizontal, Spacing.sm)
                .padding(.vertical, Spacing.xs)
                .background(colors.primaryLight)
                .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .featureCardStyle()
    }

    // MARK: - Actions

    private func prefillInput() {
        weightInput = scaleWeightString
    }

    private func handleSave() {
        switch WeightStats.validate(weightInput, unit: unit) {
        case .invalidNumber:
            alertMessage = "Please enter a valid weight."
        case let .outOfRange(minValue, maxValue):
            alertMessage = "Weight must be between \(WeightStats.jsNumberString(minValue)) and \(WeightStats.jsNumberString(maxValue)) \(unit.rawValue)."
        case let .valid(parsed):
            let entry = WeightEntry(
                id: existingEntry?.id ?? Identifiers.generate(),
                date: store.selectedDate,
                weight: parsed,
                unit: unit,
                createdAt: Dates.nowTimestamp()
            )
            store.upsertEntry(entry)
            inputFocused = false
            animateToValue = parsed

            savedTask?.cancel()
            showSavedConfirmation = true
            savedTask = Task { @MainActor in
                try? await Task.sleep(for: .seconds(3))
                if !Task.isCancelled { showSavedConfirmation = false }
            }
        }
    }
}
