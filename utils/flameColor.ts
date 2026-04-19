const STOPS = [0, 120, 240, 360, 480, 600];
const COLORS = ['#FFC107', '#FF9800', '#F44336', '#3B82F6', '#9C27B0', '#4CAF50'];

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(v => Math.round(v).toString(16).padStart(2, '0'))
    .join('');
}

export function flameColorForBurn(calories: number): string {
  const clamped = Math.min(Math.max(calories, 0), 600);
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (clamped >= STOPS[i] && clamped <= STOPS[i + 1]) {
      const t = (clamped - STOPS[i]) / (STOPS[i + 1] - STOPS[i]);
      const [r1, g1, b1] = hexToRgb(COLORS[i]);
      const [r2, g2, b2] = hexToRgb(COLORS[i + 1]);
      return rgbToHex(r1 + t * (r2 - r1), g1 + t * (g2 - g1), b1 + t * (b2 - b1));
    }
  }
  return COLORS[COLORS.length - 1];
}

export function glowIntensityForBurn(calories: number): number {
  return Math.min(Math.max(calories, 0), 600) / 600;
}
