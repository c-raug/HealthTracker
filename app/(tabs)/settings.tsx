import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { calculateDailyCalories, ageFromDob } from '../../utils/tdeeCalculation';
import { ActivityMode } from '../../types';
import ProfileSection from '../../components/settings/ProfileSection';
import GoalsSection from '../../components/settings/GoalsSection';
import MacroSection from '../../components/settings/MacroSection';
import ThemeColorPicker from '../../components/settings/ThemeColorPicker';
import FeedbackSection from '../../components/settings/FeedbackSection';
import { saveBackup } from '../../storage/backupStorage';

const makeStyles = (colors: typeof LightColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: Spacing.md,
  },
  collapsibleCard: {
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
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.small,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLabel: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    ...Typography.small,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: Radius.sm,
    padding: 3,
    gap: 3,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm - 2,
  },
  toggleOptionActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    ...Typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.white,
  },
  footer: {
    ...Typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});

export default function SettingsScreen() {
  const { preferences, entries, nutritionLog, customFoods, savedMeals, activityLog, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);

  const { focusActivityMode } = useLocalSearchParams<{ focusActivityMode?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [goalsSectionY, setGoalsSectionY] = useState(0);

  const [profileExpanded, setProfileExpanded] = useState(true);
  const [goalsExpanded, setGoalsExpanded] = useState(true);
  const [macroExpanded, setMacroExpanded] = useState(true);

  // When deep-linked from Activity page, auto-expand Goals and scroll to it
  useEffect(() => {
    if (focusActivityMode) {
      setGoalsExpanded(true);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: goalsSectionY, animated: true });
      }, 150);
    }
  }, [focusActivityMode, goalsSectionY]);

  const setUnit = (unit: 'lbs' | 'kg') => dispatch({ type: 'SET_UNIT', unit });

  const activityMode: ActivityMode = preferences.activityMode ?? 'auto';
  const setActivityMode = (mode: ActivityMode) => dispatch({ type: 'SET_ACTIVITY_MODE', mode });

  // Compute goalCalories (same pattern as nutrition.tsx)
  const profile = preferences.profile;
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedEntries[0];

  const resolvedAge = profile?.dob
    ? ageFromDob(profile.dob)
    : (profile?.age ?? null);

  const goalCalories: number | null =
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
          activityMode,
        )
      : null;

  // Compute 7-day average activity calories (same filtering logic as nutrition.tsx)
  const last7Dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const avgActivityCalories: number = (() => {
    if (goalCalories === null) return 0;
    const dailyBurned = last7Dates.map((date) => {
      const dayActivity = activityLog.find((d) => d.date === date);
      if (!dayActivity) return 0;
      if (activityMode === 'manual') {
        return dayActivity.activities
          .filter((a) => a.type !== 'smartwatch')
          .reduce((s, a) => s + a.caloriesBurned, 0);
      } else if (activityMode === 'smartwatch') {
        return dayActivity.activities
          .filter((a) => a.type === 'smartwatch')
          .reduce((s, a) => s + a.caloriesBurned, 0);
      }
      return 0; // 'auto' mode — activity already baked into TDEE
    });
    const activeDays = dailyBurned.filter((v) => v > 0);
    return activeDays.length > 0
      ? activeDays.reduce((s, v) => s + v, 0) / activeDays.length
      : 0;
  })();
  const adjustedGoalCalories: number | null =
    goalCalories !== null ? goalCalories + Math.round(avgActivityCalories) : null;
  const activityAdjusted = avgActivityCalories > 0;

  return (
    <ScrollView style={styles.container} ref={scrollRef}>
      {/* 1. Profile — biometrics only */}
      <View style={styles.collapsibleCard}>
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setProfileExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.collapsibleHeaderLeft}>
            <Ionicons
              name={profileExpanded ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.sectionTitle}>Profile</Text>
          </View>
        </TouchableOpacity>
        {profileExpanded && <ProfileSection />}
      </View>

      {/* 2. Goals & Calorie Target */}
      <View style={styles.collapsibleCard} onLayout={(e) => setGoalsSectionY(e.nativeEvent.layout.y)}>
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setGoalsExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.collapsibleHeaderLeft}>
            <Ionicons
              name={goalsExpanded ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.sectionTitle}>Goals &amp; Calorie Target</Text>
          </View>
        </TouchableOpacity>
        {goalsExpanded && (
          <GoalsSection activityMode={activityMode} onActivityModeChange={setActivityMode} />
        )}
      </View>

      {/* 3. Accent Color */}
      <View style={styles.card}>
        <ThemeColorPicker />
      </View>

      {/* 4. Units */}
      <View style={styles.card}>
        <Text style={styles.settingLabel}>Weight Unit</Text>
        <Text style={styles.settingDescription}>
          Applies to new entries and the history chart. Existing entries keep their original unit.
        </Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleOption, preferences.unit === 'lbs' && styles.toggleOptionActive]}
            onPress={() => setUnit('lbs')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, preferences.unit === 'lbs' && styles.toggleTextActive]}>
              lbs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleOption, preferences.unit === 'kg' && styles.toggleOptionActive]}
            onPress={() => setUnit('kg')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, preferences.unit === 'kg' && styles.toggleTextActive]}>
              kg
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Macros — collapsible */}
      <View style={styles.collapsibleCard}>
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setMacroExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.collapsibleHeaderLeft}>
            <Ionicons
              name={macroExpanded ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.sectionTitle}>Macros</Text>
          </View>
        </TouchableOpacity>
        {macroExpanded && (
          <MacroSection goalCalories={adjustedGoalCalories} activityAdjusted={activityAdjusted} />
        )}
      </View>

      {/* 6. Data Backup */}
      <View style={styles.card}>
        <Text style={styles.settingLabel}>Data Backup</Text>
        <Text style={styles.settingDescription}>
          Save all app data to a file that persists across reinstalls.
        </Text>
        <TouchableOpacity
          style={[styles.toggleOption, styles.toggleOptionActive, { paddingVertical: Spacing.sm }]}
          onPress={async () => {
            try {
              await saveBackup({ entries, preferences, nutritionLog, customFoods, savedMeals, activityLog });
              Alert.alert('Success', 'Data saved successfully.');
            } catch {
              Alert.alert('Error', 'Failed to save data.');
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, styles.toggleTextActive]}>Save Data</Text>
        </TouchableOpacity>
      </View>

      {/* 7. Send Feedback */}
      <View style={styles.card}>
        <FeedbackSection />
      </View>

      {/* Footer */}
      <Text style={styles.footer}>HealthTracker v1.0.0</Text>
    </ScrollView>
  );
}
