import SwiftUI

/// Shared building blocks for the Phase-11 Profile / Settings surfaces — ports of the repeated
/// `navRow`, `card`, and `toggle`/`toggleOption(Active)` styles across `expo/app/*-modal.tsx`.

/// A full-width tappable nav row (RN `styles.navRow`): a gradient feature card with a leading title
/// and a trailing chevron. Used for the Profile / Settings menu rows.
struct SettingsNavRow: View {
    @Environment(\.appColors) private var colors
    let title: String
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Text(title)
                    .font(Typography.h3)
                    .foregroundStyle(colors.text)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(colors.textSecondary)
            }
            .contentShape(Rectangle())
            .featureCardStyle()
        }
        .buttonStyle(.plain)
    }
}

/// A gradient section card (RN `styles.card`) wrapping arbitrary content — the sub-screen sections.
struct SettingsCard<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        // Content supplies its own `.padding(Spacing.md)` (RN's card padding), so the card itself
        // only draws the gradient/border/shadow.
        .featureCardStyle(padding: 0)
    }
}

/// The settings-style segmented toggle (RN `toggle` / `toggleOption` / `toggleOptionActive`):
/// a `background` track with the active option filled `primaryLight` + a `primary` 1.5px border and
/// `primary` text. Distinct from the onboarding `SegmentedToggle` (which fills solid `primary`).
struct SettingsToggle<Value: Hashable>: View {
    @Environment(\.appColors) private var colors

    let options: [(value: Value, label: String)]
    @Binding var selection: Value
    var onChange: ((Value) -> Void)?

    init(options: [(value: Value, label: String)], selection: Binding<Value>, onChange: ((Value) -> Void)? = nil) {
        self.options = options
        self._selection = selection
        self.onChange = onChange
    }

    var body: some View {
        HStack(spacing: 3) {
            ForEach(options, id: \.value) { option in
                let active = option.value == selection
                Button {
                    selection = option.value
                    onChange?(option.value)
                } label: {
                    Text(option.label)
                        .font(Typography.bodyMedium)
                        .foregroundStyle(active ? colors.primary : colors.textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.sm)
                        .background(active ? colors.primaryLight : .clear)
                        .overlay(
                            RoundedRectangle(cornerRadius: Radius.sm - 2, style: .continuous)
                                .strokeBorder(active ? colors.primary : .clear, lineWidth: 1.5)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: Radius.sm - 2, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(3)
        .background(colors.background)
        .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
    }
}

/// A bold section label (RN `settingLabel`).
struct SettingLabel: View {
    @Environment(\.appColors) private var colors
    let text: String
    init(_ text: String) { self.text = text }
    var body: some View {
        Text(text)
            .font(Typography.bodyMedium)
            .foregroundStyle(colors.text)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A secondary description paragraph (RN `settingDescription`).
struct SettingDescription: View {
    @Environment(\.appColors) private var colors
    let text: String
    init(_ text: String) { self.text = text }
    var body: some View {
        Text(text)
            .font(Typography.small)
            .foregroundStyle(colors.textSecondary)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

extension View {
    /// Bottom clearance so a pushed screen's scroll content isn't hidden behind the always-floating
    /// pill tab bar. Apply to the `ScrollView` (uses `contentMargins`, like `CollapsibleScreen`).
    func pillBottomClearance() -> some View {
        contentMargins(.bottom, PillTabBar.pillHeight + Spacing.xl, for: .scrollContent)
    }
}

/// A filled action button (RN `toggleOptionActive` used as a button — primaryLight fill, primary
/// border + text). Used for "Save Data", the water-goal Save, etc.
struct SettingsActionButton: View {
    @Environment(\.appColors) private var colors
    let title: String
    var tint: Color? = nil
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(Typography.bodyMedium)
                .foregroundStyle(tint ?? colors.primary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.sm)
                .background((tint ?? colors.primary).opacity(0.12))
                .overlay(
                    RoundedRectangle(cornerRadius: Radius.sm - 2, style: .continuous)
                        .strokeBorder(tint ?? colors.primary, lineWidth: 1.5)
                )
                .clipShape(RoundedRectangle(cornerRadius: Radius.sm - 2, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}
