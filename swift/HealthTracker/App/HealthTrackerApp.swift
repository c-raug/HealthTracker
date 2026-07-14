import SwiftUI

@main
struct HealthTrackerApp: App {
    /// Owned here so they live for the app's lifetime.
    @State private var theme = AppTheme()

    /// Install the local crash-log capture before any view builds (Phase 14).
    init() { CrashReporter.install() }
    /// The single source of truth for app state (Phase 2). Loaded on first appearance.
    @State private var store = AppStore()
    /// The transient-toast queue (Phase 12) — achievement-unlock / level-up banners.
    @State private var toasts = ToastCenter()

    var body: some Scene {
        WindowGroup {
            AppRoot(theme: theme, store: store, toasts: toasts)
        }
    }
}

/// Injects the theme + resolved palette and the `AppStore` into the environment, loads persisted
/// state on first appearance, and applies the forced appearance.
///
/// `effectiveScheme` is computed from the appearance mode directly for forced modes (so palette
/// resolution never depends on `.preferredColorScheme` propagation timing), and from the device's
/// `\.colorScheme` for `.system`.
struct AppRoot: View {
    let theme: AppTheme
    let store: AppStore
    let toasts: ToastCenter
    @Environment(\.colorScheme) private var deviceScheme

    var body: some View {
        let effectiveScheme = theme.appearanceMode.forcedScheme ?? deviceScheme
        RootView()
            .environment(theme)
            .environment(store)
            .environment(toasts)
            .environment(\.appColors, theme.colors(for: effectiveScheme))
            .tint(theme.accentPrimary)
            .preferredColorScheme(theme.appearanceMode.forcedScheme)
            .task {
                store.load()
                // Phase 2 bridge: adopt the persisted theme preferences as the source of truth.
                theme.sync(from: store.preferences)
            }
    }
}
