import SwiftUI

/// Profile screen (Phase 11) — a hidden route reached via the More menu, pushed onto the shell's
/// navigation stack (so it gets a system back button). Placeholder for the Phase 4 shell.
struct ProfileView: View {
    @Environment(\.appColors) private var colors
    var onXpTap: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.md) {
                PlaceholderCard(systemImage: "person.fill", title: "Profile", phase: "Phase 11")
            }
            .padding(Spacing.md)
        }
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
