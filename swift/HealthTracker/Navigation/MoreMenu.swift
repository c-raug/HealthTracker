import SwiftUI

/// Popover shown when "More" is tapped in the pill tab bar. Port of
/// `expo/components/navigation/MoreMenuPopover.tsx`: a card anchored above the pill with
/// Profile / Settings rows, plus a tap-catcher scrim that dismisses it. Selecting a row pushes the
/// corresponding hidden route (not a tab switch).
struct MoreMenu: View {
    @Environment(\.appColors) private var colors
    @Environment(\.bottomSafeInset) private var bottomInset

    @Binding var isVisible: Bool
    var onSelect: (MoreDestination) -> Void

    @State private var appeared = false

    private var pillClearance: CGFloat {
        PillTabBar.pillHeight + Spacing.sm + bottomInset + Spacing.sm
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            // Full-screen tap-catcher.
            Color.clear
                .contentShape(Rectangle())
                .onTapGesture { dismiss() }

            VStack(spacing: 0) {
                row(.profile, icon: "person", label: "Profile")
                Divider().background(colors.border).padding(.horizontal, Spacing.xs)
                row(.settings, icon: "gearshape", label: "Settings")
            }
            .padding(Spacing.sm)
            .frame(width: 180, alignment: .leading)
            .background(colors.card)
            .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
            .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
            .padding(.trailing, Spacing.md)
            .padding(.bottom, pillClearance)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .ignoresSafeArea()
        .onAppear {
            withAnimation(.easeOut(duration: 0.15)) { appeared = true }
        }
    }

    private func dismiss() {
        withAnimation(.easeIn(duration: 0.12)) { appeared = false }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { isVisible = false }
    }

    @ViewBuilder
    private func row(_ dest: MoreDestination, icon: String, label: String) -> some View {
        Button {
            isVisible = false
            onSelect(dest)
        } label: {
            HStack(spacing: Spacing.sm) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundStyle(colors.text)
                    .frame(width: 24)
                Text(label)
                    .font(Typography.body)
                    .foregroundStyle(colors.text)
                Spacer(minLength: 0)
            }
            .padding(.vertical, Spacing.sm)
            .padding(.horizontal, Spacing.sm)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

/// Hidden destinations reachable only through the More menu (mirrors `href: null` routes) plus the
/// Phase-11 sub-screens pushed from Profile / Settings (the RN modal routes). All resolve against the
/// shell's single `NavigationStack`, so any screen can push one with `NavigationLink(value:)` or by
/// appending to the shared path.
enum MoreDestination: Hashable {
    case profile
    case settings
    // Phase 11 sub-screens
    case editProfile      // profile-modal
    case foodLibrary      // food-library-modal
    case nutritionGoals   // nutrition-goals-modal
    case appearance       // appearance-modal
    case appSettings      // app-settings-modal
}
