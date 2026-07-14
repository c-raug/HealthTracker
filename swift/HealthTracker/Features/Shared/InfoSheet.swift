import SwiftUI

/// A small centered info dialog — port of `expo/components/InfoModal.tsx`. Presented as a `.sheet`
/// (or driven by `.infoSheet(_:)` below) with a title, a body paragraph, and a "Got it" button.
/// Used by the activity-level info on Nutrition Goals and the activity-mode info on Edit Profile.
struct InfoSheet: View {
    @Environment(\.appColors) private var colors
    @Environment(\.dismiss) private var dismiss

    let title: String
    let description: String

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(title)
                .font(Typography.h3)
                .foregroundStyle(colors.text)
            Text(description)
                .font(Typography.body)
                .foregroundStyle(colors.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
            Button {
                dismiss()
            } label: {
                Text("Got it")
                    .font(Typography.body.weight(.semibold))
                    .foregroundStyle(colors.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Spacing.sm)
                    .background(colors.primary)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
            }
            .buttonStyle(.plain)
            .padding(.top, Spacing.sm)
        }
        .padding(Spacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .presentationDetents([.height(240), .medium])
        .presentationBackground(colors.card)
    }
}

/// Identifiable info payload so a single `@State var info: InfoContent?` can drive `.infoSheet`.
struct InfoContent: Identifiable, Equatable {
    let title: String
    let description: String
    var id: String { title + description }
}

extension View {
    /// Present an `InfoSheet` bound to an optional `InfoContent`.
    func infoSheet(_ item: Binding<InfoContent?>) -> some View {
        sheet(item: item) { content in
            InfoSheet(title: content.title, description: content.description)
        }
    }
}
