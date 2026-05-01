import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../constants/theme';
import { convertWeight } from '../utils/unitConversion';
import { WeightGoal } from '../types';

/** Target weekly rate in lbs for each goal. */
const TARGET_RATE_LBS: Record<WeightGoal, number> = {
  lose_2: -2,
  'lose_1.5': -1.5,
  lose_1: -1,
  'lose_0.5': -0.5,
  maintain: 0,
  'gain_0.5': 0.5,
  gain_1: 1,
  'gain_1.5': 1.5,
  gain_2: 2,
};

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    card: {
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10,
      shadowRadius: 8,
      elevation: 3,
    },
    title: {
      ...Typography.small,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: Spacing.sm,
    },
    placeholder: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    statLabel: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    statValue: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      borderRadius: Radius.md,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      marginTop: Spacing.xs,
    },
    badgeText: {
      ...Typography.small,
      fontWeight: '600',
    },
  });

function dateDiffDays(dateA: string, dateB: string): number {
  const [ayear, amonth, aday] = dateA.split('-').map(Number);
  const [byear, bmonth, bday] = dateB.split('-').map(Number);
  const a = new Date(ayear, amonth - 1, aday).getTime();
  const b = new Date(byear, bmonth - 1, bday).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function addDaysToDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export default function WeightInsights() {
  const { entries, preferences } = useApp();
  const colors = useColors();
  const deviceScheme = useColorScheme();
  const appearanceMode = preferences.appearanceMode ?? 'system';
  const isDark =
    appearanceMode === 'dark' ||
    (appearanceMode === 'system' && (deviceScheme ?? 'light') === 'dark');
  const styles = makeStyles(colors);

  const unit = preferences.unit;
  const weightGoal = preferences.profile?.weightGoal;

  // Find entries within last 7 calendar days
  const today = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();
  const sevenDaysAgo = addDaysToDate(today, -7);

  const recentEntries = [...entries]
    .filter((e) => e.date >= sevenDaysAgo && e.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const gradientColors: [string, string] = isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8'];

  const renderPlaceholder = (msg: string) => (
    <View style={styles.card}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
      <Text style={styles.title}>Progress Insights</Text>
      <Text style={styles.placeholder}>{msg}</Text>
    </View>
  );

  if (!weightGoal) {
    return renderPlaceholder('Set a weight goal in Settings to see progress insights.');
  }

  if (recentEntries.length < 2) {
    return renderPlaceholder('Log more entries to see progress insights.');
  }

  const oldest = recentEntries[0];
  const newest = recentEntries[recentEntries.length - 1];
  const daySpan = dateDiffDays(oldest.date, newest.date);

  if (daySpan < 1) {
    return renderPlaceholder('Log more entries to see progress insights.');
  }

  // Convert both entries to the user's preferred unit
  const oldestWeight = convertWeight(oldest.weight, oldest.unit, unit);
  const newestWeight = convertWeight(newest.weight, newest.unit, unit);
  const totalChange = newestWeight - oldestWeight;

  // Weekly rate in user's unit
  const weeklyRate = (totalChange / daySpan) * 7;

  // Target rate converted to user's unit (lbs → kg if needed)
  const targetRateLbs = TARGET_RATE_LBS[weightGoal];
  const targetRate = unit === 'kg' ? targetRateLbs * 0.453592 : targetRateLbs;

  // Tolerance: 0.25 lbs or 0.1 kg
  const tolerance = unit === 'kg' ? 0.1 : 0.25;

  const diff = weeklyRate - targetRate;
  let status: 'on_track' | 'behind' | 'ahead';
  if (Math.abs(diff) <= tolerance) {
    status = 'on_track';
  } else if (
    // "behind" = not progressing enough toward goal
    (targetRate < 0 && weeklyRate > targetRate + tolerance) || // losing too slow / gaining
    (targetRate > 0 && weeklyRate < targetRate - tolerance) || // gaining too slow / losing
    (targetRate === 0 && Math.abs(weeklyRate) > tolerance)     // maintaining but drifting
  ) {
    status = 'behind';
  } else {
    status = 'ahead';
  }

  const sign = (n: number) => (n > 0 ? '+' : '');
  const fmt = (n: number) => `${sign(n)}${Math.abs(n) < 10 ? n.toFixed(1) : n.toFixed(0)} ${unit}`;

  const badgeConfig = {
    on_track: {
      icon: 'checkmark-circle' as const,
      label: 'On Track',
      bg: colors.primaryLight,
      fg: colors.primary,
    },
    behind: {
      icon: 'warning' as const,
      label: 'Behind',
      bg: colors.dangerLight,
      fg: colors.danger,
    },
    ahead: {
      icon: 'alert-circle' as const,
      label: 'Ahead of Target',
      bg: '#FFF3E0',
      fg: '#E65100',
    },
  };
  const badge = badgeConfig[status];

  return (
    <View style={styles.card}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
      <Text style={styles.title}>Progress Insights (Last 7 Days)</Text>

      <View style={styles.row}>
        <Text style={styles.statLabel}>Weight change</Text>
        <Text style={styles.statValue}>{fmt(totalChange)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.statLabel}>Weekly rate</Text>
        <Text style={styles.statValue}>{fmt(weeklyRate)}/wk</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <Ionicons name={badge.icon} size={14} color={badge.fg} />
        <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.label}</Text>
      </View>
    </View>
  );
}
