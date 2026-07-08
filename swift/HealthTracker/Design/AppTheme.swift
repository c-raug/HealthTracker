import SwiftUI
import Observation

/// App appearance override, mirroring `preferences.appearanceMode` ('light' | 'dark' | 'system').
enum AppearanceMode: String, CaseIterable, Codable, Hashable {
    case light, dark, system

    var label: String {
        switch self {
        case .light: return "Light"
        case .dark: return "Dark"
        case .system: return "System"
        }
    }

    /// The forced SwiftUI color scheme, or `nil` to follow the device.
    var forcedScheme: ColorScheme? {
        switch self {
        case .light: return .light
        case .dark: return .dark
        case .system: return nil
        }
    }
}

/// Holds the two theming preferences (appearance mode + accent) and resolves palettes.
///
/// In Phase 1 this persists directly to `UserDefaults` so the Design layer is self-contained.
/// From Phase 2 it will be bridged to `AppStore.preferences` (`themeColor` / `appearanceMode`),
/// exactly like `ThemeColorSync` bridges into `ThemeContext` in `expo/app/_layout.tsx`.
@Observable
final class AppTheme {
    var appearanceMode: AppearanceMode {
        didSet { UserDefaults.standard.set(appearanceMode.rawValue, forKey: Keys.appearance) }
    }

    /// Selected accent's primary hex, matched against `AccentPresets`. `nil` = default green.
    var accentHex: String? {
        didSet { UserDefaults.standard.set(accentHex, forKey: Keys.accent) }
    }

    private enum Keys {
        static let appearance = "pref.appearanceMode"
        static let accent = "pref.themeColor"
    }

    init() {
        let raw = UserDefaults.standard.string(forKey: Keys.appearance)
        appearanceMode = AppearanceMode(rawValue: raw ?? "") ?? .system
        accentHex = UserDefaults.standard.string(forKey: Keys.accent)
    }

    /// The accent primary color (scheme-independent), used for `.tint(...)`.
    var accentPrimary: Color { Color(hex: accentHex ?? ColorPalette.light.primary) }

    func colors(for scheme: ColorScheme) -> AppColors {
        AppColors.resolve(scheme: scheme, accentHex: accentHex)
    }
}

// MARK: - Environment plumbing

private struct AppColorsKey: EnvironmentKey {
    static let defaultValue: AppColors = AppColors.resolve(scheme: .light, accentHex: nil)
}

extension EnvironmentValues {
    /// Resolved palette for the current appearance + accent. Read via `@Environment(\.appColors)`.
    var appColors: AppColors {
        get { self[AppColorsKey.self] }
        set { self[AppColorsKey.self] = newValue }
    }
}
