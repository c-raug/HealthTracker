import SwiftUI

/// Resolved color palette for the current appearance + accent.
/// 1:1 with `useColors()` in `expo/constants/theme.ts` (base palette + accent override).
struct AppColors {
    let primary: Color
    let primaryLight: Color
    let background: Color
    let card: Color
    let text: Color
    let textSecondary: Color
    let border: Color
    let danger: Color
    let dangerLight: Color
    let white: Color
    /// Mirrors the RN dark-mode shortcut (`colors.card === '#2C2C2E'`); handy for gradients/glows.
    let isDark: Bool
}

// MARK: - Base palettes (verbatim from LightColors / DarkColors)

enum ColorPalette {
    struct Hexes {
        let primary, primaryLight, background, card, text, textSecondary, border, danger, dangerLight, white: String
    }

    static let light = Hexes(
        primary: "#4CAF50", primaryLight: "#E8F5E9", background: "#F7F8FA", card: "#FFFFFF",
        text: "#1A1A2E", textSecondary: "#6B7280", border: "#E5E7EB",
        danger: "#EF4444", dangerLight: "#FEE2E2", white: "#FFFFFF"
    )

    static let dark = Hexes(
        primary: "#4CAF50", primaryLight: "#1A3D20", background: "#1C1C1E", card: "#2C2C2E",
        text: "#F2F2F7", textSecondary: "#8E8E93", border: "#3A3A3C",
        danger: "#FF453A", dangerLight: "#3D1919", white: "#FFFFFF"
    )
}

// MARK: - Accent presets (verbatim from ACCENT_PRESETS)

struct AccentPreset: Identifiable, Hashable {
    let id: String
    let label: String
    let primary: String          // hex; also the stored `themeColor` value
    let primaryLight: String     // light-mode "primaryLight"
    let primaryLightDark: String // dark-mode "primaryLight"
}

enum AccentPresets {
    static let all: [AccentPreset] = [
        .init(id: "green",  label: "Green",  primary: "#4CAF50", primaryLight: "#E8F5E9", primaryLightDark: "#1A3D20"),
        .init(id: "blue",   label: "Blue",   primary: "#2196F3", primaryLight: "#E3F2FD", primaryLightDark: "#1A2D4A"),
        .init(id: "orange", label: "Orange", primary: "#FF9800", primaryLight: "#FFF3E0", primaryLightDark: "#3D2A10"),
        .init(id: "purple", label: "Purple", primary: "#9C27B0", primaryLight: "#F3E5F5", primaryLightDark: "#2A1A3D"),
        .init(id: "red",    label: "Red",    primary: "#F44336", primaryLight: "#FFEBEE", primaryLightDark: "#3D1919"),
        .init(id: "teal",   label: "Teal",   primary: "#009688", primaryLight: "#E0F2F1", primaryLightDark: "#1A3333"),
    ]

    static func preset(forPrimaryHex hex: String?) -> AccentPreset? {
        guard let hex else { return nil }
        return all.first { $0.primary.caseInsensitiveCompare(hex) == .orderedSame }
    }
}

// MARK: - Fixed (never-themed) colors

/// Water UI, macro bars, and modal overlays are fixed regardless of the accent theme.
/// See the "fixed colors" rules in `expo/.claude/documentation/style_guide.md`.
enum FixedColors {
    static let water = Color(hex: "#2196F3")
    static let waterLight = Color(hex: "#E3F2FD")
    static let waterGlow = Color(hex: "#64B5F6")
    static let macroProtein = Color(hex: "#3B82F6")
    static let macroCarbs = Color(hex: "#F59E0B")
    static let macroFat = Color(hex: "#EF4444")
    static let modalOverlay = Color.black.opacity(0.35)
}

// MARK: - Resolution

extension AppColors {
    /// Reproduces `useColors()`: pick the base palette for the scheme, then override
    /// `primary`/`primaryLight` from the selected accent preset (if any).
    static func resolve(scheme: ColorScheme, accentHex: String?) -> AppColors {
        let isDark = scheme == .dark
        let base = isDark ? ColorPalette.dark : ColorPalette.light

        var primaryHex = base.primary
        var primaryLightHex = base.primaryLight

        if let preset = AccentPresets.preset(forPrimaryHex: accentHex) {
            primaryHex = preset.primary
            primaryLightHex = isDark ? preset.primaryLightDark : preset.primaryLight
        } else if let accentHex, !accentHex.isEmpty {
            // Non-preset accent still overrides primary; keep the base primaryLight.
            primaryHex = accentHex
        }

        return AppColors(
            primary: Color(hex: primaryHex),
            primaryLight: Color(hex: primaryLightHex),
            background: Color(hex: base.background),
            card: Color(hex: base.card),
            text: Color(hex: base.text),
            textSecondary: Color(hex: base.textSecondary),
            border: Color(hex: base.border),
            danger: Color(hex: base.danger),
            dangerLight: Color(hex: base.dangerLight),
            white: Color(hex: base.white),
            isDark: isDark
        )
    }
}
