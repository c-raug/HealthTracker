import SwiftUI

/// Settings screen (Phase 11) — a hidden route reached via the More menu. Port of
/// `expo/app/(tabs)/settings.tsx`: an "Appearance" row, an "App Settings" row, the inline
/// `FeedbackSection` card, and a version footer. Keeps the dev Design-Gallery link so the Phase-1
/// token layer stays reachable.
struct SettingsView: View {
    @Environment(\.appColors) private var colors
    var onXpTap: () -> Void
    /// Push a sub-screen onto the shared shell stack.
    var onOpen: (MoreDestination) -> Void

    private var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0.0"
    }

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.sm) {
                SettingsNavRow(title: "Appearance") { onOpen(.appearance) }
                SettingsNavRow(title: "App Settings") { onOpen(.appSettings) }

                SettingsCard {
                    FeedbackSectionView()
                        .padding(Spacing.md)
                }

                // Dev-only entry point to the Phase-1 Design Gallery.
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

                Text("HealthTracker v\(appVersion)")
                    .font(Typography.small)
                    .foregroundStyle(colors.textSecondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Spacing.lg)
            }
            .padding(Spacing.md)
        }
        .pillBottomClearance()
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
