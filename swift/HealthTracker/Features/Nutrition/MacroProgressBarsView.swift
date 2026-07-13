import SwiftUI

/// The "Macros" card: protein / carbs / fat progress bars (consumed grams vs target grams). Port of
/// `expo/components/nutrition/MacroProgressBars.tsx`. Bar colors are the fixed macro colors
/// (never the accent — see `FixedColors`); targets come from `NutritionStats.macroTargets`.
struct MacroProgressBarsView: View {
    @Environment(\.appColors) private var colors

    let consumed: NutritionStats.Macros
    let goalCalories: Double
    let split: MacroSplit

    private struct Row: Identifiable {
        let id = UUID()
        let label: String
        let color: Color
        let current: Int
        let target: Int
    }

    private var rows: [Row] {
        let targets = NutritionStats.macroTargets(goalCalories: goalCalories, split: split)
        return [
            Row(label: "Protein", color: FixedColors.macroProtein, current: jsRoundInt(consumed.protein), target: targets.protein),
            Row(label: "Carbs", color: FixedColors.macroCarbs, current: jsRoundInt(consumed.carbs), target: targets.carbs),
            Row(label: "Fat", color: FixedColors.macroFat, current: jsRoundInt(consumed.fat), target: targets.fat),
        ]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Macros")
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
                .textCase(.uppercase)
                .kerning(0.8)

            ForEach(rows) { row in
                HStack(spacing: Spacing.sm) {
                    Text(row.label)
                        .font(Typography.small.weight(.semibold))
                        .foregroundStyle(row.color)
                        .frame(width: 60, alignment: .leading)

                    GeometryReader { geo in
                        let pct = row.target > 0 ? min(Double(row.current) / Double(row.target), 1) : 0
                        ZStack(alignment: .leading) {
                            Capsule().fill(colors.border)
                            Capsule().fill(row.color)
                                .frame(width: geo.size.width * pct)
                        }
                    }
                    .frame(height: 10)

                    Text("\(row.current)g / \(row.target)g")
                        .font(Typography.small)
                        .foregroundStyle(colors.textSecondary)
                        .frame(width: 90, alignment: .trailing)
                        .lineLimit(1)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .featureCardStyle()
    }
}
