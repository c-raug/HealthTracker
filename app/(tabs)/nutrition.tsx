import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { getToday, formatDisplayDate, addDays } from '../../utils/dateUtils';
import { calculateDailyCalories, ageFromDob } from '../../utils/tdeeCalculation';
import { MealCategory, MacroSplit } from '../../types';
import ProfilePrompt from '../../components/nutrition/ProfilePrompt';
import CalorieRing from '../../components/nutrition/CalorieRing';
import MacroProgressBars from '../../components/nutrition/MacroProgressBars';
import MealCategoryComponent from '../../components/nutrition/MealCategory';
import WaterTracker from '../../components/nutrition/WaterTracker';

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
    exerciseBurnedLabel: {
      ...Typography.small,
      color: colors.primary,
      textAlign: 'center',
      marginTop: -Spacing.sm,
      marginBottom: Spacing.md,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.3)',
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
  const { entries, preferences, nutritionLog, activityLog, isLoading } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const profile = preferences.profile;

  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const today = getToday();
  const isForwardDisabled = selectedDate >= today;

  const goBack = () => setSelectedDate(addDays(selectedDate, -1));
  const goForward = () => {
    const next = addDays(selectedDate, 1);
    if (next <= today) setSelectedDate(next);
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
      if (newDate <= today) setSelectedDate(newDate);
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
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Today pill */}
        {selectedDate !== today && (
          <TouchableOpacity style={styles.todayPill} onPress={() => setSelectedDate(today)} activeOpacity={0.7}>
            <Text style={styles.todayPillText}>Today</Text>
          </TouchableOpacity>
        )}

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
            <CalorieRing consumed={consumed} target={calorieTarget} />
            {caloriesBurned > 0 && (
              <Text style={styles.exerciseBurnedLabel}>
                +{caloriesBurned} cal from {activityMode === 'smartwatch' ? 'smart watch' : 'exercise'}
              </Text>
            )}
            <MacroProgressBars
              consumed={consumedMacros}
              goalCalories={calorieTarget}
              macroSplit={macroSplit}
            />
            <WaterTracker date={selectedDate} />
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
