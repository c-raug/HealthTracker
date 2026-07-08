import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { ActivityLevel, WeightGoal } from '../../types';
import InfoModal from '../InfoModal';

const ACTIVITY_LABELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightly_active', label: 'Lightly Active' },
  { value: 'moderately_active', label: 'Moderately Active' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

const ACTIVITY_INFO: Record<ActivityLevel, string> = {
  sedentary: 'Little or no exercise; mostly desk work or minimal daily movement. Calorie multiplier: ×1.2',
  lightly_active: 'Light exercise 1–3 days/week, e.g. walking, light gym sessions. Calorie multiplier: ×1.375',
  moderately_active: 'Moderate exercise 3–5 days/week, e.g. jogging, cycling, gym. Calorie multiplier: ×1.55',
  active: 'Hard exercise 6–7 days/week or a physically demanding job. Calorie multiplier: ×1.725',
  very_active: 'Very hard exercise daily or twice a day; athlete-level training. Calorie multiplier: ×1.9',
};

// ─── Weight goal drum constants ───────────────────────────────────────────────
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 3;
const DRUM_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PAD_COUNT = Math.floor(VISIBLE_ITEMS / 2); // 1

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    card: {
      padding: Spacing.md,
    },
    inputLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    optionGrid: {
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    optionBtn: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },
    optionBtnActive: {
      backgroundColor: colors.primary,
    },
    optionText: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    optionTextActive: {
      color: colors.white,
    },
    infoIcon: {
      padding: Spacing.xs,
    },
    // Weight goal drum picker
    drumWrapper: {
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    drumContainer: {
      width: 220,
      height: DRUM_HEIGHT,
      overflow: 'hidden',
      borderRadius: Radius.md,
      backgroundColor: colors.background,
    },
    drumHighlight: {
      position: 'absolute',
      top: ITEM_HEIGHT * PAD_COUNT,
      left: 0,
      right: 0,
      height: ITEM_HEIGHT,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
      borderRadius: Radius.sm,
    },
    drumItem: {
      height: ITEM_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    drumItemText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    drumItemTextSelected: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '700',
    },
  });

export default function GoalsSection() {
  const { preferences, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);

  const profile = preferences.profile;
  const isImperial = preferences.unit === 'lbs';
  const activityMode = preferences.activityMode ?? 'auto';
  const activityLevelActive = activityMode === 'auto';

  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile?.activityLevel ?? 'moderately_active',
  );
  const [weightGoal, setWeightGoal] = useState<WeightGoal>(
    profile?.weightGoal ?? 'maintain',
  );
  const [infoModal, setInfoModal] = useState<{ title: string; description: string } | null>(null);

  const goalScrollRef = useRef<ScrollView>(null);

  const GOAL_LABELS: { value: WeightGoal; label: string }[] = isImperial
    ? [
        { value: 'lose_2', label: 'Lose 2 lb/wk' },
        { value: 'lose_1.5', label: 'Lose 1.5 lb/wk' },
        { value: 'lose_1', label: 'Lose 1 lb/wk' },
        { value: 'lose_0.5', label: 'Lose 0.5 lb/wk' },
        { value: 'maintain', label: 'Maintain' },
        { value: 'gain_0.5', label: 'Gain 0.5 lb/wk' },
        { value: 'gain_1', label: 'Gain 1 lb/wk' },
        { value: 'gain_1.5', label: 'Gain 1.5 lb/wk' },
        { value: 'gain_2', label: 'Gain 2 lb/wk' },
      ]
    : [
        { value: 'lose_2', label: 'Lose 0.9 kg/wk' },
        { value: 'lose_1.5', label: 'Lose 0.7 kg/wk' },
        { value: 'lose_1', label: 'Lose 0.5 kg/wk' },
        { value: 'lose_0.5', label: 'Lose 0.25 kg/wk' },
        { value: 'maintain', label: 'Maintain' },
        { value: 'gain_0.5', label: 'Gain 0.25 kg/wk' },
        { value: 'gain_1', label: 'Gain 0.5 kg/wk' },
        { value: 'gain_1.5', label: 'Gain 0.7 kg/wk' },
        { value: 'gain_2', label: 'Gain 0.9 kg/wk' },
      ];

  const patchProfile = (overrides: Partial<{ activityLevel: ActivityLevel; weightGoal: WeightGoal }>) => {
    if (!profile) return;
    dispatch({
      type: 'SET_PROFILE',
      profile: {
        ...profile,
        ...overrides,
      },
    });
  };

  const handleActivityChange = (val: ActivityLevel) => {
    if (!activityLevelActive) return;
    setActivityLevel(val);
    patchProfile({ activityLevel: val });
  };

  const handleGoalChange = (val: WeightGoal) => {
    setWeightGoal(val);
    patchProfile({ weightGoal: val });
  };

  const handleGoalScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(GOAL_LABELS.length - 1, index));
    const goal = GOAL_LABELS[clamped];
    if (goal && goal.value !== weightGoal) {
      handleGoalChange(goal.value);
    }
  };

  // Scroll to current goal on mount
  useEffect(() => {
    const index = GOAL_LABELS.findIndex((g) => g.value === weightGoal);
    const t = setTimeout(() => {
      goalScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
    }, 50);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.card}>
      {/* Weight Goal */}
      <Text style={styles.inputLabel}>Weight Goal</Text>
      <View style={styles.drumWrapper}>
        <View style={styles.drumContainer}>
          <View style={styles.drumHighlight} pointerEvents="none" />
          <ScrollView
            ref={goalScrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            scrollEventThrottle={16}
            nestedScrollEnabled={true}
            onMomentumScrollEnd={handleGoalScroll}
            onScrollEndDrag={handleGoalScroll}
            contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * PAD_COUNT }}
          >
            {GOAL_LABELS.map((item) => (
              <View key={item.value} style={styles.drumItem}>
                <Text
                  style={
                    weightGoal === item.value
                      ? styles.drumItemTextSelected
                      : styles.drumItemText
                  }
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Activity Level — only shown in Auto mode */}
      {activityLevelActive && (
        <>
          <Text style={styles.inputLabel}>Activity Level</Text>
          <View style={styles.optionGrid}>
            {ACTIVITY_LABELS.map((item) => (
              <View key={item.value} style={styles.optionRow}>
                <TouchableOpacity
                  style={[styles.optionBtn, activityLevel === item.value && styles.optionBtnActive]}
                  onPress={() => handleActivityChange(item.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionText, activityLevel === item.value && styles.optionTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setInfoModal({ title: item.label, description: ACTIVITY_INFO[item.value] })}
                  style={styles.infoIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}

      <InfoModal
        visible={infoModal !== null}
        title={infoModal?.title ?? ''}
        description={infoModal?.description ?? ''}
        onClose={() => setInfoModal(null)}
      />
    </View>
  );
}
