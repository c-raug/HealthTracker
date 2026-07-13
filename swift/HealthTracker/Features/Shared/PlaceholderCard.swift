import SwiftUI

/// Temporary "coming in a later phase" card used by the Phase 4 placeholder screens. Each real
/// feature phase (5–13) replaces its screen's body, so this exists only to make the shell —
/// tabs, headers, date-nav, and modals — navigable and verifiable on device.
struct PlaceholderCard: View {
    @Environment(\.appColors) private var colors

    let systemImage: String
    let title: String
    let phase: String

    var body: some View {
        VStack(spacing: Spacing.sm) {
            Image(systemName: systemImage)
                .font(.system(size: 40))
                .foregroundStyle(colors.primary)
            Text(title)
                .font(Typography.h3)
                .foregroundStyle(colors.text)
            Text("Coming in \(phase)")
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.xl)
        .featureCardStyle()
    }
}
