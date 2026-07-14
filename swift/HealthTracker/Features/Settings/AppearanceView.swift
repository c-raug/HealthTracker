import SwiftUI

/// Appearance sub-screen — port of `expo/app/appearance-modal.tsx` (`AppearanceModePicker` +
/// `ThemeColorPicker`). Writes each change **twice**: to `AppStore.preferences` for persistence and
/// to the runtime `AppTheme` so the palette/appearance update live (the RN `ThemeColorSync` bridge is
/// one-time in this port, so the screen updates the theme directly — the same source of truth the
/// whole app resolves `\.appColors` and `.tint` from).
struct AppearanceView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store
    @Environment(AppTheme.self) private var theme

    private var currentMode: AppearanceMode { store.preferences.appearanceMode ?? .system }
    private var currentAccent: String { store.preferences.themeColor ?? AccentPresets.all[0].primary }

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.sm) {
                SettingsCard {
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        SettingLabel("Color Mode")
                        SettingDescription("Choose light, dark, or follow the device setting.")
                        modeRow
                    }
                    .padding(Spacing.md)
                }

                SettingsCard {
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        SettingLabel("Accent Color")
                        SettingDescription("Choose an accent color for buttons, icons, and progress indicators.")
                        swatchRow
                    }
                    .padding(Spacing.md)
                }
            }
            .padding(Spacing.md)
        }
        .pillBottomClearance()
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("Appearance")
        .navigationBarTitleDisplayMode(.large)
    }

    // MARK: - Color mode

    private static let modeOptions: [(mode: AppearanceMode, icon: String, label: String, desc: String)] = [
        (.light,  "sun.max",           "Light",  "Always light"),
        (.dark,   "moon",              "Dark",   "Always dark"),
        (.system, "iphone",            "System", "Match device"),
    ]

    private var modeRow: some View {
        HStack(spacing: Spacing.sm) {
            ForEach(Self.modeOptions, id: \.mode) { opt in
                let selected = currentMode == opt.mode
                Button {
                    setMode(opt.mode)
                } label: {
                    VStack(spacing: Spacing.xs) {
                        Image(systemName: opt.icon)
                            .font(.system(size: 22))
                            .foregroundStyle(selected ? colors.primary : colors.textSecondary)
                        Text(opt.label)
                            .font(Typography.small)
                            .fontWeight(.semibold)
                            .foregroundStyle(selected ? colors.primary : colors.text)
                        Text(opt.desc)
                            .font(.system(size: 11))
                            .foregroundStyle(colors.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Spacing.sm)
                    .padding(.horizontal, Spacing.xs)
                    .background(colors.card)
                    .overlay(
                        RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                            .strokeBorder(selected ? colors.primary : colors.border, lineWidth: 2)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Accent

    private var swatchRow: some View {
        let columns = [GridItem(.adaptive(minimum: 48), spacing: Spacing.sm)]
        return LazyVGrid(columns: columns, alignment: .leading, spacing: Spacing.sm) {
            ForEach(AccentPresets.all) { preset in
                let selected = currentAccent == preset.primary
                Button {
                    setAccent(preset.primary)
                } label: {
                    ZStack {
                        Circle()
                            .fill(Color(hex: preset.primary))
                            .frame(width: 40, height: 40)
                        if selected {
                            Image(systemName: "checkmark")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundStyle(.white)
                        }
                    }
                    .overlay(
                        Circle().strokeBorder(selected ? colors.text : .clear, lineWidth: 2)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Writes (store + live theme)

    private func setMode(_ mode: AppearanceMode) {
        store.setAppearanceMode(mode)
        theme.appearanceMode = mode
    }

    private func setAccent(_ hex: String) {
        store.setThemeColor(hex)
        theme.accentHex = hex
    }
}
