import SwiftUI

/// The in-app shell once onboarding is complete. Port of `expo/app/(tabs)/_layout.tsx` +
/// the in-app parts of `expo/app/_layout.tsx`:
/// - four primary tabs (Home / Weight / Nutrition / Activities) switched by the floating
///   `PillTabBar`, whose "More" item opens the `MoreMenu` popover (Profile / Settings) instead of
///   navigating,
/// - Profile / Settings are hidden routes pushed onto a `NavigationStack` (system back button),
/// - every `HeaderXpBar` tap presents the stats-achievements modal (sheet),
/// - on first appearance, if today is Monday and this ISO week's recap hasn't been shown, the
///   weekly-recap full-screen cover auto-presents once per session.
struct RootTabView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    @State private var selection: AppTab = .home
    @State private var navPath: [MoreDestination] = []
    @State private var showMoreMenu = false
    @State private var showStats = false
    @State private var recap: RecapWeek?
    @State private var recapCheckedThisSession = false

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .bottom) {
                NavigationStack(path: $navPath) {
                    tabContent
                        // The custom CollapsibleHeader is the header; hide the system nav bar on the
                        // root. Pushed Profile/Settings set their own visible title bar.
                        .toolbar(.hidden, for: .navigationBar)
                        .navigationDestination(for: MoreDestination.self) { dest in
                            switch dest {
                            case .profile: ProfileView(onXpTap: { showStats = true })
                            case .settings: SettingsView(onXpTap: { showStats = true })
                            }
                        }
                }

                PillTabBar(
                    selection: $selection,
                    moreActive: showMoreMenu,
                    onMorePressed: { showMoreMenu.toggle() }
                )

                if showMoreMenu {
                    MoreMenu(isVisible: $showMoreMenu) { dest in
                        navPath.append(dest)
                    }
                    .transition(.opacity)
                }
            }
            .environment(\.topSafeInset, proxy.safeAreaInsets.top)
            .environment(\.bottomSafeInset, proxy.safeAreaInsets.bottom)
        }
        // Reset any pushed Profile/Settings screen when a primary tab is chosen.
        .onChange(of: selection) { _, _ in navPath.removeAll() }
        .sheet(isPresented: $showStats) {
            StatsAchievementsPlaceholderView()
        }
        .fullScreenCover(item: $recap) { item in
            WeeklyRecapPlaceholderView(week: item.week)
        }
        .task { maybeShowWeeklyRecap() }
    }

    @ViewBuilder
    private var tabContent: some View {
        switch selection {
        case .home: HomeView(
            onXpTap: { showStats = true },
            onSelectTab: { selection = $0 },
            onOpenProfile: { navPath.append(.profile) },
            onOpenRecap: { recap = RecapWeek(id: Dates.getISOWeekString(Dates.getToday())) }
        )
        case .weight: WeightView(onXpTap: { showStats = true })
        case .nutrition: NutritionView(onXpTap: { showStats = true })
        case .activities: ActivitiesView(onXpTap: { showStats = true })
        case .more: // unreachable: "More" opens the popover
            HomeView(
                onXpTap: { showStats = true },
                onSelectTab: { selection = $0 },
                onOpenProfile: { navPath.append(.profile) },
                onOpenRecap: { recap = RecapWeek(id: Dates.getISOWeekString(Dates.getToday())) }
            )
        }
    }

    /// Mirrors the RN auto-recap effect: Monday + onboarding complete + this ISO week not yet shown
    /// → present once per session.
    private func maybeShowWeeklyRecap() {
        guard !recapCheckedThisSession else { return }
        guard store.preferences.onboardingComplete == true else { return }
        let today = Dates.getToday()
        guard Dates.jsDayOfWeek(today) == 1 else { return } // 1 == Monday
        let week = Dates.getISOWeekString(today)
        guard store.preferences.lastRecapShownWeek != week else { return }
        recapCheckedThisSession = true
        recap = RecapWeek(id: week)
    }
}

/// Identifiable wrapper so the recap cover can be driven by `.fullScreenCover(item:)`.
struct RecapWeek: Identifiable {
    let id: String
    var week: String { id }
}
