import { WeightEntry, DayNutrition, DayWater, UserPreferences } from '../types';
import { addDays } from './dateUtils';
import { calculateWaterGoal } from './waterCalculation';

export interface WeeklyRatingResult {
  stars: number; // 1–5
  factors: {
    calories: number; // 0–1 fraction (% of days within ±10% of goal)
    water: number;    // 0–1 fraction (% of days goal met)
    weight: number;   // 0–1 fraction (% of days with entry)
    food: number;     // 0–1 fraction (% of days with food logged)
  };
}

/**
 * Computes the weekly star rating from 7-day data slices.
 * weekStart: "YYYY-MM-DD" of the Monday starting the recap week.
 */
export function calculateWeeklyRating(
  weekStart: string,
  weightEntries: WeightEntry[],
  nutritionLog: DayNutrition[],
  waterLog: DayWater[],
  preferences: UserPreferences,
  calorieTarget: number | null,
): WeeklyRatingResult {
  const days: string[] = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  let calorieDays = 0;
  let waterDays = 0;
  let weightDays = 0;
  let foodDays = 0;

  // Latest weight entry at or before the end of the week (for water goal calculation)
  const weekEnd = days[6];
  const latestWeight = [...weightEntries]
    .filter((e) => e.date <= weekEnd)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  for (const date of days) {
    const dayNutrition = nutritionLog.find((d) => d.date === date);

    // Food: at least one food logged
    if (dayNutrition) {
      const totalFoods = Object.values(dayNutrition.meals).reduce(
        (s, foods) => s + foods.length,
        0,
      );
      if (totalFoods > 0) foodDays++;
    }

    // Calorie goal: within ±10% of target
    if (calorieTarget && calorieTarget > 0 && dayNutrition) {
      const consumed = Object.values(dayNutrition.meals).reduce(
        (s, foods) => s + foods.reduce((fs, f) => fs + (f.calories ?? 0), 0),
        0,
      );
      if (consumed > 0 && Math.abs(consumed - calorieTarget) <= calorieTarget * 0.1) {
        calorieDays++;
      }
    }

    // Weight: any entry logged
    if (weightEntries.some((e) => e.date === date)) weightDays++;

    // Water: goal met
    const dayWater = waterLog.find((d) => d.date === date);
    if (dayWater && latestWeight && preferences.profile) {
      const consumed = dayWater.entries.reduce((s, e) => s + e.amount, 0);
      const goal =
        preferences.waterGoalMode === 'manual' && preferences.waterGoalOverride
          ? preferences.waterGoalOverride
          : calculateWaterGoal(
              latestWeight.weight,
              latestWeight.unit,
              preferences.profile.activityLevel,
              preferences.waterCreatineAdjustment,
            );
      if (goal > 0 && consumed >= goal) waterDays++;
    }
  }

  const caloriesPct = calorieTarget && calorieTarget > 0 ? calorieDays / 7 : 0;
  const waterPct = waterDays / 7;
  const weightPct = weightDays / 7;
  const foodPct = foodDays / 7;

  // Average of all 4 factors, mapped linearly to 1–5 stars
  const avg = (caloriesPct + waterPct + weightPct + foodPct) / 4;
  const stars = Math.max(1, Math.min(5, Math.round(1 + avg * 4)));

  return {
    stars,
    factors: {
      calories: caloriesPct,
      water: waterPct,
      weight: weightPct,
      food: foodPct,
    },
  };
}
