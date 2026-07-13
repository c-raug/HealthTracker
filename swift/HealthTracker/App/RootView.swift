import SwiftUI

/// App root / onboarding gate. Port of the redirect logic in `expo/app/_layout.tsx`:
/// `onboardingComplete` → the tab shell (`RootTabView`); otherwise → welcome/onboarding.
/// (Phase 5 replaces `WelcomePlaceholderView` with the real welcome + 5-step onboarding flow.)
struct RootView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    var body: some View {
        Group {
            if store.preferences.onboardingComplete == true {
                RootTabView()
            } else {
                NavigationStack {
                    WelcomePlaceholderView()
                }
            }
        }
        .background(colors.background.ignoresSafeArea())
    }
}

#Preview {
    RootView()
        .environment(AppTheme())
        .environment(AppStore())
        .environment(\.appColors, AppColors.resolve(scheme: .light, accentHex: nil))
}
