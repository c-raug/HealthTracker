import SwiftUI

/// Type scale, verbatim from `Typography` in `expo/constants/theme.ts`.
/// Weight mapping: 700 → bold, 600 → semibold, 500 → medium, 400 → regular.
enum Typography {
    static let h1 = Font.system(size: 28, weight: .bold)      // 28 / 700
    static let h2 = Font.system(size: 22, weight: .semibold)  // 22 / 600
    static let h3 = Font.system(size: 18, weight: .semibold)  // 18 / 600
    static let body = Font.system(size: 16, weight: .regular) // 16 / 400
    static let bodyMedium = Font.system(size: 16, weight: .medium) // 16 / 500 (buttons, labels)
    static let small = Font.system(size: 13, weight: .regular)     // 13 / 400
}
