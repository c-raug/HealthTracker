import SwiftUI

/// Page 3 of the weekly recap — port of `expo/components/recap/RecapStreaksPage.tsx`.
/// The four current streaks (2×2 emoji grid) + up to 3 unlocked achievements.
struct RecapStreaksPageView: View {
    @Environment(\.appColors) private var colors
    let weekStart: String
    let entries: [WeightEntry]
    let nutritionLog: [DayNutrition]
    let activityLog: [DayActivity]
    let calorieTarget: Int?
    let unlockedAchievements: [String]?

    private var streaks: RecapStats.StreakSummary {
        RecapStats.currentStreaks(
            nutritionLog: nutritionLog,
            entries: entries,
            activityLog: activityLog,
            calorieTarget: calorieTarget
        )
    }
    private var achievements: [Achievements.Achievement] {
        RecapStats.unlockedThisWeek(unlockedIds: unlockedAchievements)
    }

    private var streakItems: [(label: String, emoji: String, value: Int)] {
        [
            ("Food", "🍎", streaks.food),
            ("Calorie Goal", "🎯", streaks.calorie),
            ("Weight", "⚖️", streaks.weight),
            ("Activity", "🏃", streaks.activity),
        ]
    }

    private let columns = [GridItem(.flexible(), spacing: Spacing.sm), GridItem(.flexible(), spacing: Spacing.sm)]

    var body: some View {
        VStack(spacing: 0) {
            Image(systemName: "flame")
                .font(.system(size: 52))
                .foregroundStyle(colors.primary)
                .padding(.bottom, Spacing.lg)
            Text("Streaks & Milestones")
                .font(Typography.h1)
                .foregroundStyle(colors.text)
                .padding(.bottom, Spacing.xl)

            streaksCard
                .padding(.bottom, Spacing.md)
            achievementsCard
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var streaksCard: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Current Streaks").font(Typography.h3).foregroundStyle(colors.text)
            LazyVGrid(columns: columns, spacing: Spacing.sm) {
                ForEach(streakItems, id: \.label) { item in
                    VStack(spacing: Spacing.xs) {
                        Text(item.emoji).font(.system(size: 22))
                        Text("\(item.value)").font(Typography.h3).foregroundStyle(colors.primary)
                        Text(item.label)
                            .font(Typography.small)
                            .foregroundStyle(colors.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(Spacing.sm)
                    .background(colors.background)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                }
            }
        }
        .padding(Spacing.lg)
        .frame(maxWidth: .infinity)
        .background(colors.card)
        .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
        .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
    }

    private var achievementsCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Achievements").font(Typography.h3).foregroundStyle(colors.text)
                .padding(.bottom, Spacing.sm)
            if achievements.isEmpty {
                Text("Keep going to unlock achievements!")
                    .font(Typography.body)
                    .foregroundStyle(colors.textSecondary)
                    .frame(maxWidth: .infinity)
            } else {
                ForEach(Array(achievements.enumerated()), id: \.element.id) { index, achievement in
                    HStack(spacing: Spacing.sm) {
                        Text(achievement.emoji).font(.system(size: 22))
                        Text(achievement.label).font(Typography.body).foregroundStyle(colors.text)
                        Spacer()
                    }
                    .padding(.vertical, Spacing.xs)
                    if index != achievements.count - 1 {
                        Rectangle().fill(colors.border).frame(height: 0.5)
                    }
                }
            }
        }
        .padding(Spacing.lg)
        .frame(maxWidth: .infinity)
        .background(colors.card)
        .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
        .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
    }
}
