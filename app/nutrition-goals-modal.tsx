import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../constants/theme';
import { calculateDailyCalories, ageFromDob } from '../utils/tdeeCalculation';
import { ActivityMode } from '../types';
import GoalsSection from '../components/settings/GoalsSection';
import MacroSection from '../components/settings/MacroSection';

const makeStyles = (colors: typeof LightColors) => StyleSheet.create({
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
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    ...Typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.white,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: Spacing.md,
    marginHorizontal: Spacing.md,
  },
});

export default function NutritionGoalsModal() {
  const { preferences, entries, activityLog, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [waterGoalSaved, setWaterGoalSaved] = useState(false);
  const waterGoalSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [waterGoalInput, setWaterGoalInput] = useState(
    preferences.waterGoalOverride !== undefined ? preferences.waterGoalOverride.toString() : '',
  );

  useEffect(() => {
    return () => {
      if (waterGoalSavedTimerRef.current) clearTimeout(waterGoalSavedTimerRef.current);
    };
  }, []);

  const waterGoalMode =
    preferences.waterGoalMode ??
    (preferences.waterGoalOverride !== undefined ? 'manual' : 'auto');

  const activityMode: ActivityMode = preferences.activityMode ?? 'auto';

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
      return 0;
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition Goals</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollContent} ref={scrollRef} keyboardShouldPersistTaps="handled">
          {/* Goals & Calorie Target */}
          <View style={styles.card}>
            <GoalsSection />
          </View>

          {/* Macros */}
          <View style={styles.card}>
            <MacroSection goalCalories={adjustedGoalCalories} activityAdjusted={activityAdjusted} />
          </View>

          {/* Daily Water Goal */}
          <View style={styles.card}>
            <View style={{ padding: Spacing.md }}>
              <Text style={[styles.settingLabel, { marginBottom: Spacing.xs }]}>Daily Water Goal</Text>
              <Text style={[styles.settingDescription, { marginBottom: Spacing.sm }]}>
                Auto-calculates from your weight and activity level. Switch to Manual to set a custom goal.
              </Text>
              <View style={styles.toggle}>
                {(['auto', 'manual'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.toggleOption, waterGoalMode === mode && styles.toggleOptionActive]}
                    onPress={() => dispatch({ type: 'SET_WATER_GOAL_MODE', mode })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleText, waterGoalMode === mode && styles.toggleTextActive]}>
                      {mode === 'auto' ? 'Auto' : 'Manual'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {waterGoalMode === 'auto' && (
                <View style={{ marginTop: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: Spacing.md }}>
                    <Text style={[styles.settingLabel, { marginBottom: Spacing.xs }]}>Creatine Adjustment</Text>
                    <Text style={[styles.settingDescription, { marginBottom: 0 }]}>
                      Adds +{preferences.unit === 'lbs' ? '16 oz' : '500 mL'} to your daily goal.
                    </Text>
                  </View>
                  <View style={[styles.toggle, { width: 100 }]}>
                    {([false, true] as const).map((val) => (
                      <TouchableOpacity
                        key={String(val)}
                        style={[styles.toggleOption, (preferences.waterCreatineAdjustment ?? false) === val && styles.toggleOptionActive]}
                        onPress={() => dispatch({ type: 'SET_WATER_CREATINE', enabled: val })}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.toggleText, (preferences.waterCreatineAdjustment ?? false) === val && styles.toggleTextActive]}>
                          {val ? 'On' : 'Off'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {waterGoalMode === 'manual' && (
                <View style={{ marginTop: Spacing.md, flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
                  <TextInput
                    style={[styles.toggleOption, {
                      flex: 1,
                      backgroundColor: colors.background,
                      borderRadius: Radius.sm,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      ...Typography.body,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }]}
                    value={waterGoalInput}
                    onChangeText={setWaterGoalInput}
                    placeholder={`e.g. ${preferences.unit === 'lbs' ? '100' : '3000'} ${preferences.unit === 'lbs' ? 'oz' : 'mL'}`}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)}
                  />
                  <TouchableOpacity
                    style={[styles.toggleOption, styles.toggleOptionActive, { paddingHorizontal: Spacing.md }, waterGoalSaved && { backgroundColor: '#2E7D32' }]}
                    onPress={() => {
                      const val = parseInt(waterGoalInput, 10);
                      if (waterGoalInput.trim() === '') {
                        dispatch({ type: 'SET_WATER_GOAL_OVERRIDE', amount: undefined });
                        setWaterGoalSaved(true);
                        if (waterGoalSavedTimerRef.current) clearTimeout(waterGoalSavedTimerRef.current);
                        waterGoalSavedTimerRef.current = setTimeout(() => setWaterGoalSaved(false), 1200);
                      } else if (!isNaN(val) && val > 0) {
                        dispatch({ type: 'SET_WATER_GOAL_OVERRIDE', amount: val });
                        setWaterGoalSaved(true);
                        if (waterGoalSavedTimerRef.current) clearTimeout(waterGoalSavedTimerRef.current);
                        waterGoalSavedTimerRef.current = setTimeout(() => setWaterGoalSaved(false), 1200);
                      } else {
                        Alert.alert('Invalid', 'Please enter a positive number.');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleText, styles.toggleTextActive]}>{waterGoalSaved ? 'Saved!' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
