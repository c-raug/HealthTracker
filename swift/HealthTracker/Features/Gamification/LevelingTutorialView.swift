import SwiftUI

/// Full-screen story-style leveling tutorial — port of `expo/app/leveling-tutorial-modal.tsx` and
/// its three pages. Presented as a `fullScreenCover` from `StatsAchievementsView`'s ⓘ button.
/// Header progress segments fill as you advance; invisible left/right tap zones go back / forward;
/// the footer button reads "Next" until the last page, then "Done".
struct LevelingTutorialView: View {
    @Environment(\.appColors) private var colors
    @Environment(\.dismiss) private var dismiss
    @Environment(AppStore.self) private var store

    private let pageCount = 3
    @State private var page = 0

    private var totalXp: Int { store.preferences.totalXp ?? 0 }

    var body: some View {
        ZStack {
            colors.background.ignoresSafeArea()
            VStack(spacing: 0) {
                // Header: progress segments + close.
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
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(colors.text)
                    }
                    .buttonStyle(.plain)
                    .padding(Spacing.xs)
                }
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.md)
                .padding(.bottom, Spacing.xs)

                // Page content with left/right tap zones layered on top.
                ZStack {
                    switch page {
                    case 0: TutorialXpPage()
                    case 1: TutorialLevelsPage(totalXp: totalXp)
                    default: TutorialPrestigePage()
                    }
                    HStack(spacing: 0) {
                        Color.clear.contentShape(Rectangle()).onTapGesture { back() }
                        Color.clear.contentShape(Rectangle()).onTapGesture { advance() }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                // Footer: Next / Done.
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
                .padding(.horizontal, Spacing.xl)
                .padding(.bottom, Spacing.lg)
            }
        }
    }

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

// MARK: - Page 1: How to Earn XP

/// Port of `TutorialXpPage.tsx` — the daily-action + streak-bonus XP table.
private struct TutorialXpPage: View {
    @Environment(\.appColors) private var colors

    private let dailyActions: [(String, String)] = [
        ("Log food", "+\(XP.food)/entry (max \(XP.foodCap)/day)"),
        ("Hit calorie goal", "+\(XP.calorieGoal)/day"),
        ("Hit water goal", "+\(XP.waterGoal)/day"),
        ("Log weight", "+\(XP.weight)/day"),
        ("Log activity", "+\(XP.activity)/day"),
    ]
    private let bonuses: [(String, String)] = [
        ("7-day streak", "+\(XP.streak7) (one-time)"),
        ("30-day streak", "+\(XP.streak30) (one-time)"),
    ]

    var body: some View {
        VStack(spacing: Spacing.xl) {
            Image(systemName: "star").font(.system(size: 52)).foregroundStyle(colors.primary)
            Text("How to Earn XP").font(Typography.h1).foregroundStyle(colors.text)
            VStack(alignment: .leading, spacing: 0) {
                sectionHeader("DAILY ACTIONS")
                ForEach(Array(dailyActions.enumerated()), id: \.offset) { idx, item in
                    row(item.0, item.1, last: idx == dailyActions.count - 1)
                }
                sectionHeader("STREAK BONUSES")
                ForEach(Array(bonuses.enumerated()), id: \.offset) { idx, item in
                    row(item.0, item.1, last: idx == bonuses.count - 1)
                }
            }
            .padding(Spacing.lg)
            .background(colors.card)
            .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
            .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func sectionHeader(_ text: String) -> some View {
        Text(text)
            .font(Typography.small.weight(.semibold))
            .foregroundStyle(colors.textSecondary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, Spacing.md)
            .padding(.bottom, Spacing.xs)
    }

    private func row(_ label: String, _ value: String, last: Bool) -> some View {
        VStack(spacing: 0) {
            HStack {
                Text(label).font(Typography.body).foregroundStyle(colors.text)
                Spacer()
                Text(value).font(Typography.body.weight(.semibold)).foregroundStyle(colors.primary)
            }
            .padding(.vertical, Spacing.sm)
            if !last {
                Rectangle().fill(colors.border).frame(height: 0.5)
            }
        }
    }
}

// MARK: - Page 2: The Levels

/// Port of `TutorialLevelsPage.tsx` — the 10-level ladder with the current level highlighted.
private struct TutorialLevelsPage: View {
    @Environment(\.appColors) private var colors
    let totalXp: Int

    private var currentLevel: Int { XP.level(forXp: totalXp) }

    var body: some View {
        VStack(spacing: Spacing.xl) {
            Image(systemName: "trophy").font(.system(size: 52)).foregroundStyle(colors.primary)
            Text("The Levels").font(Typography.h1).foregroundStyle(colors.text)
            VStack(spacing: 0) {
                ForEach(Array(XP.levelNames.enumerated()), id: \.offset) { index, name in
                    let levelNum = index + 1
                    let isCurrent = levelNum == currentLevel
                    let isLast = index == XP.levelNames.count - 1
                    VStack(spacing: 0) {
                        HStack(spacing: Spacing.sm) {
                            Text("\(levelNum)")
                                .font(Typography.body.weight(.semibold))
                                .foregroundStyle(isCurrent ? colors.primary : colors.textSecondary)
                                .frame(width: 24, alignment: .leading)
                            Text(name)
                                .font(isCurrent ? Typography.body.weight(.semibold) : Typography.body)
                                .foregroundStyle(isCurrent ? colors.primary : colors.text)
                            if isCurrent {
                                Image(systemName: "arrow.left").font(.system(size: 14)).foregroundStyle(colors.primary)
                            }
                            Spacer()
                            Text("\(thresholdText(XP.levelThresholds[index])) XP")
                                .font(isCurrent ? Typography.small.weight(.semibold) : Typography.small)
                                .foregroundStyle(isCurrent ? colors.primary : colors.textSecondary)
                        }
                        .padding(.vertical, Spacing.sm)
                        .padding(.horizontal, Spacing.sm)
                        .background(isCurrent ? colors.primaryLight : Color.clear)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                        if !isLast {
                            Rectangle().fill(colors.border).frame(height: 0.5)
                        }
                    }
                }
            }
            .padding(Spacing.lg)
            .background(colors.card)
            .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
            .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    /// Thousands-separated threshold (RN `toLocaleString()`).
    private func thresholdText(_ n: Int) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        return f.string(from: NSNumber(value: n)) ?? "\(n)"
    }
}

// MARK: - Page 3: Prestige

/// Port of `TutorialPrestigePage.tsx` — the prestige explainer.
private struct TutorialPrestigePage: View {
    @Environment(\.appColors) private var colors

    var body: some View {
        VStack(spacing: Spacing.xl) {
            Image(systemName: "rosette").font(.system(size: 52)).foregroundStyle(colors.primary)
            Text("Prestige").font(Typography.h1).foregroundStyle(colors.text)
            VStack(alignment: .leading, spacing: Spacing.md) {
                paragraph("When you reach Level 10 (Legend), you unlock the ability to Prestige.")
                paragraph("Prestiging resets your XP back to 0 and your level back to 1, but you earn a permanent prestige badge that shows alongside your level.")
                HStack {
                    Text("P1 · Level 4 · Dedicated")
                        .font(Typography.body.weight(.semibold))
                        .foregroundStyle(colors.text)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(Spacing.md)
                .background(colors.background)
                .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                paragraph("You can prestige as many times as you like. Each time, your prestige number increases — P1, P2, P3, and so on. The journey never ends!")
            }
            .padding(Spacing.lg)
            .background(colors.card)
            .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
            .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func paragraph(_ text: String) -> some View {
        Text(text)
            .font(Typography.body)
            .foregroundStyle(colors.text)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}
