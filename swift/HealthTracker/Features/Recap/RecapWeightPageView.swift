import SwiftUI

/// Page 1 of the weekly recap — port of `expo/components/recap/RecapWeightPage.tsx`.
/// Start/end weight for the recap week with a colored change indicator (loss = accent, gain = danger).
struct RecapWeightPageView: View {
    @Environment(\.appColors) private var colors
    let weekStart: String
    let entries: [WeightEntry]

    private var page: RecapStats.WeightPage { RecapStats.weightPage(weekStart: weekStart, entries: entries) }
    private var unitLabel: String { page.unit == .lbs ? "lbs" : "kg" }

    var body: some View {
        VStack(spacing: 0) {
            Image(systemName: "scalemass")
                .font(.system(size: 52))
                .foregroundStyle(colors.primary)
                .padding(.bottom, Spacing.lg)
            Text("Weekly Weight")
                .font(Typography.h1)
                .foregroundStyle(colors.text)
                .padding(.bottom, Spacing.xl)

            if !page.hasData {
                Text("No weight entries this week")
                    .font(Typography.body)
                    .foregroundStyle(colors.textSecondary)
                    .padding(.top, Spacing.md)
            } else {
                VStack(spacing: Spacing.sm) {
                    row("Start of week", value: formatted(page.startWeight))
                    row("End of week", value: formatted(page.endWeight))
                    if let change = page.change {
                        changeRow(change)
                            .padding(.top, Spacing.xs)
                    }
                }
                .padding(Spacing.lg)
                .frame(maxWidth: .infinity)
                .background(colors.card)
                .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
                .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
            }
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func formatted(_ weight: Double?) -> String {
        guard let w = weight else { return "—" }
        return String(format: "%.1f %@", w, unitLabel)
    }

    private func row(_ label: String, value: String) -> some View {
        HStack {
            Text(label).font(Typography.body).foregroundStyle(colors.textSecondary)
            Spacer()
            Text(value).font(Typography.h3).foregroundStyle(colors.text)
        }
    }

    @ViewBuilder
    private func changeRow(_ change: Double) -> some View {
        let isLoss = change < 0
        let isGain = change > 0
        HStack(spacing: Spacing.xs) {
            if isLoss {
                Image(systemName: "arrow.down").font(.system(size: 22)).foregroundStyle(colors.primary)
            } else if isGain {
                Image(systemName: "arrow.up").font(.system(size: 22)).foregroundStyle(colors.danger)
            }
            Text(changeText(change))
                .font(Typography.h2)
                .foregroundStyle(isLoss ? colors.primary : isGain ? colors.danger : colors.textSecondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func changeText(_ change: Double) -> String {
        if change == 0 { return "No change" }
        let sign = change > 0 ? "+" : ""
        return String(format: "%@%.1f %@", sign, change, unitLabel)
    }
}
