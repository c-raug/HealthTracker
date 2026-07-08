import { Ionicons } from '@expo/vector-icons';

export interface Achievement {
  id: string;
  category: 'streak' | 'foods';
  threshold: number;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  emoji: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Streak milestones
  { id: 'streak_7', category: 'streak', threshold: 7, icon: 'flame-outline', label: '7-Day Streak', emoji: '🔥' },
  { id: 'streak_30', category: 'streak', threshold: 30, icon: 'flame-outline', label: '30-Day Streak', emoji: '⚡' },
  { id: 'streak_100', category: 'streak', threshold: 100, icon: 'medal-outline', label: '100-Day Streak', emoji: '🏅' },
  { id: 'streak_365', category: 'streak', threshold: 365, icon: 'trophy-outline', label: '365-Day Streak', emoji: '🏆' },
  // Food logged milestones
  { id: 'foods_10', category: 'foods', threshold: 10, icon: 'restaurant-outline', label: '10 Foods Logged', emoji: '🍎' },
  { id: 'foods_50', category: 'foods', threshold: 50, icon: 'restaurant-outline', label: '50 Foods Logged', emoji: '🥗' },
  { id: 'foods_100', category: 'foods', threshold: 100, icon: 'restaurant-outline', label: '100 Foods Logged', emoji: '🍽️' },
  { id: 'foods_500', category: 'foods', threshold: 500, icon: 'star-outline', label: '500 Foods Logged', emoji: '⭐' },
];

/**
 * Returns achievement IDs that are newly unlocked given current state.
 * "Newly unlocked" means the threshold is met but the ID is not yet in unlockedIds.
 */
export function checkNewAchievements(
  unlockedIds: string[],
  longestStreak: number,
  totalFoodsLogged: number,
): string[] {
  return ACHIEVEMENTS.filter((a) => {
    if (unlockedIds.includes(a.id)) return false;
    if (a.category === 'streak') return longestStreak >= a.threshold;
    if (a.category === 'foods') return totalFoodsLogged >= a.threshold;
    return false;
  }).map((a) => a.id);
}
