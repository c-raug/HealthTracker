import SwiftUI

/// Frosted-glass level pill shown at the trailing edge of every tab header.
/// Port of `expo/components/navigation/HeaderXpBar.tsx`:
/// - shows `Level N` (or `MAX`) over a primary-tinted progress fill,
/// - when XP increases, briefly fades the label to `+N xp` then springs the fill to its new width,
/// - tapping opens the stats / achievements modal.
///
/// Uses `XP.progress(forXp:)` (Phase 3) as the single source of level math.
struct HeaderXpBar: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    /// Fired on tap so the host can present the stats-achievements modal.
    var onTap: () -> Void

    private var totalXp: Int { store.preferences.totalXp ?? 0 }

    // Animated state.
    @State private var displayedProgress: CGFloat = 0
    @State private var prevXp: Int = 0
    @State private var xpDelta: Int = 0
    @State private var showingDelta = false
    @State private var didInit = false

    private var progress: XP.Progress { XP.progress(forXp: totalXp) }

    private var targetFraction: CGFloat {
        let p = progress
        if p.isMax { return 1 }
        let span = p.nextLevelXp - p.currentLevelXp
        guard span > 0 else { return 1 }
        return CGFloat(totalXp - p.currentLevelXp) / CGFloat(span)
    }

    var body: some View {
        Button(action: onTap) {
            GeometryReader { geo in
                ZStack {
                    // Frosted glass base.
                    Capsule().fill(.ultraThinMaterial)

                    // Progress fill — semi-transparent primary.
                    HStack {
                        Capsule()
                            .fill(colors.primary.opacity(0.33))
                            .frame(width: geo.size.width * displayedProgress)
                        Spacer(minLength: 0)
                    }

                    // Top-half glass sheen.
                    VStack {
                        UnevenRoundedRectangle(
                            topLeadingRadius: 13, bottomLeadingRadius: 0,
                            bottomTrailingRadius: 0, topTrailingRadius: 13
                        )
                        .fill(Color.white.opacity(colors.isDark ? 0.07 : 0.40))
                        .frame(height: geo.size.height * 0.45)
                        Spacer(minLength: 0)
                    }

                    // Centered text.
                    Group {
                        if showingDelta {
                            Text("+\(xpDelta) xp")
                                .font(Typography.small.weight(.bold))
                                .foregroundStyle(colors.primary)
                                .transition(.opacity)
                        } else {
                            Text(progress.isMax ? "MAX" : "Level \(progress.level)")
                                .font(Typography.small.weight(.semibold))
                                .foregroundStyle(colors.isDark ? Color.white.opacity(0.9) : colors.text)
                                .transition(.opacity)
                        }
                    }
                    .lineLimit(1)
                }
            }
            .frame(width: 88, height: 26)
            .clipShape(Capsule())
            .overlay(
                Capsule().strokeBorder(
                    colors.isDark ? Color.white.opacity(0.20) : Color.white.opacity(0.65),
                    lineWidth: 0.5
                )
            )
        }
        .buttonStyle(.plain)
        .padding(.trailing, Spacing.md)
        .onAppear {
            guard !didInit else { return }
            didInit = true
            prevXp = totalXp
            displayedProgress = targetFraction
        }
        .onChange(of: totalXp) { oldValue, newValue in
            handleXpChange(from: oldValue, to: newValue)
        }
    }

    /// Mirrors the RN sequence: on a gain, flash `+N xp`, then spring the fill; on a decrease
    /// (e.g. prestige reset) just snap to the new value.
    private func handleXpChange(from oldValue: Int, to newValue: Int) {
        prevXp = newValue
        guard newValue > oldValue else {
            withAnimation(.easeInOut(duration: 0.2)) { displayedProgress = targetFraction }
            return
        }
        xpDelta = newValue - oldValue
        withAnimation(.easeInOut(duration: 0.15)) { showingDelta = true }

        // After the delay, fade the label back and spring the fill.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.75) {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                displayedProgress = targetFraction
            }
            withAnimation(.easeInOut(duration: 0.2)) { showingDelta = false }
        }
    }
}
