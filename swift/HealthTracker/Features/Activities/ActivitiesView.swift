import SwiftUI

/// Activities tab (Phase 9). Placeholder for the Phase 4 shell.
struct ActivitiesView: View {
    var onXpTap: () -> Void

    var body: some View {
        CollapsibleScreen(title: "Activities", onXpTap: onXpTap) {
            DateNavBar()
            PlaceholderCard(systemImage: "flame.fill", title: "Activities", phase: "Phase 9")
        }
    }
}
