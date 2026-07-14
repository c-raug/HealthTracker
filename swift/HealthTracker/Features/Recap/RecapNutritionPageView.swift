import SwiftUI

/// Page 2 of the weekly recap — port of `expo/components/recap/RecapNutritionPage.tsx`.
/// Average daily calories (over logged days) + weekly macro totals in the fixed macro colors.
struct RecapNutritionPageView: View {
    @Environment(\.appColors) private var colors
    let weekStart: String
    let nutritionLog: [DayNutrition]
    let calorieTarget: Int?

    private var page: RecapStats.NutritionPage {
        RecapStats.nutritionPage(weekStart: weekStart, nutritionLog: nutritionLog)
    }

    var body: some View {
        VStack(spacing: 0) {
            Image(systemName: "fork.knife")
                .font(.system(size: 52))
                .foregroundStyle(colors.primary)
                .padding(.bottom, Spacing.lg)
            Text("Weekly Nutrition")
                .font(Typography.h1)
                .foregroundStyle(colors.text)
                .padding(.bottom, Spacing.xl)

            if page.loggingDays == 0 {
                Text("No nutrition data logged this week")
                    .font(Typography.body)
                    .foregroundStyle(colors.textSecondary)
                    .padding(.top, Spacing.md)
            } else {
                caloriesCard
                    .padding(.bottom, Spacing.md)
                macrosCard
            }
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var caloriesCard: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text("Avg Daily Calories").font(Typography.h3).foregroundStyle(colors.text)
                .padding(.bottom, Spacing.xs)
            row("Consumed", value: "\(grouped(page.avgCalories)) cal")
            if let target = calorieTarget, target > 0 {
                row("Goal", value: "\(grouped(target)) cal")
            }
            Text("Based on \(page.loggingDays) of 7 days logged")
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
                .frame(maxWidth: .infinity, alignment: .trailing)
                .padding(.top, Spacing.xs)
        }
        .padding(Spacing.lg)
        .frame(maxWidth: .infinity)
        .background(colors.card)
        .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
        .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
    }

    private var macrosCard: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Weekly Macros").font(Typography.h3).foregroundStyle(colors.text)
            HStack(spacing: Spacing.sm) {
                macroPill("Protein", grams: page.totalProtein, color: FixedColors.macroProtein)
                macroPill("Carbs", grams: page.totalCarbs, color: FixedColors.macroCarbs)
                macroPill("Fat", grams: page.totalFat, color: FixedColors.macroFat)
            }
        }
        .padding(Spacing.lg)
        .frame(maxWidth: .infinity)
        .background(colors.card)
        .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
        .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
    }

    private func row(_ label: String, value: String) -> some View {
        HStack {
            Text(label).font(Typography.body).foregroundStyle(colors.textSecondary)
            Spacer()
            Text(value).font(Typography.h3).foregroundStyle(colors.text)
        }
    }

    private func macroPill(_ label: String, grams: Int, color: Color) -> some View {
        VStack(spacing: Spacing.xs) {
            Text(label)
                .font(Typography.small.weight(.semibold))
                .foregroundStyle(colors.white)
                .opacity(0.9)
            Text("\(grams)g")
                .font(Typography.h3.weight(.bold))
                .foregroundStyle(colors.white)
        }
        .frame(maxWidth: .infinity)
        .padding(Spacing.sm)
        .background(color)
        .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
    }

    /// Thousands-separated integer (RN `toLocaleString()`).
    private func grouped(_ n: Int) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        return f.string(from: NSNumber(value: n)) ?? "\(n)"
    }
}
