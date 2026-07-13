import SwiftUI

/// Weekly recap modal (Phase 13) — a full-screen cover auto-shown on Mondays once per ISO week.
/// Placeholder for the Phase 4 shell. On dismiss it marks the week as shown
/// (`SET_LAST_RECAP_WEEK`), mirroring the RN modal's completion behavior.
struct WeeklyRecapPlaceholderView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    /// The ISO week this recap covers; recorded so it won't reappear this week.
    let week: String

    var body: some View {
        ZStack {
            colors.background.ignoresSafeArea()
            VStack(spacing: Spacing.lg) {
                Spacer()
                PlaceholderCard(systemImage: "star.fill", title: "Weekly Recap", phase: "Phase 13")
                    .padding(.horizontal, Spacing.lg)
                Spacer()
                Button {
                    store.setLastRecapWeek(week)
                    dismiss()
                } label: {
                    Text("Done")
                        .font(Typography.bodyMedium)
                        .foregroundStyle(colors.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.md)
                        .background(colors.primary)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
                }
                .buttonStyle(.plain)
                .padding(.horizontal, Spacing.lg)
                .padding(.bottom, Spacing.xl)
            }
        }
    }
}
