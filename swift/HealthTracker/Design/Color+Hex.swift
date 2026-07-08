import SwiftUI

/// Hex-string color support, mirroring how `expo/constants/theme.ts` stores every token as a hex
/// string (including 8-digit `RRGGBBAA` values such as `#2196F388`).
extension Color {
    init(hex: String) {
        let (r, g, b, a) = Color.rgba(fromHex: hex)
        self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
    }

    /// Parses `#RGB`, `#RRGGBB`, or `#RRGGBBAA` into 0...1 components. Falls back to black on bad input.
    static func rgba(fromHex hex: String) -> (Double, Double, Double, Double) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }

        // Expand shorthand #RGB -> #RRGGBB
        if s.count == 3 {
            s = s.map { "\($0)\($0)" }.joined()
        }

        var value: UInt64 = 0
        guard Scanner(string: s).scanHexInt64(&value) else { return (0, 0, 0, 1) }

        switch s.count {
        case 8: // RRGGBBAA
            return (
                Double((value & 0xFF00_0000) >> 24) / 255,
                Double((value & 0x00FF_0000) >> 16) / 255,
                Double((value & 0x0000_FF00) >> 8) / 255,
                Double(value & 0x0000_00FF) / 255
            )
        case 6: // RRGGBB
            return (
                Double((value & 0xFF0000) >> 16) / 255,
                Double((value & 0x00FF00) >> 8) / 255,
                Double(value & 0x0000FF) / 255,
                1
            )
        default:
            return (0, 0, 0, 1)
        }
    }
}
