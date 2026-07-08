import SwiftUI

/// App root. In Phase 4/5 this becomes the onboarding gate (welcome / onboarding vs. the tab bar).
/// For the Phase 1 checkpoint it shows the Design Gallery so the full token layer can be verified.
struct RootView: View {
    @Environment(\.appColors) private var colors

    var body: some View {
        DesignGalleryView()
            .background(colors.background.ignoresSafeArea())
    }
}

#Preview {
    RootView()
        .environment(AppTheme())
        .environment(\.appColors, AppColors.resolve(scheme: .light, accentHex: nil))
}
