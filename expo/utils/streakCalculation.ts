import { WeightEntry, DayNutrition, DayActivity } from '../types';
import { getToday, addDays } from './dateUtils';

export interface StreakResult {
  current: number;
  longest: number;
}

/**
 * Computes current and longest streak for a set of dates that satisfy a condition.
 * Counts backwards from today (inclusive).
 */
function computeStreak(activeDates: Set<string>): StreakResult {
  const today = getToday();
  let current = 0;
  let date = today;

  // Count current streak backwards from today
  while (activeDates.has(date)) {
    current++;
    date = addDays(date, -1);
  }

  // Find longest streak by scanning all dates
  if (activeDates.size === 0) return { current: 0, longest: 0 };

  const sorted = Array.from(activeDates).sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (addDays(sorted[i - 1], 1) === sorted[i]) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }
  if (current > longest) longest = current;

  return { current, longest };
}

/** Consecutive days with at least 1 food logged */
export function foodStreak(nutritionLog: DayNutrition[]): StreakResult {
  const dates = new Set<string>();
  for (const day of nutritionLog) {
    const totalFoods = Object.values(day.meals).reduce((s, foods) => s + foods.length, 0);
    if (totalFoods > 0) dates.add(day.date);
  }
  return computeStreak(dates);
}

/** Consecutive days within ±10% of calorie target */
export function calorieGoalStreak(
  nutritionLog: DayNutrition[],
  calorieTarget: number | null,
): StreakResult {
  if (!calorieTarget || calorieTarget <= 0) return { current: 0, longest: 0 };
  const dates = new Set<string>();
  for (const day of nutritionLog) {
    const consumed = Object.values(day.meals).reduce(
      (s, foods) => s + foods.reduce((fs, f) => fs + (f.calories ?? 0), 0),
      0,
    );
    if (consumed > 0 && Math.abs(consumed - calorieTarget) <= calorieTarget * 0.1) {
      dates.add(day.date);
    }
  }
  return computeStreak(dates);
}

/** Consecutive days with at least 1 weight entry */
export function weightStreak(entries: WeightEntry[]): StreakResult {
  const dates = new Set<string>();
  for (const e of entries) dates.add(e.date);
  return computeStreak(dates);
}

/** Consecutive days with at least 1 exercise or step log */
export function activityStreak(activityLog: DayActivity[]): StreakResult {
  const dates = new Set<string>();
  for (const day of activityLog) {
    if (day.activities.length > 0) dates.add(day.date);
  }
  return computeStreak(dates);
}
