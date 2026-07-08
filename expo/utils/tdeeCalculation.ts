import { Sex, ActivityLevel, WeightGoal, ActivityMode } from '../types';

/** Mifflin-St Jeor BMR calculation. Weight in kg, height in cm. */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function getActivityMultiplier(level: ActivityLevel): number {
  switch (level) {
    case 'sedentary':
      return 1.2;
    case 'lightly_active':
      return 1.375;
    case 'moderately_active':
      return 1.55;
    case 'active':
      return 1.725;
    case 'very_active':
      return 1.9;
  }
}

export function getGoalCalories(tdee: number, goal: WeightGoal): number {
  switch (goal) {
    case 'lose_2':
      return Math.round(tdee - 1000);
    case 'lose_1.5':
      return Math.round(tdee - 750);
    case 'lose_1':
      return Math.round(tdee - 500);
    case 'lose_0.5':
      return Math.round(tdee - 250);
    case 'maintain':
      return Math.round(tdee);
    case 'gain_0.5':
      return Math.round(tdee + 250);
    case 'gain_1':
      return Math.round(tdee + 500);
    case 'gain_1.5':
      return Math.round(tdee + 750);
    case 'gain_2':
      return Math.round(tdee + 1000);
  }
}

/** Convert height value to cm based on unit. */
export function heightToCm(value: number, unit: 'in' | 'cm'): number {
  return unit === 'cm' ? value : value * 2.54;
}

/** Convert weight to kg for TDEE calculation. */
export function weightToKg(weight: number, unit: 'lbs' | 'kg'): number {
  return unit === 'kg' ? weight : weight * 0.453592;
}

/** Compute age from a date-of-birth string "YYYY-MM-DD". */
export function ageFromDob(dob: string): number {
  const [y, m, d] = dob.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

/** Calculate daily calorie goal from profile and current weight.
 *
 * activityMode controls which multiplier is used:
 *   'auto'       — uses the provided activityLevel (user's chosen level baked into TDEE)
 *   'manual'     — always uses sedentary (×1.2); user logs all activity separately
 *   'smartwatch' — always uses sedentary (×1.2); smartwatch calories added separately
 */
export function calculateDailyCalories(
  weightValue: number,
  weightUnit: 'lbs' | 'kg',
  heightValue: number,
  heightUnit: 'in' | 'cm',
  age: number,
  sex: Sex,
  activityLevel: ActivityLevel,
  weightGoal: WeightGoal,
  activityMode: ActivityMode = 'manual',
): number {
  const weightKg = weightToKg(weightValue, weightUnit);
  const heightCm = heightToCm(heightValue, heightUnit);
  const bmr = calculateBMR(weightKg, heightCm, age, sex);
  const effectiveLevel: ActivityLevel = activityMode === 'auto' ? activityLevel : 'sedentary';
  const tdee = bmr * getActivityMultiplier(effectiveLevel);
  return getGoalCalories(tdee, weightGoal);
}
