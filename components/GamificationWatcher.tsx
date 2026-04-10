import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import {
  foodStreak,
  weightStreak,
  activityStreak,
  calorieGoalStreak,
} from '../utils/streakCalculation';
import { checkNewAchievements, ACHIEVEMENTS } from '../utils/achievementCalculation';
import {
  getLevelFromXp,
  getLevelName,
  XP_FOOD,
  XP_FOOD_CAP,
  XP_CALORIE_GOAL,
  XP_WATER_GOAL,
  XP_WEIGHT,
  XP_ACTIVITY,
  XP_STREAK_7,
  XP_STREAK_30,
} from '../utils/xpCalculation';
import { calculateDailyCalories, ageFromDob } from '../utils/tdeeCalculation';
import { calculateWaterGoal } from '../utils/waterCalculation';
import { getToday } from '../utils/dateUtils';

/**
 * Invisible component that lives inside AppProvider + ToastProvider.
 * Watches state reactively to:
 *   1. Check and unlock achievements (silently on first load, with toast afterward)
 *   2. Grant XP for daily actions (capped/guarded via xpLog)
 *   3. Show level-up toast when total XP crosses a level threshold
 */
export default function GamificationWatcher() {
  const { entries, nutritionLog, activityLog, waterLog, preferences, isLoading, dispatch } = useApp();
  const { showToast } = useToast();

  const today = getToday();
  const xpLog = preferences.xpLog ?? {};
  const unlockedAchievements = preferences.unlockedAchievements ?? [];
  const totalXp = preferences.totalXp ?? 0;

  // ── Computed values ─────────────────────────────────────────────────────────

  const profile = preferences.profile;
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedEntries[0];
  const resolvedAge = profile?.dob ? ageFromDob(profile.dob) : (profile?.age ?? null);

  const baseTdee =
    profile && latestWeight && resolvedAge !== null
      ? calculateDailyCalories(
          latestWeight.weight,
          latestWeight.unit,
          profile.heightValue,
          profile.heightUnit,
          resolvedAge,
          profile.sex,
          profile.activityLevel,
          profile.weightGoal,
          preferences.activityMode ?? 'auto',
        )
      : 0;

  const dayActivity = activityLog.find((d) => d.date === today);
  const activityMode = preferences.activityMode ?? 'auto';
  let todayBurned = 0;
  if (activityMode === 'manual') {
    todayBurned = dayActivity?.activities.filter((a) => a.type !== 'smartwatch').reduce((s, a) => s + a.caloriesBurned, 0) ?? 0;
  } else if (activityMode === 'smartwatch') {
    todayBurned = dayActivity?.activities.filter((a) => a.type === 'smartwatch').reduce((s, a) => s + a.caloriesBurned, 0) ?? 0;
  }
  const calorieTarget = baseTdee + todayBurned;

  const todayNutrition = nutritionLog.find((d) => d.date === today);
  const todayFoodCount = todayNutrition
    ? Object.values(todayNutrition.meals).reduce((s, foods) => s + foods.length, 0)
    : 0;
  const todayCalories = todayNutrition
    ? Object.values(todayNutrition.meals).reduce(
        (s, foods) => s + foods.reduce((fs, f) => fs + (f.calories ?? 0), 0),
        0,
      )
    : 0;

  const totalFoodsLogged = nutritionLog.reduce(
    (sum, day) => sum + Object.values(day.meals).reduce((s, foods) => s + foods.length, 0),
    0,
  );

  const waterGoal =
    profile && latestWeight
      ? preferences.waterGoalMode === 'manual' && preferences.waterGoalOverride != null
        ? preferences.waterGoalOverride
        : calculateWaterGoal(
            latestWeight.weight,
            latestWeight.unit,
            profile.activityLevel,
            preferences.waterCreatineAdjustment,
          )
      : 0;

  const todayWaterLog = waterLog.find((d) => d.date === today);
  const todayWater = todayWaterLog
    ? todayWaterLog.entries.reduce((s, e) => s + e.amount, 0)
    : 0;

  // Longest streak across all four streak types (for achievement threshold checks)
  const longestStreak = Math.max(
    foodStreak(nutritionLog).longest,
    weightStreak(entries).longest,
    activityStreak(activityLog).longest,
    calorieGoalStreak(nutritionLog, calorieTarget).longest,
  );

  // ── Achievement unlock watcher ───────────────────────────────────────────────
  const achievementInitializedRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    const currentUnlocked = preferences.unlockedAchievements ?? [];
    const newIds = checkNewAchievements(currentUnlocked, longestStreak, totalFoodsLogged);

    for (const id of newIds) {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', id });
      if (achievementInitializedRef.current) {
        const achievement = ACHIEVEMENTS.find((a) => a.id === id);
        if (achievement) {
          showToast(`Achievement Unlocked: ${achievement.label}`, achievement.emoji);
        }
      }
    }

    achievementInitializedRef.current = true;
  }, [longestStreak, totalFoodsLogged, isLoading]);

  // ── XP — food logging ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    const earned = Math.min(todayFoodCount * XP_FOOD, XP_FOOD_CAP);
    const logged = (preferences.xpLog ?? {})[today]?.food ?? 0;
    const toGrant = earned - logged;
    if (toGrant > 0) {
      dispatch({ type: 'ADD_XP', amount: toGrant, date: today, source: 'food' });
    }
  }, [todayFoodCount, isLoading]);

  // ── XP — calorie goal ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading || calorieTarget <= 0) return;
    if ((preferences.xpLog ?? {})[today]?.calorieGoal) return;
    if (todayCalories > 0 && Math.abs(todayCalories - calorieTarget) <= calorieTarget * 0.1) {
      dispatch({ type: 'ADD_XP', amount: XP_CALORIE_GOAL, date: today, source: 'calorieGoal' });
    }
  }, [todayCalories, calorieTarget, isLoading]);

  // ── XP — water goal ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading || waterGoal <= 0) return;
    if ((preferences.xpLog ?? {})[today]?.waterGoal) return;
    if (todayWater >= waterGoal) {
      dispatch({ type: 'ADD_XP', amount: XP_WATER_GOAL, date: today, source: 'waterGoal' });
    }
  }, [todayWater, isLoading]);

  // ── XP — weight logging ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    if ((preferences.xpLog ?? {})[today]?.weight) return;
    const hasEntry = entries.some((e) => e.date === today);
    if (hasEntry) {
      dispatch({ type: 'ADD_XP', amount: XP_WEIGHT, date: today, source: 'weight' });
    }
  }, [entries, isLoading]);

  // ── XP — activity logging ────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    if ((preferences.xpLog ?? {})[today]?.activity) return;
    const todayAct = activityLog.find((d) => d.date === today);
    if (todayAct && todayAct.activities.length > 0) {
      dispatch({ type: 'ADD_XP', amount: XP_ACTIVITY, date: today, source: 'activity' });
    }
  }, [activityLog, isLoading]);

  // ── XP — streak bonuses (one-time per milestone) ─────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    const grantedIds = preferences.unlockedAchievements ?? [];
    if (longestStreak >= 7 && !grantedIds.includes('xp_streak_7')) {
      dispatch({ type: 'ADD_XP', amount: XP_STREAK_7, date: today, source: 'streak7' });
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', id: 'xp_streak_7' });
    }
    if (longestStreak >= 30 && !grantedIds.includes('xp_streak_30')) {
      dispatch({ type: 'ADD_XP', amount: XP_STREAK_30, date: today, source: 'streak30' });
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', id: 'xp_streak_30' });
    }
  }, [longestStreak, isLoading]);

  // ── Level-up toast ───────────────────────────────────────────────────────────
  const prevXpRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const current = preferences.totalXp ?? 0;
    const prev = prevXpRef.current;
    if (prev !== null && current > prev) {
      const prevLevel = getLevelFromXp(prev);
      const currLevel = getLevelFromXp(current);
      if (currLevel > prevLevel) {
        showToast(`Level Up! You are now ${getLevelName(current)}`, '⬆️');
      }
    }
    prevXpRef.current = current;
  }, [preferences.totalXp, isLoading]);

  return null;
}
