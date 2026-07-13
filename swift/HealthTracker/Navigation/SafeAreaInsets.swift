import SwiftUI

/// Top/bottom safe-area insets injected once at the shell root so the collapsible header and the
/// floating pill tab bar can size themselves without each spawning its own `GeometryReader`.
/// Mirrors the RN app's `useSafeAreaInsets()` usage in `PillTabBar`, `HeaderXpBar`, and
/// `CollapsibleTabHeader`.
private struct TopSafeInsetKey: EnvironmentKey {
    static let defaultValue: CGFloat = 0
}

private struct BottomSafeInsetKey: EnvironmentKey {
    static let defaultValue: CGFloat = 0
}

extension EnvironmentValues {
    var topSafeInset: CGFloat {
        get { self[TopSafeInsetKey.self] }
        set { self[TopSafeInsetKey.self] = newValue }
    }
    var bottomSafeInset: CGFloat {
        get { self[BottomSafeInsetKey.self] }
        set { self[BottomSafeInsetKey.self] = newValue }
    }
}
