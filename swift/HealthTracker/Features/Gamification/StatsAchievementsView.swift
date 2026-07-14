import SwiftUI

/// Stats & Achievements sheet — port of `expo/app/stats-achievements-modal.tsx`. Presented from any
/// `HeaderXpBar` tap and from the Profile "Stats & Achievements" row. Replaces the Phase-4
/// `StatsAchievementsPlaceholderView`. Three gradient (`featureCardStyle`) cards:
///   - **Level:** the numbered/prestige label, the XP-to-next bar (or a Prestige button at max), and
///     an ⓘ that opens the leveling tutorial.
///   - **Badges:** the four streak types (calorie goal / weight / food / activity) with current + best.
///   - **Achievements:** the 8 visible achievements as a 2-column grid (locked = dimmed + lock).
struct StatsAchievementsView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var showTutorial = false
    @State private var showPrestigeConfirm = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.sm) {
                    levelCard
                    badgesCard
                    achievementsCard
                }
                .padding(Spacing.md)
                .padding(.bottom, Spacing.xl)
            }
            .background(colors.background.ignoresSafeArea())
            .navigationTitle("Stats & Achievements")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
            .fullScreenCover(isPresented: $showTutorial) { LevelingTutorialView() }
            .alert("Prestige", isPresented: $showPrestigeConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Prestige", role: .destructive) { store.prestige() }
            } message: {
                Text("You've reached Legend — the highest level! Prestige resets your XP back to 0 and Level 1, but earns you a prestige badge. Continue your journey as P\(prestige + 1)?")
            }
        }
    }

    // MARK: - Level

    private var totalXp: Int { store.preferences.totalXp ?? 0 }
    private var prestige: Int { store.preferences.prestige ?? 0 }
    private var progress: XP.Progress { XP.progress(forXp: totalXp) }

    /// `Level N · Name`, prefixed `P{n} ·` at prestige > 0 (the star is rendered in the view).
    private var levelLabel: String {
        let numbered = XP.levelLabel(forXp: totalXp)
        return prestige > 0 ? "P\(prestige) · \(numbered)" : numbered
    }

    private var xpFraction: Double {
        if progress.isMax { return 1 }
        let span = progress.nextLevelXp - progress.currentLevelXp
        guard span > 0 else { return 1 }
        return min(1, Double(totalXp - progress.currentLevelXp) / Double(span))
    }

    private var levelCard: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack {
                Text("Level").font(Typography.body.weight(.semibold)).foregroundStyle(colors.text)
                Spacer()
                Button { showTutorial = true } label: {
                    Image(systemName: "info.circle")
                        .font(.system(size: 20))
                        .foregroundStyle(colors.textSecondary)
                }
                .buttonStyle(.plain)
            }
            HStack {
                Text("⭐ \(levelLabel)").font(Typography.body.weight(.bold)).foregroundStyle(colors.text)
                Spacer()
                if !progress.isMax {
                    Text("\(totalXp - progress.currentLevelXp) / \(progress.nextLevelXp - progress.currentLevelXp) XP")
                        .font(Typography.small)
                        .foregroundStyle(colors.textSecondary)
                }
            }
            if progress.isMax {
                Button { showPrestigeConfirm = true } label: {
                    Text("Prestige →")
                        .font(Typography.body.weight(.bold))
                        .foregroundStyle(colors.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.sm)
                        .background(colors.primary)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                }
                .buttonStyle(.plain)
            } else {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(colors.border)
                        Capsule().fill(colors.primary).frame(width: geo.size.width * xpFraction)
                    }
                }
                .frame(height: 8)
                Text("Level \(progress.level) → Level \(progress.level + 1)")
                    .font(Typography.small)
                    .foregroundStyle(colors.textSecondary)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
        }
        .featureCardStyle()
    }

    // MARK: - Badges

    /// Calorie target for the streak badge uses the base TDEE only (no today-burn), matching the RN
    /// stats modal's `calorieTarget`. `nil` when the profile / weight are incomplete.
    private var calorieTarget: Int? {
        let latest = NutritionStats.latestWeight(store.entries)
        let t = NutritionStats.baseTdee(
            profile: store.preferences.profile,
            latestWeight: latest,
            activityMode: store.preferences.activityMode ?? .auto
        )
        return t > 0 ? t : nil
    }

    private struct Badge: Identifiable {
        let label: String
        let emoji: String
        let streak: Streaks.Result
        var id: String { label }
    }

    private var badges: [Badge] {
        [
            Badge(label: "Calorie Goal", emoji: "🎯", streak: Streaks.calorieGoal(store.nutritionLog, calorieTarget: calorieTarget)),
            Badge(label: "Weight", emoji: "🔥", streak: Streaks.weight(store.entries)),
            Badge(label: "Food", emoji: "🔥", streak: Streaks.food(store.nutritionLog)),
            Badge(label: "Activity", emoji: "🔥", streak: Streaks.activity(store.activityLog)),
        ]
    }

    private var badgesCard: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Badges").font(Typography.body.weight(.semibold)).foregroundStyle(colors.text)
            ForEach(badges) { b in
                HStack(spacing: Spacing.md) {
                    Text(b.emoji).font(.system(size: 28))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(b.label).font(Typography.body.weight(.semibold)).foregroundStyle(colors.text)
                        Text("Current: \(dayCount(b.streak.current))   Best: \(dayCount(b.streak.longest))")
                            .font(Typography.small)
                            .foregroundStyle(colors.textSecondary)
                    }
                    Spacer()
                }
                .padding(Spacing.md)
                .background(colors.background)
                .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
            }
        }
        .featureCardStyle()
    }

    private func dayCount(_ n: Int) -> String { "\(n) day\(n == 1 ? "" : "s")" }

    // MARK: - Achievements

    private var unlockedIds: Set<String> { Set(store.preferences.unlockedAchievements ?? []) }

    private var achievementsCard: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Achievements").font(Typography.body.weight(.semibold)).foregroundStyle(colors.text)
            LazyVGrid(
                columns: [
                    GridItem(.flexible(), spacing: Spacing.xs),
                    GridItem(.flexible(), spacing: Spacing.xs),
                ],
                spacing: Spacing.xs
            ) {
                ForEach(Achievements.all) { a in achievementTile(a) }
            }
        }
        .featureCardStyle()
    }

    private func achievementTile(_ a: Achievements.Achievement) -> some View {
        let unlocked = unlockedIds.contains(a.id)
        return VStack(spacing: 4) {
            Text(a.emoji).font(.system(size: 24))
            Text(a.label)
                .font(Typography.small.weight(.semibold))
                .foregroundStyle(colors.text)
                .multilineTextAlignment(.center)
            Text(a.category == .streak ? "\(a.threshold)-day streak" : "\(a.threshold) foods logged")
                .font(.system(size: 10))
                .foregroundStyle(colors.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(Spacing.sm)
        .background(colors.background)
        .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
        .overlay(alignment: .topTrailing) {
            if !unlocked {
                Image(systemName: "lock.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(colors.textSecondary)
                    .padding(Spacing.xs)
            }
        }
        .overlay {
            if unlocked {
                RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                    .strokeBorder(colors.primary, lineWidth: 1)
            }
        }
        .opacity(unlocked ? 1 : 0.5)
    }
}
