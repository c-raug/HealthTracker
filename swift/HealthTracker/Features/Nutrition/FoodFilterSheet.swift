import SwiftUI

/// Food-type filter sheet — port of `expo/components/nutrition/FoodFilterModal.tsx`. Lets the user
/// multi-select food-type categories (OR filter), and in **Edit** mode manage the category list:
/// *Remove* deletes a category from every food, *Favorite* promotes a category to a Quick Filter
/// (capped at 4). A `+` adds a brand-new category. Tapping **Apply** returns the selected types.
///
/// Deferred vs RN (device-polish, documented in the roadmap): the RN pills *shake* while in Favorite
/// edit mode — a purely decorative animation dropped here; every function is present.
struct FoodFilterSheet: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    let currentFilters: [String]
    let onApply: ([String]) -> Void

    @State private var selected: [String] = []
    @State private var editMode = false
    @State private var subMode: SubMode = .favorite
    @State private var showNewFilterField = false
    @State private var newFilterText = ""
    @State private var deleteCategory: String?
    @State private var showFavoriteLimit = false
    @FocusState private var newFilterFocused: Bool

    private enum SubMode { case remove, favorite }

    private var categories: [String] { store.preferences.foodTypeCategories ?? [] }
    private var favorites: [String] { store.preferences.favoriteFilterTypes ?? [] }
    private var available: [String] { selected.isEmpty ? categories : categories.filter { !selected.contains($0) } }

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider().overlay(colors.border)
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    if !selected.isEmpty {
                        sectionLabel("Selected")
                        pillFlow(selected, isSelected: true)
                    }
                    sectionLabel("Available")
                    pillFlow(available, isSelected: false, showAddPill: editMode)
                    buttonRow
                }
                .padding(.horizontal, Spacing.md)
                .padding(.bottom, Spacing.lg)
            }
        }
        .background(colors.card.ignoresSafeArea())
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .onAppear { selected = currentFilters }
        .confirmationDialog(
            "Delete Filter",
            isPresented: Binding(get: { deleteCategory != nil }, set: { if !$0 { deleteCategory = nil } }),
            titleVisibility: .visible, presenting: deleteCategory
        ) { cat in
            Button("Delete", role: .destructive) { performDelete(cat) }
            Button("Cancel", role: .cancel) { deleteCategory = nil }
        } message: { cat in Text("Delete \"\(cat)\"? This will remove it from all your foods.") }
        .alert("Quick Filter Limit", isPresented: $showFavoriteLimit) {
            Button("OK", role: .cancel) {}
        } message: { Text("You can only have up to 4 Quick Filters.") }
    }

    // MARK: - Header

    private var header: some View {
        HStack(spacing: Spacing.sm) {
            Text("Filter Foods").font(Typography.h2).foregroundStyle(colors.text)
            Spacer()
            if editMode {
                subModeButton("Remove", .remove)
                subModeButton("Favorite", .favorite)
                Button("Done") { setEditMode(false) }
                    .font(Typography.small.weight(.semibold)).foregroundStyle(colors.primary)
            } else {
                Button("Edit") { setEditMode(true) }
                    .font(Typography.small.weight(.semibold)).foregroundStyle(colors.primary)
            }
            Button { dismiss() } label: {
                Image(systemName: "xmark").font(.system(size: 18, weight: .semibold)).foregroundStyle(colors.text)
            }
            .buttonStyle(.plain)
        }
        .padding(Spacing.md)
    }

    private func subModeButton(_ title: String, _ mode: SubMode) -> some View {
        Button { subMode = mode; showNewFilterField = false; newFilterText = "" } label: {
            Text(title)
                .font(Typography.small.weight(subMode == mode ? .bold : .medium))
                .foregroundStyle(subMode == mode ? colors.primary : colors.textSecondary)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Pills

    private func sectionLabel(_ text: String) -> some View {
        Text(text)
            .font(Typography.small).foregroundStyle(colors.textSecondary)
            .textCase(.uppercase).kerning(0.8)
            .padding(.top, Spacing.md).padding(.bottom, Spacing.sm)
    }

    /// A wrapping row of pills. SwiftUI has no native flow layout pre-iOS-16-`Layout`, so we use a
    /// simple `WrapHStack` helper below (kept local to this feature).
    private func pillFlow(_ types: [String], isSelected: Bool, showAddPill: Bool = false) -> some View {
        WrapHStack(spacing: Spacing.sm) {
            ForEach(types, id: \.self) { pill($0, isSelected: isSelected) }
            if showAddPill { addPill }
        }
    }

    @ViewBuilder
    private func pill(_ type: String, isSelected: Bool) -> some View {
        if editMode && subMode == .remove {
            pillLabel(type, isSelected: isSelected).onTapGesture { deleteCategory = type }
        } else if editMode && subMode == .favorite {
            pillLabel(type, isSelected: isSelected)
                .overlay(alignment: .topTrailing) {
                    let isFav = favorites.contains(type)
                    Button {
                        if isFav { store.setFavoriteFilterTypes(favorites.filter { $0 != type }) }
                        else if favorites.count >= 4 { showFavoriteLimit = true }
                        else { store.setFavoriteFilterTypes(favorites + [type]) }
                    } label: {
                        Image(systemName: isFav ? "minus.circle.fill" : "plus.circle.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(isFav ? colors.danger : colors.primary)
                            .background(Circle().fill(colors.card))
                    }
                    .buttonStyle(.plain)
                    .offset(x: 6, y: -6)
                }
        } else {
            pillLabel(type, isSelected: isSelected).onTapGesture {
                withAnimation(.easeInOut(duration: 0.2)) {
                    selected = FoodLibraryLogic.toggleFoodTypeFilter(selected, type: type)
                }
            }
        }
    }

    private func pillLabel(_ type: String, isSelected: Bool) -> some View {
        Text(type)
            .font(Typography.body.weight(.medium))
            .foregroundStyle(isSelected ? colors.white : colors.textSecondary)
            .padding(.horizontal, Spacing.md).padding(.vertical, Spacing.sm)
            .background(isSelected ? colors.primary : colors.border)
            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
    }

    @ViewBuilder
    private var addPill: some View {
        if showNewFilterField {
            TextField("New filter…", text: $newFilterText)
                .font(Typography.body).foregroundStyle(colors.text)
                .focused($newFilterFocused)
                .submitLabel(.done)
                .onSubmit(submitNewFilter)
                .frame(minWidth: 100)
                .padding(.horizontal, Spacing.md).padding(.vertical, Spacing.sm)
                .background(colors.background)
                .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(colors.primary, lineWidth: 1))
                .onAppear { newFilterFocused = true }
        } else {
            Button { showNewFilterField = true } label: {
                Text("+")
                    .font(Typography.body.weight(.semibold)).foregroundStyle(colors.primary)
                    .padding(.horizontal, Spacing.md).padding(.vertical, Spacing.sm)
                    .background(colors.background)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(colors.primary, lineWidth: 1))
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - Footer buttons

    private var buttonRow: some View {
        HStack(spacing: Spacing.sm) {
            Button { withAnimation(.easeInOut(duration: 0.2)) { selected = [] } } label: {
                Text("Clear Filters")
                    .font(Typography.body.weight(.semibold)).foregroundStyle(colors.textSecondary)
                    .frame(maxWidth: .infinity).padding(.vertical, Spacing.md)
                    .background(colors.background)
                    .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(colors.border, lineWidth: 1))
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
            }
            .buttonStyle(.plain)

            Button { onApply(selected); dismiss() } label: {
                Text("Apply")
                    .font(Typography.body.weight(.semibold)).foregroundStyle(colors.white)
                    .frame(maxWidth: .infinity).padding(.vertical, Spacing.md)
                    .background(colors.primary)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
            }
            .buttonStyle(.plain)
            .frame(maxWidth: .infinity)
        }
        .padding(.top, Spacing.lg)
    }

    // MARK: - Edit actions

    private func setEditMode(_ on: Bool) {
        editMode = on
        subMode = .favorite
        showNewFilterField = false
        newFilterText = ""
    }

    private func submitNewFilter() {
        let trimmed = newFilterText.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty && !categories.contains(trimmed) {
            store.setFoodTypeCategories(categories + [trimmed])
        }
        newFilterText = ""
        showNewFilterField = false
    }

    private func performDelete(_ cat: String) {
        store.setFoodTypeCategories(categories.filter { $0 != cat })
        if favorites.contains(cat) { store.setFavoriteFilterTypes(favorites.filter { $0 != cat }) }
        selected.removeAll { $0 == cat }
        deleteCategory = nil
    }
}

/// A minimal wrapping HStack (chips flow onto the next line when they run out of width). Uses the
/// iOS-16 `Layout` protocol so it stays a single lightweight pass with no `GeometryReader`.
struct WrapHStack: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var rows: [[LayoutSubviews.Element]] = [[]]
        var x: CGFloat = 0
        var totalHeight: CGFloat = 0
        var rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, !rows[rows.count - 1].isEmpty {
                rows.append([])
                totalHeight += rowHeight + spacing
                x = 0
                rowHeight = 0
            }
            rows[rows.count - 1].append(view)
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        totalHeight += rowHeight
        return CGSize(width: maxWidth == .infinity ? x : maxWidth, height: totalHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
