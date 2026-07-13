import SwiftUI

/// A single logged-food row inside a meal category. Port of `expo/components/nutrition/FoodItem.tsx`:
/// swipe-left to delete, tap to edit. Editing a **quick-add** entry shows a calories/name form;
/// editing a normal food shows the `PortionSelectorView`. Portion math lives in `PortionMath`.
struct FoodItemView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    let item: NutritionFoodItem
    let date: String
    let category: MealCategory
    var onDelete: () -> Void

    @State private var editVisible = false
    @State private var editServings: Double = 1
    @State private var quickCalories = ""
    @State private var quickName = ""

    private var hasNutrition: Bool { item.calories != nil }
    private var baseServings: Double { item.servings ?? 1 }

    var body: some View {
        SwipeableRow(
            actionColor: colors.danger,
            onAction: onDelete,
            actionLabel: {
                Text("Delete")
                    .font(Typography.body.weight(.semibold))
                    .foregroundStyle(colors.white)
            },
            content: { rowContent }
        )
        .sheet(isPresented: $editVisible) { editSheet }
    }

    // MARK: - Row

    private var rowContent: some View {
        HStack(spacing: Spacing.sm) {
            Text("•")
                .font(Typography.body)
                .foregroundStyle(colors.textSecondary)

            Button(action: openEdit) {
                VStack(alignment: .leading, spacing: 1) {
                    HStack(spacing: Spacing.xs) {
                        Text(item.name)
                            .font(Typography.body)
                            .italic(item.quickAdd == true)
                            .foregroundStyle(colors.text)
                            .lineLimit(1)
                        if item.quickAdd == true {
                            Text("Quick")
                                .font(.system(size: 10))
                                .foregroundStyle(colors.white)
                                .padding(.horizontal, Spacing.xs)
                                .padding(.vertical, 2)
                                .background(colors.textSecondary)
                                .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                        }
                    }
                    if hasNutrition, let serving = item.servingSize {
                        Text(serving + (baseServings > 1 ? " x\(WeightStats.jsNumberString(baseServings))" : ""))
                            .font(Typography.small)
                            .foregroundStyle(colors.textSecondary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if hasNutrition {
                Text("\(WeightStats.jsNumberString(item.calories ?? 0)) cal")
                    .font(Typography.body.weight(.medium))
                    .foregroundStyle(colors.textSecondary)
            }
        }
        .padding(.vertical, Spacing.sm)
        .padding(.horizontal, Spacing.md)
        .background(colors.card)
        .overlay(alignment: .bottom) {
            Rectangle().fill(colors.border).frame(height: 1)
        }
    }

    // MARK: - Edit sheet

    @ViewBuilder
    private var editSheet: some View {
        NavigationStack {
            Group {
                if item.quickAdd == true {
                    quickEditForm
                } else {
                    ScrollView {
                        PortionSelectorView(
                            value: $editServings,
                            baseCalories: PortionMath.perServingBase(stored: item.calories, baseServings: baseServings),
                            baseProtein: PortionMath.perServingBase(stored: item.protein, baseServings: baseServings),
                            baseCarbs: PortionMath.perServingBase(stored: item.carbs, baseServings: baseServings),
                            baseFat: PortionMath.perServingBase(stored: item.fat, baseServings: baseServings),
                            servingSize: item.servingSize ?? "1 serving",
                            baseServings: 1,
                            foodName: item.name
                        )
                        confirmButton("Update Portion")
                    }
                }
            }
            .background(colors.background.ignoresSafeArea())
            .navigationTitle(item.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { editVisible = false }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private var quickEditForm: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text("Calories")
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
                .padding(.top, Spacing.md)
            editField($quickCalories, numeric: true)

            Text("Name")
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
                .padding(.top, Spacing.md)
            editField($quickName, numeric: false)

            confirmButton("Update")
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func editField(_ text: Binding<String>, numeric: Bool) -> some View {
        TextField("", text: text)
            .keyboardType(numeric ? .numberPad : .default)
            .font(Typography.body)
            .foregroundStyle(colors.text)
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.sm)
            .background(colors.background)
            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                    .strokeBorder(colors.border, lineWidth: 1)
            )
    }

    private func confirmButton(_ title: String) -> some View {
        Button(action: confirmEdit) {
            Text(title)
                .font(Typography.body.weight(.semibold))
                .foregroundStyle(colors.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.md)
                .background(colors.primary)
                .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
        }
        .buttonStyle(.plain)
        .padding(.horizontal, Spacing.md)
        .padding(.top, Spacing.sm)
    }

    // MARK: - Actions

    private func openEdit() {
        if item.quickAdd == true {
            quickCalories = WeightStats.jsNumberString(item.calories ?? 0)
            quickName = item.name
        } else {
            editServings = item.servings ?? 1
        }
        editVisible = true
    }

    private func confirmEdit() {
        if item.quickAdd == true {
            let cal = Double(Int(quickCalories) ?? 0)
            var updated = item
            updated.name = quickName.trimmingCharacters(in: .whitespaces).isEmpty ? "Quick Add" : quickName.trimmingCharacters(in: .whitespaces)
            updated.calories = cal
            store.updateFoodInMeal(date: date, category: category, food: updated)
        } else {
            let updated = PortionMath.rescale(item, toServings: editServings)
            store.updateFoodInMeal(date: date, category: category, food: updated)
        }
        editVisible = false
    }
}
