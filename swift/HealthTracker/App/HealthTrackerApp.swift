import SwiftUI

@main
struct HealthTrackerApp: App {
    /// Owned here so it lives for the app's lifetime. Bridged to AppStore.preferences in Phase 2.
    @State private var theme = AppTheme()

    var body: some Scene {
        WindowGroup {
            AppRoot(theme: theme)
        }
    }
}

/// Injects the theme + resolved palette into the environment and applies the forced appearance.
///
/// `effectiveScheme` is computed from the appearance mode directly for forced modes (so palette
/// resolution never depends on `.preferredColorScheme` propagation timing), and from the device's
/// `\.colorScheme` for `.system`.
struct AppRoot: View {
    let theme: AppTheme
    @Environment(\.colorScheme) private var deviceScheme

    var body: some View {
        let effectiveScheme = theme.appearanceMode.forcedScheme ?? deviceScheme
        RootView()
            .environment(theme)
            .environment(\.appColors, theme.colors(for: effectiveScheme))
            .tint(theme.accentPrimary)
            .preferredColorScheme(theme.appearanceMode.forcedScheme)
    }
}
