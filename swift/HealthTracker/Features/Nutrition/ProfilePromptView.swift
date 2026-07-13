import SwiftUI

/// Prompt shown on the Nutrition (and later Home/Activities) tab when the profile or first weight
/// entry is missing, so a calorie target can't be computed. Port of
/// `expo/components/nutrition/ProfilePrompt.tsx`.
///
/// The RN button routes to `/settings`; here we use a `NavigationLink(value:)` that resolves against
/// the `MoreDestination` destination already registered on the shell's `NavigationStack`
/// (`RootTabView`), so tapping pushes the real Settings screen with no extra plumbing.
struct ProfilePromptView: View {
    @Environment(\.appColors) private var colors

    let message: String

    var body: some View {
        VStack(spacing: Spacing.xs) {
            Image(systemName: "person.crop.circle")
                .font(.system(size: 48))
                .foregroundStyle(colors.textSecondary)
                .padding(.bottom, Spacing.sm)

            Text("Set Up Your Profile")
                .font(Typography.h3)
                .foregroundStyle(colors.text)

            Text(message)
                .font(Typography.body)
                .foregroundStyle(colors.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.bottom, Spacing.sm)

            NavigationLink(value: MoreDestination.settings) {
                Text("Go to Settings")
                    .font(Typography.bodyMedium)
                    .foregroundStyle(colors.white)
                    .padding(.vertical, Spacing.sm)
                    .padding(.horizontal, Spacing.lg)
                    .background(colors.primary)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity)
        .padding(Spacing.lg)
        .background(colors.card)
        .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
        .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
    }
}
