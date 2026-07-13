import SwiftUI

/// Bottom sheet to choose which meal categories a custom food / saved meal is pinned to. Port of the
/// "Pin to meal categories" modal repeated in `AddFoodTab.tsx` / `AddMealTab.tsx`.
struct PinCategoriesSheet: View {
    @Environment(\.appColors) private var colors
    @Environment(\.dismiss) private var dismiss

    let initial: [MealCategory]
    var onSave: ([MealCategory]) -> Void

    @State private var selected: Set<MealCategory>

    init(initial: [MealCategory], onSave: @escaping ([MealCategory]) -> Void) {
        self.initial = initial
        self.onSave = onSave
        _selected = State(initialValue: Set(initial))
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ForEach(MealCategory.allCases, id: \.self) { cat in
                    Button {
                        if selected.contains(cat) { selected.remove(cat) } else { selected.insert(cat) }
                    } label: {
                        HStack {
                            Text(cat.rawValue.capitalized)
                                .font(Typography.body)
                                .foregroundStyle(colors.text)
                            Spacer()
                            Image(systemName: selected.contains(cat) ? "checkmark.square.fill" : "square")
                                .font(.system(size: 22))
                                .foregroundStyle(selected.contains(cat) ? colors.primary : colors.textSecondary)
                        }
                        .padding(.vertical, Spacing.sm)
                        .padding(.horizontal, Spacing.md)
                        .contentShape(Rectangle())
                        .overlay(alignment: .bottom) { Rectangle().fill(colors.border).frame(height: 1) }
                    }
                    .buttonStyle(.plain)
                }
                Spacer()
            }
            .background(colors.background)
            .navigationTitle("Pin to Categories")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onSave(MealCategory.allCases.filter { selected.contains($0) })
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }
}
