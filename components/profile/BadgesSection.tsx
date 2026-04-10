import { useState } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
import { ACHIEVEMENTS } from '../../utils/achievementCalculation';
import { getLevelProgress } from '../../utils/xpCalculation';

interface BadgeInfo {
  label: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
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
    // ── XP / Level section ───────────────────────────────────────────────────
    xpSection: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    xpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    levelText: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '700',
    },
    xpLabel: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    xpBarBg: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    xpBarFill: {
      height: 8,
      borderRadius: 4,
    },
    prestigeBtn: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: 8,
      alignItems: 'center',
    },
    prestigeBtnText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '700',
    },
    // ── Collapsed streak pills ───────────────────────────────────────────────
    collapsedRow: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingBottom: Spacing.sm,
    },
    streakPill: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      paddingVertical: Spacing.xs,
      marginHorizontal: 4,
    },
    pillIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    pillLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
    },
    flameText: {
      fontSize: 14,
    },
    streakCount: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    // ── Expanded content ─────────────────────────────────────────────────────
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
    // ── Achievements grid ────────────────────────────────────────────────────
    achievementsSectionTitle: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    achievementsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    achievementTile: {
      width: '48%',
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      padding: Spacing.sm,
      alignItems: 'center',
      gap: 4,
    },
    achievementTileUnlocked: {
      borderWidth: 1,
      borderColor: colors.primary,
    },
    achievementTileLocked: {
      opacity: 0.5,
    },
    achievementEmoji: {
      fontSize: 24,
    },
    achievementLabel: {
      ...Typography.small,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'center',
    },
    achievementSub: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    lockIcon: {
      position: 'absolute',
      top: Spacing.xs,
      right: Spacing.xs,
    },
  });

export default function BadgesSection() {
  const { entries, nutritionLog, activityLog, preferences, dispatch } = useApp();
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
    { label: 'Calorie Goal', shortLabel: 'Calories', icon: 'trophy-outline', emoji: '🎯', streak: calorieGoalStreak(nutritionLog, calorieTarget) },
    { label: 'Weight', shortLabel: 'Weight', icon: 'scale-outline', emoji: '🔥', streak: weightStreak(entries) },
    { label: 'Food', shortLabel: 'Food', icon: 'restaurant-outline', emoji: '🔥', streak: foodStreak(nutritionLog) },
    { label: 'Activity', shortLabel: 'Activity', icon: 'walk-outline', emoji: '🔥', streak: activityStreak(activityLog) },
  ];

  // ── XP / Level data ────────────────────────────────────────────────────────
  const totalXp = preferences.totalXp ?? 0;
  const prestige = preferences.prestige ?? 0;
  const { level, name, currentLevelXp, nextLevelXp, isMax } = getLevelProgress(totalXp);
  const xpProgress = isMax
    ? 1
    : Math.min(1, (totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp));
  const levelLabel = prestige > 0 ? `P${prestige} · ${name}` : name;

  function handlePrestige() {
    Alert.alert(
      'Prestige',
      `You've reached Legend — the highest level! Prestige resets your XP back to 0 and Level 1, but earns you a prestige badge. Continue your journey as P${prestige + 1}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Prestige',
          style: 'destructive',
          onPress: () => dispatch({ type: 'PRESTIGE' }),
        },
      ],
    );
  }

  // ── Achievement data ───────────────────────────────────────────────────────
  const unlockedIds = preferences.unlockedAchievements ?? [];

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

      {/* XP / Level section — always visible */}
      <View style={styles.xpSection}>
        <View style={styles.xpRow}>
          <Text style={styles.levelText}>⭐ {levelLabel}</Text>
          {!isMax && (
            <Text style={styles.xpLabel}>
              {totalXp - currentLevelXp} / {nextLevelXp - currentLevelXp} XP
            </Text>
          )}
        </View>
        {isMax ? (
          <TouchableOpacity style={styles.prestigeBtn} onPress={handlePrestige} activeOpacity={0.8}>
            <Text style={styles.prestigeBtnText}>Prestige →</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.xpBarBg}>
            <View
              style={[
                styles.xpBarFill,
                { width: `${Math.round(xpProgress * 100)}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        )}
      </View>

      {/* Collapsed: streak pills */}
      {collapsed && (
        <View style={styles.collapsedRow}>
          {badges.map((b) => (
            <View key={b.label} style={styles.streakPill}>
              <Ionicons name={b.icon} size={18} color={colors.textSecondary} />
              <Text style={styles.pillLabel}>{b.shortLabel}</Text>
              <View style={styles.pillIconRow}>
                <Text style={styles.flameText}>{b.emoji}</Text>
                <Text style={styles.streakCount}>{b.streak.current}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Expanded: streak cards + achievements */}
      {!collapsed && (
        <View style={styles.expandedContent}>
          {badges.map((b) => (
            <View key={b.label} style={styles.badgeCard}>
              <Text style={styles.badgeIcon}>{b.emoji}</Text>
              <View style={styles.badgeInfo}>
                <Text style={styles.badgeLabel}>{b.label}</Text>
                <Text style={styles.badgeStats}>
                  Current: {b.streak.current} day{b.streak.current !== 1 ? 's' : ''} {'  '}
                  Best: {b.streak.longest} day{b.streak.longest !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          ))}

          {/* Achievements grid */}
          <Text style={styles.achievementsSectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((a) => {
              const unlocked = unlockedIds.includes(a.id);
              return (
                <View
                  key={a.id}
                  style={[
                    styles.achievementTile,
                    unlocked ? styles.achievementTileUnlocked : styles.achievementTileLocked,
                  ]}
                >
                  {!unlocked && (
                    <View style={styles.lockIcon}>
                      <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={styles.achievementEmoji}>{a.emoji}</Text>
                  <Text style={styles.achievementLabel}>{a.label}</Text>
                  <Text style={styles.achievementSub}>
                    {a.category === 'streak'
                      ? `${a.threshold}-day streak`
                      : `${a.threshold} foods logged`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
