import SwiftUI

/// Stylized digital bathroom scale with an LCD readout. Port of
/// `expo/components/weight/DigitalScale.tsx`.
///
/// The LCD shows, in priority order: an animated count-up (during/just after a Save) → the saved
/// entry value → a dimmed placeholder. When a real value is showing, a soft `primary` glow appears
/// (the RN iOS `scaleOuterGlow` shadow; the Android `AndroidGlowBackdrop` has no iOS counterpart).
struct DigitalScaleView: View {
    @Environment(\.appColors) private var colors

    /// The committed saved value in the display unit (never the live TextField text). Empty = none.
    let weight: String
    let unit: String
    /// Set to the just-saved weight to trigger the count-up; reset to `nil` on date change.
    let animateToValue: Double?
    var size: CGFloat = 280
    var hideUnit: Bool = false

    private static let animationDuration: TimeInterval = 1.5

    @State private var displayNumber: String?
    @State private var animationDone = false
    @State private var prevAnimValue: Double?
    @State private var animTask: Task<Void, Never>?

    private var hasSavedValue: Bool { !weight.isEmpty && weight != "0" }
    private var showAnimated: Bool { displayNumber != nil }

    private var displayValue: String {
        if let displayNumber { return displayNumber }
        if hasSavedValue { return weight }
        return unit == "lbs" ? "175.5" : "80.0"
    }

    private var valueColor: Color {
        (showAnimated || hasSavedValue) ? colors.text : colors.textSecondary
    }

    private var showGlow: Bool {
        animationDone || (hasSavedValue && !showAnimated)
    }

    var body: some View {
        ZStack {
            // Scale body: primaryLight fill, thick primary border, inset hairline "platform".
            RoundedRectangle(cornerRadius: Radius.lg, style: .continuous)
                .fill(colors.primaryLight)
                .overlay(
                    RoundedRectangle(cornerRadius: Radius.lg, style: .continuous)
                        .strokeBorder(colors.primary, lineWidth: 3)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                        .strokeBorder(colors.border, lineWidth: 1)
                        .padding(8)
                )

            // LCD recess near the top.
            VStack {
                lcd
                    .padding(.top, size * 0.08)
                Spacer(minLength: 0)
            }
        }
        .frame(width: size, height: size)
        .shadow(color: colors.primary.opacity(showGlow ? 0.6 : 0), radius: 10)
        .onChange(of: animateToValue, initial: true) { _, newValue in
            runAnimation(to: newValue)
        }
        .onDisappear { animTask?.cancel() }
    }

    private var lcd: some View {
        let layout: AnyLayout = hideUnit
            ? AnyLayout(VStackLayout(spacing: 0))
            : AnyLayout(HStackLayout(spacing: Spacing.xs))
        return layout {
            Text(displayValue)
                .font(.system(size: (size * (hideUnit ? 0.15 : 0.13)).rounded(), weight: .bold))
                .monospacedDigit()
                .foregroundStyle(valueColor)
            if !hideUnit {
                Text(unit)
                    .font(.system(size: (size * 0.065).rounded(), weight: .semibold))
                    .foregroundStyle(valueColor)
            }
        }
        .frame(width: size * (hideUnit ? 0.50 : 0.55), height: size * (hideUnit ? 0.20 : 0.22))
        .background(colors.background)
        .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                .strokeBorder(colors.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.12), radius: 3, x: 0, y: 2)
    }

    /// Cubic-ease-out count-up from 0 → target over 1.5s, mirroring the RN
    /// `requestAnimationFrame` loop. Passing `nil` clears the LCD back to the saved/placeholder state.
    private func runAnimation(to target: Double?) {
        animTask?.cancel()
        guard let target else {
            prevAnimValue = nil
            displayNumber = nil
            animationDone = false
            return
        }
        guard target != prevAnimValue else { return }
        prevAnimValue = target
        animationDone = false
        displayNumber = "0"

        let decimals = target.truncatingRemainder(dividingBy: 1) != 0 ? 1 : 0
        let start = Date()
        animTask = Task { @MainActor in
            while !Task.isCancelled {
                let elapsed = Date().timeIntervalSince(start)
                let progress = min(elapsed / Self.animationDuration, 1)
                let eased = 1 - pow(1 - progress, 3)
                displayNumber = String(format: "%.\(decimals)f", eased * target)
                if progress >= 1 {
                    displayNumber = String(format: "%.\(decimals)f", target)
                    animationDone = true
                    return
                }
                try? await Task.sleep(nanoseconds: 16_000_000)
            }
        }
    }
}
