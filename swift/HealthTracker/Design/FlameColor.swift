import SwiftUI

/// Verbatim port of `expo/utils/flameColor.ts` — the activity-burn flame gradient (0...600 cal).
/// 6-stop, channel-wise linear RGB interpolation. Used exclusively by the CalorieFlame view.
enum FlameColor {
    private static let stops: [Double] = [0, 120, 240, 300, 420, 540]
    private static let hexes: [String] = ["#FFC107", "#FF9800", "#F44336", "#3B82F6", "#9C27B0", "#4CAF50"]

    /// Interpolated flame color for a calorie-burn value (clamped to 0...600).
    static func color(forBurn calories: Double) -> Color {
        let cal = min(max(calories, 0), 600)
        for i in 0..<(stops.count - 1) {
            let lo = stops[i]
            let hi = stops[i + 1]
            // Last segment also absorbs the 540...600 overflow (clamps to the final color).
            if cal <= hi || i == stops.count - 2 {
                let t = hi > lo ? (cal - lo) / (hi - lo) : 0
                return lerp(hexes[i], hexes[i + 1], min(max(t, 0), 1))
            }
        }
        return Color(hex: hexes[hexes.count - 1])
    }

    /// Glow intensity 0...1, verbatim from `glowIntensityForBurn`.
    static func glowIntensity(forBurn calories: Double) -> Double {
        min(max(calories, 0), 600) / 600
    }

    private static func lerp(_ a: String, _ b: String, _ t: Double) -> Color {
        let (ar, ag, ab, _) = Color.rgba(fromHex: a)
        let (br, bg, bb, _) = Color.rgba(fromHex: b)
        return Color(
            .sRGB,
            red: ar + (br - ar) * t,
            green: ag + (bg - ag) * t,
            blue: ab + (bb - ab) * t,
            opacity: 1
        )
    }
}
