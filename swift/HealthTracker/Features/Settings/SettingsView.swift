import SwiftUI

/// Settings screen (Phase 11) — a hidden route reached via the More menu. Placeholder for the
/// Phase 4 shell. Keeps a dev link to the Design Gallery so the Phase 1 token layer stays
/// reachable now that `RootView` shows the app shell instead of the gallery.
struct SettingsView: View {
    @Environment(\.appColors) private var colors
    var onXpTap: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.md) {
                PlaceholderCard(systemImage: "gearshape.fill", title: "Settings", phase: "Phase 11")

                NavigationLink {
                    DesignGalleryView()
                        .background(colors.background.ignoresSafeArea())
                        .navigationTitle("Design Gallery")
                        .navigationBarTitleDisplayMode(.inline)
                } label: {
                    HStack(spacing: Spacing.sm) {
                        Image(systemName: "paintpalette.fill")
                            .foregroundStyle(colors.primary)
                        Text("Design Gallery (dev)")
                            .font(Typography.body)
                            .foregroundStyle(colors.text)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 14))
                            .foregroundStyle(colors.textSecondary)
                    }
                    .padding(Spacing.md)
                    .cardStyle()
                }
                .buttonStyle(.plain)
            }
            .padding(Spacing.md)
        }
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HeaderXpBar(onTap: onXpTap)
            }
        }
    }
}
