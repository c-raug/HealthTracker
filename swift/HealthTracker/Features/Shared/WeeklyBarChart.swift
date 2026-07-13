import SwiftUI
import Charts

/// A 7-day bar chart card (consumed bars + a dashed goal line), ported from the `BarChart` +
/// `WeeklyCalorieGraph` / `WeeklyWaterGraph` / `WeeklyActivityGraph` exports in
/// `expo/components/nutrition/WeeklyIntakeGraph.tsx`. RN drew it with `react-native-svg`; here it's
/// the native Swift `Charts` framework.
///
/// Shared because three tabs consume it: Nutrition (calories — proximity colored), Water (Phase 8 —
/// fixed blue), and Activities (Phase 9 — fixed accent). Coloring is selected via `Coloring`.
struct WeeklyBarChart: View {
    @Environment(\.appColors) private var colors

    let title: String
    let points: [NutritionStats.DayPoint]
    var goalLine: Int?
    var coloring: Coloring

    /// How each bar is tinted.
    enum Coloring: Equatable {
        /// Calorie proximity to that day's goal (RN `useProximityColors`).
        case proximity
        /// A single fixed color for every bar (RN `fixedBarColor` — water blue / accent).
        case fixed(Color)
    }

    private static let weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    private func weekday(_ date: String) -> String {
        Self.weekdayLabels[Dates.jsDayOfWeek(date)]
    }

    private func barColor(_ point: NutritionStats.DayPoint) -> Color {
        switch coloring {
        case .proximity:
            return CalorieProximity.ringColor(consumed: point.consumed, target: point.goal, fallback: colors.primary)
        case let .fixed(color):
            return color
        }
    }

    /// The goal value to draw the dashed line at: an explicit `goalLine`, else the first day with a
    /// positive goal (RN `resolvedGoal`).
    private var resolvedGoal: Double {
        if let goalLine, goalLine > 0 { return Double(goalLine) }
        return points.first { $0.goal > 0 }?.goal ?? 0
    }

    /// Y-axis upper bound: at least the tallest bar/goal, with headroom above the goal (RN `maxValue`).
    private var maxValue: Double {
        let dataMax = max(points.map { max($0.goal, $0.consumed) }.max() ?? 1, 1)
        return max(dataMax, resolvedGoal > 0 ? resolvedGoal * 1.15 : dataMax)
    }

    private func goalLabel(_ value: Double) -> String {
        value >= 1000 ? String(format: "%.1fk", value / 1000) : "\(Int(value))"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(title)
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
                .textCase(.uppercase)
                .kerning(0.8)

            chart
                .frame(height: 180)
                .background(Color(hex: colors.isDark ? "#2C2C2E" : "#F8F9FB"))
                .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                        .strokeBorder(colors.border, lineWidth: 1)
                )
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .featureCardStyle()
    }

    private var chart: some View {
        Chart {
            ForEach(points) { point in
                BarMark(
                    x: .value("Day", weekday(point.date)),
                    y: .value("Value", point.consumed),
                    width: .ratio(0.55)
                )
                .foregroundStyle(barColor(point))
                .opacity(0.85)
                .cornerRadius(3)
            }

            if resolvedGoal > 0 {
                RuleMark(y: .value("Goal", resolvedGoal))
                    .lineStyle(StrokeStyle(lineWidth: 2, dash: [4, 3]))
                    .foregroundStyle(colors.textSecondary.opacity(0.9))
                    .annotation(position: .top, alignment: .trailing) {
                        Text("Goal: \(goalLabel(resolvedGoal))")
                            .font(.system(size: 9))
                            .foregroundStyle(colors.textSecondary)
                    }
            }
        }
        // Preserve chronological order for the nominal x-axis (Charts would otherwise sort labels).
        .chartXScale(domain: points.map { weekday($0.date) })
        .chartYScale(domain: 0...maxValue)
        .chartYAxis {
            AxisMarks { value in
                AxisGridLine()
                AxisValueLabel {
                    if let v = value.as(Double.self) {
                        Text(v >= 1000 ? String(format: "%.1fk", v / 1000) : "\(Int(v))")
                            .font(.system(size: 10))
                            .foregroundStyle(colors.textSecondary)
                    }
                }
            }
        }
        .chartXAxis {
            AxisMarks { _ in
                AxisValueLabel()
                    .font(Typography.small)
            }
        }
        .padding(Spacing.sm)
    }
}
