import SwiftUI

/// Dual wheel-picker portion selector with a live macro preview. Port of
/// `expo/components/nutrition/PortionSelector.tsx` — RN used custom scroll "drums"; the
/// rn-to-swift map calls for native `Picker(.wheel)`. The two wheels (whole number + eighth
/// fraction) drive the bound serving `value`; all number logic lives in `PortionMath`.
struct PortionSelectorView: View {
    @Environment(\.appColors) private var colors

    @Binding var value: Double
    let baseCalories: Double
    let baseProtein: Double
    let baseCarbs: Double
    let baseFat: Double
    let servingSize: String
    let baseServings: Double
    var foodName: String?

    @State private var whole: Int
    @State private var fractionIndex: Int

    init(
        value: Binding<Double>,
        baseCalories: Double,
        baseProtein: Double,
        baseCarbs: Double,
        baseFat: Double,
        servingSize: String,
        baseServings: Double,
        foodName: String? = nil
    ) {
        _value = value
        self.baseCalories = baseCalories
        self.baseProtein = baseProtein
        self.baseCarbs = baseCarbs
        self.baseFat = baseFat
        self.servingSize = servingSize
        self.baseServings = baseServings
        self.foodName = foodName
        let parts = PortionMath.decompose(value.wrappedValue)
        _whole = State(initialValue: parts.whole)
        _fractionIndex = State(initialValue: parts.fractionIndex)
    }

    private var total: Double { PortionMath.compose(whole: whole, fractionIndex: fractionIndex) }
    private var preview: (calories: Int, protein: Double, carbs: Double, fat: Double) {
        PortionMath.preview(total: total, baseCalories: baseCalories, baseProtein: baseProtein,
                            baseCarbs: baseCarbs, baseFat: baseFat, baseServings: baseServings)
    }

    var body: some View {
        VStack(spacing: Spacing.sm) {
            if let foodName {
                Text(foodName)
                    .font(Typography.body.weight(.semibold))
                    .foregroundStyle(colors.text)
                    .multilineTextAlignment(.center)
                    .lineLimit(1)
            }

            Text("\(PortionMath.servingCountLabel(total)) × \(servingSize)")
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)

            HStack(spacing: Spacing.md) {
                wheel(label: "Whole") {
                    Picker("Whole", selection: $whole) {
                        ForEach(0...PortionMath.wholeMax, id: \.self) { Text("\($0)").tag($0) }
                    }
                    .pickerStyle(.wheel)
                    .frame(width: 110, height: 132)
                }
                wheel(label: "Fraction") {
                    Picker("Fraction", selection: $fractionIndex) {
                        ForEach(PortionMath.fractionLabels.indices, id: \.self) {
                            Text(PortionMath.fractionLabels[$0]).tag($0)
                        }
                    }
                    .pickerStyle(.wheel)
                    .frame(width: 110, height: 132)
                }
            }

            Text("\(PortionMath.totalDisplay(whole: whole, fractionIndex: fractionIndex)) serving\(total != 1 ? "s" : "")")
                .font(Typography.h3)
                .foregroundStyle(colors.text)

            HStack {
                previewItem("\(preview.calories)", "cal")
                Spacer()
                previewItem("\(WeightStats.jsNumberString(preview.protein))g", "protein")
                Spacer()
                previewItem("\(WeightStats.jsNumberString(preview.carbs))g", "carbs")
                Spacer()
                previewItem("\(WeightStats.jsNumberString(preview.fat))g", "fat")
            }
            .padding(.vertical, Spacing.sm)
            .padding(.horizontal, Spacing.md)
            .background(colors.primaryLight)
            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
        }
        .padding(.horizontal, Spacing.md)
        .padding(.vertical, Spacing.sm)
        .onChange(of: whole) { value = total }
        .onChange(of: fractionIndex) { value = total }
    }

    private func wheel<Content: View>(label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(spacing: Spacing.xs) {
            Text(label)
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
            content()
                .background(colors.background)
                .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
        }
    }

    private func previewItem(_ value: String, _ label: String) -> some View {
        VStack(spacing: 0) {
            Text(value)
                .font(Typography.body.weight(.semibold))
                .foregroundStyle(colors.text)
            Text(label)
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
        }
    }
}
