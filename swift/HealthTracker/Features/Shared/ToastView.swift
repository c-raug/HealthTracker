import SwiftUI

/// Top-anchored transient banner — port of `expo/components/ToastNotification.tsx`. Springs in from
/// above with a card background + hairline border, shows an optional emoji + the message + a ✕, and
/// dismisses on tap (or after the `ToastCenter` 3s timer). Rendered as an overlay at the top of the
/// shell, above the tab content and pill bar.
struct ToastView: View {
    @Environment(\.appColors) private var colors
    @Environment(\.topSafeInset) private var topInset
    @Environment(ToastCenter.self) private var toasts

    var body: some View {
        VStack(spacing: 0) {
            if let message = toasts.current {
                banner(message)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .padding(.horizontal, Spacing.md)
        .padding(.top, topInset + Spacing.sm)
        .animation(.spring(response: 0.4, dampingFraction: 0.85), value: toasts.current)
        .allowsHitTesting(toasts.current != nil)
    }

    private func banner(_ message: ToastMessage) -> some View {
        Button { toasts.dismiss() } label: {
            HStack(spacing: Spacing.sm) {
                if let emoji = message.emoji {
                    Text(emoji).font(.system(size: 22))
                }
                Text(message.text)
                    .font(Typography.body.weight(.semibold))
                    .foregroundStyle(colors.text)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text("✕")
                    .font(Typography.small)
                    .foregroundStyle(colors.textSecondary)
            }
            .padding(.vertical, Spacing.sm)
            .padding(.horizontal, Spacing.md)
            .background(colors.card)
            .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Radius.lg, style: .continuous)
                    .strokeBorder(colors.border, lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }
}
