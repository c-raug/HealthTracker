import Foundation
import Observation

/// The single source of truth for app state — the Swift port of the `useReducer` store in
/// `expo/context/AppContext.tsx`. Every method here mirrors one reducer action (see
/// `docs/data-model.md` §2), preserving newest-first prepend semantics and the once-per-day XP guards.
///
/// Persistence is write-through: each slice has a `didSet` that saves its JSON file (gated by
/// `!isLoading`, exactly like the RN persistence effects) and schedules the debounced 3s auto-backup.
@MainActor
@Observable
final class AppStore {
    // MARK: - State slices (each writes through to its JSON file on change)

    var entries: [WeightEntry] = [] { didSet { persist(.entries) } }
    var preferences = UserPreferences() { didSet { persist(.preferences) } }
    var nutritionLog: [DayNutrition] = [] { didSet { persist(.nutritionLog) } }
    var customFoods: [CustomFood] = [] { didSet { persist(.customFoods) } }
    var savedMeals: [SavedMeal] = [] { didSet { persist(.savedMeals) } }
    var activityLog: [DayActivity] = [] { didSet { persist(.activityLog) } }
    var waterLog: [DayWater] = [] { didSet { persist(.waterLog) } }

    /// The shared date all data tabs read/write. Initialized to today; **never persisted** (resets
    /// to today on relaunch — matches the RN `selectedDate` behavior).
    var selectedDate: String
    /// True until the first `load()` completes. Gates write-through so hydrating from disk never
    /// re-persists (mirrors the `!state.isLoading` guard on the RN persistence effects).
    var isLoading = true

    // MARK: - Infra

    private let jsonStore: JSONStore
    private let ioQueue = DispatchQueue(label: "com.healthtracker.persistence", qos: .utility)
    private var autoBackupTask: Task<Void, Never>?

    static let xpFoodCap = XP.foodCap

    enum XpSource: Sendable {
        case food, calorieGoal, waterGoal, weight, activity, streak7, streak30
    }

    init(jsonStore: JSONStore = JSONStore()) {
        self.jsonStore = jsonStore
        self.selectedDate = Self.todayString()
    }

    // MARK: - Load / migrations

    /// Hydrate all slices from disk and run the `LOAD_DATA` migrations. Safe to call once at launch.
    func load() {
        let store = jsonStore
        let loadedEntries = store.load([WeightEntry].self, from: .entries) ?? []
        let loadedPrefs = store.load(UserPreferences.self, from: .preferences) ?? UserPreferences(unit: .lbs)
        let loadedNutrition = store.load([DayNutrition].self, from: .nutritionLog) ?? []
        let loadedFoods = store.load([CustomFood].self, from: .customFoods) ?? []
        let loadedMeals = store.load([SavedMeal].self, from: .savedMeals) ?? []
        let loadedActivity = store.load([DayActivity].self, from: .activityLog) ?? []
        let loadedWater = store.load([DayWater].self, from: .waterLog) ?? []

        applyLoaded(
            entries: loadedEntries,
            preferences: loadedPrefs,
            nutritionLog: loadedNutrition,
            customFoods: loadedFoods,
            savedMeals: loadedMeals,
            activityLog: loadedActivity,
            waterLog: loadedWater,
            flushMigrations: true
        )
    }

    /// Assign all slices + apply migrations. During initial load (`isLoading == true`) the slice
    /// assignments skip write-through, so `flushMigrations` re-persists the two slices migrations can
    /// touch (preferences, custom foods) to flush their canonical form to disk. During `importBackup`
    /// (`isLoading == false`) every assignment already persists, so no flush is needed.
    private func applyLoaded(
        entries: [WeightEntry],
        preferences prefsIn: UserPreferences,
        nutritionLog: [DayNutrition],
        customFoods: [CustomFood],
        savedMeals: [SavedMeal],
        activityLog: [DayActivity],
        waterLog: [DayWater],
        flushMigrations: Bool
    ) {
        var prefs = prefsIn
        // Legacy onboarding auto-complete: profile + entries but no explicit flag → complete.
        if prefs.profile != nil, !entries.isEmpty, !(prefs.onboardingComplete ?? false) {
            prefs.onboardingComplete = true
        }
        // Seed default food-type categories / favorite filters when unset.
        if prefs.foodTypeCategories == nil {
            prefs.foodTypeCategories = UserPreferences.defaultFoodTypeCategories
        }
        if prefs.favoriteFilterTypes == nil {
            prefs.favoriteFilterTypes = []
        }
        // Custom-food legacy migration already ran at decode time (see CustomFood.init(from:)).

        self.entries = entries
        self.preferences = prefs
        self.nutritionLog = nutritionLog
        self.customFoods = customFoods
        self.savedMeals = savedMeals
        self.activityLog = activityLog
        self.waterLog = waterLog
        self.isLoading = false

        if flushMigrations {
            persist(.preferences)
            persist(.customFoods)
        }
    }

    // MARK: - Weight

    func upsertEntry(_ entry: WeightEntry) {
        var list = entries.filter { $0.date != entry.date }
        list.insert(entry, at: 0)
        entries = list
    }

    func deleteEntry(id: String) {
        entries.removeAll { $0.id == id }
    }

    // MARK: - Selected date / units / profile

    func setSelectedDate(_ date: String) { selectedDate = date }

    func setUnit(_ unit: WeightUnit) { preferences.unit = unit }

    func setProfile(_ profile: UserProfile) { preferences.profile = profile }

    func setMacroPreset(_ preset: MacroPreset, split: MacroSplit) {
        var p = preferences
        p.macroPreset = preset
        p.macroSplit = split
        preferences = p
    }

    // MARK: - Nutrition (foods in meals)

    func addFoodToMeal(date: String, category: MealCategory, food: NutritionFoodItem) {
        var day = dayForNutrition(date)
        day.meals[category].append(food)
        upsertNutritionDay(day)
    }

    func deleteFoodFromMeal(date: String, category: MealCategory, foodId: String) {
        var day = dayForNutrition(date)
        day.meals[category].removeAll { $0.id == foodId }
        upsertNutritionDay(day)
    }

    func updateFoodInMeal(date: String, category: MealCategory, food: NutritionFoodItem) {
        var day = dayForNutrition(date)
        day.meals[category] = day.meals[category].map { $0.id == food.id ? food : $0 }
        upsertNutritionDay(day)
    }

    func reorderMealFoods(date: String, category: MealCategory, foods: [NutritionFoodItem]) {
        var day = dayForNutrition(date)
        day.meals[category] = foods
        upsertNutritionDay(day)
    }

    // MARK: - Custom foods

    func addCustomFood(_ food: CustomFood) { customFoods.insert(food, at: 0) }

    func updateCustomFood(_ food: CustomFood) {
        customFoods = customFoods.map { $0.id == food.id ? food : $0 }
    }

    func deleteCustomFood(id: String) { customFoods.removeAll { $0.id == id } }

    func reorderPinnedFoods(category: MealCategory, ids: [String]) {
        customFoods = customFoods.map { food in
            guard let idx = ids.firstIndex(of: food.id) else { return food }
            var f = food
            var order = f.pinnedOrder ?? [:]
            order[category.rawValue] = idx
            f.pinnedOrder = order
            return f
        }
    }

    // MARK: - Saved meals

    func addSavedMeal(_ meal: SavedMeal) { savedMeals.insert(meal, at: 0) }

    func updateSavedMeal(_ meal: SavedMeal) {
        savedMeals = savedMeals.map { $0.id == meal.id ? meal : $0 }
    }

    func deleteSavedMeal(id: String) { savedMeals.removeAll { $0.id == id } }

    func reorderPinnedMeals(category: MealCategory, ids: [String]) {
        savedMeals = savedMeals.map { meal in
            guard let idx = ids.firstIndex(of: meal.id) else { return meal }
            var m = meal
            var order = m.pinnedOrder ?? [:]
            order[category.rawValue] = idx
            m.pinnedOrder = order
            return m
        }
    }

    // MARK: - Activity

    func addActivity(date: String, activity: ActivityEntry) {
        var day = activityDay(date)
        var stamped = activity
        stamped.loggedWithMode = preferences.activityMode ?? .auto
        day.activities.append(stamped)
        upsertActivityDay(day)
    }

    func deleteActivity(date: String, activityId: String) {
        var day = activityDay(date)
        day.activities.removeAll { $0.id == activityId }
        upsertActivityDay(day)
    }

    func dismissActivityWarning(date: String, activityId: String) {
        var day = activityDay(date)
        day.activities = day.activities.map { activity in
            guard activity.id == activityId else { return activity }
            var a = activity
            a.warningDismissed = true
            return a
        }
        upsertActivityDay(day)
    }

    func setActivityMode(_ mode: ActivityMode) { preferences.activityMode = mode }

    // MARK: - Water

    func addWaterEntry(date: String, entry: WaterEntry) {
        let existing = waterLog.first { $0.date == date }
        let day: DayWater = existing.map { DayWater(date: $0.date, entries: $0.entries + [entry]) }
            ?? DayWater(date: date, entries: [entry])
        var filtered = waterLog.filter { $0.date != date }
        filtered.insert(day, at: 0)
        waterLog = filtered
    }

    func deleteWaterEntry(date: String, entryId: String) {
        guard let existing = waterLog.first(where: { $0.date == date }) else { return }
        let day = DayWater(date: existing.date, entries: existing.entries.filter { $0.id != entryId })
        var filtered = waterLog.filter { $0.date != date }
        filtered.insert(day, at: 0)
        waterLog = filtered
    }

    func setWaterGoalOverride(_ amount: Double?) { preferences.waterGoalOverride = amount }
    func setWaterGoalMode(_ mode: WaterGoalMode) { preferences.waterGoalMode = mode }
    func setWaterCreatine(_ enabled: Bool) { preferences.waterCreatineAdjustment = enabled }
    func setWaterPresets(_ presets: [Int]) { preferences.waterPresets = presets }

    // MARK: - Misc preferences

    func setOnboardingComplete() { preferences.onboardingComplete = true }
    func setThemeColor(_ color: String) { preferences.themeColor = color }
    func setSectionsExpanded(_ enabled: Bool) { preferences.sectionsExpanded = enabled }
    func setAppearanceMode(_ mode: AppearanceMode) { preferences.appearanceMode = mode }
    func setAvatar(_ uri: String?) { preferences.avatarUri = uri }
    func setLastRecapWeek(_ week: String) { preferences.lastRecapShownWeek = week }
    func setFavoriteFilterTypes(_ types: [String]) { preferences.favoriteFilterTypes = types }

    /// Update the food-type categories, pruning any type that no longer exists from every custom food.
    func setFoodTypeCategories(_ categories: [String]) {
        let updated = customFoods.map { food -> CustomFood in
            guard let types = food.foodTypes, !types.isEmpty else { return food }
            let filtered = types.filter { categories.contains($0) }
            if filtered.count == types.count { return food }
            var f = food
            f.foodTypes = filtered.isEmpty ? nil : filtered
            return f
        }
        customFoods = updated
        var p = preferences
        p.foodTypeCategories = categories
        preferences = p
    }

    // MARK: - Gamification

    func unlockAchievement(id: String) {
        var list = preferences.unlockedAchievements ?? []
        guard !list.contains(id) else { return }
        list.append(id)
        preferences.unlockedAchievements = list
    }

    /// Grant XP with the same per-day guards as the RN reducer: food is capped at 25/day; each
    /// boolean source (calorie/water/weight/activity goal) grants once per day; streak bonuses are
    /// gated one-time by the watcher via `unlockedAchievements`.
    func addXP(amount: Int, date: String, source: XpSource) {
        let currentXp = preferences.totalXp ?? 0
        var xpLog = preferences.xpLog ?? [:]
        var dayLog = xpLog[date] ?? XpDayLog()

        switch source {
        case .food:
            let alreadyEarned = dayLog.food
            let canEarn = max(0, Self.xpFoodCap - alreadyEarned)
            let toAdd = min(amount, canEarn)
            if toAdd <= 0 { return }
            dayLog.food = alreadyEarned + toAdd
            xpLog[date] = dayLog
            var p = preferences
            p.totalXp = currentXp + toAdd
            p.xpLog = xpLog
            preferences = p
            return
        case .calorieGoal:
            if dayLog.calorieGoal { return }
            dayLog.calorieGoal = true
            xpLog[date] = dayLog
        case .waterGoal:
            if dayLog.waterGoal { return }
            dayLog.waterGoal = true
            xpLog[date] = dayLog
        case .weight:
            if dayLog.weight { return }
            dayLog.weight = true
            xpLog[date] = dayLog
        case .activity:
            if dayLog.activity { return }
            dayLog.activity = true
            xpLog[date] = dayLog
        case .streak7, .streak30:
            break  // one-time bonuses; no per-day ledger entry
        }

        var p = preferences
        p.totalXp = currentXp + amount
        p.xpLog = xpLog
        preferences = p
    }

    func prestige() {
        var p = preferences
        p.totalXp = 0
        p.prestige = (preferences.prestige ?? 0) + 1
        preferences = p
    }

    // MARK: - Backup export / import

    /// Pretty-printed backup JSON for the share sheet (Phase 11 wires up the UI).
    func exportBackupData() throws -> Data {
        try BackupCodec.encodePretty(currentSnapshot())
    }

    /// Import a backup envelope, replacing all slices and re-running load migrations. Throws
    /// `BackupCodec.BackupError.invalidBackup` if the payload is missing required keys.
    func importBackup(_ data: Data) throws {
        let backup = try BackupCodec.decode(data)
        applyLoaded(
            entries: backup.entries,
            preferences: backup.preferences,
            nutritionLog: backup.nutritionLog,
            customFoods: backup.customFoods,
            savedMeals: backup.savedMeals,
            activityLog: backup.activityLog,
            waterLog: backup.waterLog ?? [],
            flushMigrations: false
        )
    }

    // MARK: - Helpers (mirror the reducer's day upsert helpers)

    private func dayForNutrition(_ date: String) -> DayNutrition {
        nutritionLog.first { $0.date == date } ?? DayNutrition(date: date)
    }

    private func upsertNutritionDay(_ day: DayNutrition) {
        var log = nutritionLog.filter { $0.date != day.date }
        log.insert(day, at: 0)
        nutritionLog = log
    }

    private func activityDay(_ date: String) -> DayActivity {
        activityLog.first { $0.date == date } ?? DayActivity(date: date)
    }

    private func upsertActivityDay(_ day: DayActivity) {
        var log = activityLog.filter { $0.date != day.date }
        log.insert(day, at: 0)
        activityLog = log
    }

    private func currentSnapshot() -> BackupCodec.Snapshot {
        BackupCodec.Snapshot(
            entries: entries,
            preferences: preferences,
            nutritionLog: nutritionLog,
            customFoods: customFoods,
            savedMeals: savedMeals,
            activityLog: activityLog,
            waterLog: waterLog
        )
    }

    // MARK: - Persistence write-through

    private func persist(_ slice: JSONStore.Slice) {
        guard !isLoading else { return }
        let data: Data?
        switch slice {
        case .entries:      data = try? JSONStore.encoder.encode(entries)
        case .preferences:  data = try? JSONStore.encoder.encode(preferences)
        case .nutritionLog: data = try? JSONStore.encoder.encode(nutritionLog)
        case .customFoods:  data = try? JSONStore.encoder.encode(customFoods)
        case .savedMeals:   data = try? JSONStore.encoder.encode(savedMeals)
        case .activityLog:  data = try? JSONStore.encoder.encode(activityLog)
        case .waterLog:     data = try? JSONStore.encoder.encode(waterLog)
        }
        if let data {
            let store = jsonStore
            ioQueue.async { store.write(data, to: slice) }
        }
        scheduleAutoBackup()
    }

    /// Debounced (3s) full-state backup to Documents — the silent `writeAutoBackup` equivalent.
    private func scheduleAutoBackup() {
        autoBackupTask?.cancel()
        autoBackupTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(3))
            guard !Task.isCancelled else { return }
            self?.writeAutoBackupNow()
        }
    }

    private func writeAutoBackupNow() {
        guard let data = try? BackupCodec.encodeCompact(currentSnapshot()) else { return }
        let store = jsonStore
        ioQueue.async { store.writeBackupFile(data) }
    }

    // MARK: - Dates

    /// Local-timezone `"YYYY-MM-DD"` for today. Delegates to the Phase 3 `Dates` logic
    /// (single source of truth for day-key formatting).
    static func todayString() -> String {
        Dates.getToday()
    }
}
