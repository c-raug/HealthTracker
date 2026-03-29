import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { calculateDailyCalories, ageFromDob } from '../../utils/tdeeCalculation';
import {
  foodStreak,
  calorieGoalStreak,
  weightStreak,
  activityStreak,
  StreakResult,
} from '../../utils/streakCalculation';

interface BadgeInfo {
  label: string;
  streak: StreakResult;
}

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      marginBottom: Spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    sectionTitle: {
      ...Typography.h3,
      color: colors.text,
    },
    collapsedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    streakPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    flameText: {
      fontSize: 14,
    },
    streakCount: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    expandedContent: {
      padding: Spacing.md,
      paddingTop: 0,
      gap: Spacing.sm,
    },
    badgeCard: {
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    badgeIcon: {
      fontSize: 28,
    },
    badgeInfo: {
      flex: 1,
    },
    badgeLabel: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: 2,
    },
    badgeStats: {
      ...Typography.small,
      color: colors.textSecondary,
    },
  });

export default function BadgesSection() {
  const { entries, nutritionLog, activityLog, preferences } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [collapsed, setCollapsed] = useState(true);

  const profile = preferences.profile;
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedEntries[0];
  const resolvedAge = profile?.dob ? ageFromDob(profile.dob) : (profile?.age ?? null);
  const calorieTarget =
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
      : null;

  const badges: BadgeInfo[] = [
    { label: 'Food', streak: foodStreak(nutritionLog) },
    { label: 'Calorie Goal', streak: calorieGoalStreak(nutritionLog, calorieTarget) },
    { label: 'Weight', streak: weightStreak(entries) },
    { label: 'Activity', streak: activityStreak(activityLog) },
  ];

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name={collapsed ? 'chevron-forward' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
          <Text style={styles.sectionTitle}>Badges</Text>
        </View>
      </TouchableOpacity>

      {collapsed && (
        <View style={styles.collapsedRow}>
          {badges.map((b) => (
            <View key={b.label} style={styles.streakPill}>
              <Text style={styles.flameText}>{'\uD83D\uDD25'}</Text>
              <Text style={styles.streakCount}>{b.streak.current}</Text>
            </View>
          ))}
        </View>
      )}

      {!collapsed && (
        <View style={styles.expandedContent}>
          {badges.map((b) => (
            <View key={b.label} style={styles.badgeCard}>
              <Text style={styles.badgeIcon}>{'\uD83D\uDD25'}</Text>
              <View style={styles.badgeInfo}>
                <Text style={styles.badgeLabel}>{b.label}</Text>
                <Text style={styles.badgeStats}>
                  Current: {b.streak.current} day{b.streak.current !== 1 ? 's' : ''} {'  '}
                  Best: {b.streak.longest} day{b.streak.longest !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
