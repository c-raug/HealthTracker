import SwiftUI

/// Translate-up-on-scroll tab header. Port of
/// `expo/components/navigation/CollapsibleTabHeader.tsx`:
/// - a frosted-glass bar pinned to the top holding the large title + `HeaderXpBar`,
/// - a solid background overlay that fades out over the first 20pt of scroll (revealing the blur),
/// - the whole bar translates up by its own height as you scroll, then clamps.
///
/// `scrollY` is the normalized scroll amount (0 at rest, growing as content scrolls up), supplied
/// by `CollapsibleScreen` via `.onScrollGeometryChange`.
struct CollapsibleHeader: View {
    @Environment(\.appColors) private var colors
    @Environment(\.topSafeInset) private var topInset

    static let barHeight: CGFloat = 52

    let title: String
    let scrollY: CGFloat
    var onXpTap: () -> Void

    private var totalHeight: CGFloat { topInset + Self.barHeight }

    private var translateY: CGFloat {
        -min(max(scrollY, 0), totalHeight)
    }

    /// Solid overlay fades out across the first 20pt (iOS can't animate a material's opacity).
    private var solidOpacity: Double {
        Double(1 - min(max(scrollY, 0), 20) / 20)
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            // Always-on blur, revealed once the solid overlay fades.
            Rectangle().fill(.regularMaterial)
            // Solid overlay that fades out on scroll.
            colors.background.opacity(solidOpacity)

            HStack(spacing: Spacing.sm) {
                Text(title)
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(colors.text)
                    .lineLimit(1)
                Spacer(minLength: Spacing.sm)
                HeaderXpBar(onTap: onXpTap)
            }
            .padding(.horizontal, Spacing.md)
            .frame(height: Self.barHeight)
        }
        .frame(height: totalHeight)
        .clipped()
        .offset(y: translateY)
        .ignoresSafeArea(edges: .top)
        .zIndex(10)
    }
}

/// Standard tab-screen container: a scroll view whose content sits below the collapsible header and
/// clears the floating pill tab bar, wired to drive the header's translate/fade. Later feature
/// phases fill in `content`; Phase 4 uses it for the placeholder screens.
struct CollapsibleScreen<Content: View>: View {
    @Environment(\.appColors) private var colors
    @Environment(\.topSafeInset) private var topInset

    let title: String
    var onXpTap: () -> Void
    @ViewBuilder var content: () -> Content

    @State private var scrollY: CGFloat = 0

    /// Clearance so scroll content isn't hidden behind the floating pill (pill height + margins).
    private var bottomClearance: CGFloat { PillTabBar.pillHeight + Spacing.md * 2 }
    private var headerHeight: CGFloat { topInset + CollapsibleHeader.barHeight }

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.md) {
                content()
            }
            .padding(.horizontal, Spacing.md)
            .padding(.top, Spacing.md)
        }
        .contentMargins(.top, headerHeight, for: .scrollContent)
        .contentMargins(.bottom, bottomClearance, for: .scrollContent)
        .onScrollGeometryChange(for: CGFloat.self) { geo in
            geo.contentOffset.y + geo.contentInsets.top
        } action: { _, newValue in
            scrollY = newValue
        }
        .background(colors.background.ignoresSafeArea())
        .overlay(alignment: .top) {
            CollapsibleHeader(title: title, scrollY: scrollY, onXpTap: onXpTap)
        }
    }
}
