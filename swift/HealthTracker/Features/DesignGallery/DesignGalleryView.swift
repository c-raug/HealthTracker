import SwiftUI

/// Phase 1 checkpoint screen. Renders the entire design-token layer so it can be verified visually
/// in light/dark and across all six accents before any feature work begins. Delete (or hide behind
/// a debug flag) once feature screens land.
struct DesignGalleryView: View {
    @Environment(AppTheme.self) private var theme
    @Environment(\.appColors) private var colors

    private var appearanceBinding: Binding<AppearanceMode> {
        Binding(get: { theme.appearanceMode }, set: { theme.appearanceMode = $0 })
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                Text("Design Gallery")
                    .font(Typography.h1)
                    .foregroundStyle(colors.text)

                appearanceSection
                accentSection
                paletteSection
                fixedColorsSection
                typographySection
                cardsSection
                proximitySection
                flameSection
            }
            .padding(Spacing.md)
        }
    }

    // MARK: Controls

    private var appearanceSection: some View {
        GallerySection(title: "Appearance mode") {
            Picker("Appearance", selection: appearanceBinding) {
                ForEach(AppearanceMode.allCases, id: \.self) { mode in
                    Text(mode.label).tag(mode)
                }
            }
            .pickerStyle(.segmented)
        }
    }

    private var accentSection: some View {
        GallerySection(title: "Accent color") {
            HStack(spacing: Spacing.md) {
                ForEach(AccentPresets.all) { preset in
                    let selected = preset.primary.caseInsensitiveCompare(theme.accentHex ?? ColorPalette.light.primary) == .orderedSame
                    Button {
                        theme.accentHex = preset.primary
                    } label: {
                        Circle()
                            .fill(Color(hex: preset.primary))
                            .frame(width: 36, height: 36)
                            .overlay(
                                Circle().strokeBorder(colors.text.opacity(selected ? 0.9 : 0), lineWidth: 3)
                            )
                            .overlay(
                                Circle().strokeBorder(colors.border, lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(preset.label)
                }
            }
        }
    }

    // MARK: Swatches

    private var paletteSection: some View {
        GallerySection(title: "Palette (accent-aware)") {
            FlowSwatches(items: [
                ("primary", colors.primary),
                ("primaryLight", colors.primaryLight),
                ("background", colors.background),
                ("card", colors.card),
                ("text", colors.text),
                ("textSecondary", colors.textSecondary),
                ("border", colors.border),
                ("danger", colors.danger),
                ("dangerLight", colors.dangerLight),
            ], borderColor: colors.border, labelColor: colors.textSecondary)
        }
    }

    private var fixedColorsSection: some View {
        GallerySection(title: "Fixed colors (never themed)") {
            FlowSwatches(items: [
                ("water", FixedColors.water),
                ("waterLight", FixedColors.waterLight),
                ("waterGlow", FixedColors.waterGlow),
                ("protein", FixedColors.macroProtein),
                ("carbs", FixedColors.macroCarbs),
                ("fat", FixedColors.macroFat),
            ], borderColor: colors.border, labelColor: colors.textSecondary)
        }
    }

    // MARK: Typography

    private var typographySection: some View {
        GallerySection(title: "Typography") {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                Text("H1 · 28 / bold").font(Typography.h1)
                Text("H2 · 22 / semibold").font(Typography.h2)
                Text("H3 · 18 / semibold").font(Typography.h3)
                Text("Body · 16 / regular").font(Typography.body)
                Text("Body medium · 16 / medium").font(Typography.bodyMedium)
                Text("Small · 13 / regular").font(Typography.small)
            }
            .foregroundStyle(colors.text)
        }
    }

    // MARK: Cards

    private var cardsSection: some View {
        GallerySection(title: "Card styles") {
            VStack(alignment: .leading, spacing: Spacing.md) {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text("Standard card").font(Typography.h3).foregroundStyle(colors.text)
                    Text("cardStyle() — subtle shadow").font(Typography.small).foregroundStyle(colors.textSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .cardStyle()

                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text("Feature card").font(Typography.h3).foregroundStyle(colors.text)
                    Text("featureCardStyle() — gradient + border + deep shadow")
                        .font(Typography.small).foregroundStyle(colors.textSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .featureCardStyle()
            }
        }
    }

    // MARK: Ramps

    private var proximitySection: some View {
        GallerySection(title: "Calorie proximity ring color") {
            HStack(spacing: Spacing.sm) {
                ForEach([0, 25, 50, 100, 200, 300], id: \.self) { delta in
                    let color = CalorieProximity.ringColor(consumed: 2000 + Double(delta), target: 2000, fallback: colors.primary)
                    VStack(spacing: Spacing.xs) {
                        RoundedRectangle(cornerRadius: Radius.sm, style: .continuous)
                            .fill(color)
                            .frame(height: 40)
                        Text("Δ\(delta)").font(Typography.small).foregroundStyle(colors.textSecondary)
                    }
                }
            }
        }
    }

    private var flameSection: some View {
        GallerySection(title: "Flame burn gradient (0…600 cal)") {
            HStack(spacing: 2) {
                ForEach(Array(stride(from: 0, through: 600, by: 50)), id: \.self) { cal in
                    RoundedRectangle(cornerRadius: 3, style: .continuous)
                        .fill(FlameColor.color(forBurn: Double(cal)))
                        .frame(height: 44)
                }
            }
        }
    }
}

// MARK: - Building blocks

/// A titled block laid out as a standard card.
private struct GallerySection<Content: View>: View {
    @Environment(\.appColors) private var colors
    let title: String
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(title).font(Typography.h3).foregroundStyle(colors.text)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardStyle()
    }
}

/// A wrapping grid of labeled color swatches.
private struct FlowSwatches: View {
    let items: [(String, Color)]
    let borderColor: Color
    let labelColor: Color

    private let columns = [GridItem(.adaptive(minimum: 92), spacing: Spacing.sm)]

    var body: some View {
        LazyVGrid(columns: columns, alignment: .leading, spacing: Spacing.sm) {
            ForEach(items, id: \.0) { name, color in
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    RoundedRectangle(cornerRadius: Radius.sm, style: .continuous)
                        .fill(color)
                        .frame(height: 44)
                        .overlay(
                            RoundedRectangle(cornerRadius: Radius.sm, style: .continuous)
                                .strokeBorder(borderColor, lineWidth: 1)
                        )
                    Text(name).font(Typography.small).foregroundStyle(labelColor)
                }
            }
        }
    }
}

#Preview {
    DesignGalleryView()
        .environment(AppTheme())
        .environment(\.appColors, AppColors.resolve(scheme: .light, accentHex: nil))
}
