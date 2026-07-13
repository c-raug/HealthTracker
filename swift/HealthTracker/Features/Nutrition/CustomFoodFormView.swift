import SwiftUI

/// Create / edit a custom food. Port of `expo/components/nutrition/CustomFoodForm.tsx`:
/// a Required / Optional segmented form. Calories auto-compute from macros (`p*4+c*4+f*9`) unless the
/// user overrides. On save it writes via `store.addCustomFood` / `updateCustomFood` and calls
/// `onDone(createdFood?)` (the created food is handed back so the Add-Food tab can jump to its portion
/// step). Form math lives in `FoodLibraryLogic`.
///
/// Deferred vs RN: per-chip food-type **removal** (a settings-style action) — toggling existing types
/// and adding new ones are supported.
struct CustomFoodFormView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    var onDone: (CustomFood?) -> Void
    var initialFood: CustomFood?
    var mode: Mode
    var initialName: String

    enum Mode { case create, edit }
    private enum FormTab: String, CaseIterable { case required = "Required", optional = "Optional" }

    @State private var activeTab: FormTab = .required
    @State private var name: String
    @State private var caloriesText: String
    @State private var proteinText: String
    @State private var carbsText: String
    @State private var fatText: String
    @State private var portionQty: String
    @State private var portionUnit: String
    @State private var isManual: Bool
    @State private var selectedTypes: [String]
    @State private var showAddType = false
    @State private var newTypeName = ""
    @State private var alertMessage: String?
    @State private var confirmOverride = false

    init(onDone: @escaping (CustomFood?) -> Void, initialFood: CustomFood? = nil, mode: Mode = .create, initialName: String = "") {
        self.onDone = onDone
        self.initialFood = initialFood
        self.mode = mode
        self.initialName = initialName
        let serving = FoodLibraryLogic.parseServingSize(initialFood?.servingSize ?? "1 g")
        _name = State(initialValue: initialFood?.name ?? initialName)
        _caloriesText = State(initialValue: initialFood.map { WeightStats.jsNumberString($0.calories) } ?? "")
        _proteinText = State(initialValue: initialFood.map { WeightStats.jsNumberString($0.protein) } ?? "")
        _carbsText = State(initialValue: initialFood.map { WeightStats.jsNumberString($0.carbs) } ?? "")
        _fatText = State(initialValue: initialFood.map { WeightStats.jsNumberString($0.fat) } ?? "")
        _portionQty = State(initialValue: serving.qty)
        _portionUnit = State(initialValue: serving.unit)
        _isManual = State(initialValue: (mode == .edit && initialFood != nil) ? FoodLibraryLogic.caloriesAreManual(initialFood!) : false)
        _selectedTypes = State(initialValue: initialFood?.foodTypes ?? [])
    }

    private var foodTypeCategories: [String] { store.preferences.foodTypeCategories ?? [] }
    private func num(_ s: String) -> Double { WeightStats.jsParseFloat(s) ?? 0 }
    private var computedCalories: Int {
        FoodLibraryLogic.autoCalories(protein: num(proteinText), carbs: num(carbsText), fat: num(fatText))
    }
    private var displayCalories: String {
        isManual ? caloriesText : (computedCalories == 0 ? "" : "\(computedCalories)")
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                Text(mode == .edit ? "Edit Custom Food" : "Create Custom Food")
                    .font(Typography.h3)
                    .foregroundStyle(colors.text)

                Picker("", selection: $activeTab) {
                    ForEach(FormTab.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)

                if activeTab == .required { requiredTab } else { optionalTab }

                Button(action: handleSave) {
                    Text(mode == .edit ? "Save Changes" : "Save Custom Food")
                        .font(Typography.body.weight(.semibold))
                        .foregroundStyle(colors.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.md)
                        .background(colors.primary)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                }
                .buttonStyle(.plain)
                .padding(.top, Spacing.md)

                Button { onDone(nil) } label: {
                    Text("Cancel")
                        .font(Typography.body)
                        .foregroundStyle(colors.textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.md)
                }
                .buttonStyle(.plain)
            }
            .padding(Spacing.md)
        }
        .background(colors.background)
        .alert("Override Calories?", isPresented: $confirmOverride) {
            Button("Cancel", role: .cancel) {}
            Button("Override") { isManual = true; caloriesText = "" }
        } message: {
            Text("Manually entered calories may not match your macro tracking.")
        }
        .alert("Required", isPresented: Binding(get: { alertMessage != nil }, set: { if !$0 { alertMessage = nil } })) {
            Button("OK", role: .cancel) { alertMessage = nil }
        } message: {
            Text(alertMessage ?? "")
        }
    }

    // MARK: - Required tab

    private var requiredTab: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            label("Name *")
            textField($name, placeholder: "e.g. Homemade Granola")

            label("Serving Size")
            HStack(spacing: Spacing.sm) {
                textField($portionQty, placeholder: "1", numeric: true)
                    .frame(width: 72)
                ForEach(FoodLibraryLogic.portionUnits, id: \.self) { unit in
                    Button { portionUnit = unit } label: {
                        Text(unit)
                            .font(Typography.small.weight(.semibold))
                            .foregroundStyle(portionUnit == unit ? colors.white : colors.textSecondary)
                            .padding(.horizontal, Spacing.sm)
                            .padding(.vertical, Spacing.xs)
                            .background(portionUnit == unit ? colors.primary : colors.background)
                            .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }

            HStack(spacing: Spacing.xs) {
                label("Calories *")
                if !isManual {
                    Text("(auto-computed)").font(Typography.small).italic().foregroundStyle(colors.textSecondary)
                }
            }
            HStack(spacing: Spacing.sm) {
                if isManual {
                    textField($caloriesText, placeholder: "0", numeric: true)
                } else {
                    Button { confirmOverride = true } label: {
                        Text(displayCalories.isEmpty ? "0" : displayCalories)
                            .font(Typography.body)
                            .foregroundStyle(colors.textSecondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, Spacing.md)
                            .padding(.vertical, Spacing.sm)
                            .background(colors.background)
                            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(colors.border, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
                Button { if isManual { isManual = false } else { confirmOverride = true } } label: {
                    Text(isManual ? "Auto" : "Override")
                        .font(Typography.small.weight(.semibold))
                        .foregroundStyle(colors.primary)
                        .padding(Spacing.sm)
                        .background(colors.background)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: Spacing.sm) {
                macroField("Protein (g)", $proteinText)
                macroField("Carbs (g)", $carbsText)
                macroField("Fat (g)", $fatText)
            }
        }
    }

    private func macroField(_ title: String, _ text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            label(title)
            textField(text, placeholder: "0", numeric: true)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Optional tab (food types)

    private var optionalTab: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            label("Food Type")
            FlowChips(items: foodTypeCategories, selected: Set(selectedTypes), onTap: { type in
                if selectedTypes.contains(type) { selectedTypes.removeAll { $0 == type } }
                else { selectedTypes.append(type) }
            }) {
                Button { showAddType = true; newTypeName = "" } label: {
                    HStack(spacing: 2) {
                        Image(systemName: "plus").font(.system(size: 12))
                        Text("Add").font(Typography.small.weight(.semibold))
                    }
                    .foregroundStyle(colors.primary)
                    .padding(.horizontal, Spacing.sm)
                    .padding(.vertical, Spacing.xs)
                    .overlay(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous).strokeBorder(colors.border, style: StrokeStyle(lineWidth: 1, dash: [3])))
                }
                .buttonStyle(.plain)
            }

            if showAddType {
                HStack(spacing: Spacing.sm) {
                    TextField("New food type…", text: $newTypeName)
                        .font(Typography.body)
                        .foregroundStyle(colors.text)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(colors.card)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(colors.primary, lineWidth: 1))
                        .onSubmit(confirmAddType)
                    Button(action: confirmAddType) {
                        Image(systemName: "checkmark").foregroundStyle(colors.white)
                            .padding(Spacing.sm).background(colors.primary)
                            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Helpers

    private func label(_ text: String) -> some View {
        Text(text)
            .font(Typography.small)
            .foregroundStyle(colors.textSecondary)
            .textCase(.uppercase)
            .kerning(0.8)
    }

    private func textField(_ text: Binding<String>, placeholder: String, numeric: Bool = false) -> some View {
        TextField(placeholder, text: text)
            .keyboardType(numeric ? .decimalPad : .default)
            .font(Typography.body)
            .foregroundStyle(colors.text)
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.sm)
            .background(colors.card)
            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(colors.border, lineWidth: 1))
    }

    // MARK: - Actions

    private func confirmAddType() {
        let trimmed = newTypeName.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { showAddType = false; return }
        if foodTypeCategories.contains(where: { $0.caseInsensitiveCompare(trimmed) == .orderedSame }) {
            alertMessage = "This food type already exists."
            return
        }
        store.setFoodTypeCategories(foodTypeCategories + [trimmed])
        showAddType = false
        newTypeName = ""
    }

    private func handleSave() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty else { alertMessage = "Please enter a food name."; return }
        guard let cal = WeightStats.jsParseFloat(displayCalories), cal >= 0 else {
            alertMessage = "Please enter valid calories (or fill in macros to auto-compute)."
            return
        }
        let qty = portionQty.trimmingCharacters(in: .whitespaces)
        let servingSize = "\(qty.isEmpty ? "1" : qty) \(portionUnit)"
        let types = selectedTypes.isEmpty ? nil : selectedTypes

        if mode == .edit, let initialFood {
            var updated = initialFood
            updated.name = trimmedName
            updated.calories = cal
            updated.protein = num(proteinText)
            updated.carbs = num(carbsText)
            updated.fat = num(fatText)
            updated.servingSize = servingSize
            updated.foodTypes = types
            store.updateCustomFood(updated)
            onDone(nil)
        } else {
            let newFood = CustomFood(
                id: Identifiers.generate(),
                name: trimmedName,
                calories: cal,
                protein: num(proteinText),
                carbs: num(carbsText),
                fat: num(fatText),
                servingSize: servingSize,
                createdAt: Dates.nowTimestamp(),
                pinnedCategories: nil,
                pinnedOrder: nil,
                foodTypes: types
            )
            store.addCustomFood(newFood)
            onDone(newFood)
        }
    }
}

/// A simple wrapping chip row (food types) — selected chips fill `primary`, plus a trailing button.
private struct FlowChips<Trailing: View>: View {
    @Environment(\.appColors) private var colors
    let items: [String]
    let selected: Set<String>
    let onTap: (String) -> Void
    @ViewBuilder var trailing: () -> Trailing

    var body: some View {
        // A lightweight wrap using an adaptive grid so it reflows without a custom layout.
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 80), spacing: Spacing.xs, alignment: .leading)], alignment: .leading, spacing: Spacing.xs) {
            ForEach(items, id: \.self) { type in
                let active = selected.contains(type)
                Button { onTap(type) } label: {
                    Text(type)
                        .font(Typography.small.weight(.medium))
                        .foregroundStyle(active ? colors.white : colors.textSecondary)
                        .padding(.horizontal, Spacing.sm)
                        .padding(.vertical, Spacing.xs)
                        .frame(maxWidth: .infinity)
                        .background(active ? colors.primary : colors.border)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                }
                .buttonStyle(.plain)
            }
            trailing()
        }
    }
}
