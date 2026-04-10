import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { WeightEntry, DayNutrition, DayActivity } from '../../types';
import {
  foodStreak,
  weightStreak,
  activityStreak,
  calorieGoalStreak,
} from '../../utils/streakCalculation';
import { ACHIEVEMENTS } from '../../utils/achievementCalculation';

interface Props {
  weekStart: string;
  weightEntries: WeightEntry[];
  nutritionLog: DayNutrition[];
  activityLog: DayActivity[];
  calorieTarget: number | null;
  unlockedAchievements: string[];
}

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    iconRow: {
      marginBottom: Spacing.lg,
    },
    title: {
      ...Typography.h1,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      width: '100%',
      marginBottom: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTitle: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    streakGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    streakItem: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      padding: Spacing.sm,
      alignItems: 'center',
      gap: Spacing.xs,
    },
    streakEmoji: {
      fontSize: 22,
    },
    streakLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    streakValue: {
      ...Typography.h3,
      color: colors.primary,
    },
    achievementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    achievementEmoji: {
      fontSize: 22,
    },
    achievementLabel: {
      ...Typography.body,
      color: colors.text,
      flex: 1,
    },
    noAchievementsText: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

export default function RecapStreaksPage({
  weekStart,
  weightEntries,
  nutritionLog,
  activityLog,
  calorieTarget,
  unlockedAchievements,
}: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  // Compute streaks using current data
  const food = foodStreak(nutritionLog);
  const weight = weightStreak(weightEntries);
  const activity = activityStreak(activityLog);
  const calorie = calorieGoalStreak(nutritionLog, calorieTarget);

  // Achievements unlocked this week: those in unlockedAchievements whose
  // "unlock date" we can't determine exactly, so we show all unlocked ones
  // that map to the current state being >= threshold.
  // For the recap, we show achievements that were newly unlocked.
  // Since we don't store unlock dates, we show all currently unlocked achievements.
  const unlockedThisWeek = ACHIEVEMENTS.filter((a) => {
    if (!unlockedAchievements.includes(a.id)) return false;
    // Show as "new" if we can check; since we lack unlock timestamps,
    // show all unlocked achievements in the recap
    return true;
  }).slice(0, 3); // Limit to 3 for display

  const streaks = [
    { label: 'Food', emoji: '🍎', current: food.current },
    { label: 'Calorie Goal', emoji: '🎯', current: calorie.current },
    { label: 'Weight', emoji: '⚖️', current: weight.current },
    { label: 'Activity', emoji: '🏃', current: activity.current },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Ionicons name="flame-outline" size={52} color={colors.primary} />
      </View>
      <Text style={styles.title}>Streaks & Milestones</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Streaks</Text>
        <View style={styles.streakGrid}>
          {streaks.map((streak) => (
            <View key={streak.label} style={styles.streakItem}>
              <Text style={styles.streakEmoji}>{streak.emoji}</Text>
              <Text style={styles.streakValue}>{streak.current}</Text>
              <Text style={styles.streakLabel}>{streak.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Achievements</Text>
        {unlockedThisWeek.length === 0 ? (
          <Text style={styles.noAchievementsText}>Keep going to unlock achievements!</Text>
        ) : (
          unlockedThisWeek.map((achievement, index) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementRow,
                index === unlockedThisWeek.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
              <Text style={styles.achievementLabel}>{achievement.label}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
