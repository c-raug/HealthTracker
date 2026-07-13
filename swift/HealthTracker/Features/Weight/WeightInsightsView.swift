import SwiftUI

/// 7-day "Progress Insights" card: weight change, weekly rate, and an on-track/behind/ahead badge.
/// Port of `expo/components/WeightInsights.tsx`; all derivation lives in `WeightStats.insights`.
struct WeightInsightsView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    private var unit: WeightUnit { store.preferences.unit }

    private var insights: WeightStats.Insights {
        WeightStats.insights(
            entries: store.entries,
            unit: unit,
            goal: store.preferences.profile?.weightGoal
        )
    }

    var body: some View {
        switch insights {
        case .noGoal:
            card(title: "Progress Insights") {
                placeholderText("Set a weight goal in Settings to see progress insights.")
            }
        case .insufficient:
            card(title: "Progress Insights") {
                placeholderText("Log more entries to see progress insights.")
            }
        case let .ready(totalChange, weeklyRate, status):
            card(title: "Progress Insights (Last 7 Days)") {
                statRow("Weight change", fmt(totalChange))
                statRow("Weekly rate", "\(fmt(weeklyRate))/wk")
                badge(for: status)
            }
        }
    }

    // MARK: - Building blocks

    private func card<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(title)
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
                .textCase(.uppercase)
                .kerning(0.8)
                .padding(.bottom, Spacing.xs)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .featureCardStyle()
    }

    private func placeholderText(_ msg: String) -> some View {
        Text(msg)
            .font(Typography.body)
            .foregroundStyle(colors.textSecondary)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.sm)
    }

    private func statRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
            Spacer()
            Text(value)
                .font(Typography.body.weight(.semibold))
                .foregroundStyle(colors.text)
        }
        .padding(.bottom, Spacing.xs)
    }

    private func badge(for status: WeightStats.InsightStatus) -> some View {
        let config = badgeConfig(status)
        return HStack(spacing: Spacing.xs) {
            Image(systemName: config.icon)
                .font(.system(size: 14))
                .foregroundStyle(config.fg)
            Text(config.label)
                .font(Typography.small.weight(.semibold))
                .foregroundStyle(config.fg)
        }
        .padding(.vertical, Spacing.xs)
        .padding(.horizontal, Spacing.sm)
        .background(config.bg)
        .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
        .padding(.top, Spacing.xs)
    }

    private func badgeConfig(_ status: WeightStats.InsightStatus) -> (icon: String, label: String, bg: Color, fg: Color) {
        switch status {
        case .onTrack:
            return ("checkmark.circle.fill", "On Track", colors.primaryLight, colors.primary)
        case .behind:
            return ("exclamationmark.triangle.fill", "Behind", colors.dangerLight, colors.danger)
        case .ahead:
            return ("exclamationmark.circle.fill", "Ahead of Target", Color(hex: "#FFF3E0"), Color(hex: "#E65100"))
        }
    }

    // MARK: - Formatting (RN `fmt`)

    /// `+/-N.N unit` — 1 dp under 10, whole otherwise; the sign prefix is only added for positives
    /// (negatives carry their own minus). Mirrors the RN `fmt` helper.
    private func fmt(_ n: Double) -> String {
        let sign = n > 0 ? "+" : ""
        let magnitude = abs(n) < 10 ? String(format: "%.1f", n) : String(format: "%.0f", n)
        return "\(sign)\(magnitude) \(unit.rawValue)"
    }
}
