import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { calculateDailyCalories, ageFromDob } from '../../utils/tdeeCalculation';
import { ActivityMode } from '../../types';
import ProfileCard from '../../components/profile/ProfileCard';
import BadgesSection from '../../components/profile/BadgesSection';
import GoalsSection from '../../components/settings/GoalsSection';
import MacroSection from '../../components/settings/MacroSection';
import FeedbackSection, { FeedbackSectionHandle } from '../../components/settings/FeedbackSection';

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
    ...Typography.h3,
    color: colors.text,
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
  navRow: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  navRowText: {
    ...Typography.h3,
    color: colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  footer: {
    ...Typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});

export default function SettingsScreen() {
  const { preferences, entries, nutritionLog, customFoods, savedMeals, activityLog, waterLog, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);

  const { focusActivityMode, focusFeedback } = useLocalSearchParams<{ focusActivityMode?: string; focusFeedback?: string }>();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const feedbackRef = useRef<FeedbackSectionHandle>(null);
  const [nutritionGoalsSectionY, setNutritionGoalsSectionY] = useState(0);
  const [feedbackSectionY, setFeedbackSectionY] = useState(0);

  const [nutritionGoalsExpanded, setNutritionGoalsExpanded] = useState(false);
  const [waterGoalSaved, setWaterGoalSaved] = useState(false);
  const waterGoalSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [waterGoalInput, setWaterGoalInput] = useState(
    preferences.waterGoalOverride !== undefined ? preferences.waterGoalOverride.toString() : '',
  );

  useFocusEffect(
    useCallback(() => {
      setNutritionGoalsExpanded(false);
      if (focusActivityMode) {
        setNutritionGoalsExpanded(true);
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y: nutritionGoalsSectionY, animated: true });
        }, 150);
        router.setParams({ focusActivityMode: undefined });
      } else {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusActivityMode]),
  );

  // Backward-compat: if no waterGoalMode but override exists, default to manual
  const waterGoalMode =
    preferences.waterGoalMode ??
    (preferences.waterGoalOverride !== undefined ? 'manual' : 'auto');

  useEffect(() => {
    return () => {
      if (waterGoalSavedTimerRef.current) clearTimeout(waterGoalSavedTimerRef.current);
    };
  }, []);

  // When deep-linked with focusFeedback, scroll to and focus the feedback section inline
  useEffect(() => {
    if (focusFeedback) {
      router.setParams({ focusFeedback: undefined });
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: feedbackSectionY, animated: true });
      }, 150);
      setTimeout(() => {
        feedbackRef.current?.focus();
      }, 350);
    }
  }, [focusFeedback]);

  const activityMode: ActivityMode = preferences.activityMode ?? 'auto';
  const setActivityMode = (mode: ActivityMode) => dispatch({ type: 'SET_ACTIVITY_MODE', mode });

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} ref={scrollRef} keyboardShouldPersistTaps="handled">
        {/* 1. Profile Card — always visible, tappable to edit */}
        <ProfileCard />

        {/* 2. Badges — collapsible */}
        <BadgesSection />

        {/* 3. Nutrition Goals — merged Goals, Macros, Water Goal */}
        <View
          style={styles.collapsibleCard}
          onLayout={(e) => setNutritionGoalsSectionY(e.nativeEvent.layout.y)}
        >
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setNutritionGoalsExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <Ionicons
                name={nutritionGoalsExpanded ? 'chevron-down' : 'chevron-forward'}
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.sectionTitle}>Nutrition Goals</Text>
            </View>
          </TouchableOpacity>
          {nutritionGoalsExpanded && (
            <View>
              {/* Goals & Calorie Target */}
              <GoalsSection activityMode={activityMode} onActivityModeChange={setActivityMode} />

              {/* Divider */}
              <View style={styles.divider} />

              {/* Macros */}
              <MacroSection goalCalories={adjustedGoalCalories} activityAdjusted={activityAdjusted} />

              {/* Divider */}
              <View style={styles.divider} />

              {/* Daily Water Goal */}
              <View style={{ padding: Spacing.md, paddingTop: 0 }}>
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
          )}
        </View>

        {/* 4. Appearance → tappable row → appearance-modal */}
        <TouchableOpacity
          style={styles.navRow}
          onPress={() => router.push('/appearance-modal')}
          activeOpacity={0.7}
        >
          <Text style={styles.navRowText}>Appearance</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* 5. App Settings → sub-screen */}
        <TouchableOpacity
          style={styles.navRow}
          onPress={() => router.push('/app-settings-modal')}
          activeOpacity={0.7}
        >
          <Text style={styles.navRowText}>App Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* 6. Send Feedback */}
        <View
          style={styles.collapsibleCard}
          onLayout={(e) => setFeedbackSectionY(e.nativeEvent.layout.y)}
        >
          <View style={{ padding: Spacing.md }}>
            <FeedbackSection ref={feedbackRef} onFocusInput={() => {
              setTimeout(() => {
                scrollRef.current?.scrollTo({ y: feedbackSectionY, animated: true });
              }, 150);
            }} />
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>HealthTracker v{(require('../../app.json') as { expo: { version: string } }).expo.version}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
