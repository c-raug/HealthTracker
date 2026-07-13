import SwiftUI

/// Home dashboard (Phase 10). Placeholder for the Phase 4 shell — real content lands in Phase 10.
struct HomeView: View {
    var onXpTap: () -> Void

    var body: some View {
        CollapsibleScreen(title: "Home", onXpTap: onXpTap) {
            DateNavBar()
            PlaceholderCard(systemImage: "house.fill", title: "Home Dashboard", phase: "Phase 10")
        }
    }
}
