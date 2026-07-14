import SwiftUI

/// The weekly-recap full-screen cover — port of `expo/app/weekly-recap-modal.tsx`.
/// A 4-page story (Weight · Nutrition · Streaks · Rating) covering the most recently completed ISO
/// week: progress segments fill as you advance, invisible left/right tap zones go back / forward,
/// the footer shows the week label + a Next/Done button. On appear it marks the current ISO week as
/// shown (`SET_LAST_RECAP_WEEK`) so it won't auto-reappear this week.
///
/// Presented from `RootTabView` (Monday auto-cover once/session) and the ProfileCard avatar tap.
struct WeeklyRecapView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    /// The ISO week this recap covers; recorded so it won't reappear this week.
    let week: String

    private let pageCount = 4
    @State private var page = 0

    // The recap always covers the most recently completed ISO week (previous Mon–Sun).
    private var weekStart: String { RecapStats.weekStart() }
    private var calorieTarget: Int? {
        RecapStats.calorieTarget(entries: store.entries, preferences: store.preferences)
    }

    var body: some View {
        ZStack {
            colors.background.ignoresSafeArea()
            VStack(spacing: 0) {
                header

                // Page content with left/right tap zones layered on top.
                ZStack {
                    pageContent
                    HStack(spacing: 0) {
                        Color.clear.contentShape(Rectangle()).onTapGesture { back() }
                        Color.clear.contentShape(Rectangle()).onTapGesture { advance() }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                footer
            }
        }
        .onAppear {
            // Mark the current ISO week as shown when the recap opens (RN mounts this in useEffect).
            let currentWeek = Dates.getISOWeekString(Dates.getToday())
            if store.preferences.lastRecapShownWeek != currentWeek {
                store.setLastRecapWeek(currentWeek)
            }
        }
    }

    // MARK: - Header (progress segments + close)

    private var header: some View {
        HStack(spacing: Spacing.sm) {
            HStack(spacing: Spacing.xs) {
                ForEach(0..<pageCount, id: \.self) { i in
                    Capsule()
                        .fill(i <= page ? colors.primary : colors.border)
                        .frame(height: 3)
                }
            }
            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundStyle(colors.text)
            }
            .buttonStyle(.plain)
            .padding(Spacing.xs)
        }
        .padding(.horizontal, Spacing.md)
        .padding(.top, Spacing.lg)
        .padding(.bottom, Spacing.xs)
    }

    // MARK: - Pages

    @ViewBuilder
    private var pageContent: some View {
        switch page {
        case 0:
            RecapWeightPageView(weekStart: weekStart, entries: store.entries)
        case 1:
            RecapNutritionPageView(
                weekStart: weekStart,
                nutritionLog: store.nutritionLog,
                calorieTarget: calorieTarget
            )
        case 2:
            RecapStreaksPageView(
                weekStart: weekStart,
                entries: store.entries,
                nutritionLog: store.nutritionLog,
                activityLog: store.activityLog,
                calorieTarget: calorieTarget,
                unlockedAchievements: store.preferences.unlockedAchievements
            )
        default:
            RecapRatingPageView(result: ratingResult)
        }
    }

    private var ratingResult: WeeklyRating.Result {
        WeeklyRating.calculate(
            weekStart: weekStart,
            weightEntries: store.entries,
            nutritionLog: store.nutritionLog,
            waterLog: store.waterLog,
            preferences: store.preferences,
            calorieTarget: calorieTarget
        )
    }

    // MARK: - Footer (week label + Next/Done)

    private var footer: some View {
        VStack(spacing: Spacing.sm) {
            Text(RecapStats.weekLabel(weekStart: weekStart))
                .font(Typography.small)
                .foregroundStyle(colors.textSecondary)
            Button { advance() } label: {
                Text(page == pageCount - 1 ? "Done" : "Next")
                    .font(Typography.body.weight(.semibold))
                    .foregroundStyle(colors.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Spacing.md)
                    .background(colors.primary)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, Spacing.xl)
        .padding(.bottom, Spacing.lg)
    }

    // MARK: - Navigation

    private func advance() {
        if page < pageCount - 1 {
            withAnimation { page += 1 }
        } else {
            dismiss()
        }
    }

    private func back() {
        if page > 0 { withAnimation { page -= 1 } }
    }
}
