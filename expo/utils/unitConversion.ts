export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10;
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function convertWeight(
  weight: number,
  from: 'lbs' | 'kg',
  to: 'lbs' | 'kg',
): number {
  if (from === to) return weight;
  return from === 'lbs' ? lbsToKg(weight) : kgToLbs(weight);
}
