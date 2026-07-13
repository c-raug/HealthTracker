import SwiftUI

/// Nutrition tab (Phase 7). Placeholder for the Phase 4 shell.
struct NutritionView: View {
    var onXpTap: () -> Void

    var body: some View {
        CollapsibleScreen(title: "Nutrition", onXpTap: onXpTap) {
            DateNavBar()
            PlaceholderCard(systemImage: "fork.knife", title: "Nutrition", phase: "Phase 7")
        }
    }
}
