import SwiftUI

/// Welcome / onboarding entry (Phase 5). Placeholder for the Phase 4 shell: the real welcome and
/// 5-step onboarding flow land in Phase 5. For now it lets you enter the tab shell on a fresh
/// install (dev-only "Enter app" sets `onboardingComplete`) and keeps the Design Gallery reachable.
///
/// Shown by `RootView` whenever `preferences.onboardingComplete != true`.
struct WelcomePlaceholderView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    var body: some View {
        ZStack {
            colors.background.ignoresSafeArea()
            VStack(spacing: Spacing.lg) {
                Spacer()
                Image(systemName: "heart.text.square.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(colors.primary)
                Text("HealthTracker")
                    .font(Typography.h1)
                    .foregroundStyle(colors.text)
                Text("Welcome + onboarding — Phase 5")
                    .font(Typography.small)
                    .foregroundStyle(colors.textSecondary)
                Spacer()

                Button {
                    store.setOnboardingComplete()
                } label: {
                    Text("Enter app (dev)")
                        .font(Typography.bodyMedium)
                        .foregroundStyle(colors.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.md)
                        .background(colors.primary)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
                }
                .buttonStyle(.plain)

                NavigationLink {
                    DesignGalleryView()
                        .background(colors.background.ignoresSafeArea())
                        .navigationTitle("Design Gallery")
                        .navigationBarTitleDisplayMode(.inline)
                } label: {
                    Text("Design Gallery (dev)")
                        .font(Typography.body)
                        .foregroundStyle(colors.primary)
                }
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.bottom, Spacing.xl)
        }
    }
}
