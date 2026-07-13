import SwiftUI

/// Stats & achievements modal (Phase 12) — presented as a sheet from any `HeaderXpBar` tap.
/// Placeholder for the Phase 4 shell.
struct StatsAchievementsPlaceholderView: View {
    @Environment(\.appColors) private var colors
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.md) {
                    PlaceholderCard(systemImage: "rosette", title: "Stats & Achievements", phase: "Phase 12")
                }
                .padding(Spacing.md)
            }
            .background(colors.background.ignoresSafeArea())
            .navigationTitle("Stats")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
