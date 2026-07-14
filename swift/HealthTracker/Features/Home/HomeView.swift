import SwiftUI

/// Home dashboard (Phase 10). Port of `expo/app/(tabs)/home.tsx` — a read-only overview that composes
/// widgets built in earlier phases: the shared `DateNavBar`, the `ProfileCard`, a full-width
/// **Nutrition** feature card (calorie ring + water bottle), and a bottom row of half-width
/// **Activity** (burn flame) and **Weight** (digital scale) cards. Each feature card taps through to
/// its tab; the profile card opens the recap (avatar) or Edit Profile (name/chevron).
///
/// All numbers are the same ones the Nutrition/Activities/Weight tabs show — computed here via the
/// pure `NutritionStats` / `WaterStats` / `ActivityStats` (+ `HomeStats` for the scale value). Like
/// the RN screen, Home is **not** gated on a complete profile: missing data just yields a 0 target /
/// 0 burn / placeholder scale, and the cards still render.
struct HomeView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    var onXpTap: () -> Void
    /// Switch the active primary tab (RN `router.push('/(tabs)/…')`).
    var onSelectTab: (AppTab) -> Void
    /// Open Edit Profile (RN `router.push('/profile-modal')`).
    var onOpenProfile: () -> Void
    /// Open the weekly recap (RN `router.push('/weekly-recap-modal')`).
    var onOpenRecap: () -> Void

    // MARK: - Derived numbers (mirror NutritionView / ActivitiesView)

    private var unit: WeightUnit { store.preferences.unit }
    private var profile: UserProfile? { store.preferences.profile }
    private var latestWeight: WeightEntry? { NutritionStats.latestWeight(store.entries) }
    private var activityMode: ActivityMode { store.preferences.activityMode ?? .manual }

    private var meals: Meals {
        store.nutritionLog.first { $0.date == store.selectedDate }?.meals ?? Meals()
    }
    private var split: MacroSplit { store.preferences.macroSplit ?? NutritionStats.defaultSplit }
    private var dayActivity: DayActivity? { store.activityLog.first { $0.date == store.selectedDate } }

    private var baseTdee: Int {
        NutritionStats.baseTdee(profile: profile, latestWeight: latestWeight, activityMode: activityMode)
    }
    private var calorieTarget: Int { baseTdee + NutritionStats.caloriesBurned(dayActivity, mode: activityMode) }
    private var consumed: Double { NutritionStats.consumedCalories(meals) }

    private var waterGoal: Int {
        WaterStats.resolveGoal(preferences: store.preferences, profile: profile, latestWeight: latestWeight)
    }
    private var waterConsumed: Double {
        WaterStats.consumed(store.waterLog.first { $0.date == store.selectedDate })
    }

    /// Every logged activity for the day feeds the flame (mode-independent, like the Activities tab).
    private var totalBurned: Int { ActivityStats.totalBurned(dayActivity) }

    /// The weight to show on the scale for the viewed date, in the display unit (empty = none yet).
    private var scaleValue: String {
        guard let entry = HomeStats.latestEntry(onOrBefore: store.selectedDate, in: store.entries) else { return "" }
        return WeightStats.jsNumberString(Units.convertWeight(entry.weight, from: entry.unit, to: unit))
    }

    var body: some View {
        CollapsibleScreen(title: "Home", onXpTap: onXpTap) {
            DateNavBar()

            ProfileCardView(onOpenRecap: onOpenRecap, onOpenProfile: onOpenProfile)

            nutritionCard

            HStack(spacing: Spacing.sm) {
                activityCard
                weightCard
            }
        }
    }

    // MARK: - Cards

    private var nutritionCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            cardLabel("NUTRITION")
            HStack(alignment: .center, spacing: Spacing.md) {
                CalorieRingView(consumed: consumed, target: Double(calorieTarget))
                WaterBottleVisual(
                    consumed: waterConsumed,
                    goal: waterGoal,
                    unitLabel: WaterStats.unitLabel(unit),
                    onTap: { onSelectTab(.nutrition) }
                )
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.sm)
        }
        .featureCardStyle(padding: 0)
        .contentShape(Rectangle())
        .onTapGesture { onSelectTab(.nutrition) }
    }

    private var activityCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            cardLabel("ACTIVITY")
            CalorieFlameView(totalBurned: totalBurned, size: 120)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .frame(maxWidth: .infinity, minHeight: 160)
        .featureCardStyle(padding: 0)
        .contentShape(Rectangle())
        .onTapGesture { onSelectTab(.activities) }
    }

    private var weightCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            cardLabel("WEIGHT")
            DigitalScaleView(weight: scaleValue, unit: unit.rawValue, animateToValue: nil, size: 100, hideUnit: true)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.bottom, Spacing.md)
        }
        .frame(maxWidth: .infinity, minHeight: 160)
        .featureCardStyle(padding: 0)
        .contentShape(Rectangle())
        .onTapGesture { onSelectTab(.weight) }
    }

    private func cardLabel(_ text: String) -> some View {
        Text(text)
            .font(Typography.small.weight(.semibold))
            .foregroundStyle(colors.textSecondary)
            .padding(.horizontal, Spacing.md)
            .padding(.top, Spacing.sm)
            .padding(.bottom, Spacing.xs)
    }
}
