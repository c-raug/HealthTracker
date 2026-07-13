import SwiftUI

/// The "calories burned today" flame on the Activities pager (page 0). Port of
/// `expo/components/activities/CalorieFlame.tsx`.
///
/// RN drew a custom fire SVG path filled/stroked with `flameColorForBurn(...)`; the rn-to-swift map
/// substitutes the `flame.fill` SF Symbol (as elsewhere Ionicons became SF Symbols), tinted with the
/// same `FlameColor` ramp and given a matching burn-scaled glow. The burn count + unit are overlaid
/// over the flame body. The Android `AndroidGlowBackdrop` has no iOS counterpart (an iOS `.shadow`
/// glow is used, consistent with Phases 6/8).
struct CalorieFlameView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    let totalBurned: Int
    var size: CGFloat = 176

    private var color: Color { FlameColor.color(forBurn: Double(totalBurned)) }
    private var intensity: Double { FlameColor.glowIntensity(forBurn: Double(totalBurned)) }
    private var calUnit: String { store.preferences.unit == .kg ? "kcal" : "cal" }

    var body: some View {
        ZStack {
            Image(systemName: "flame.fill")
                .resizable()
                .scaledToFit()
                .frame(width: size, height: size)
                .foregroundStyle(color.opacity(0.9))
                .shadow(
                    color: color.opacity(intensity == 0 ? 0 : 0.25 + intensity * 0.6),
                    radius: intensity == 0 ? 0 : 6 + intensity * 18
                )

            VStack(spacing: Spacing.xs) {
                Text(ActivityStats.groupedNumber(totalBurned))
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(.white)
                Text(calUnit)
                    .font(Typography.small)
                    .foregroundStyle(.white.opacity(0.9))
            }
            // Sit the readout over the flame body (RN overlay starts ~28% from the top).
            .offset(y: size * 0.12)
            .shadow(color: .black.opacity(0.25), radius: 2, y: 1)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.sm)
    }
}
