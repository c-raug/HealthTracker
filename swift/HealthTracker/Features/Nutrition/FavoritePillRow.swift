import SwiftUI

/// A row of up-to-4 "Quick Filter" pills shown above the food list when the user has favorited food
/// types. Port of `expo/components/nutrition/FavoritePillRow.tsx`: tapping a pill toggles that type in
/// the active filter set. Renders nothing when there are no favorites.
struct FavoritePillRow: View {
    @Environment(\.appColors) private var colors

    let favorites: [String]
    let activeFilters: [String]
    let onToggle: (String) -> Void

    var body: some View {
        if !favorites.isEmpty {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text("Quick Filters")
                    .font(Typography.small)
                    .foregroundStyle(colors.textSecondary)
                    .textCase(.uppercase)
                    .kerning(0.8)

                HStack(spacing: Spacing.xs) {
                    ForEach(favorites.prefix(4), id: \.self) { type in
                        let active = activeFilters.contains(type)
                        Button { onToggle(type) } label: {
                            Text(type)
                                .font(Typography.small.weight(.medium))
                                .foregroundStyle(active ? colors.white : colors.text)
                                .lineLimit(1)
                                .frame(maxWidth: .infinity)
                                .frame(height: 32)
                                .background(active ? colors.primary : colors.card)
                                .clipShape(Capsule())
                                .overlay(Capsule().strokeBorder(active ? colors.primary : colors.border, lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.horizontal, Spacing.md)
            .padding(.bottom, Spacing.xs)
        }
    }
}
