import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../constants/theme';
import { calculateDailyCalories, ageFromDob } from '../utils/tdeeCalculation';
import {
  foodStreak,
  calorieGoalStreak,
  weightStreak,
  activityStreak,
  StreakResult,
} from '../utils/streakCalculation';
import { ACHIEVEMENTS } from '../utils/achievementCalculation';
import { getLevelProgress, getLevelLabel } from '../utils/xpCalculation';

interface BadgeInfo {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
  streak: StreakResult;
}

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...Typography.h2,
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    scrollContent: {
      padding: Spacing.md,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 5,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionLabel: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: Spacing.sm,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    // ── Level section ────────────────────────────────────────────────────────
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
    levelHint: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
    prestigeBtn: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: 8,
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    prestigeBtnText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '700',
    },
    // ── Badge cards ──────────────────────────────────────────────────────────
    badgeCard: {
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.xs,
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

export default function StatsAchievementsModal() {
  const { entries, nutritionLog, activityLog, preferences, dispatch } = useApp();
  const router = useRouter();
  const colors = useColors();
  const styles = makeStyles(colors);
  const isDark = colors.card === '#2C2C2E';

  // ── Level / XP data ────────────────────────────────────────────────────────
  const totalXp = preferences.totalXp ?? 0;
  const prestige = preferences.prestige ?? 0;
  const { level, name, currentLevelXp, nextLevelXp, isMax } = getLevelProgress(totalXp);
  const numberedLabel = getLevelLabel(totalXp);
  const levelLabel = prestige > 0 ? `P${prestige} · ${numberedLabel}` : numberedLabel;
  const xpProgress = isMax
    ? 1
    : Math.min(1, (totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp));

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

  // ── Streak / Calorie target data ──────────────────────────────────────────
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
    {
      label: 'Calorie Goal',
      icon: 'trophy-outline',
      emoji: '🎯',
      streak: calorieGoalStreak(nutritionLog, calorieTarget),
    },
    {
      label: 'Weight',
      icon: 'scale-outline',
      emoji: '🔥',
      streak: weightStreak(entries),
    },
    {
      label: 'Food',
      icon: 'restaurant-outline',
      emoji: '🔥',
      streak: foodStreak(nutritionLog),
    },
    {
      label: 'Activity',
      icon: 'walk-outline',
      emoji: '🔥',
      streak: activityStreak(activityLog),
    },
  ];

  // ── Achievement data ───────────────────────────────────────────────────────
  const unlockedIds = preferences.unlockedAchievements ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stats & Achievements</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
      >
        {/* ── Level ── */}
        <View style={styles.card}>
          <LinearGradient colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']} style={StyleSheet.absoluteFill} />
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Level</Text>
            <TouchableOpacity
              onPress={() => router.push('/leveling-tutorial-modal')}
              activeOpacity={0.6}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.xpRow}>
            <Text style={styles.levelText}>⭐ {levelLabel}</Text>
            {!isMax && (
              <Text style={styles.xpLabel}>
                {totalXp - currentLevelXp} / {nextLevelXp - currentLevelXp} XP
              </Text>
            )}
          </View>
          {isMax ? (
            <TouchableOpacity
              style={styles.prestigeBtn}
              onPress={handlePrestige}
              activeOpacity={0.8}
            >
              <Text style={styles.prestigeBtnText}>Prestige →</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.xpBarBg}>
                <View
                  style={[
                    styles.xpBarFill,
                    {
                      width: `${Math.round(xpProgress * 100)}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.levelHint}>
                Level {level} → Level {level + 1}
              </Text>
            </>
          )}
        </View>

        {/* ── Badges ── */}
        <View style={styles.card}>
          <LinearGradient colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']} style={StyleSheet.absoluteFill} />
          <Text style={styles.sectionLabel}>Badges</Text>
          {badges.map((b) => (
            <View key={b.label} style={styles.badgeCard}>
              <Text style={styles.badgeIcon}>{b.emoji}</Text>
              <View style={styles.badgeInfo}>
                <Text style={styles.badgeLabel}>{b.label}</Text>
                <Text style={styles.badgeStats}>
                  Current: {b.streak.current} day{b.streak.current !== 1 ? 's' : ''}
                  {'  '}
                  Best: {b.streak.longest} day{b.streak.longest !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Achievements ── */}
        <View style={styles.card}>
          <LinearGradient colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']} style={StyleSheet.absoluteFill} />
          <Text style={styles.sectionLabel}>Achievements</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}
