import SwiftUI

/// Verbatim port of `ringColorForProximity` in `expo/utils/calorieColor.ts`.
/// Returns a color based on `|consumed - target|`; falls back when there's no valid target.
enum CalorieProximity {
    static func ringColor(consumed: Double, target: Double, fallback: Color) -> Color {
        guard target > 0 else { return fallback }
        let delta = abs(consumed - target)
        if delta <= 25 { return Color(hex: "#2E7D32") }   // dark green
        if delta <= 50 { return Color(hex: "#4CAF50") }   // green
        if delta <= 100 { return Color(hex: "#FFC107") }  // yellow
        if delta <= 200 { return Color(hex: "#FF9800") }  // orange
        return Color(hex: "#F44336")                      // red
    }
}
