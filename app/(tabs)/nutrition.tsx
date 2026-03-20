import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';
import { useFocusEffect } from 'expo-router';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { getToday, formatDisplayDate, addDays } from '../../utils/dateUtils';
import { calculateDailyCalories, ageFromDob } from '../../utils/tdeeCalculation';
import { calculateWaterGoal } from '../../utils/waterCalculation';
import { MealCategory, MacroSplit } from '../../types';
import ProfilePrompt from '../../components/nutrition/ProfilePrompt';
import CalorieRing from '../../components/nutrition/CalorieRing';
import MacroProgressBars from '../../components/nutrition/MacroProgressBars';
import MealCategoryComponent from '../../components/nutrition/MealCategory';
import WaterTracker from '../../components/nutrition/WaterTracker';
import WaterBottleVisual from '../../components/nutrition/WaterBottleVisual';
import WeeklyIntakeGraph from '../../components/nutrition/WeeklyIntakeGraph';

const MEAL_CATEGORIES: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    content: { padding: Spacing.md },
    todayPill: {
      alignSelf: 'center',
      backgroundColor: colors.primaryLight,
      borderRadius: Radius.md,
      paddingVertical: 4,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.xs,
    },
    todayPillText: {
      ...Typography.small,
      color: colors.primary,
      fontWeight: '600',
    },
    dateNav: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.md,
    },
    arrowBtn: {
      padding: Spacing.sm,
    },
    dateCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
    },
    dateText: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '500',
      textAlign: 'center',
    },
    calendarIcon: {
      marginLeft: Spacing.xs,
    },
    promptContainer: {
      marginTop: Spacing.xl,
    },
    ringRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    exerciseBurnedLabel: {
      ...Typography.small,
      color: colors.primary,
      textAlign: 'center',
      marginTop: -Spacing.sm,
      marginBottom: Spacing.md,
    },
    pagerContainer: {
      overflow: 'hidden',
    },
    pageDots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      marginTop: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.primary,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    pickerSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      paddingBottom: Spacing.xl,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerDone: {
      ...Typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    iosPicker: {
      height: 200,
    },
  });

export default function NutritionScreen() {
  const { entries, preferences, nutritionLog, activityLog, waterLog, isLoading, selectedDate, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const profile = preferences.profile;
  const { width: windowWidth } = useWindowDimensions();
  const pagerWidth = windowWidth - Spacing.md * 2;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [waterExpandKey, setWaterExpandKey] = useState(0);
  const [sectionKey, setSectionKey] = useState(0);
  const [activePagerPage, setActivePagerPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const pagerScrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      setSectionKey((k) => k + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      pagerScrollRef.current?.scrollTo({ x: 0, animated: false });
      setActivePagerPage(0);
    }, []),
  );

  const today = getToday();
  const isForwardDisabled = selectedDate >= today;

  const goBack = () => dispatch({ type: 'SET_SELECTED_DATE', date: addDays(selectedDate, -1) });
  const goForward = () => {
    const next = addDays(selectedDate, 1);
    if (next <= today) dispatch({ type: 'SET_SELECTED_DATE', date: next });
  };

  const handleDatePickerChange = (
    event: DateTimePickerEvent,
    date?: Date,
  ) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const newDate = `${y}-${m}-${d}`;
      if (newDate <= today) dispatch({ type: 'SET_SELECTED_DATE', date: newDate });
    }
  };

  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  const maximumDate = new Date(todayYear, todayMonth - 1, todayDay);
  const [selYear, selMonth, selDay] = selectedDate.split('-').map(Number);
  const pickerValue = new Date(selYear, selMonth - 1, selDay);

  // Get day's nutrition data
  const dayNutrition = nutritionLog.find((d) => d.date === selectedDate);
  const meals = dayNutrition?.meals ?? {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  };

  // Calculate consumed calories and macros
  const consumed = MEAL_CATEGORIES.reduce((total, cat) => {
    return total + meals[cat].reduce((sum, food) => sum + (food.calories ?? 0), 0);
  }, 0);

  const consumedMacros = MEAL_CATEGORIES.reduce(
    (totals, cat) => {
      meals[cat].forEach((food) => {
        totals.protein += food.protein ?? 0;
        totals.carbs += food.carbs ?? 0;
        totals.fat += food.fat ?? 0;
      });
      return totals;
    },
    { protein: 0, carbs: 0, fat: 0 },
  );

  const macroSplit: MacroSplit = preferences.macroSplit ?? { protein: 30, carbs: 40, fat: 30 };

  // Get latest weight for TDEE
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedEntries[0];

  const activityMode = preferences.activityMode ?? 'manual';

  // Calculate calorie target
  const resolvedAge = profile?.dob
    ? ageFromDob(profile.dob)
    : (profile?.age ?? null);

  let baseTdee = 0;
  if (profile && latestWeight && resolvedAge !== null) {
    baseTdee = calculateDailyCalories(
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

  // Add calories burned from activities for the selected date (mode-aware)
  const dayActivity = activityLog.find((d) => d.date === selectedDate);
  let caloriesBurned = 0;
  if (activityMode === 'manual') {
    caloriesBurned = dayActivity?.activities
      .filter((a) => a.type !== 'smartwatch')
      .reduce((s, a) => s + a.caloriesBurned, 0) ?? 0;
  } else if (activityMode === 'smartwatch') {
    caloriesBurned = dayActivity?.activities
      .filter((a) => a.type === 'smartwatch')
      .reduce((s, a) => s + a.caloriesBurned, 0) ?? 0;
  }
  // auto: caloriesBurned stays 0 — TDEE already includes activity level

  const calorieTarget = baseTdee + caloriesBurned;

  // Compute 7-day weekly data for the graph (oldest → newest), ending on selectedDate
  const last7Days = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, -(6 - i)));

  const weeklyCalorieData = last7Days.map((date) => {
    const dayNut = nutritionLog.find((d) => d.date === date);
    const consumed = dayNut
      ? MEAL_CATEGORIES.reduce(
          (sum, cat) => sum + (dayNut.meals[cat]?.reduce((s, f) => s + (f.calories ?? 0), 0) ?? 0),
          0,
        )
      : 0;
    const dayAct = activityLog.find((d) => d.date === date);
    let dayBurned = 0;
    if (activityMode === 'manual') {
      dayBurned = dayAct?.activities.filter((a) => a.type !== 'smartwatch').reduce((s, a) => s + a.caloriesBurned, 0) ?? 0;
    } else if (activityMode === 'smartwatch') {
      dayBurned = dayAct?.activities.filter((a) => a.type === 'smartwatch').reduce((s, a) => s + a.caloriesBurned, 0) ?? 0;
    }
    return { date, consumed, goal: baseTdee + dayBurned };
  });

  // Activity-adjusted calorie goal for the graph dashed line:
  // average caloriesBurned across days in the 7-day window that had activity (exclude zero-activity days)
  const activityDaysInWindow = last7Days
    .map((date) => {
      const dayAct = activityLog.find((d) => d.date === date);
      if (!dayAct) return 0;
      if (activityMode === 'manual') {
        return dayAct.activities.filter((a) => a.type !== 'smartwatch').reduce((s, a) => s + a.caloriesBurned, 0);
      } else if (activityMode === 'smartwatch') {
        return dayAct.activities.filter((a) => a.type === 'smartwatch').reduce((s, a) => s + a.caloriesBurned, 0);
      }
      return 0;
    })
    .filter((burned) => burned > 0);
  const avgActivityCalories = activityDaysInWindow.length > 0
    ? activityDaysInWindow.reduce((s, v) => s + v, 0) / activityDaysInWindow.length
    : 0;
  const adjustedCalorieGoal = baseTdee > 0 ? baseTdee + Math.round(avgActivityCalories) : null;

  const waterGoalValue = (() => {
    if (preferences.waterGoalMode === 'manual' || (!preferences.waterGoalMode && preferences.waterGoalOverride !== undefined)) {
      return preferences.waterGoalOverride ?? 0;
    }
    if (latestWeight && profile) {
      return calculateWaterGoal(
        latestWeight.weight,
        latestWeight.unit,
        profile.activityLevel,
        preferences.waterCreatineAdjustment,
      );
    }
    return 0;
  })();

  const weeklyWaterData = last7Days.map((date) => {
    const dayWater = waterLog.find((d) => d.date === date);
    const consumed = dayWater ? dayWater.entries.reduce((s, e) => s + e.amount, 0) : 0;
    return { date, consumed, goal: waterGoalValue };
  });

  const waterUnit = preferences.unit === 'lbs' ? 'oz' : 'mL';

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <NestableScrollContainer
        ref={scrollRef as any}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={goBack} style={styles.arrowBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateCenter}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateText}>
              {formatDisplayDate(selectedDate)}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.textSecondary}
              style={styles.calendarIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goForward}
            style={styles.arrowBtn}
            disabled={isForwardDisabled}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={isForwardDisabled ? colors.border : colors.primary}
            />
          </TouchableOpacity>
          {selectedDate !== today && (
            <TouchableOpacity
              onPress={() => dispatch({ type: 'SET_SELECTED_DATE', date: today })}
              style={styles.arrowBtn}
            >
              <Ionicons name="play-skip-forward-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Conditionally show content */}
        {!profile ? (
          <View style={styles.promptContainer}>
            <ProfilePrompt message="Set up your profile in Settings to calculate your daily calorie target." />
          </View>
        ) : !latestWeight ? (
          <View style={styles.promptContainer}>
            <ProfilePrompt message="Log your first weight entry on the Weight tab to calculate your TDEE." />
          </View>
        ) : (
          <>
            {/* Swipeable pager: Page 1 = ring+bottle, Page 2 = weekly graph */}
            <View style={styles.pagerContainer}>
              <ScrollView
                ref={pagerScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={32}
                onMomentumScrollEnd={(e) => {
                  const page = Math.round(e.nativeEvent.contentOffset.x / pagerWidth);
                  setActivePagerPage(page);
                }}
              >
                {/* Page 1: Calorie ring + water bottle */}
                <View style={{ width: pagerWidth }}>
                  <View style={styles.ringRow}>
                    <CalorieRing consumed={consumed} target={calorieTarget} />
                    <WaterBottleVisual date={selectedDate} onPress={() => setWaterExpandKey((k) => k + 1)} />
                  </View>
                  {caloriesBurned > 0 && (
                    <Text style={styles.exerciseBurnedLabel}>
                      +{caloriesBurned} cal from {activityMode === 'smartwatch' ? 'smart watch' : 'exercise'}
                    </Text>
                  )}
                </View>

                {/* Page 2: Weekly intake graph */}
                <View style={{ width: pagerWidth }}>
                  <WeeklyIntakeGraph
                    width={pagerWidth}
                    calorieData={weeklyCalorieData}
                    waterData={weeklyWaterData}
                    waterUnit={waterUnit}
                    calorieGoal={adjustedCalorieGoal}
                    waterGoal={waterGoalValue > 0 ? waterGoalValue : null}
                  />
                </View>
              </ScrollView>

              {/* Page dot indicators */}
              <View style={styles.pageDots}>
                <View style={[styles.dot, activePagerPage === 0 && styles.dotActive]} />
                <View style={[styles.dot, activePagerPage === 1 && styles.dotActive]} />
              </View>
            </View>
            <MacroProgressBars
              consumed={consumedMacros}
              goalCalories={calorieTarget}
              macroSplit={macroSplit}
            />
            <WaterTracker
              key={`water-${sectionKey}`}
              date={selectedDate}
              expandKey={waterExpandKey}
              onFocusInput={() => {
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
              }}
            />
            {MEAL_CATEGORIES.map((cat) => (
              <MealCategoryComponent
                key={cat}
                category={cat}
                foods={meals[cat]}
                date={selectedDate}
              />
            ))}
          </>
        )}
      </NestableScrollContainer>

      {/* Date picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          onChange={handleDatePickerChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerValue}
                mode="date"
                display="spinner"
                maximumDate={maximumDate}
                onChange={handleDatePickerChange}
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
