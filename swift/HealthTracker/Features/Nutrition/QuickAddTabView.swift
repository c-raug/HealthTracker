import SwiftUI

/// "Quick Add" tab of the Add-Food modal: a calories-only (optionally named) entry. Port of
/// `expo/components/nutrition/QuickAddTab.tsx`. Adds a `quickAdd: true` food to the meal.
struct QuickAddTabView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    let date: String
    let category: MealCategory
    var onDone: () -> Void

    @State private var name = ""
    @State private var calories = ""
    @FocusState private var caloriesFocused: Bool

    private var isValid: Bool { (Int(calories) ?? 0) > 0 }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text("Name (optional)")
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
            field($name, placeholder: "e.g. Restaurant lunch", numeric: false)

            Text("Calories *")
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
                .padding(.top, Spacing.md)
            field($calories, placeholder: "e.g. 500", numeric: true)
                .focused($caloriesFocused)

            Button(action: handleAdd) {
                Text("Add")
                    .font(Typography.body.weight(.semibold))
                    .foregroundStyle(colors.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Spacing.md)
                    .background(colors.primary)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                    .opacity(isValid ? 1 : 0.5)
            }
            .buttonStyle(.plain)
            .disabled(!isValid)
            .padding(.top, Spacing.lg)

            Spacer()
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .onAppear { caloriesFocused = true }
    }

    private func field(_ text: Binding<String>, placeholder: String, numeric: Bool) -> some View {
        TextField(placeholder, text: text)
            .keyboardType(numeric ? .numberPad : .default)
            .font(Typography.body)
            .foregroundStyle(colors.text)
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.sm)
            .background(colors.card)
            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                    .strokeBorder(colors.border, lineWidth: 1)
            )
    }

    private func handleAdd() {
        guard isValid else { return }
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        let food = NutritionFoodItem(
            id: Identifiers.generate(),
            name: trimmed.isEmpty ? "Quick Add" : trimmed,
            calories: Double(Int(calories) ?? 0),
            protein: 0, carbs: 0, fat: 0,
            servingSize: nil, servings: nil, mealGroupId: nil, mealGroupName: nil,
            quickAdd: true
        )
        store.addFoodToMeal(date: date, category: category, food: food)
        onDone()
    }
}
