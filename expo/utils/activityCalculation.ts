import { weightToKg } from './tdeeCalculation';

const WEIGHT_LIFTING_MET = 5.0;

/** Calories burned for weight lifting using MET formula: MET × weight_kg × hours */
export function calculateExerciseCalories(
  durationMinutes: number,
  weightValue: number,
  weightUnit: 'lbs' | 'kg',
): number {
  const weightKg = weightToKg(weightValue, weightUnit);
  return Math.round(WEIGHT_LIFTING_MET * weightKg * (durationMinutes / 60));
}

/** Calories burned from steps: steps × (weight_kg / 70) × 0.04 */
export function calculateStepCalories(
  steps: number,
  weightValue: number,
  weightUnit: 'lbs' | 'kg',
): number {
  const weightKg = weightToKg(weightValue, weightUnit);
  return Math.round(steps * (weightKg / 70) * 0.04);
}
