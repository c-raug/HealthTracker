import Foundation

/// Verbatim port of `expo/utils/weeklyRatingCalculation.ts`.
///
/// Scores a 7-day window (Monday-anchored) across 4 factors — food logged, calorie goal (±10%),
/// weight logged, water goal met — each a 0…1 fraction of days, then maps the average to 1…5 stars.
enum WeeklyRating {

    struct Factors: Equatable {
        var calories: Double // 0…1
        var water: Double    // 0…1
        var weight: Double   // 0…1
        var food: Double     // 0…1
    }

    struct Result: Equatable {
        var stars: Int // 1…5
        var factors: Factors
    }

    /// - Parameter weekStart: `"YYYY-MM-DD"` Monday that begins the recap week.
    static func calculate(
        weekStart: String,
        weightEntries: [WeightEntry],
        nutritionLog: [DayNutrition],
        waterLog: [DayWater],
        preferences: UserPreferences,
        calorieTarget: Int?
    ) -> Result {
        let days = (0..<7).map { Dates.addDays(weekStart, $0) }

        var calorieDays = 0
        var waterDays = 0
        var weightDays = 0
        var foodDays = 0

        // Latest weight entry at or before the end of the week (drives the water goal).
        let weekEnd = days[6]
        let latestWeight = weightEntries
            .filter { $0.date <= weekEnd }
            .sorted { $0.date > $1.date }
            .first

        let targetD = calorieTarget.map(Double.init)

        for date in days {
            let dayNutrition = nutritionLog.first { $0.date == date }

            // Food: at least one item logged.
            if let n = dayNutrition, Streaks.totalFoods(n.meals) > 0 {
                foodDays += 1
            }

            // Calorie goal: within ±10% of target.
            if let target = targetD, target > 0, let n = dayNutrition {
                let consumed = Streaks.consumedCalories(n.meals)
                if consumed > 0 && abs(consumed - target) <= target * 0.1 {
                    calorieDays += 1
                }
            }

            // Weight: any entry that day.
            if weightEntries.contains(where: { $0.date == date }) {
                weightDays += 1
            }

            // Water: consumed ≥ goal.
            if let dayWater = waterLog.first(where: { $0.date == date }),
               let latest = latestWeight,
               let profile = preferences.profile {
                let consumed = dayWater.entries.reduce(0) { $0 + $1.amount }
                let goal: Double
                if preferences.waterGoalMode == .manual, let override = preferences.waterGoalOverride {
                    goal = override
                } else {
                    goal = Double(WaterGoal.calculate(
                        weightValue: latest.weight,
                        weightUnit: latest.unit,
                        activityLevel: profile.activityLevel,
                        creatine: preferences.waterCreatineAdjustment ?? false
                    ))
                }
                if goal > 0 && consumed >= goal {
                    waterDays += 1
                }
            }
        }

        let caloriesPct = (targetD ?? 0) > 0 ? Double(calorieDays) / 7 : 0
        let waterPct = Double(waterDays) / 7
        let weightPct = Double(weightDays) / 7
        let foodPct = Double(foodDays) / 7

        let avg = (caloriesPct + waterPct + weightPct + foodPct) / 4
        let stars = max(1, min(5, jsRoundInt(1 + avg * 4)))

        return Result(
            stars: stars,
            factors: Factors(calories: caloriesPct, water: waterPct, weight: weightPct, food: foodPct)
        )
    }
}
