import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { calculateDailyCalories, ageFromDob } from '../../utils/tdeeCalculation';
import { ActivityMode } from '../../types';
import ProfileSection from '../../components/settings/ProfileSection';
import GoalsSection from '../../components/settings/GoalsSection';
import MacroSection from '../../components/settings/MacroSection';
import ThemeColorPicker from '../../components/settings/ThemeColorPicker';
import FeedbackSection, { FeedbackSectionHandle } from '../../components/settings/FeedbackSection';
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
  const [goalsSectionY, setGoalsSectionY] = useState(0);

  const [profileExpanded, setProfileExpanded] = useState(false);
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const [macroExpanded, setMacroExpanded] = useState(false);
  const [waterGoalExpanded, setWaterGoalExpanded] = useState(false);
  const [appConfigExpanded, setAppConfigExpanded] = useState(false);
  const [waterGoalSaved, setWaterGoalSaved] = useState(false);
  const waterGoalSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [waterGoalInput, setWaterGoalInput] = useState(
    preferences.waterGoalOverride !== undefined ? preferences.waterGoalOverride.toString() : '',
  );

  // Reset all sections to collapsed and scroll to top when screen comes back into focus.
  // When focusActivityMode is present, expand Goals & Calorie Target and scroll to it instead.
  // After handling focusActivityMode, clear the param so repeated tab switches don't re-expand.
  useFocusEffect(
    useCallback(() => {
      setProfileExpanded(false);
      setMacroExpanded(false);
      setWaterGoalExpanded(false);
      setAppConfigExpanded(false);
      if (focusActivityMode) {
        setGoalsExpanded(true);
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y: goalsSectionY, animated: true });
        }, 150);
        // Clear the param so subsequent tab-switches don't re-expand Goals
        router.setParams({ focusActivityMode: undefined });
      } else {
        setGoalsExpanded(false);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    // goalsSectionY intentionally excluded: re-running on layout changes would
    // re-expand Goals whenever a sibling section (e.g. Profile) changes height.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusActivityMode]),
  );

  // Backward-compat: if no waterGoalMode but override exists, default to manual
  const waterGoalMode =
    preferences.waterGoalMode ??
    (preferences.waterGoalOverride !== undefined ? 'manual' : 'auto');

  // Clean up waterGoalSaved timer on unmount
  useEffect(() => {
    return () => {
      if (waterGoalSavedTimerRef.current) clearTimeout(waterGoalSavedTimerRef.current);
    };
  }, []);

  // When deep-linked with focusFeedback, scroll to end and focus the feedback input
  useEffect(() => {
    if (focusFeedback) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
      setTimeout(() => {
        feedbackRef.current?.focus();
      }, 350);
    }
  }, [focusFeedback]);

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} ref={scrollRef} keyboardShouldPersistTaps="handled">
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

        {/* 3. Macros — collapsible */}
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

        {/* 4. Daily Water Goal — collapsible */}
        <View style={styles.collapsibleCard}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setWaterGoalExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <Ionicons
                name={waterGoalExpanded ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.sectionTitle}>Daily Water Goal</Text>
            </View>
          </TouchableOpacity>
          {waterGoalExpanded && (
            <View style={{ padding: Spacing.md, paddingTop: 0 }}>
              <Text style={[styles.settingDescription, { marginBottom: Spacing.sm }]}>
                Auto-calculates from your weight and activity level. Switch to Manual to set a custom goal.
              </Text>
              {/* Auto / Manual toggle */}
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

              {/* Auto mode: creatine toggle */}
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

              {/* Manual mode: custom goal input */}
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
          )}
        </View>

        {/* 5. App Configuration */}
        <View style={styles.collapsibleCard}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setAppConfigExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <Ionicons
                name={appConfigExpanded ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.sectionTitle}>App Configuration</Text>
            </View>
          </TouchableOpacity>
          {appConfigExpanded && (
            <View style={{ padding: Spacing.md, paddingTop: 0 }}>
              <Text style={[styles.settingLabel, { marginBottom: Spacing.xs }]}>Default Tab</Text>
              <Text style={[styles.settingDescription, { marginBottom: Spacing.sm }]}>
                Choose which tab opens when you launch the app.
              </Text>
              <View style={styles.toggle}>
                {(['weight', 'nutrition', 'activity'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.toggleOption, (preferences.defaultTab ?? 'nutrition') === tab && styles.toggleOptionActive]}
                    onPress={() => dispatch({ type: 'SET_DEFAULT_TAB', tab })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleText, (preferences.defaultTab ?? 'nutrition') === tab && styles.toggleTextActive]}>
                      {tab === 'weight' ? 'Weight' : tab === 'nutrition' ? 'Nutrition' : 'Activity'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ marginTop: Spacing.md }}>
                <ThemeColorPicker />
              </View>
              <View style={{ marginTop: Spacing.md }}>
                <Text style={[styles.settingLabel, { marginBottom: Spacing.xs }]}>Weight Unit</Text>
                <Text style={[styles.settingDescription, { marginBottom: Spacing.sm }]}>
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
              <View style={{ marginTop: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: Spacing.md }}>
                  <Text style={[styles.settingLabel, { marginBottom: Spacing.xs }]}>Expand sections by default</Text>
                  <Text style={[styles.settingDescription, { marginBottom: 0 }]}>
                    When on, meal categories start expanded on the Nutrition tab.
                  </Text>
                </View>
                <View style={[styles.toggle, { width: 100 }]}>
                  {([false, true] as const).map((val) => (
                    <TouchableOpacity
                      key={String(val)}
                      style={[styles.toggleOption, (preferences.sectionsExpanded ?? false) === val && styles.toggleOptionActive]}
                      onPress={() => dispatch({ type: 'SET_SECTIONS_EXPANDED', enabled: val })}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.toggleText, (preferences.sectionsExpanded ?? false) === val && styles.toggleTextActive]}>
                        {val ? 'On' : 'Off'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
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
                await saveBackup({ entries, preferences, nutritionLog, customFoods, savedMeals, activityLog, waterLog });
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
          <FeedbackSection ref={feedbackRef} onFocusInput={() => {
            setTimeout(() => {
              scrollRef.current?.scrollToEnd({ animated: true });
            }, 150);
          }} />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>HealthTracker v{(require('../../app.json') as { expo: { version: string } }).expo.version}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
