import SwiftUI

/// Food Library sub-screen — port of `expo/app/food-library-modal.tsx`: a Foods / Meals segmented
/// switcher, each an alphabetical searchable list with edit + delete, plus a Create action that opens
/// the shared `CustomFoodFormView` (foods) or `CreateMealFlowView` (meals, incl. the edit/EditMeal
/// path) in a sheet. Reached from the Profile screen.
///
/// Phase 14: the food-type **filter** sheet + **favorite** Quick-Filter pills are wired here (Foods
/// tab). The RN `FloatingPillBar` blurred-pill layout is intentionally replaced by the native search
/// field + a filter button + toolbar `＋` (an idiomatic substitution, consistent with earlier phases).
struct FoodLibraryView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    private enum Tab: Hashable { case foods, meals }

    /// The active create/edit form, presented as a sheet (so its bottom action buttons clear the
    /// always-floating pill tab bar).
    private enum FormSheet: Identifiable {
        case createFood
        case editFood(CustomFood)
        case createMeal
        case editMeal(SavedMeal)

        var id: String {
            switch self {
            case .createFood: return "createFood"
            case .editFood(let f): return "editFood-\(f.id)"
            case .createMeal: return "createMeal"
            case .editMeal(let m): return "editMeal-\(m.id)"
            }
        }
    }

    @State private var tab: Tab = .foods
    @State private var query = ""
    @State private var sheet: FormSheet?
    @State private var deleteFood: CustomFood?
    @State private var deleteMeal: SavedMeal?
    @State private var activeFilters: [String] = []
    @State private var showFilterSheet = false

    private var filtersActive: Bool { FoodLibraryLogic.hasActiveFoodTypeFilter(activeFilters) }

    var body: some View {
        VStack(spacing: Spacing.sm) {
            SettingsToggle(options: [(Tab.foods, "Foods"), (Tab.meals, "Meals")], selection: $tab)
                .padding(.horizontal, Spacing.md)

            HStack(spacing: Spacing.sm) {
                searchField
                if tab == .foods {
                    Button { showFilterSheet = true } label: {
                        Image(systemName: "line.3.horizontal.decrease.circle\(filtersActive ? ".fill" : "")")
                            .font(.system(size: 22))
                            .foregroundStyle(filtersActive ? colors.primary : colors.textSecondary)
                            .frame(width: 44, height: 44)
                            .background(colors.card)
                            .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous).strokeBorder(filtersActive ? colors.primary : colors.border, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Filter foods")
                }
            }
            .padding(.horizontal, Spacing.md)

            if tab == .foods {
                FavoritePillRow(favorites: store.preferences.favoriteFilterTypes ?? [], activeFilters: activeFilters) { type in
                    activeFilters = FoodLibraryLogic.toggleFoodTypeFilter(activeFilters, type: type)
                }
            }

            ScrollView {
                LazyVStack(spacing: Spacing.sm) {
                    if tab == .foods { foodRows } else { mealRows }
                }
                .padding(.horizontal, Spacing.md)
            }
            .pillBottomClearance()
        }
        .padding(.top, Spacing.sm)
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("Food Library")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    sheet = tab == .foods ? .createFood : .createMeal
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel(tab == .foods ? "Create Custom Food" : "Create Meal")
            }
        }
        .sheet(item: $sheet) { form in
            NavigationStack { formView(form) }
        }
        .sheet(isPresented: $showFilterSheet) {
            FoodFilterSheet(currentFilters: activeFilters) { activeFilters = $0 }
        }
        .confirmationDialog(
            "Delete Food", isPresented: Binding(get: { deleteFood != nil }, set: { if !$0 { deleteFood = nil } }),
            titleVisibility: .visible, presenting: deleteFood
        ) { food in
            Button("Delete", role: .destructive) { store.deleteCustomFood(id: food.id); deleteFood = nil }
            Button("Cancel", role: .cancel) { deleteFood = nil }
        } message: { food in Text("Delete \"\(food.name)\"? This cannot be undone.") }
        .confirmationDialog(
            "Delete Meal", isPresented: Binding(get: { deleteMeal != nil }, set: { if !$0 { deleteMeal = nil } }),
            titleVisibility: .visible, presenting: deleteMeal
        ) { meal in
            Button("Delete", role: .destructive) { store.deleteSavedMeal(id: meal.id); deleteMeal = nil }
            Button("Cancel", role: .cancel) { deleteMeal = nil }
        } message: { meal in Text("Delete \"\(meal.name)\"? This cannot be undone.") }
    }

    // MARK: - Sheet content

    @ViewBuilder
    private func formView(_ form: FormSheet) -> some View {
        switch form {
        case .createFood:
            CustomFoodFormView(onDone: { _ in sheet = nil }, mode: .create)
                .background(colors.background.ignoresSafeArea())
        case .editFood(let food):
            CustomFoodFormView(onDone: { _ in sheet = nil }, initialFood: food, mode: .edit)
                .background(colors.background.ignoresSafeArea())
        case .createMeal:
            CreateMealFlowView(onDone: { sheet = nil })
                .background(colors.background.ignoresSafeArea())
        case .editMeal(let meal):
            CreateMealFlowView(onDone: { sheet = nil }, editing: meal)
                .background(colors.background.ignoresSafeArea())
        }
    }

    // MARK: - Search

    private var searchField: some View {
        HStack(spacing: Spacing.sm) {
            Image(systemName: "magnifyingglass").foregroundStyle(colors.textSecondary)
            TextField(tab == .foods ? "Search foods" : "Search meals", text: $query)
                .font(Typography.body).foregroundStyle(colors.text)
                .autocorrectionDisabled()
            if !query.isEmpty {
                Button { query = "" } label: {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(colors.textSecondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, Spacing.md).padding(.vertical, Spacing.sm)
        .background(colors.card)
        .overlay(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous).strokeBorder(colors.border, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
    }

    // MARK: - Foods

    private var sortedFoods: [CustomFood] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        let byName = store.customFoods.filter { q.isEmpty || $0.name.lowercased().contains(q) }
        return FoodLibraryLogic.applyFoodTypeFilter(byName, activeTypes: activeFilters)
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    @ViewBuilder
    private var foodRows: some View {
        if sortedFoods.isEmpty {
            emptyText(query.isEmpty && !filtersActive ? "No custom foods yet. Create one!" : "No foods match your search.")
        } else {
            ForEach(sortedFoods) { food in
                libraryRow(name: food.name, meta: "\(WeightStats.jsNumberString(food.calories)) cal · \(food.servingSize)") {
                    sheet = .editFood(food)
                } onDelete: {
                    deleteFood = food
                }
            }
        }
    }

    // MARK: - Meals

    private var sortedMeals: [SavedMeal] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        return store.savedMeals
            .filter { q.isEmpty || $0.name.lowercased().contains(q) }
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    @ViewBuilder
    private var mealRows: some View {
        if sortedMeals.isEmpty {
            emptyText(query.isEmpty ? "No saved meals yet. Create one!" : "No meals match your search.")
        } else {
            ForEach(sortedMeals) { meal in
                let cal = meal.foods.reduce(0.0) { $0 + ($1.calories ?? 0) }
                let count = meal.foods.count
                libraryRow(name: meal.name, meta: "\(count) food\(count == 1 ? "" : "s") · \(WeightStats.jsNumberString(cal)) cal") {
                    sheet = .editMeal(meal)
                } onDelete: {
                    deleteMeal = meal
                }
            }
        }
    }

    // MARK: - Row / empty

    private func libraryRow(name: String, meta: String, onEdit: @escaping () -> Void, onDelete: @escaping () -> Void) -> some View {
        HStack(spacing: Spacing.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(name).font(Typography.body).foregroundStyle(colors.text).lineLimit(1)
                Text(meta).font(Typography.small).foregroundStyle(colors.textSecondary)
            }
            Spacer()
            Button(action: onEdit) {
                Image(systemName: "pencil").foregroundStyle(colors.textSecondary).padding(Spacing.xs)
            }
            .buttonStyle(.plain)
            Button(action: onDelete) {
                Image(systemName: "trash").foregroundStyle(colors.danger).padding(Spacing.xs)
            }
            .buttonStyle(.plain)
        }
        .padding(Spacing.md)
        .cardStyle()
    }

    private func emptyText(_ text: String) -> some View {
        Text(text)
            .font(Typography.small).foregroundStyle(colors.textSecondary)
            .frame(maxWidth: .infinity).padding(.vertical, Spacing.xl)
    }
}
