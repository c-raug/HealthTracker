import SwiftUI

/// The water bottle that sits beside the calorie ring on the Nutrition pager's center page.
/// Port of `expo/components/nutrition/WaterBottleVisual.tsx`: a cap/neck/body bottle whose fill
/// spring-animates to the day's consumed fraction, with a centered percent label, a "consumed/goal"
/// caption, and a blue glow at ≥100%. Tapping it expands the Water Tracker below (via `onTap`).
///
/// Fixed water blue (`FixedColors.water`) — never the accent. The goal is resolved by the parent and
/// passed in (on the Nutrition tab profile + weight are guaranteed, so it's always a real target).
struct WaterBottleVisual: View {
    @Environment(\.appColors) private var colors

    let consumed: Double
    let goal: Int
    let unitLabel: String
    var onTap: () -> Void

    private let bottleWidth: CGFloat = 68
    private let bodyHeight: CGFloat = 115
    private let capWidth: CGFloat = 36
    private let capHeight: CGFloat = 14
    private let neckHeight: CGFloat = 8

    /// Animated fill target (0…1). Drives the height of the blue column.
    @State private var animatedFraction: CGFloat = 0

    private var targetFraction: CGFloat { CGFloat(WaterStats.fillFraction(consumed: consumed, goal: goal)) }
    private var isFull: Bool { WaterStats.rawFraction(consumed: consumed, goal: goal) >= 1 }
    private var pct: Int { WaterStats.pctDisplay(consumed: consumed, goal: goal) }

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 6) {
                bottle
                Text("\(Int(consumed.rounded()))/\(goal)\(unitLabel)")
                    .font(Typography.small)
                    .foregroundStyle(colors.textSecondary)
                    .lineLimit(1)
            }
            .padding(.horizontal, Spacing.sm)
        }
        .buttonStyle(.plain)
        .onAppear { animatedFraction = targetFraction }
        .onChange(of: targetFraction) { _, newValue in
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                animatedFraction = newValue
            }
        }
    }

    private var bottle: some View {
        VStack(spacing: 0) {
            UnevenRoundedRectangle(topLeadingRadius: 4, topTrailingRadius: 4, style: .continuous)
                .fill(colors.border)
                .frame(width: capWidth, height: capHeight)
            Rectangle()
                .fill(colors.border)
                .frame(width: capWidth + 8, height: neckHeight)
            ZStack(alignment: .bottom) {
                RoundedRectangle(cornerRadius: 13, style: .continuous)
                    .fill(colors.background)
                FixedColors.water.opacity(0.53)
                    .frame(height: bodyHeight * animatedFraction)
                Text("\(pct)%")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(colors.text)
                    .frame(maxHeight: .infinity)
            }
            .frame(width: bottleWidth, height: bodyHeight)
            .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 13, style: .continuous)
                    .strokeBorder(colors.border, lineWidth: 2)
            )
        }
        .shadow(color: isFull ? FixedColors.waterGlow.opacity(0.85) : .clear, radius: 10)
    }
}
