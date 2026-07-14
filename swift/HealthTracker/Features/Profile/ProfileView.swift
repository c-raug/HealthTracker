import SwiftUI

/// Profile screen (Phase 11) — a hidden route reached via the More menu, pushed onto the shell's
/// navigation stack. Port of `expo/app/(tabs)/profile.tsx`: the `ProfileCard`, a "Stats &
/// Achievements" row (→ the stats sheet, a Phase-12 placeholder for now), then "Food Library" and
/// "Nutrition Goals" rows. Tapping the card's avatar opens the weekly recap; its name/chevron opens
/// Edit Profile.
struct ProfileView: View {
    @Environment(\.appColors) private var colors
    var onXpTap: () -> Void
    /// Avatar tap → weekly recap (from the shell).
    var onOpenRecap: () -> Void
    /// Push a sub-screen onto the shared shell stack.
    var onOpen: (MoreDestination) -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.sm) {
                ProfileCardView(
                    onOpenRecap: onOpenRecap,
                    onOpenProfile: { onOpen(.editProfile) }
                )
                .padding(.bottom, Spacing.xs)

                // BadgesSection → stats-achievements (the same sheet the XP pill presents; Phase 12).
                SettingsNavRow(title: "Stats & Achievements", action: onXpTap)

                SettingsNavRow(title: "Food Library") { onOpen(.foodLibrary) }
                SettingsNavRow(title: "Nutrition Goals") { onOpen(.nutritionGoals) }
            }
            .padding(Spacing.md)
        }
        .pillBottomClearance()
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HeaderXpBar(onTap: onXpTap)
            }
        }
    }
}
