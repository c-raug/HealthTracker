import SwiftUI

/// A transient banner message (achievement unlock / level-up). Port of `ToastMessage` in
/// `expo/context/ToastContext.tsx`.
struct ToastMessage: Identifiable, Equatable {
    let id: Int
    let text: String
    let emoji: String?
}

/// The single toast queue — port of `ToastProvider`. At most one message is visible at a time;
/// a new `show` replaces the current one and (re)starts a 3-second auto-dismiss timer. Injected
/// into the environment; rendered by `ToastView` and fed by `GamificationWatcher`.
@MainActor
@Observable
final class ToastCenter {
    private(set) var current: ToastMessage?

    private var nextId = 1
    private var dismissTask: Task<Void, Never>?

    func show(_ text: String, emoji: String? = nil) {
        dismissTask?.cancel()
        current = ToastMessage(id: nextId, text: text, emoji: emoji)
        nextId += 1
        dismissTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(3))
            guard !Task.isCancelled else { return }
            self?.current = nil
        }
    }

    func dismiss() {
        dismissTask?.cancel()
        current = nil
    }
}
