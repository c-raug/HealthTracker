import SwiftUI
import Charts

/// Weight-trend line chart with a time-range selector + Start/Change/Current summary. Port of
/// `expo/components/WeightChart.tsx` (which used `react-native-chart-kit`; here we use the native
/// Swift `Charts` framework). Shows a placeholder until at least 2 entries exist.
struct WeightChartView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    @State private var range: WeightStats.TimeRange = .oneMonth

    private var unit: WeightUnit { store.preferences.unit }
    private var unitLabel: String { unit.rawValue }

    private var series: WeightStats.ChartSeries? {
        WeightStats.chartSeries(entries: store.entries, unit: unit, range: range)
    }

    var body: some View {
        if let series {
            chartCard(series)
        } else {
            placeholder
        }
    }

    // MARK: - Chart card

    private func chartCard(_ series: WeightStats.ChartSeries) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack {
                Text("Weight Trend (\(unitLabel))")
                    .font(Typography.small)
                    .foregroundStyle(colors.textSecondary)
                    .textCase(.uppercase)
                    .kerning(0.8)
                Spacer()
                rangeMenu
            }

            chart(series)
                .frame(height: 200)
                .padding(Spacing.sm)
                .background(Color(hex: colors.isDark ? "#2C2C2E" : "#F8F9FB"))
                .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                        .strokeBorder(colors.border, lineWidth: 1)
                )

            summaryRow(series)
        }
        .featureCardStyle()
    }

    private var rangeMenu: some View {
        Menu {
            ForEach(WeightStats.TimeRange.allCases) { option in
                Button {
                    range = option
                } label: {
                    if option == range {
                        Label(option.rawValue, systemImage: "checkmark")
                    } else {
                        Text(option.rawValue)
                    }
                }
            }
        } label: {
            HStack(spacing: Spacing.xs) {
                Text(range.rawValue)
                    .font(Typography.small.weight(.semibold))
                Image(systemName: "chevron.down")
                    .font(.system(size: 12))
            }
            .foregroundStyle(colors.primary)
            .padding(.horizontal, Spacing.sm)
            .padding(.vertical, Spacing.xs)
            .background(colors.primaryLight)
            .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
        }
    }

    private func chart(_ series: WeightStats.ChartSeries) -> some View {
        // Show at most ~6 x-axis labels to avoid crowding (RN `labelStep`).
        let count = series.points.count
        let labelStep = max(1, Int(ceil(Double(count) / 6)))
        let labelIndices = stride(from: 0, to: count, by: labelStep).map { $0 }
        let labels = Dictionary(uniqueKeysWithValues: series.points.map { ($0.index, Dates.formatShortDate($0.date)) })

        return Chart(series.points) { point in
            LineMark(
                x: .value("Point", point.index),
                y: .value("Weight", point.value)
            )
            .foregroundStyle(colors.primary)
            .lineStyle(StrokeStyle(lineWidth: 2))
            .interpolationMethod(.catmullRom)

            PointMark(
                x: .value("Point", point.index),
                y: .value("Weight", point.value)
            )
            .foregroundStyle(colors.primary)
            .symbolSize(30)
        }
        .chartXAxis {
            AxisMarks(values: labelIndices) { value in
                AxisGridLine()
                AxisValueLabel {
                    if let i = value.as(Int.self), let label = labels[i] {
                        Text(label)
                            .font(Typography.small)
                            .foregroundStyle(colors.textSecondary)
                    }
                }
            }
        }
        .chartYAxis {
            AxisMarks()
        }
    }

    private func summaryRow(_ series: WeightStats.ChartSeries) -> some View {
        let net = series.netChange
        let sign = net >= 0 ? "+" : ""
        let netStr = "\(sign)\(String(format: "%.1f", net)) \(unitLabel)"
        let netColor: Color = net < 0 ? colors.primary : (net > 0 ? colors.danger : colors.textSecondary)

        return HStack {
            summaryItem("Start", String(format: "%.1f", series.startWeight), colors.text)
            Spacer()
            summaryItem("Change", netStr, netColor)
            Spacer()
            summaryItem("Current", String(format: "%.1f", series.endWeight), colors.text)
        }
        .padding(.top, Spacing.xs)
    }

    private func summaryItem(_ label: String, _ value: String, _ valueColor: Color) -> some View {
        VStack(spacing: Spacing.xs) {
            Text(label)
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
            Text(value)
                .font(Typography.body.weight(.semibold))
                .foregroundStyle(valueColor)
        }
    }

    // MARK: - Placeholder

    private var placeholder: some View {
        Text("Log at least 2 entries to see your weight chart.")
            .font(Typography.body)
            .foregroundStyle(colors.textSecondary)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
            .padding(Spacing.xl)
            .featureCardStyle()
    }
}
