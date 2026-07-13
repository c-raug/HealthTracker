import SwiftUI

/// Circular calorie-progress ring with a consumed/target readout in the center. Port of
/// `expo/components/nutrition/CalorieRing.tsx` (RN drew it with `react-native-svg`; here it's a
/// trimmed `Circle`). The progress color comes from `CalorieProximity.ringColor` (proximity to
/// target), and the arc fills to at most 100% even though the readout can go "over".
struct CalorieRingView: View {
    @Environment(\.appColors) private var colors

    let consumed: Double
    let target: Double

    private static let size: CGFloat = 160
    private static let stroke: CGFloat = 16

    private var ratio: Double {
        target > 0 ? min(consumed / target, 1.2) : 0
    }
    private var remaining: Double { target - consumed }
    private var ringColor: Color {
        CalorieProximity.ringColor(consumed: consumed, target: target, fallback: colors.primary)
    }

    var body: some View {
        VStack(spacing: Spacing.xs) {
            ZStack {
                // Background track ring.
                Circle()
                    .stroke(colors.border, lineWidth: Self.stroke)

                // Progress arc (caps at 100% of the circumference).
                Circle()
                    .trim(from: 0, to: min(ratio, 1))
                    .stroke(ringColor, style: StrokeStyle(lineWidth: Self.stroke, lineCap: .round))
                    .rotationEffect(.degrees(-90))

                VStack(spacing: 0) {
                    Text(Int(consumed).formatted())
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(colors.text)
                    Text("of \(Int(target).formatted()) cal")
                        .font(Typography.small)
                        .foregroundStyle(colors.textSecondary)
                }
            }
            .frame(width: Self.size, height: Self.size)

            Text(remaining >= 0
                 ? "\(Int(remaining).formatted()) remaining"
                 : "\(Int(abs(remaining)).formatted()) over")
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
        }
    }
}
