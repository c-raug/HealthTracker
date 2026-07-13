import SwiftUI

/// The Add-Food modal presented from a meal category's **+ Add**. Port of
/// `expo/app/add-food-modal.tsx`: a titled sheet with a three-tab switcher — **Add Food** (custom-food
/// library), **Add Meal** (saved meals), **Quick Add** (calories only). Dismisses itself on a
/// successful add via the environment `dismiss` (`onDone`).
struct AddFoodModal: View {
    @Environment(\.appColors) private var colors
    @Environment(\.dismiss) private var dismiss

    let date: String
    let category: MealCategory

    @State private var tab: Tab = .food

    private enum Tab: String, CaseIterable, Identifiable {
        case food = "Add Food", meal = "Add Meal", quickAdd = "Quick Add"
        var id: String { rawValue }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("", selection: $tab) {
                    ForEach(Tab.allCases) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding(Spacing.md)

                Group {
                    switch tab {
                    case .food: AddFoodTabView(date: date, category: category, onDone: { dismiss() })
                    case .meal: AddMealTabView(date: date, category: category, onDone: { dismiss() })
                    case .quickAdd: QuickAddTabView(date: date, category: category, onDone: { dismiss() })
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .background(colors.background)
            .navigationTitle("Add to \(category.rawValue.capitalized)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: { Image(systemName: "chevron.down") }
                }
            }
        }
    }
}
