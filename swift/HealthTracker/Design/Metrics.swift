import CoreGraphics

/// Spacing scale, verbatim from `Spacing` in `expo/constants/theme.ts`.
enum Spacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
}

/// Corner-radius scale, verbatim from `Radius` in `expo/constants/theme.ts`.
/// (Progress bars use a raw `4`; the pill tab bar uses height/2.)
enum Radius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
}
