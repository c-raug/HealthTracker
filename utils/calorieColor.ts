/**
 * Returns a hex color based on how close consumed calories are to the target goal.
 * Returns the fallback color when no valid target is set.
 *
 * Thresholds (absolute delta from goal):
 *   ≤ 25 cal  → dark green
 *   ≤ 50 cal  → green
 *   ≤ 100 cal → yellow
 *   ≤ 200 cal → orange
 *   > 200 cal → red
 */
export function ringColorForProximity(consumed: number, target: number, fallback: string): string {
  if (target <= 0) return fallback;
  const delta = Math.abs(consumed - target);
  if (delta <= 25) return '#2E7D32';
  if (delta <= 50) return '#4CAF50';
  if (delta <= 100) return '#FFC107';
  if (delta <= 200) return '#FF9800';
  return '#F44336';
}
