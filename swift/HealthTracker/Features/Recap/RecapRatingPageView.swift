import SwiftUI

/// Page 4 of the weekly recap — port of `expo/components/recap/RecapRatingPage.tsx`.
/// A 1–5 star rating (fixed amber) over the 4-factor breakdown bars (accent-filled).
struct RecapRatingPageView: View {
    @Environment(\.appColors) private var colors
    let result: WeeklyRating.Result

    private static let starFilled = Color(hex: "#F59E0B")
    private static let starEmpty = Color(hex: "#D1D5DB")

    private var factors: [(label: String, value: Double)] {
        [
            ("Calorie Goal", result.factors.calories),
            ("Water Goal", result.factors.water),
            ("Weight Logged", result.factors.weight),
            ("Food Logged", result.factors.food),
        ]
    }

    var body: some View {
        VStack(spacing: 0) {
            Image(systemName: "trophy")
                .font(.system(size: 52))
                .foregroundStyle(colors.primary)
                .padding(.bottom, Spacing.lg)
            Text("Week Rating")
                .font(Typography.h1)
                .foregroundStyle(colors.text)
                .padding(.bottom, Spacing.md)

            HStack(spacing: Spacing.xs) {
                ForEach(0..<5, id: \.self) { i in
                    Image(systemName: i < result.stars ? "star.fill" : "star")
                        .font(.system(size: 36))
                        .foregroundStyle(i < result.stars ? Self.starFilled : Self.starEmpty)
                }
            }
            .padding(.bottom, Spacing.xl)

            VStack(alignment: .leading, spacing: Spacing.sm) {
                Text("Factor Breakdown").font(Typography.h3).foregroundStyle(colors.text)
                    .padding(.bottom, Spacing.xs)
                ForEach(factors, id: \.label) { factor in
                    factorRow(factor.label, value: factor.value)
                }
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity)
            .background(colors.card)
            .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
            .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func factorRow(_ label: String, value: Double) -> some View {
        let pct = jsRoundInt(value * 100)
        return VStack(spacing: Spacing.xs) {
            HStack {
                Text(label).font(Typography.body).foregroundStyle(colors.text)
                Spacer()
                Text("\(pct)%").font(Typography.body.weight(.semibold)).foregroundStyle(colors.textSecondary)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(colors.border)
                    Capsule().fill(colors.primary)
                        .frame(width: geo.size.width * CGFloat(pct) / 100)
                }
            }
            .frame(height: 8)
        }
    }
}
