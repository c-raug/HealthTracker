import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useColors, LightColors, Typography, Spacing } from '../../constants/theme';
import AndroidGlowBackdrop from '../glow/AndroidGlowBackdrop';
import { useApp } from '../../context/AppContext';
import { calculateWaterGoal } from '../../utils/waterCalculation';
import { ageFromDob } from '../../utils/tdeeCalculation';

const WATER_BLUE = '#2196F3';

const BOTTLE_WIDTH = 68;
const BOTTLE_BODY_HEIGHT = 115;
const CAP_WIDTH = 36;
const CAP_HEIGHT = 14;
const NECK_HEIGHT = 8;

const GLOW_BLUE = '#64B5F6';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.sm,
      marginBottom: Spacing.md,
    },
    bottleContainer: {
      alignItems: 'center',
    },
    cap: {
      width: CAP_WIDTH,
      height: CAP_HEIGHT,
      backgroundColor: colors.border,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
    neck: {
      width: CAP_WIDTH + 8,
      height: NECK_HEIGHT,
      backgroundColor: colors.border,
    },
    bottleBody: {
      width: BOTTLE_WIDTH,
      height: BOTTLE_BODY_HEIGHT,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 13,
      overflow: 'hidden',
      backgroundColor: colors.background,
    },
    fill: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    label: {
      ...Typography.small,
      color: colors.textSecondary,
      marginTop: 6,
      textAlign: 'center',
    },
    pctLabel: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pctText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
    },
  });

interface Props {
  date: string;
  onPress: () => void;
}

export default function WaterBottleVisual({ date, onPress }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { preferences, entries, waterLog } = useApp();

  // Get water entries for the selected date
  const dayWater = waterLog?.find((d) => d.date === date);
  const entries_water = dayWater?.entries ?? [];
  const totalConsumed = entries_water.reduce((sum, e) => sum + e.amount, 0);

  // Calculate goal (same logic as WaterTracker)
  const profile = preferences.profile;
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedEntries[0];
  const isImperial = preferences.unit === 'lbs';
  const unit = isImperial ? 'oz' : 'mL';

  const waterGoalMode =
    preferences.waterGoalMode ??
    (preferences.waterGoalOverride !== undefined ? 'manual' : 'auto');

  let waterGoal = 64;
  if (waterGoalMode === 'manual' && preferences.waterGoalOverride !== undefined) {
    waterGoal = preferences.waterGoalOverride;
  } else if (profile && latestWeight) {
    const resolvedAge = profile.dob ? ageFromDob(profile.dob) : (profile.age ?? null);
    if (resolvedAge !== null) {
      waterGoal = calculateWaterGoal(
        latestWeight.weight,
        latestWeight.unit,
        profile.activityLevel,
        preferences.waterCreatineAdjustment,
      );
    }
  }

  const rawPct = waterGoal > 0 ? totalConsumed / waterGoal : 0;
  const pct = Math.min(rawPct, 1);
  const fillHeight = Math.round(pct * BOTTLE_BODY_HEIGHT);
  const pctDisplay = Math.round(rawPct * 100);

  // Animate fill height
  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue: fillHeight,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [fillHeight]);

  const fillColor = WATER_BLUE;

  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.8}>
      <View style={[
        styles.bottleContainer,
        rawPct >= 1 && Platform.OS === 'ios' && {
          shadowColor: GLOW_BLUE,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.85,
          shadowRadius: 10,
          elevation: 10,
        },
      ]}>
        {rawPct >= 1 && (
          <AndroidGlowBackdrop
            color={GLOW_BLUE}
            intensity={1}
            shape="rect"
            size={{ width: BOTTLE_WIDTH, height: CAP_HEIGHT + NECK_HEIGHT + BOTTLE_BODY_HEIGHT }}
            borderRadius={13}
          />
        )}
        <View style={styles.cap} />
        <View style={styles.neck} />
        <View style={styles.bottleBody}>
          <Animated.View
            style={[styles.fill, { height: fillAnim, backgroundColor: WATER_BLUE + '88' }]}
          />
          <View style={styles.pctLabel}>
            <Text style={styles.pctText}>{pctDisplay}%</Text>
          </View>
        </View>
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {Math.round(totalConsumed)}/{waterGoal}{unit}
      </Text>
    </TouchableOpacity>
  );
}
