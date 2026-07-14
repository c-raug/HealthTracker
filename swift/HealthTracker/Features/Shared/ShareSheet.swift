import SwiftUI
import UIKit

/// Thin `UIActivityViewController` wrapper for the iOS share sheet — the native stand-in for
/// `expo-sharing`'s `saveBackup()`. Present it with `.sheet(item:)` driven by a `ShareItem`.
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}

/// Identifiable wrapper so a file URL can drive `.sheet(item:)`.
struct ShareItem: Identifiable {
    let id = UUID()
    let url: URL
}
