import SwiftUI

/// Weight tracking tab (Phase 6). Placeholder for the Phase 4 shell.
struct WeightView: View {
    var onXpTap: () -> Void

    var body: some View {
        CollapsibleScreen(title: "Weight", onXpTap: onXpTap) {
            DateNavBar()
            PlaceholderCard(systemImage: "scalemass.fill", title: "Weight Tracking", phase: "Phase 6")
        }
    }
}
