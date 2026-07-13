import SwiftUI

/// The five primary destinations. `more` doesn't navigate — it toggles the More popover.
enum AppTab: String, CaseIterable, Hashable {
    case home, weight, nutrition, activities, more

    var title: String {
        switch self {
        case .home: return "Home"
        case .weight: return "Weight"
        case .nutrition: return "Nutrition"
        case .activities: return "Activities"
        case .more: return "More"
        }
    }

    /// SF Symbols standing in for the RN Ionicons (`home`, `scale`, `restaurant`, `flame`, `ellipsis`).
    var iconActive: String {
        switch self {
        case .home: return "house.fill"
        case .weight: return "scalemass.fill"
        case .nutrition: return "fork.knife"
        case .activities: return "flame.fill"
        case .more: return "ellipsis"
        }
    }

    var iconInactive: String {
        switch self {
        case .home: return "house"
        case .weight: return "scalemass"
        case .nutrition: return "fork.knife"
        case .activities: return "flame"
        case .more: return "ellipsis"
        }
    }
}

/// Floating blurred pill tab bar. Port of `expo/components/navigation/PillTabBar.tsx`:
/// a rounded `.ultraThinMaterial` capsule floating above the content with a hairline border, five
/// evenly-spaced items, active item tinted `primary`. "More" invokes `onMorePressed` (popover)
/// instead of switching tabs.
struct PillTabBar: View {
    @Environment(\.appColors) private var colors
    @Environment(\.bottomSafeInset) private var bottomInset

    static let pillHeight: CGFloat = 56

    @Binding var selection: AppTab
    /// Highlight the "More" item while its popover is open.
    var moreActive: Bool
    var onMorePressed: () -> Void

    var body: some View {
        HStack(spacing: 0) {
            ForEach(AppTab.allCases, id: \.self) { tab in
                tabButton(tab)
            }
        }
        .frame(height: Self.pillHeight)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .overlay(Capsule().strokeBorder(colors.border, lineWidth: 1))
        .padding(.horizontal, Spacing.md)
        .padding(.bottom, bottomInset + Spacing.sm)
    }

    private func isFocused(_ tab: AppTab) -> Bool {
        tab == .more ? moreActive : selection == tab
    }

    @ViewBuilder
    private func tabButton(_ tab: AppTab) -> some View {
        let focused = isFocused(tab)
        let tint = focused ? colors.primary : colors.textSecondary

        Button {
            if tab == .more {
                onMorePressed()
            } else {
                selection = tab
            }
        } label: {
            VStack(spacing: 2) {
                Image(systemName: focused ? tab.iconActive : tab.iconInactive)
                    .font(.system(size: 22))
                Text(tab.title)
                    .font(.system(size: 10, weight: .semibold))
            }
            .foregroundStyle(tint)
            .frame(maxWidth: .infinity)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(focused ? .isSelected : [])
    }
}
