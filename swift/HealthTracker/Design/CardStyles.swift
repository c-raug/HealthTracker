import SwiftUI

/// Standard content-card shadow/elevation from the style guide (Section 7):
/// black, offset (0,1), opacity 0.06, radius 4.
struct CardStyle: ViewModifier {
    @Environment(\.appColors) private var colors
    var padding: CGFloat = Spacing.md
    var cornerRadius: CGFloat = Radius.md

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(colors.card)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
    }
}

/// iOS-26 feature-card style (style guide Section 15): a top→bottom gradient fill,
/// 1px border, and a deeper shadow (offset (0,4), opacity 0.12, radius 12).
/// Used by the Home dashboard cards, ProfileCard, and the weekly graphs.
struct FeatureCardStyle: ViewModifier {
    @Environment(\.appColors) private var colors
    var padding: CGFloat = Spacing.md
    var cornerRadius: CGFloat = Radius.lg

    private var gradient: LinearGradient {
        let stops = colors.isDark ? ["#3A3A3C", "#2C2C2E"] : ["#FFFFFF", "#F4F4F8"]
        return LinearGradient(colors: stops.map { Color(hex: $0) }, startPoint: .top, endPoint: .bottom)
    }

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(gradient)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(colors.border, lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.12), radius: 12, x: 0, y: 4)
    }
}

extension View {
    func cardStyle(padding: CGFloat = Spacing.md, cornerRadius: CGFloat = Radius.md) -> some View {
        modifier(CardStyle(padding: padding, cornerRadius: cornerRadius))
    }

    func featureCardStyle(padding: CGFloat = Spacing.md, cornerRadius: CGFloat = Radius.lg) -> some View {
        modifier(FeatureCardStyle(padding: padding, cornerRadius: cornerRadius))
    }
}
