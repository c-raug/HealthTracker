import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../constants/theme';
import { getToday, getISOWeekString, getISOWeekMonday, addDays } from '../utils/dateUtils';
import { calculateDailyCalories, ageFromDob } from '../utils/tdeeCalculation';
import { calculateWeeklyRating } from '../utils/weeklyRatingCalculation';
import RecapWeightPage from '../components/recap/RecapWeightPage';
import RecapNutritionPage from '../components/recap/RecapNutritionPage';
import RecapStreaksPage from '../components/recap/RecapStreaksPage';
import RecapRatingPage from '../components/recap/RecapRatingPage';

const PAGE_COUNT = 4;

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xs,
    },
    progressBar: {
      flexDirection: 'row',
      gap: Spacing.xs,
      flex: 1,
      marginRight: Spacing.sm,
    },
    progressSegment: {
      flex: 1,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.border,
    },
    progressSegmentFilled: {
      backgroundColor: colors.primary,
    },
    closeButton: {
      padding: Spacing.xs,
    },
    pageArea: {
      flex: 1,
    },
    tapZones: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
    },
    tapLeft: {
      flex: 1,
    },
    tapRight: {
      flex: 1,
    },
    footer: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.lg,
    },
    nextButton: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    nextButtonText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    weekLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
  });

export default function WeeklyRecapModal() {
  const router = useRouter();
  const colors = useColors();
  const styles = makeStyles(colors);
  const { entries, preferences, nutritionLog, waterLog, activityLog, dispatch } = useApp();

  const [currentPage, setCurrentPage] = useState(0);

  // The recap covers the previous week (7 days ending yesterday)
  const today = getToday();
  const weekEnd = addDays(today, -1);
  const weekStart = getISOWeekMonday(weekEnd);

  // Mark recap as shown for current ISO week when modal opens
  useEffect(() => {
    const currentWeek = getISOWeekString(today);
    if (preferences.lastRecapShownWeek !== currentWeek) {
      dispatch({ type: 'SET_LAST_RECAP_WEEK', week: currentWeek });
    }
  }, []);

  // Compute calorie target from profile
  const profile = preferences.profile;
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );
  const latestWeight = sortedEntries[0];
  const activityMode = preferences.activityMode ?? 'auto';

  const resolvedAge = profile?.dob
    ? ageFromDob(profile.dob)
    : (profile?.age ?? null);

  let calorieTarget: number | null = null;
  if (profile && latestWeight && resolvedAge !== null) {
    calorieTarget = calculateDailyCalories(
      latestWeight.weight,
      latestWeight.unit,
      profile.heightValue,
      profile.heightUnit,
      resolvedAge,
      profile.sex,
      profile.activityLevel,
      profile.weightGoal,
      activityMode,
    );
  }

  // Compute weekly rating
  const ratingResult = useMemo(
    () =>
      calculateWeeklyRating(
        weekStart,
        entries,
        nutritionLog,
        waterLog,
        preferences,
        calorieTarget,
      ),
    [weekStart, entries, nutritionLog, waterLog, preferences, calorieTarget],
  );

  const handleClose = () => {
    router.back();
  };

  const handleAdvance = () => {
    if (currentPage < PAGE_COUNT - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const weekLabel = (() => {
    const [sy, sm, sd] = weekStart.split('-').map(Number);
    const [ey, em, ed] = addDays(weekStart, 6).split('-').map(Number);
    const startDate = new Date(sy, sm - 1, sd);
    const endDate = new Date(ey, em - 1, ed);
    const fmtOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', fmtOpts)} – ${endDate.toLocaleDateString('en-US', fmtOpts)}`;
  })();

  const isLastPage = currentPage === PAGE_COUNT - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header: progress bar + close */}
      <View style={styles.header}>
        <View style={styles.progressBar}>
          {Array.from({ length: PAGE_COUNT }, (_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                i <= currentPage && styles.progressSegmentFilled,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Page content */}
      <View style={styles.pageArea}>
        {currentPage === 0 && (
          <RecapWeightPage weekStart={weekStart} weightEntries={entries} />
        )}
        {currentPage === 1 && (
          <RecapNutritionPage
            weekStart={weekStart}
            nutritionLog={nutritionLog}
            calorieTarget={calorieTarget}
          />
        )}
        {currentPage === 2 && (
          <RecapStreaksPage
            weekStart={weekStart}
            weightEntries={entries}
            nutritionLog={nutritionLog}
            activityLog={activityLog}
            calorieTarget={calorieTarget}
            unlockedAchievements={preferences.unlockedAchievements ?? []}
          />
        )}
        {currentPage === 3 && <RecapRatingPage result={ratingResult} />}

        {/* Invisible tap zones: left half = go back, right half = advance */}
        <View style={styles.tapZones} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.tapLeft}
            onPress={handleBack}
            activeOpacity={1}
          />
          <TouchableOpacity
            style={styles.tapRight}
            onPress={handleAdvance}
            activeOpacity={1}
          />
        </View>
      </View>

      {/* Footer: week label + next/done button */}
      <View style={styles.footer}>
        <Text style={styles.weekLabel}>{weekLabel}</Text>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleAdvance}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLastPage ? 'Done' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
