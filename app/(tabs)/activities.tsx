import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Modal,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { getToday, formatDisplayDate, addDays } from '../../utils/dateUtils';
import { calculateExerciseCalories, calculateStepCalories } from '../../utils/activityCalculation';
import { generateId } from '../../utils/generateId';
import { ActivityEntry } from '../../types';
import ProfilePrompt from '../../components/nutrition/ProfilePrompt';

// ─── Drum picker constants ────────────────────────────────────────────────────
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const DRUM_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PAD_COUNT = Math.floor(VISIBLE_ITEMS / 2); // 2

const HOURS = Array.from({ length: 6 }, (_, i) => i);      // 0–5
const MINUTES = Array.from({ length: 60 }, (_, i) => i);   // 0–59

// ─── Styles ──────────────────────────────────────────────────────────────────
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
    // Today pill
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
    // Date nav
    dateNav: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.md,
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
    // Summary card
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      marginBottom: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    summaryCalories: {
      ...Typography.h1,
      color: colors.primary,
    },
    summaryLabel: {
      ...Typography.body,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    // Section card
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      marginBottom: Spacing.md,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
    },
    sectionTitle: {
      ...Typography.h3,
      color: colors.text,
    },
    sectionBody: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
    },
    // Exercise type pills
    pillRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    pill: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    pillSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pillText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    pillTextSelected: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    // Duration drums
    drumSectionLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    drumWrapper: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.lg,
      marginBottom: Spacing.md,
    },
    drumColumn: {
      alignItems: 'center',
    },
    drumLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    drumContainer: {
      width: 90,
      height: DRUM_HEIGHT,
      overflow: 'hidden',
      borderRadius: Radius.md,
      backgroundColor: colors.background,
    },
    drumScroll: { flex: 1 },
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
      ...Typography.h3,
      color: colors.text,
      fontWeight: '700',
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
    // Preview
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: colors.primaryLight,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
    },
    previewText: {
      ...Typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    // Steps / smartwatch input
    stepsInput: {
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.h3,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    // Add button
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    addButtonText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    // Activity list
    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    activityInfo: {
      flex: 1,
    },
    activityName: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '500',
    },
    activityDetail: {
      ...Typography.small,
      color: colors.textSecondary,
      marginTop: 2,
    },
    activityCalories: {
      ...Typography.body,
      color: colors.primary,
      fontWeight: '600',
      marginRight: Spacing.sm,
    },
    activityCaloriesRef: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
      marginRight: Spacing.sm,
    },
    refOnlyLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginRight: Spacing.xs,
    },
    deleteBtn: {
      padding: Spacing.xs,
    },
    emptyText: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.lg,
    },
    promptContainer: { marginTop: Spacing.xl },
    // Warning / info banners
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.xs,
      backgroundColor: colors.dangerLight,
      borderRadius: Radius.sm,
      padding: Spacing.sm,
      marginBottom: Spacing.md,
    },
    warningText: {
      ...Typography.small,
      color: colors.danger,
      flex: 1,
      lineHeight: 17,
    },
    changeModeLinkRow: {
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    changeModeLink: {
      ...Typography.small,
      color: colors.primary,
    },
    activityWarningRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.dangerLight,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    activityWarningText: {
      ...Typography.small,
      color: colors.danger,
      flex: 1,
      lineHeight: 17,
    },
    activityWarningDismiss: {
      padding: Spacing.xs,
      marginLeft: Spacing.xs,
    },
    // iOS date picker modal
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
    iosPicker: { height: 200 },
  });

const MODE_LABELS: Record<string, string> = {
  auto: 'Auto',
  manual: 'Manual',
  smartwatch: 'Smart Watch',
};

export default function ActivitiesScreen() {
  const { entries, preferences, activityLog, dispatch, isLoading } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [exerciseCollapsed, setExerciseCollapsed] = useState(false);
  const [stepsCollapsed, setStepsCollapsed] = useState(false);

  // Exercise form state
  const [selectedHours, setSelectedHours] = useState(0);
  const [selectedMinutes, setSelectedMinutes] = useState(30);

  // Steps form state
  const [stepsInput, setStepsInput] = useState('');

  // Smartwatch form state
  const [smartwatchInput, setSmartwatchInput] = useState('');

  // Drum refs
  const hoursScrollRef = useRef<ScrollView>(null);
  const minutesScrollRef = useRef<ScrollView>(null);

  const today = getToday();
  const isForwardDisabled = selectedDate >= today;

  const activityMode = preferences.activityMode ?? 'auto';

  const goBack = () => setSelectedDate(addDays(selectedDate, -1));
  const goForward = () => {
    const next = addDays(selectedDate, 1);
    if (next <= today) setSelectedDate(next);
  };

  const handleDatePickerChange = (event: DateTimePickerEvent, date?: Date) => {
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

  // Position drums on mount
  useEffect(() => {
    const t = setTimeout(() => {
      hoursScrollRef.current?.scrollTo({ y: selectedHours * ITEM_HEIGHT, animated: false });
      minutesScrollRef.current?.scrollTo({ y: selectedMinutes * ITEM_HEIGHT, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, []);

  // Pre-fill smartwatch input from existing entry for selected date
  useEffect(() => {
    const dayAct = activityLog.find((d) => d.date === selectedDate);
    const existing = dayAct?.activities.find((a) => a.type === 'smartwatch');
    setSmartwatchInput(existing ? String(existing.caloriesBurned) : '');
  }, [selectedDate, activityLog]);

  const handleHoursScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(HOURS.length - 1, index));
    if (clamped !== selectedHours) setSelectedHours(clamped);
  };

  const handleMinutesScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(MINUTES.length - 1, index));
    if (clamped !== selectedMinutes) setSelectedMinutes(clamped);
  };

  const profile = preferences.profile;
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedEntries[0];

  // Activity data for selected date
  const dayActivity = activityLog.find((d) => d.date === selectedDate);
  const totalBurned = dayActivity?.activities.reduce((s, a) => s + a.caloriesBurned, 0) ?? 0;

  // Exercise calorie preview
  const totalDurationMinutes = selectedHours * 60 + selectedMinutes;
  const exercisePreviewCals =
    latestWeight && totalDurationMinutes > 0
      ? calculateExerciseCalories(totalDurationMinutes, latestWeight.weight, latestWeight.unit)
      : 0;

  // Steps calorie preview
  const stepsCount = parseInt(stepsInput, 10);
  const stepsPreviewCals =
    latestWeight && !isNaN(stepsCount) && stepsCount > 0
      ? calculateStepCalories(stepsCount, latestWeight.weight, latestWeight.unit)
      : 0;

  const handleAddExercise = () => {
    if (totalDurationMinutes === 0 || !latestWeight) return;
    const cals = calculateExerciseCalories(totalDurationMinutes, latestWeight.weight, latestWeight.unit);
    const entry: ActivityEntry = {
      id: generateId(),
      type: 'exercise',
      exerciseType: 'weight_lifting',
      durationMinutes: totalDurationMinutes,
      caloriesBurned: cals,
    };
    dispatch({ type: 'ADD_ACTIVITY', date: selectedDate, activity: entry });
    setSelectedHours(0);
    setSelectedMinutes(30);
    setTimeout(() => {
      hoursScrollRef.current?.scrollTo({ y: 0, animated: false });
      minutesScrollRef.current?.scrollTo({ y: 30 * ITEM_HEIGHT, animated: false });
    }, 50);
  };

  const handleAddSteps = () => {
    Keyboard.dismiss();
    if (isNaN(stepsCount) || stepsCount <= 0 || !latestWeight) return;
    const cals = calculateStepCalories(stepsCount, latestWeight.weight, latestWeight.unit);
    const entry: ActivityEntry = {
      id: generateId(),
      type: 'steps',
      steps: stepsCount,
      caloriesBurned: cals,
    };
    dispatch({ type: 'ADD_ACTIVITY', date: selectedDate, activity: entry });
    setStepsInput('');
  };

  const handleSaveSmartwatch = () => {
    Keyboard.dismiss();
    const cals = parseInt(smartwatchInput, 10);
    if (isNaN(cals) || cals < 0) return;

    // Remove any existing smartwatch entry for the day first
    const existingEntry = dayActivity?.activities.find((a) => a.type === 'smartwatch');
    if (existingEntry) {
      dispatch({ type: 'DELETE_ACTIVITY', date: selectedDate, activityId: existingEntry.id });
    }

    if (cals > 0) {
      const entry: ActivityEntry = {
        id: generateId(),
        type: 'smartwatch',
        caloriesBurned: cals,
      };
      dispatch({ type: 'ADD_ACTIVITY', date: selectedDate, activity: entry });
    }
  };

  const handleDelete = (activityId: string) => {
    dispatch({ type: 'DELETE_ACTIVITY', date: selectedDate, activityId });
  };

  const formatDuration = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const getActivityLabel = (activity: ActivityEntry): string => {
    if (activity.type === 'exercise') {
      return activity.exerciseType === 'weight_lifting' ? 'Weight Lifting' : 'Exercise';
    }
    if (activity.type === 'steps') return 'Steps';
    return 'Smart Watch';
  };

  const getActivityDetail = (activity: ActivityEntry): string => {
    if (activity.type === 'exercise' && activity.durationMinutes != null) {
      return formatDuration(activity.durationMinutes);
    }
    if (activity.type === 'steps' && activity.steps != null) {
      return `${activity.steps.toLocaleString()} steps`;
    }
    return 'Calories from wearable';
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile || !latestWeight) {
    return (
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <View style={styles.promptContainer}>
          <ProfilePrompt message="Set up your profile and log a weight entry to start tracking activity calories." />
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
            <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
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

        {/* Auto mode warning */}
        {activityMode === 'auto' && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={14} color={colors.danger} />
            <Text style={styles.warningText}>
              You're in Auto mode — activities logged here are for reference only and won't affect your calorie target.
            </Text>
          </View>
        )}

        {/* Change tracking mode link */}
        <View style={styles.changeModeLinkRow}>
          <TouchableOpacity onPress={() => router.navigate('/(tabs)/settings?focusActivityMode=1')} activeOpacity={0.7}>
            <Text style={styles.changeModeLink}>Change tracking mode →</Text>
          </TouchableOpacity>
        </View>

        {/* Calories burned summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="flame" size={32} color={colors.primary} />
            <Text style={styles.summaryCalories}>{totalBurned.toLocaleString()}</Text>
          </View>
          <Text style={styles.summaryLabel}>calories burned</Text>
        </View>

        {activityMode === 'smartwatch' ? (
          /* Smart Watch Mode: single calorie input */
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Smart Watch Calories</Text>
            </View>
            <View style={styles.sectionBody}>
              <Text style={styles.drumSectionLabel}>
                Enter total calories burned from your smart watch today
              </Text>
              <TextInput
                style={styles.stepsInput}
                value={smartwatchInput}
                onChangeText={setSmartwatchInput}
                keyboardType="number-pad"
                placeholder="e.g. 450"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={[styles.addButton, (!smartwatchInput || parseInt(smartwatchInput, 10) < 0) && { opacity: 0.5 }]}
                onPress={handleSaveSmartwatch}
                disabled={!smartwatchInput || isNaN(parseInt(smartwatchInput, 10))}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Log Exercise section */}
            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setExerciseCollapsed(!exerciseCollapsed)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>Log Exercise</Text>
                <Ionicons
                  name={exerciseCollapsed ? 'chevron-forward' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {!exerciseCollapsed && (
                <View style={styles.sectionBody}>
                  <Text style={styles.drumSectionLabel}>Exercise Type</Text>
                  <View style={styles.pillRow}>
                    <View style={[styles.pill, styles.pillSelected]}>
                      <Text style={styles.pillTextSelected}>Weight Lifting</Text>
                    </View>
                  </View>

                  <Text style={styles.drumSectionLabel}>Duration</Text>
                  <View style={styles.drumWrapper}>
                    {/* Hours drum */}
                    <View style={styles.drumColumn}>
                      <Text style={styles.drumLabel}>Hours</Text>
                      <View style={styles.drumContainer}>
                        <View style={styles.drumHighlight} pointerEvents="none" />
                        <ScrollView
                          ref={hoursScrollRef}
                          style={styles.drumScroll}
                          showsVerticalScrollIndicator={false}
                          snapToInterval={ITEM_HEIGHT}
                          decelerationRate="fast"
                          scrollEventThrottle={16}
                          onMomentumScrollEnd={handleHoursScroll}
                          onScrollEndDrag={handleHoursScroll}
                          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * PAD_COUNT }}
                        >
                          {HOURS.map((h) => (
                            <View key={h} style={styles.drumItem}>
                              <Text style={h === selectedHours ? styles.drumItemTextSelected : styles.drumItemText}>
                                {h}
                              </Text>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    </View>

                    {/* Minutes drum */}
                    <View style={styles.drumColumn}>
                      <Text style={styles.drumLabel}>Minutes</Text>
                      <View style={styles.drumContainer}>
                        <View style={styles.drumHighlight} pointerEvents="none" />
                        <ScrollView
                          ref={minutesScrollRef}
                          style={styles.drumScroll}
                          showsVerticalScrollIndicator={false}
                          snapToInterval={ITEM_HEIGHT}
                          decelerationRate="fast"
                          scrollEventThrottle={16}
                          onMomentumScrollEnd={handleMinutesScroll}
                          onScrollEndDrag={handleMinutesScroll}
                          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * PAD_COUNT }}
                        >
                          {MINUTES.map((m) => (
                            <View key={m} style={styles.drumItem}>
                              <Text style={m === selectedMinutes ? styles.drumItemTextSelected : styles.drumItemText}>
                                {m}
                              </Text>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </View>

                  {exercisePreviewCals > 0 && (
                    <View style={styles.previewRow}>
                      <Ionicons name="flame-outline" size={16} color={colors.primary} />
                      <Text style={styles.previewText}>~{exercisePreviewCals} cal burned</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.addButton, totalDurationMinutes === 0 && { opacity: 0.5 }]}
                    onPress={handleAddExercise}
                    disabled={totalDurationMinutes === 0}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addButtonText}>Add Exercise</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Log Steps section */}
            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setStepsCollapsed(!stepsCollapsed)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>Log Steps</Text>
                <Ionicons
                  name={stepsCollapsed ? 'chevron-forward' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {!stepsCollapsed && (
                <View style={styles.sectionBody}>
                  <TextInput
                    style={styles.stepsInput}
                    value={stepsInput}
                    onChangeText={setStepsInput}
                    keyboardType="number-pad"
                    placeholder="Enter step count"
                    placeholderTextColor={colors.textSecondary}
                  />

                  {stepsPreviewCals > 0 && (
                    <View style={[styles.previewRow, { marginTop: 0 }]}>
                      <Ionicons name="flame-outline" size={16} color={colors.primary} />
                      <Text style={styles.previewText}>~{stepsPreviewCals} cal burned</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.addButton, (isNaN(stepsCount) || stepsCount <= 0) && { opacity: 0.5 }]}
                    onPress={handleAddSteps}
                    disabled={isNaN(stepsCount) || stepsCount <= 0}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addButtonText}>Add Steps</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        {/* Activity list */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activityMode === 'auto' ? "Today's Activities (reference)" : "Today's Activities"}
            </Text>
          </View>

          {!dayActivity || dayActivity.activities.length === 0 ? (
            <Text style={styles.emptyText}>No activities logged</Text>
          ) : (
            dayActivity.activities.map((activity, index) => {
              const showWarning =
                activity.loggedWithMode !== undefined &&
                activity.loggedWithMode !== activityMode &&
                !activity.warningDismissed;
              const isLast = index === dayActivity.activities.length - 1;
              return (
                <View key={activity.id}>
                  <View
                    style={[
                      styles.activityRow,
                      !showWarning && isLast && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityName}>{getActivityLabel(activity)}</Text>
                      <Text style={styles.activityDetail}>{getActivityDetail(activity)}</Text>
                    </View>
                    {activityMode === 'auto' && (
                      <Text style={styles.refOnlyLabel}>ref</Text>
                    )}
                    <Text style={activityMode === 'auto' ? styles.activityCaloriesRef : styles.activityCalories}>
                      {activity.caloriesBurned} cal
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(activity.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                  {showWarning && (
                    <View style={[styles.activityWarningRow, isLast && { borderBottomWidth: 0 }]}>
                      <Text style={styles.activityWarningText}>
                        ⚠ Logged under {MODE_LABELS[activity.loggedWithMode!]} mode — data may no longer be accurate
                      </Text>
                      <TouchableOpacity
                        style={styles.activityWarningDismiss}
                        onPress={() => dispatch({ type: 'DISMISS_ACTIVITY_WARNING', date: selectedDate, activityId: activity.id })}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={14} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Date picker — Android */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          onChange={handleDatePickerChange}
        />
      )}

      {/* Date picker — iOS */}
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
