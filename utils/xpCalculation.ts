// XP amounts per action
export const XP_FOOD = 5;          // per food entry, capped at 25/day
export const XP_FOOD_CAP = 25;     // daily food XP cap
export const XP_CALORIE_GOAL = 20; // hit daily calorie goal ±10%
export const XP_WATER_GOAL = 15;   // hit daily water goal
export const XP_WEIGHT = 10;       // log weight
export const XP_ACTIVITY = 10;     // log any activity
export const XP_STREAK_7 = 50;     // 7-day streak bonus
export const XP_STREAK_30 = 200;   // 30-day streak bonus

// Level thresholds: XP needed to reach each level (index = level - 1)
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000];

export const LEVEL_NAMES = [
  'Novice',
  'Apprentice',
  'Journeyman',
  'Dedicated',
  'Committed',
  'Veteran',
  'Elite',
  'Expert',
  'Master',
  'Legend',
];

/** Returns the level (1–10) for a given total XP. */
export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

/** Returns the level name for a given total XP. */
export function getLevelName(totalXp: number): string {
  return LEVEL_NAMES[getLevelFromXp(totalXp) - 1];
}

/**
 * Returns XP progress info toward the next level.
 * At max level (10), returns { current: totalXp, next: LEVEL_THRESHOLDS[9], isMax: true }.
 */
export function getLevelProgress(totalXp: number): {
  level: number;
  name: string;
  currentLevelXp: number;
  nextLevelXp: number;
  isMax: boolean;
} {
  const level = getLevelFromXp(totalXp);
  const isMax = level === 10;
  const currentLevelXp = LEVEL_THRESHOLDS[level - 1];
  const nextLevelXp = isMax ? LEVEL_THRESHOLDS[9] : LEVEL_THRESHOLDS[level];
  return {
    level,
    name: LEVEL_NAMES[level - 1],
    currentLevelXp,
    nextLevelXp,
    isMax,
  };
}
