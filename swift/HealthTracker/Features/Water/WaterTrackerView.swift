import SwiftUI

/// The collapsible **Water** card below the macro bars on the Nutrition tab. Port of
/// `expo/components/nutrition/WaterTracker.tsx`: a header (chevron + "Water" + collapsed quick-add
/// pill), three gradient preset buttons (long-press to edit the amount), a custom-amount field, and
/// the grouped entry list (trash = remove the most recent of that amount, Clear = confirm-remove-all).
///
/// Writes go straight to the store (`addWaterEntry` / `deleteWaterEntry` / `setWaterPresets`).
/// No XP is granted here — water-goal XP is a Phase-12 gamification-watcher concern. All water UI is
/// fixed blue (`FixedColors.water`), never the accent.
struct WaterTrackerView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    let date: String
    /// Bumped by the parent when the water bottle is tapped, so the card expands (RN `expandKey`).
    let expandKey: Int

    @State private var collapsed = true
    @State private var customAmount = ""
    @State private var editingPreset: Int?
    @State private var editValue = ""
    @State private var clearGroup: WaterStats.Group?
    @FocusState private var editFocused: Bool
    @FocusState private var customFocused: Bool

    private var isImperial: Bool { store.preferences.unit == .lbs }
    private var unit: String { WaterStats.unitLabel(store.preferences.unit) }
    private var defaults: [Int] { WaterStats.defaultPresets(unit: store.preferences.unit) }
    private var presets: [Int] { WaterStats.presets(preferences: store.preferences) }

    private var dayEntries: [WaterEntry] {
        store.waterLog.first { $0.date == date }?.entries ?? []
    }
    private var groups: [WaterStats.Group] { WaterStats.grouped(dayEntries) }

    var body: some View {
        VStack(spacing: 0) {
            header
            if !collapsed {
                body_
                if !groups.isEmpty { entryList }
            }
        }
        .featureCardStyle(padding: 0)
        .onChange(of: expandKey) { if collapsed { collapsed = false } }
        .alert("Remove all entries?", isPresented: clearAlertBinding, presenting: clearGroup) { group in
            Button("Cancel", role: .cancel) {}
            Button("Confirm", role: .destructive) { clearAll(group) }
        } message: { group in
            Text("Remove all \(group.count) entr\(group.count == 1 ? "y" : "ies") of \(amountLabel(group.amount)) \(unit)?")
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) { collapsed.toggle() }
            } label: {
                HStack(spacing: Spacing.xs) {
                    Image(systemName: collapsed ? "chevron.right" : "chevron.down")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(colors.textSecondary)
                    Text("Water")
                        .font(Typography.h3)
                        .foregroundStyle(colors.text)
                }
            }
            .buttonStyle(.plain)

            Spacer()

            if collapsed {
                Button {
                    addAmount(Double(presets[1]))
                } label: {
                    Text("+\(presets[1]) \(unit)")
                        .font(Typography.small.weight(.bold))
                        .foregroundStyle(FixedColors.water)
                        .padding(.vertical, Spacing.xs)
                        .padding(.horizontal, Spacing.sm)
                        .background(FixedColors.waterLight, in: RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                                .strokeBorder(FixedColors.water, lineWidth: 1.5)
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.vertical, Spacing.sm)
        .padding(.horizontal, Spacing.md)
    }

    // MARK: - Body (presets + custom)

    private var body_: some View {
        VStack(spacing: Spacing.sm) {
            HStack(spacing: Spacing.xs) {
                ForEach(0..<3, id: \.self) { idx in
                    presetColumn(idx)
                }
            }

            HStack(spacing: Spacing.sm) {
                TextField("Custom amount (\(unit))", text: $customAmount)
                    .keyboardType(.decimalPad)
                    .focused($customFocused)
                    .submitLabel(.done)
                    .onSubmit(addCustom)
                    .padding(.horizontal, Spacing.md)
                    .padding(.vertical, Spacing.sm)
                    .background(colors.background, in: RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                            .strokeBorder(colors.border, lineWidth: 1)
                    )

                Button(action: addCustom) {
                    Text("Add")
                        .font(Typography.body.weight(.semibold))
                        .foregroundStyle(FixedColors.water)
                        .padding(.vertical, Spacing.sm)
                        .padding(.horizontal, Spacing.md)
                        .background(FixedColors.waterLight, in: RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                                .strokeBorder(FixedColors.water, lineWidth: 1.5)
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, Spacing.md)
        .padding(.bottom, Spacing.md)
    }

    @ViewBuilder
    private func presetColumn(_ idx: Int) -> some View {
        VStack(spacing: 2) {
            if editingPreset == idx {
                TextField("", text: $editValue)
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.center)
                    .focused($editFocused)
                    .submitLabel(.done)
                    .onSubmit { savePreset(idx) }
                    .font(Typography.small)
                    .foregroundStyle(colors.text)
                    .padding(.horizontal, Spacing.sm)
                    .padding(.vertical, Spacing.sm)
                    .frame(maxWidth: .infinity)
                    .background(colors.background, in: RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                            .strokeBorder(FixedColors.water, lineWidth: 1)
                    )
                    .onChange(of: editFocused) { _, focused in
                        if !focused && editingPreset == idx { savePreset(idx) }
                    }
            } else {
                Button {
                    addAmount(Double(presets[idx]))
                } label: {
                    ZStack {
                        LinearGradient(
                            colors: [Color(hex: "#42A5F5"), Color(hex: "#1565C0")],
                            startPoint: .top, endPoint: .bottom
                        )
                        VStack(spacing: 0) {
                            Text("+\(presets[idx]) \(unit)")
                                .font(Typography.small.weight(.semibold))
                                .foregroundStyle(.white)
                            if idx == 1 {
                                Text("Quick Add")
                                    .font(.system(size: 9, weight: .medium))
                                    .foregroundStyle(.white.opacity(0.85))
                            }
                        }
                    }
                    .frame(height: 44)
                    .frame(maxWidth: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                    .overlay {
                        if idx == 1 {
                            RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                                .strokeBorder(Color.white.opacity(0.33), lineWidth: 2)
                        }
                    }
                }
                .buttonStyle(.plain)
                .onLongPressGesture(minimumDuration: 0.5) { startEditPreset(idx) }

                Text("hold to edit")
                    .font(Typography.small)
                    .foregroundStyle(colors.textSecondary)
            }
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Entry list

    private var entryList: some View {
        VStack(spacing: 0) {
            ForEach(groups) { group in
                HStack {
                    HStack(spacing: Spacing.sm) {
                        Text("\(amountLabel(group.amount)) \(unit)")
                            .font(Typography.body)
                            .foregroundStyle(colors.text)
                        if group.count > 1 {
                            Text("\(group.count)x")
                                .font(Typography.small.weight(.semibold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, Spacing.xs)
                                .padding(.vertical, 2)
                                .background(FixedColors.water, in: RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                        }
                    }
                    Spacer()
                    HStack(spacing: Spacing.xs) {
                        Button { removeOne(group) } label: {
                            Image(systemName: "trash")
                                .font(.system(size: 20))
                                .foregroundStyle(colors.danger)
                        }
                        .buttonStyle(.plain)

                        Button { clearGroup = group } label: {
                            Text("Clear")
                                .font(Typography.small.weight(.semibold))
                                .foregroundStyle(colors.danger)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.vertical, Spacing.sm)
                .padding(.horizontal, Spacing.md)
                .overlay(alignment: .bottom) {
                    Rectangle().fill(colors.border).frame(height: 1)
                }
            }
        }
        .padding(.top, Spacing.sm)
    }

    // MARK: - Actions

    private func addAmount(_ amount: Double) {
        store.addWaterEntry(
            date: date,
            entry: WaterEntry(id: Identifiers.generate(), amount: amount, loggedAt: Dates.nowTimestamp())
        )
    }

    private func addCustom() {
        guard let amount = WaterStats.parseCustomAmount(customAmount) else { return }
        addAmount(Double(amount))
        customAmount = ""
    }

    private func removeOne(_ group: WaterStats.Group) {
        guard let id = WaterStats.mostRecentId(group, entries: dayEntries) else { return }
        store.deleteWaterEntry(date: date, entryId: id)
    }

    private func clearAll(_ group: WaterStats.Group) {
        for id in group.ids { store.deleteWaterEntry(date: date, entryId: id) }
    }

    private func startEditPreset(_ idx: Int) {
        editValue = String(presets[idx])
        editingPreset = idx
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { editFocused = true }
    }

    private func savePreset(_ idx: Int) {
        let next = WaterStats.savePreset(editValue, index: idx, current: presets, defaults: defaults)
        store.setWaterPresets(next)
        editingPreset = nil
        editValue = ""
    }

    private func amountLabel(_ amount: Double) -> String {
        WeightStats.jsNumberString(amount)
    }

    private var clearAlertBinding: Binding<Bool> {
        Binding(get: { clearGroup != nil }, set: { if !$0 { clearGroup = nil } })
    }
}
