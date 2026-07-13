import SwiftUI
import UIKit

/// Shared building blocks for the welcome + onboarding screens (port of the repeated
/// `toggle` / `optionBtn` / `presetBtn` styles in `expo/app/onboarding.tsx`).

/// Two-or-more-option segmented toggle: a `colors.card` track with the active segment filled
/// `primary` (RN `styles.toggle` / `toggleOption`). Generic over any `Hashable` value.
struct SegmentedToggle<Value: Hashable>: View {
    @Environment(\.appColors) private var colors

    let options: [(value: Value, label: String)]
    @Binding var selection: Value

    var body: some View {
        HStack(spacing: 3) {
            ForEach(options, id: \.value) { option in
                let active = option.value == selection
                Button {
                    selection = option.value
                } label: {
                    Text(option.label)
                        .font(Typography.bodyMedium)
                        .foregroundStyle(active ? colors.white : colors.textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.sm)
                        .background(active ? colors.primary : .clear)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.sm - 2, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(3)
        .background(colors.card)
        .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
    }
}

/// Full-width selectable option row (RN `styles.optionBtn`) — used for activity level and goals.
struct OptionButton: View {
    @Environment(\.appColors) private var colors

    let label: String
    let active: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(Typography.small)
                .fontWeight(.medium)
                .foregroundStyle(active ? colors.white : colors.textSecondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.sm)
                .padding(.horizontal, Spacing.md)
                .background(active ? colors.primary : colors.card)
                .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

/// A plain field label (RN `styles.inputLabel`).
struct FieldLabel: View {
    @Environment(\.appColors) private var colors
    let text: String

    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text)
            .font(Typography.small)
            .foregroundStyle(colors.textSecondary)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A card-styled text field matching RN `styles.input`.
struct OnboardingTextField: View {
    @Environment(\.appColors) private var colors

    let placeholder: String
    @Binding var text: String
    var keyboard: UIKeyboardType = .default
    var autocapitalization: TextInputAutocapitalization = .never

    var body: some View {
        TextField(placeholder, text: $text)
            .font(Typography.body)
            .foregroundStyle(colors.text)
            .keyboardType(keyboard)
            .textInputAutocapitalization(autocapitalization)
            .autocorrectionDisabled()
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.sm + 2)
            .background(colors.card)
            .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
    }
}
