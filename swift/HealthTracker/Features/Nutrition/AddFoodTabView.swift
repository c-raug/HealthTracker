import SwiftUI

/// "Add Food" tab of the Add-Food modal. Port of `expo/components/nutrition/AddFoodTab.tsx`:
/// a searchable custom-food list (Pinned + Recent when idle; Pinned + My Foods when searching), each
/// row tappable to a portion step, with pin / edit / delete actions and a "Create Custom Food" entry.
/// Ranking/scaling lives in `FoodLibraryLogic`.
///
/// Deferred vs RN (device-polish, documented in the roadmap): pinned drag-**reorder** — a drag
/// gesture that can't be validated blind; the `reorderPinnedFoods` store method is ready for it.
/// Food-type **filtering** (`FoodFilterSheet`/`FavoritePillRow`), pinning, editing, deleting, search,
/// and portioned add are all here.
struct AddFoodTabView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    let date: String
    let category: MealCategory
    var onDone: () -> Void

    @State private var query = ""
    @State private var screen: Screen = .list
    @State private var servings: Double = 1
    @State private var pinning: CustomFood?
    @State private var activeFilters: [String] = []
    @State private var showFilterSheet = false

    private enum Screen {
        case list
        case portion(NutritionFoodItem)
        case create
        case edit(CustomFood)
    }

    private var isSearching: Bool { !query.trimmingCharacters(in: .whitespaces).isEmpty }
    private var filtersActive: Bool { FoodLibraryLogic.hasActiveFoodTypeFilter(activeFilters) }
    private var frequency: [String: Int] { FoodLibraryLogic.frequencyMap(store.nutritionLog) }
    private var matched: [CustomFood] {
        FoodLibraryLogic.applyFoodTypeFilter(FoodLibraryLogic.matches(store.customFoods, query: query), activeTypes: activeFilters)
    }
    private var pinnedFoods: [CustomFood] { FoodLibraryLogic.pinned(matched, category: category) }
    private var recentFoods: [CustomFood] {
        guard !isSearching else { return [] }
        let base = FoodLibraryLogic.applyFoodTypeFilter(store.customFoods, activeTypes: activeFilters)
        return FoodLibraryLogic.recent(base, category: category, frequency: frequency)
    }
    private var myFoods: [CustomFood] { isSearching ? FoodLibraryLogic.unpinned(matched, category: category) : [] }
    private var isEmpty: Bool {
        isSearching ? (pinnedFoods.isEmpty && myFoods.isEmpty) : (pinnedFoods.isEmpty && recentFoods.isEmpty)
    }

    var body: some View {
        switch screen {
        case .list: listScreen
        case let .portion(item): portionScreen(item)
        case .create:
            CustomFoodFormView(onDone: { created in
                if let created { screen = .portion(FoodLibraryLogic.toNutritionItem(created)); servings = 1 }
                else { screen = .list }
            }, initialName: query.trimmingCharacters(in: .whitespaces))
        case let .edit(food):
            CustomFoodFormView(onDone: { _ in screen = .list }, initialFood: food, mode: .edit)
        }
    }

    // MARK: - List

    private var listScreen: some View {
        VStack(spacing: 0) {
            searchBar
            FavoritePillRow(favorites: store.preferences.favoriteFilterTypes ?? [], activeFilters: activeFilters) { type in
                activeFilters = FoodLibraryLogic.toggleFoodTypeFilter(activeFilters, type: type)
            }
            ScrollView {
                LazyVStack(spacing: 0) {
                    if !pinnedFoods.isEmpty {
                        sectionHeader("Pinned")
                        ForEach(pinnedFoods) { foodRow($0) }
                    }
                    if !recentFoods.isEmpty {
                        sectionHeader("Recent")
                        ForEach(recentFoods) { foodRow($0) }
                    }
                    if !myFoods.isEmpty {
                        sectionHeader("My Foods")
                        ForEach(myFoods) { foodRow($0) }
                    }
                    if isEmpty {
                        Text(isSearching || filtersActive ? "No results found" : "No custom foods yet. Tap \"Create Custom Food\" to add one.")
                            .font(Typography.small)
                            .foregroundStyle(colors.textSecondary)
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: .infinity)
                            .padding(Spacing.lg)
                    }
                }
            }
            createButton
        }
        .sheet(item: $pinning) { food in
            PinCategoriesSheet(initial: food.pinnedCategories ?? []) { pins in
                var updated = food
                updated.pinnedCategories = pins
                store.updateCustomFood(updated)
            }
        }
        .sheet(isPresented: $showFilterSheet) {
            FoodFilterSheet(currentFilters: activeFilters) { activeFilters = $0 }
        }
    }

    private var searchBar: some View {
        HStack(spacing: Spacing.sm) {
            HStack(spacing: Spacing.sm) {
                Image(systemName: "magnifyingglass").foregroundStyle(colors.textSecondary)
                TextField("Search foods…", text: $query)
                    .font(Typography.body)
                    .foregroundStyle(colors.text)
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.sm)
            .background(colors.card)
            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(colors.border, lineWidth: 1))

            Button { showFilterSheet = true } label: {
                Image(systemName: "line.3.horizontal.decrease.circle\(filtersActive ? ".fill" : "")")
                    .font(.system(size: 22))
                    .foregroundStyle(filtersActive ? colors.primary : colors.textSecondary)
                    .frame(width: 44, height: 44)
                    .background(colors.card)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(filtersActive ? colors.primary : colors.border, lineWidth: 1))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Filter foods")
        }
        .padding(Spacing.md)
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(Typography.small)
            .foregroundStyle(colors.textSecondary)
            .textCase(.uppercase)
            .kerning(0.8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.xs)
            .background(colors.background)
    }

    private func foodRow(_ food: CustomFood) -> some View {
        HStack(spacing: Spacing.sm) {
            Button { selectFood(food) } label: {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text(food.name).font(Typography.body).foregroundStyle(colors.text).lineLimit(1)
                    Text(rowInfo(food)).font(Typography.small).foregroundStyle(colors.textSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            iconButton(FoodLibraryLogic.isPinnedHere(food, category: category) ? "pin.fill" : "pin",
                       tint: FoodLibraryLogic.isPinnedHere(food, category: category) ? colors.primary : colors.textSecondary) {
                pinning = food
            }
            iconButton("pencil", tint: colors.textSecondary) { screen = .edit(food) }
            iconButton("trash", tint: colors.danger) { store.deleteCustomFood(id: food.id) }
        }
        .padding(.vertical, Spacing.sm)
        .padding(.horizontal, Spacing.md)
        .background(colors.card)
        .overlay(alignment: .bottom) { Rectangle().fill(colors.border).frame(height: 1) }
    }

    private func rowInfo(_ food: CustomFood) -> String {
        var parts = ["\(WeightStats.jsNumberString(food.calories)) cal"]
        if !food.servingSize.isEmpty { parts.append(food.servingSize) }
        parts.append("P: \(WeightStats.jsNumberString(food.protein))g")
        return parts.joined(separator: " · ")
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
                Text("Create Custom Food").font(Typography.body.weight(.semibold))
            }
            .foregroundStyle(colors.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.md)
            .background(colors.primary)
            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
        }
        .buttonStyle(.plain)
        .padding(Spacing.md)
    }

    // MARK: - Portion step

    private func portionScreen(_ item: NutritionFoodItem) -> some View {
        VStack(spacing: 0) {
            ScrollView {
                PortionSelectorView(
                    value: $servings,
                    baseCalories: item.calories ?? 0,
                    baseProtein: item.protein ?? 0,
                    baseCarbs: item.carbs ?? 0,
                    baseFat: item.fat ?? 0,
                    servingSize: item.servingSize ?? "1 serving",
                    baseServings: 1,
                    foodName: item.name
                )
            }
            HStack(spacing: Spacing.sm) {
                Button { screen = .list } label: {
                    Text("Cancel")
                        .font(Typography.body.weight(.semibold))
                        .foregroundStyle(colors.textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.sm)
                        .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(colors.border, lineWidth: 1))
                }
                .buttonStyle(.plain)

                Button { confirmAdd(item) } label: {
                    Text("Add to \(category.rawValue.capitalized)")
                        .font(Typography.body.weight(.semibold))
                        .foregroundStyle(colors.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.sm)
                        .background(colors.primary)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                }
                .buttonStyle(.plain)
            }
            .padding(Spacing.md)
        }
    }

    // MARK: - Actions

    private func selectFood(_ food: CustomFood) {
        servings = 1
        screen = .portion(FoodLibraryLogic.toNutritionItem(food))
    }

    private func confirmAdd(_ item: NutritionFoodItem) {
        store.addFoodToMeal(date: date, category: category, food: FoodLibraryLogic.logged(base: item, servings: servings))
        onDone()
    }
}
