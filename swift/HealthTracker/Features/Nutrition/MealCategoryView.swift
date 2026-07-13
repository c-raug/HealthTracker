import SwiftUI

/// One collapsible meal-category card (Breakfast / Lunch / Dinner / Snacks). Port of
/// `expo/components/nutrition/MealCategory.tsx`:
/// - header: chevron + label + `(count) · N cal`, a copy-yesterday button, and a **+ Add** pill;
///   swiping the header left reveals **save-as-meal** (blue bookmark);
/// - body (when expanded): ungrouped `FoodItemView` rows, then per-`mealGroupId` **saved-meal groups**
///   (each its own collapsible header, swipe-left to remove the whole group).
///
/// The **+ Add** and **save-as-meal** actions are surfaced via closures so the parent
/// (`NutritionView`) owns modal presentation (real modals arrive in Phase 7c). Copy / edit / delete /
/// remove-group all work here against the store. Swipeable rows paint opaque backgrounds so the
/// revealed action stays hidden until swiped.
struct MealCategoryView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    let category: MealCategory
    let foods: [NutritionFoodItem]
    let date: String
    var onAdd: (MealCategory) -> Void
    var onSaveAsMeal: (_ foods: [NutritionFoodItem], _ name: String) -> Void

    @State private var collapsed: Bool
    @State private var collapsedGroups: Set<String> = []
    @State private var alert: MealAlert?

    init(
        category: MealCategory,
        foods: [NutritionFoodItem],
        date: String,
        sectionsExpanded: Bool,
        onAdd: @escaping (MealCategory) -> Void,
        onSaveAsMeal: @escaping (_ foods: [NutritionFoodItem], _ name: String) -> Void
    ) {
        self.category = category
        self.foods = foods
        self.date = date
        self.onAdd = onAdd
        self.onSaveAsMeal = onSaveAsMeal
        _collapsed = State(initialValue: !sectionsExpanded)
    }

    private var label: String { category.rawValue.capitalized }
    private var totalCal: Int { jsRoundInt(foods.reduce(0) { $0 + ($1.calories ?? 0) }) }
    private var ungrouped: [NutritionFoodItem] { foods.filter { $0.mealGroupId == nil } }
    private var groups: [MealGroup] { MealGroup.split(foods) }

    private var cardGradient: LinearGradient {
        let stops = colors.isDark ? ["#3A3A3C", "#2C2C2E"] : ["#FFFFFF", "#F4F4F8"]
        return LinearGradient(colors: stops.map { Color(hex: $0) }, startPoint: .top, endPoint: .bottom)
    }

    var body: some View {
        VStack(spacing: 0) {
            SwipeableRow(
                actionColor: FixedColors.water,
                onAction: handleSaveAsMeal,
                actionLabel: {
                    Image(systemName: "bookmark")
                        .font(.system(size: 22))
                        .foregroundStyle(colors.white)
                },
                content: { header }
            )

            if !collapsed {
                content
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Radius.lg, style: .continuous)
                .strokeBorder(colors.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.12), radius: 12, x: 0, y: 4)
        .onDisappear { if store.preferences.sectionsExpanded != true { collapsed = true } }
        .alert(
            alert?.title(label: label) ?? "",
            isPresented: Binding(get: { alert != nil }, set: { if !$0 { alert = nil } }),
            presenting: alert
        ) { a in
            alertButtons(a)
        } message: { a in
            Text(a.message(label: label))
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Button { withAnimation(.easeInOut(duration: 0.2)) { collapsed.toggle() } } label: {
                HStack(spacing: Spacing.xs) {
                    Image(systemName: collapsed ? "chevron.right" : "chevron.down")
                        .font(.system(size: 18))
                        .foregroundStyle(colors.textSecondary)
                    Text(label)
                        .font(Typography.h3)
                        .foregroundStyle(colors.text)
                    if !foods.isEmpty {
                        Text("(\(foods.count)) · \(totalCal) cal")
                            .font(Typography.small)
                            .foregroundStyle(colors.textSecondary)
                    }
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            Spacer()

            HStack(spacing: Spacing.xs) {
                Button(action: handleCopy) {
                    Image(systemName: "doc.on.doc")
                        .font(.system(size: 20))
                        .foregroundStyle(colors.textSecondary)
                        .padding(Spacing.xs)
                }
                .buttonStyle(.plain)

                Button { onAdd(category) } label: {
                    Text("+ Add")
                        .font(Typography.small.weight(.bold))
                        .foregroundStyle(colors.primary)
                        .padding(.vertical, Spacing.xs)
                        .padding(.horizontal, Spacing.sm)
                        .background(colors.primaryLight)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                                .strokeBorder(colors.primary, lineWidth: 1.5)
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.vertical, Spacing.sm)
        .padding(.horizontal, Spacing.md)
        .background(cardGradient)
    }

    // MARK: - Content

    @ViewBuilder
    private var content: some View {
        VStack(spacing: 0) {
            if foods.isEmpty {
                VStack(spacing: Spacing.xs) {
                    Image(systemName: "leaf")
                        .font(.system(size: 28))
                        .foregroundStyle(colors.border)
                    Text("Tap + Add to log food")
                        .font(Typography.small)
                        .foregroundStyle(colors.textSecondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.lg)
                .background(cardGradient)
            }

            ForEach(ungrouped) { item in
                FoodItemView(item: item, date: date, category: category) {
                    store.deleteFoodFromMeal(date: date, category: category, foodId: item.id)
                }
            }

            ForEach(groups) { group in
                groupSection(group)
            }
        }
    }

    private func groupSection(_ group: MealGroup) -> some View {
        let isCollapsed = !collapsedGroups.contains(group.id) // default collapsed
        let groupCal = jsRoundInt(group.foods.reduce(0) { $0 + ($1.calories ?? 0) })
        return VStack(spacing: 0) {
            SwipeableRow(
                actionColor: colors.danger,
                onAction: { alert = .removeGroup(group) },
                actionLabel: {
                    Image(systemName: "trash")
                        .font(.system(size: 20))
                        .foregroundStyle(colors.white)
                },
                content: {
                    Button {
                        if isCollapsed { collapsedGroups.insert(group.id) }
                        else { collapsedGroups.remove(group.id) }
                    } label: {
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: isCollapsed ? "chevron.right" : "chevron.down")
                                .font(.system(size: 16))
                                .foregroundStyle(colors.textSecondary)
                            Text(group.name)
                                .font(Typography.body.weight(.semibold))
                                .foregroundStyle(colors.textSecondary)
                                .lineLimit(1)
                            Text("· \(groupCal) cal")
                                .font(Typography.small)
                                .foregroundStyle(colors.textSecondary)
                            Spacer()
                        }
                        .padding(.vertical, Spacing.sm)
                        .padding(.horizontal, Spacing.md)
                        .background(colors.card)
                        .overlay(alignment: .top) { Rectangle().fill(colors.border).frame(height: 1) }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            )

            if !isCollapsed {
                ForEach(group.foods) { food in
                    FoodItemView(item: food, date: date, category: category) {
                        store.deleteFoodFromMeal(date: date, category: category, foodId: food.id)
                    }
                }
            }
        }
    }

    // MARK: - Actions

    private func handleCopy() {
        let yesterday = Dates.addDays(date, -1)
        let source = store.nutritionLog.first { $0.date == yesterday }?.meals[category] ?? []
        alert = source.isEmpty ? .copyEmpty : .copyConfirm(source)
    }

    private func handleSaveAsMeal() {
        guard !foods.isEmpty else { return }
        alert = .saveAsMeal
    }

    private func performCopy(_ source: [NutritionFoodItem]) {
        for food in source {
            var fresh = food
            fresh.id = Identifiers.generate()
            store.addFoodToMeal(date: date, category: category, food: fresh)
        }
    }

    private func performSaveAsMeal() {
        let fresh = foods.map { food -> NutritionFoodItem in
            var f = food
            f.id = Identifiers.generate()
            return f
        }
        onSaveAsMeal(fresh, label)
    }

    private func performRemoveGroup(_ group: MealGroup) {
        for food in group.foods {
            store.deleteFoodFromMeal(date: date, category: category, foodId: food.id)
        }
    }

    // MARK: - Alerts

    @ViewBuilder
    private func alertButtons(_ a: MealAlert) -> some View {
        switch a {
        case .saveAsMeal:
            Button("Cancel", role: .cancel) {}
            Button("Save") { performSaveAsMeal() }
        case let .copyConfirm(foods):
            Button("Cancel", role: .cancel) {}
            Button("Copy") { performCopy(foods) }
        case .copyEmpty:
            Button("OK", role: .cancel) {}
        case let .removeGroup(group):
            Button("Cancel", role: .cancel) {}
            Button("Remove", role: .destructive) { performRemoveGroup(group) }
        }
    }

    enum MealAlert: Identifiable {
        case saveAsMeal
        case copyConfirm([NutritionFoodItem])
        case copyEmpty
        case removeGroup(MealGroup)

        var id: String {
            switch self {
            case .saveAsMeal: return "save"
            case .copyConfirm: return "copyConfirm"
            case .copyEmpty: return "copyEmpty"
            case let .removeGroup(g): return "remove-\(g.id)"
            }
        }

        func title(label: String) -> String {
            switch self {
            case .saveAsMeal: return "Save \(label) as a Custom Meal?"
            case .copyConfirm: return "Copy \(label) from yesterday?"
            case .copyEmpty: return "Nothing to Copy"
            case let .removeGroup(g): return "Remove \(g.name)?"
            }
        }

        func message(label: String) -> String {
            switch self {
            case .saveAsMeal:
                return "You can review and edit the foods before saving."
            case let .copyConfirm(foods):
                return "This will add \(foods.count) food\(foods.count == 1 ? "" : "s") to your log."
            case .copyEmpty:
                return "No foods logged in \(label) yesterday."
            case let .removeGroup(g):
                return "Remove all \(g.foods.count) food\(g.foods.count == 1 ? "" : "s") from this meal group?"
            }
        }
    }
}

/// A saved-meal group: foods sharing a `mealGroupId`, keyed for `ForEach`/alerts.
struct MealGroup: Identifiable, Hashable {
    let id: String
    let name: String
    let foods: [NutritionFoodItem]

    /// Split a meal's foods into groups (by first appearance of each `mealGroupId`), preserving order.
    static func split(_ foods: [NutritionFoodItem]) -> [MealGroup] {
        var order: [String] = []
        var byId: [String: [NutritionFoodItem]] = [:]
        var names: [String: String] = [:]
        for f in foods {
            guard let gid = f.mealGroupId else { continue }
            if byId[gid] == nil { order.append(gid); names[gid] = f.mealGroupName ?? "Saved Meal" }
            byId[gid, default: []].append(f)
        }
        return order.map { MealGroup(id: $0, name: names[$0] ?? "Saved Meal", foods: byId[$0] ?? []) }
    }
}
