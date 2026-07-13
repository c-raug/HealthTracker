import SwiftUI

/// "Add Meal" tab of the Add-Food modal. Port of `expo/components/nutrition/AddMealTab.tsx`:
/// a searchable saved-meal list (Pinned + All Meals); tapping a meal logs all its foods under one
/// shared `mealGroupId`. Pin / delete / create are supported; editing a saved meal (`EditMealFlow`)
/// and drag-reorder / food-type filtering are deferred.
struct AddMealTabView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    let date: String
    let category: MealCategory
    var onDone: () -> Void

    @State private var query = ""
    @State private var screen: Screen = .list
    @State private var pinning: SavedMeal?
    @State private var deleting: SavedMeal?

    private enum Screen { case list, create }

    private var matched: [SavedMeal] { FoodLibraryLogic.mealMatches(store.savedMeals, query: query) }
    private var pinnedMeals: [SavedMeal] { FoodLibraryLogic.pinnedMeals(matched, category: category) }
    private var otherMeals: [SavedMeal] { FoodLibraryLogic.otherMeals(matched, category: category) }
    private var isEmpty: Bool { pinnedMeals.isEmpty && otherMeals.isEmpty }

    var body: some View {
        switch screen {
        case .list: listScreen
        case .create: CreateMealFlowView(onDone: { screen = .list })
        }
    }

    private var listScreen: some View {
        VStack(spacing: 0) {
            searchBar
            ScrollView {
                LazyVStack(spacing: 0) {
                    if !pinnedMeals.isEmpty {
                        sectionHeader("Pinned")
                        ForEach(pinnedMeals) { mealRow($0) }
                    }
                    if !otherMeals.isEmpty {
                        if !pinnedMeals.isEmpty { sectionHeader("All Meals") }
                        ForEach(otherMeals) { mealRow($0) }
                    }
                    if isEmpty {
                        Text(query.trimmingCharacters(in: .whitespaces).isEmpty ? "No saved meals yet" : "No results found")
                            .font(Typography.small).foregroundStyle(colors.textSecondary)
                            .frame(maxWidth: .infinity).padding(Spacing.xl)
                    }
                }
            }
            createButton
        }
        .sheet(item: $pinning) { meal in
            PinCategoriesSheet(initial: meal.pinnedCategories ?? []) { pins in
                var updated = meal
                updated.pinnedCategories = pins
                store.updateSavedMeal(updated)
            }
        }
        .alert("Delete Meal", isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } }), presenting: deleting) { meal in
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) { store.deleteSavedMeal(id: meal.id) }
        } message: { _ in
            Text("Are you sure you want to delete this saved meal?")
        }
    }

    private var searchBar: some View {
        HStack(spacing: Spacing.sm) {
            Image(systemName: "magnifyingglass").foregroundStyle(colors.textSecondary)
            TextField("Search meals…", text: $query).font(Typography.body).foregroundStyle(colors.text)
        }
        .padding(.horizontal, Spacing.md).padding(.vertical, Spacing.sm)
        .background(colors.card)
        .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(colors.border, lineWidth: 1))
        .padding(Spacing.md)
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title).font(Typography.small).foregroundStyle(colors.textSecondary)
            .textCase(.uppercase).kerning(0.8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, Spacing.md).padding(.vertical, Spacing.xs)
            .background(colors.background)
    }

    private func mealRow(_ meal: SavedMeal) -> some View {
        HStack(spacing: Spacing.sm) {
            Button { addMeal(meal) } label: {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text(meal.name).font(Typography.body.weight(.semibold)).foregroundStyle(colors.text).lineLimit(1)
                    Text("\(meal.foods.count) food\(meal.foods.count == 1 ? "" : "s") · \(FoodLibraryLogic.mealCalories(meal)) cal")
                        .font(Typography.small).foregroundStyle(colors.textSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            iconButton(FoodLibraryLogic.isMealPinnedHere(meal, category: category) ? "pin.fill" : "pin",
                       tint: FoodLibraryLogic.isMealPinnedHere(meal, category: category) ? colors.primary : colors.textSecondary) {
                pinning = meal
            }
            iconButton("trash", tint: colors.danger) { deleting = meal }
        }
        .padding(.vertical, Spacing.sm).padding(.horizontal, Spacing.md)
        .background(colors.card)
        .overlay(alignment: .bottom) { Rectangle().fill(colors.border).frame(height: 1) }
    }

    private func iconButton(_ systemName: String, tint: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName).font(.system(size: 18)).foregroundStyle(tint).padding(Spacing.xs)
        }
        .buttonStyle(.plain)
    }

    private var createButton: some View {
        Button { screen = .create } label: {
            HStack(spacing: Spacing.xs) {
                Image(systemName: "plus.circle.fill")
                Text("Create Meal").font(Typography.body.weight(.semibold))
            }
            .foregroundStyle(colors.white)
            .frame(maxWidth: .infinity).padding(.vertical, Spacing.md)
            .background(colors.primary)
            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
        }
        .buttonStyle(.plain)
        .padding(Spacing.md)
    }

    private func addMeal(_ meal: SavedMeal) {
        for food in FoodLibraryLogic.mealGroupFoods(meal) {
            store.addFoodToMeal(date: date, category: category, food: food)
        }
        onDone()
    }
}
