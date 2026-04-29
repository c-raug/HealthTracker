import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { getToday, formatDisplayDate, addDays } from '../../utils/dateUtils';
import { calculateDailyCalories, ageFromDob } from '../../utils/tdeeCalculation';
import { convertWeight } from '../../utils/unitConversion';
import { MealCategory } from '../../types';
import { PILL_TOTAL_HEIGHT } from '../../components/navigation/PillTabBar';
import ProfileCard from '../../components/profile/ProfileCard';
import CalorieRing from '../../components/nutrition/CalorieRing';
import WaterBottleVisual from '../../components/nutrition/WaterBottleVisual';
import CalorieFlame from '../../components/activities/CalorieFlame';
import DigitalScale from '../../components/weight/DigitalScale';

const MEAL_CATEGORIES: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    content: { padding: Spacing.md },

    dateNav: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.sm,
    },
    arrowBtn: { padding: Spacing.sm },
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
    calendarIcon: { marginLeft: Spacing.xs },

    // Grid cards
    gridCard: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 5,
      overflow: 'hidden',
    },
    cardLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xs,
    },
    nutritionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
    },
    bottomRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    halfCard: {
      flex: 1,
      minHeight: 160,
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 5,
      overflow: 'hidden',
      alignItems: 'center',
    },
    flameContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: Spacing.sm,
    },
    scaleContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: Spacing.lg,
    },

    // iOS date picker modal
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
    iosPicker: { height: 200 },
  });

export default function HomeScreen() {
  const { entries, preferences, nutritionLog, activityLog, isLoading, selectedDate, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const systemScheme = useColorScheme();
  const resolvedScheme: 'light' | 'dark' =
    preferences.appearanceMode === 'light' ? 'light' :
    preferences.appearanceMode === 'dark' ? 'dark' :
    (systemScheme ?? 'light');
  const isDark = resolvedScheme === 'dark';

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [waterExpandKey, setWaterExpandKey] = useState(0);

  const today = getToday();
  const isForwardDisabled = selectedDate >= today;

  const goBack = () => dispatch({ type: 'SET_SELECTED_DATE', date: addDays(selectedDate, -1) });
  const goForward = () => {
    const next = addDays(selectedDate, 1);
    if (next <= today) dispatch({ type: 'SET_SELECTED_DATE', date: next });
  };

  const handleDatePickerChange = (event: DateTimePickerEvent, date?: Date) => {
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

  // Calorie computations (same as nutrition.tsx)
  const profile = preferences.profile;
  const activityMode = preferences.activityMode ?? 'manual';
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedEntries[0];
  const resolvedAge = profile?.dob ? ageFromDob(profile.dob) : (profile?.age ?? null);

  let baseTdee = 0;
  if (profile && latestWeight && resolvedAge !== null) {
    baseTdee = calculateDailyCalories(
      latestWeight.weight, latestWeight.unit,
      profile.heightValue, profile.heightUnit,
      resolvedAge, profile.sex, profile.activityLevel, profile.weightGoal, activityMode,
    );
  }

  const dayActivity = activityLog.find((d) => d.date === selectedDate);
  let caloriesBurned = 0;
  if (activityMode === 'manual') {
    caloriesBurned = dayActivity?.activities.filter((a) => a.type !== 'smartwatch').reduce((s, a) => s + a.caloriesBurned, 0) ?? 0;
  } else if (activityMode === 'smartwatch') {
    caloriesBurned = dayActivity?.activities.filter((a) => a.type === 'smartwatch').reduce((s, a) => s + a.caloriesBurned, 0) ?? 0;
  }
  const calorieTarget = baseTdee + caloriesBurned;

  const dayNutrition = nutritionLog.find((d) => d.date === selectedDate);
  const meals = dayNutrition?.meals ?? { breakfast: [], lunch: [], dinner: [], snacks: [] };
  const consumed = MEAL_CATEGORIES.reduce((total, cat) =>
    total + meals[cat].reduce((sum, food) => sum + (food.calories ?? 0), 0), 0);

  // Total burned for flame (all activity entries for the date)
  const totalBurned = dayActivity?.activities.reduce((sum, a) => sum + a.caloriesBurned, 0) ?? 0;

  // Latest weight entry at or before selectedDate
  const latestEntryForDate = sortedEntries.find((e) => e.date <= selectedDate);

  if (isLoading) {
    return (
      <View style={[styles.flex, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={[styles.content, { paddingBottom: PILL_TOTAL_HEIGHT + insets.bottom + Spacing.md }]} keyboardShouldPersistTaps="handled">
      {/* Date navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={goBack} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateCenter} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
          <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} style={styles.calendarIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goForward} style={styles.arrowBtn} disabled={isForwardDisabled}>
          <Ionicons name="chevron-forward" size={22} color={isForwardDisabled ? colors.border : colors.primary} />
        </TouchableOpacity>
        {selectedDate !== today && (
          <TouchableOpacity onPress={() => dispatch({ type: 'SET_SELECTED_DATE', date: today })} style={styles.arrowBtn}>
            <Ionicons name="play-skip-forward-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Profile card */}
      <ProfileCard />

      {/* Nutrition card — full width */}
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => router.push('/(tabs)/nutrition')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.cardLabel}>NUTRITION</Text>
        <View style={styles.nutritionContent}>
          <CalorieRing consumed={consumed} target={calorieTarget} />
          <WaterBottleVisual date={selectedDate} onPress={() => setWaterExpandKey((k) => k + 1)} />
        </View>
      </TouchableOpacity>

      {/* Bottom row: Activity + Weight */}
      <View style={styles.bottomRow}>
        {/* Activity card */}
        <TouchableOpacity
          style={styles.halfCard}
          onPress={() => router.push('/(tabs)/activities')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.cardLabel}>ACTIVITY</Text>
          <View style={styles.flameContent}>
            <CalorieFlame totalBurned={totalBurned} size={120} />
          </View>
        </TouchableOpacity>

        {/* Weight card */}
        <TouchableOpacity
          style={styles.halfCard}
          onPress={() => router.push('/(tabs)/')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.cardLabel}>WEIGHT</Text>
          <View style={styles.scaleContent}>
            <DigitalScale
              weight={latestEntryForDate ? String(convertWeight(latestEntryForDate.weight, latestEntryForDate.unit, preferences.unit)) : ''}
              unit={preferences.unit}
              animateToValue={null}
              size={100}
              hideUnit={true}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Date picker — Android renders inline, iOS uses a modal */}
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
        <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
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
                themeVariant={resolvedScheme}
              />
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}
