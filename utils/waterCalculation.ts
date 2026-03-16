import { ActivityLevel } from '../types';

/**
 * Calculate recommended daily water intake.
 * Imperial: body weight (lbs) × 0.5 oz/day
 * Metric: body weight (kg) × 35 mL/day
 * Scaled up ×1.2 for Active or Very Active users.
 */
export function calculateWaterGoal(
  weightValue: number,
  weightUnit: 'lbs' | 'kg',
  activityLevel: ActivityLevel,
): number {
  const isActive = activityLevel === 'active' || activityLevel === 'very_active';
  if (weightUnit === 'lbs') {
    const base = weightValue * 0.5;
    return Math.round(isActive ? base * 1.2 : base);
  } else {
    const base = weightValue * 35;
    return Math.round(isActive ? base * 1.2 : base);
  }
}
