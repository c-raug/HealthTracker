import SwiftUI

/// Build and save a multi-food meal. Port of `expo/components/nutrition/CreateMealFlow.tsx`:
/// a name field, a food search, an "In Meal" list, and a portion step for each added food. Also used
/// to save a meal from the "swipe → save as meal" action (seeded with `initialFoods`/`initialName`),
/// and — when `editing` is supplied — as the **EditMealFlow** (Phase 11 Food Library), updating the
/// existing meal in place. Saves via `store.addSavedMeal` / `store.updateSavedMeal`.
struct CreateMealFlowView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    var onDone: () -> Void
    var initialFoods: [NutritionFoodItem]
    var initialName: String
    /// When non-nil, the flow edits this saved meal (updates in place, preserving id / pins).
    var editing: SavedMeal?

    @State private var mealName: String
    @State private var foods: [NutritionFoodItem]
    @State private var query = ""
    @State private var selected: NutritionFoodItem?
    @State private var servings: Double = 1
    @State private var alertMessage: String?

    init(onDone: @escaping () -> Void, initialFoods: [NutritionFoodItem] = [], initialName: String = "", editing: SavedMeal? = nil) {
        self.onDone = onDone
        self.editing = editing
        self.initialFoods = editing?.foods ?? initialFoods
        self.initialName = editing?.name ?? initialName
        _mealName = State(initialValue: editing?.name ?? initialName)
        _foods = State(initialValue: editing?.foods ?? initialFoods)
    }

    private var isSearching: Bool { !query.trimmingCharacters(in: .whitespaces).isEmpty }
    private var frequency: [String: Int] { FoodLibraryLogic.frequencyMap(store.nutritionLog) }
    private var matched: [CustomFood] { FoodLibraryLogic.matches(store.customFoods, query: query) }

    private func isPinnedAny(_ f: CustomFood) -> Bool { !(f.pinnedCategories?.isEmpty ?? true) }
    private var pinnedCustom: [CustomFood] {
        matched.filter(isPinnedAny).sorted {
            ($0.pinnedOrder?.values.min() ?? .max) < ($1.pinnedOrder?.values.min() ?? .max)
        }
    }
    private var recentCustom: [CustomFood] {
        guard !isSearching else { return [] }
        return store.customFoods
            .filter { !isPinnedAny($0) && (frequency[$0.name.lowercased().trimmingCharacters(in: .whitespaces)] ?? 0) > 0 }
            .sorted { (frequency[$0.name.lowercased().trimmingCharacters(in: .whitespaces)] ?? 0) > (frequency[$1.name.lowercased().trimmingCharacters(in: .whitespaces)] ?? 0) }
            .prefix(7).map { $0 }
    }
    private var myFoods: [CustomFood] { isSearching ? matched.filter { !isPinnedAny($0) } : [] }

    var body: some View {
        VStack(spacing: 0) {
            header
            if let selected { portionPanel(selected) }
            ScrollView {
                LazyVStack(spacing: 0) {
                    if !isSearching, !foods.isEmpty {
                        sectionHeader("In Meal (\(foods.count))")
                        ForEach(foods) { inMealRow($0) }
                    }
                    if !pinnedCustom.isEmpty { sectionHeader("Pinned"); ForEach(pinnedCustom) { customRow($0) } }
                    if !recentCustom.isEmpty { sectionHeader("Recent"); ForEach(recentCustom) { customRow($0) } }
                    if !myFoods.isEmpty { sectionHeader("My Foods"); ForEach(myFoods) { customRow($0) } }
                    if pinnedCustom.isEmpty && recentCustom.isEmpty && myFoods.isEmpty {
                        Text(isSearching ? "No results found" : "No custom foods saved yet")
                            .font(Typography.small).foregroundStyle(colors.textSecondary)
                            .frame(maxWidth: .infinity).padding(Spacing.md)
                    }
                }
            }
            buttonRow
        }
        .background(colors.background)
        .alert("Required", isPresented: Binding(get: { alertMessage != nil }, set: { if !$0 { alertMessage = nil } })) {
            Button("OK", role: .cancel) { alertMessage = nil }
        } message: { Text(alertMessage ?? "") }
    }

    // MARK: - Pieces

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(editing != nil ? "Edit Meal" : "Create Meal").font(Typography.h3).foregroundStyle(colors.text)
            input($mealName, placeholder: "Meal name (e.g. Post-Workout Shake)")
            input($query, placeholder: "Search foods to add…")
        }
        .padding(Spacing.md)
    }

    private func input(_ text: Binding<String>, placeholder: String) -> some View {
        TextField(placeholder, text: text)
            .font(Typography.body).foregroundStyle(colors.text)
            .padding(.horizontal, Spacing.md).padding(.vertical, Spacing.sm)
            .background(colors.card)
            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(colors.border, lineWidth: 1))
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title).font(Typography.small).foregroundStyle(colors.textSecondary)
            .textCase(.uppercase).kerning(0.8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, Spacing.md).padding(.vertical, Spacing.xs)
            .background(colors.background)
    }

    private func inMealRow(_ food: NutritionFoodItem) -> some View {
        HStack {
            Text(food.name).font(Typography.body).foregroundStyle(colors.text).lineLimit(1)
            Spacer()
            Text("\(WeightStats.jsNumberString(food.calories ?? 0)) cal").font(Typography.small).foregroundStyle(colors.textSecondary)
            Button { foods.removeAll { $0.id == food.id } } label: {
                Image(systemName: "xmark.circle.fill").foregroundStyle(colors.danger).padding(.leading, Spacing.xs)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, Spacing.sm).padding(.horizontal, Spacing.md)
        .background(colors.card)
        .overlay(alignment: .bottom) { Rectangle().fill(colors.border).frame(height: 1) }
    }

    private func customRow(_ food: CustomFood) -> some View {
        Button { select(food) } label: {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(food.name).font(Typography.body).foregroundStyle(colors.text).lineLimit(1)
                Text("\(WeightStats.jsNumberString(food.calories)) cal\(food.servingSize.isEmpty ? "" : " · \(food.servingSize)")")
                    .font(Typography.small).foregroundStyle(colors.textSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, Spacing.sm).padding(.horizontal, Spacing.md)
            .background(selected?.id == food.id ? colors.primaryLight : colors.card)
            .overlay(alignment: .bottom) { Rectangle().fill(colors.border).frame(height: 1) }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func portionPanel(_ item: NutritionFoodItem) -> some View {
        VStack(spacing: 0) {
            PortionSelectorView(
                value: $servings,
                baseCalories: item.calories ?? 0, baseProtein: item.protein ?? 0,
                baseCarbs: item.carbs ?? 0, baseFat: item.fat ?? 0,
                servingSize: item.servingSize ?? "1 serving",
                baseServings: item.servings ?? 1, foodName: item.name
            )
            Button { confirmAdd(item) } label: {
                Text("Add to Meal")
                    .font(Typography.body.weight(.semibold)).foregroundStyle(colors.white)
                    .frame(maxWidth: .infinity).padding(.vertical, Spacing.sm)
                    .background(colors.primary)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
            }
            .buttonStyle(.plain)
            .padding([.horizontal, .bottom], Spacing.md)
        }
        .background(colors.card)
        .overlay(alignment: .bottom) { Rectangle().fill(colors.border).frame(height: 1) }
    }

    private var buttonRow: some View {
        HStack(spacing: Spacing.sm) {
            Button(action: onDone) {
                Text("Cancel").font(Typography.body).foregroundStyle(colors.textSecondary)
                    .frame(maxWidth: .infinity).padding(.vertical, Spacing.md)
                    .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(colors.border, lineWidth: 1))
            }
            .buttonStyle(.plain)
            Button(action: save) {
                Text(editing != nil ? "Save Changes" : "Save Meal").font(Typography.body.weight(.semibold)).foregroundStyle(colors.white)
                    .frame(maxWidth: .infinity).padding(.vertical, Spacing.md)
                    .background(colors.primary)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .padding(Spacing.md)
    }

    // MARK: - Actions

    private func select(_ food: CustomFood) {
        servings = 1
        selected = FoodLibraryLogic.toNutritionItem(food)
    }

    private func confirmAdd(_ item: NutritionFoodItem) {
        foods.append(FoodLibraryLogic.logged(base: item, servings: servings))
        selected = nil
        servings = 1
        query = ""
    }

    private func save() {
        guard !mealName.trimmingCharacters(in: .whitespaces).isEmpty else { alertMessage = "Please enter a meal name."; return }
        guard !foods.isEmpty else { alertMessage = "Please add at least one food."; return }
        let trimmedName = mealName.trimmingCharacters(in: .whitespaces)
        if let editing {
            store.updateSavedMeal(SavedMeal(
                id: editing.id,
                name: trimmedName,
                foods: foods,
                createdAt: editing.createdAt,
                pinnedCategories: editing.pinnedCategories,
                pinnedOrder: editing.pinnedOrder
            ))
        } else {
            store.addSavedMeal(SavedMeal(
                id: Identifiers.generate(),
                name: trimmedName,
                foods: foods,
                createdAt: Dates.nowTimestamp(),
                pinnedCategories: nil,
                pinnedOrder: nil
            ))
        }
        onDone()
    }
}
