import { ActivityLevel } from '../types';

/**
 * Calculate recommended daily water intake.
 * Imperial: body weight (lbs) × 0.5 oz/day
 * Metric: body weight (kg) × 35 mL/day
 * Scaled up ×1.2 for Active or Very Active users.
 * Optional creatine adjustment: +16 oz (imperial) or +500 mL (metric).
 */
export function calculateWaterGoal(
  weightValue: number,
  weightUnit: 'lbs' | 'kg',
  activityLevel: ActivityLevel,
  creatine?: boolean,
): number {
  const isActive = activityLevel === 'active' || activityLevel === 'very_active';
  if (weightUnit === 'lbs') {
    const base = weightValue * 0.5;
    const adjusted = isActive ? base * 1.2 : base;
    return Math.round(adjusted + (creatine ? 16 : 0));
  } else {
    const base = weightValue * 35;
    const adjusted = isActive ? base * 1.2 : base;
    return Math.round(adjusted + (creatine ? 500 : 0));
  }
}
