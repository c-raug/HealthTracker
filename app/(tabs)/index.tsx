import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
  Animated,
  Modal,
  ActivityIndicator,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CollapsibleTabHeader, { COLLAPSIBLE_HEADER_HEIGHT } from '../../components/navigation/CollapsibleTabHeader';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { getToday, formatDisplayDate, addDays } from '../../utils/dateUtils';
import { convertWeight } from '../../utils/unitConversion';
import WeightChart from '../../components/WeightChart';
import WeightInsights from '../../components/WeightInsights';
import DigitalScale from '../../components/weight/DigitalScale';
import { WeightEntry } from '../../types';
import { generateId } from '../../utils/generateId';
import { PILL_TOTAL_HEIGHT } from '../../components/navigation/PillTabBar';


const makeStyles = (colors: typeof LightColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.md, paddingTop: Spacing.md },

  // Today pill
  todayPill: {
    alignSelf: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: Radius.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  todayPillText: {
    ...Typography.small,
    color: colors.primary,
    fontWeight: '600',
  },

  // Date navigation
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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

  // Pager
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
  scalePage: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Log Weight card (smartwatch-style)
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

  // Weight input row (side-by-side)
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    width: 90,
  },
  saveButtonText: {
    ...Typography.body,
    color: colors.white,
    fontWeight: '600',
  },

  // Saved confirmation message
  savedMessage: {
    ...Typography.small,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontStyle: 'italic',
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
  iosPicker: {
    height: 200,
  },
});

export default function WeightScreen() {
  const { entries, preferences, dispatch, isLoading, selectedDate } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();
  const systemScheme = useColorScheme();
  const resolvedScheme: 'light' | 'dark' = preferences.appearanceMode === 'light' ? 'light' : preferences.appearanceMode === 'dark' ? 'dark' : (systemScheme ?? 'light');
  const { width: windowWidth } = useWindowDimensions();
  const pagerWidth = windowWidth - Spacing.md * 2;

  const isDark = resolvedScheme === 'dark';
  const scrollY = useRef(new Animated.Value(0)).current;

  const [weightInput, setWeightInput] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [animateToValue, setAnimateToValue] = useState<number | null>(null);
  const [activePagerPage, setActivePagerPage] = useState(0);
  const [chartHeight, setChartHeight] = useState(280);

  const pagerScrollRef = useRef<ScrollView>(null);

  const today = getToday();
  const existingEntry = entries.find((e) => e.date === selectedDate);
  const isForwardDisabled = selectedDate >= today;

  useFocusEffect(
    useCallback(() => {
      pagerScrollRef.current?.scrollTo({ x: 0, animated: false });
      setActivePagerPage(0);
    }, []),
  );

  // Reset animation only on date change (not on save, which also updates entries)
  useEffect(() => {
    setAnimateToValue(null);
  }, [selectedDate]);

  // Pre-fill input when date or entries change
  useEffect(() => {
    if (existingEntry) {
      const val = convertWeight(
        existingEntry.weight,
        existingEntry.unit,
        preferences.unit,
      );
      setWeightInput(String(val));
    } else {
      setWeightInput('');
    }
  }, [selectedDate, entries]);

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

  const handleSave = () => {
    const parsed = parseFloat(weightInput);
    if (!weightInput || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }

    const minWeight = preferences.unit === 'lbs' ? 50 : 20;
    const maxWeight = preferences.unit === 'lbs' ? 1000 : 500;
    if (parsed < minWeight || parsed > maxWeight) {
      Alert.alert(
        'Invalid Weight',
        `Weight must be between ${minWeight} and ${maxWeight} ${preferences.unit}.`,
      );
      return;
    }

    const entry: WeightEntry = {
      id: existingEntry ? existingEntry.id : generateId(),
      date: selectedDate,
      weight: parsed,
      unit: preferences.unit,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'UPSERT_ENTRY', entry });
    Keyboard.dismiss();
    setAnimateToValue(parsed);

    const now = new Date();
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const datePart = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const timePart = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setSavedMessage(`Weight saved on ${datePart} at ${timePart}`);
    setTimeout(() => setSavedMessage(null), 3500);
  };

  // Build maximumDate from today string to avoid UTC offset issues
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  const maximumDate = new Date(todayYear, todayMonth - 1, todayDay);

  // Build the picker value from selectedDate
  const [selYear, selMonth, selDay] = selectedDate.split('-').map(Number);
  const pickerValue = new Date(selYear, selMonth - 1, selDay);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <CollapsibleTabHeader title="Weight" scrollY={scrollY} />

      {/* Header region blur — blurs content that scrolls behind the header */}
      <BlurView
        intensity={12}
        tint={isDark ? 'dark' : 'light'}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Math.round((insets.top + COLLAPSIBLE_HEADER_HEIGHT) / 2), zIndex: 5, overflow: 'hidden' }}
        pointerEvents="none"
      />
      {/* Footer region blur — blurs content that scrolls behind the tab bar */}
      <BlurView
        intensity={12}
        tint={isDark ? 'dark' : 'light'}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: Math.round((PILL_TOTAL_HEIGHT + insets.bottom) / 2), zIndex: 5, overflow: 'hidden' }}
        pointerEvents="none"
      />

      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + COLLAPSIBLE_HEADER_HEIGHT, paddingBottom: PILL_TOTAL_HEIGHT + insets.bottom + Spacing.md }]}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Date navigation bar */}
        <View style={styles.dateNav}>
          <LinearGradient
            colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']}
            style={StyleSheet.absoluteFill}
          />
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

        {/* Swipeable pager: Page 0 = scale, Page 1 = weight chart */}
        <View style={styles.pagerContainer}>
          <ScrollView
            ref={pagerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={32}
            contentOffset={{ x: 0, y: 0 }}
            onMomentumScrollEnd={(e) => {
              const page = Math.round(e.nativeEvent.contentOffset.x / pagerWidth);
              setActivePagerPage(page);
            }}
          >
            {/* Page 0: Digital scale */}
            <View style={[styles.scalePage, { width: pagerWidth, height: chartHeight }]}>
              <DigitalScale
                weight={existingEntry ? String(convertWeight(existingEntry.weight, existingEntry.unit, preferences.unit)) : ''}
                unit={preferences.unit}
                animateToValue={animateToValue}
                size={Math.round(chartHeight * 0.6)}
              />
            </View>

            {/* Page 1: Weight chart */}
            <View
              style={{ width: pagerWidth }}
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                if (h > 0 && Math.abs(h - chartHeight) > 1) setChartHeight(h);
              }}
            >
              <WeightChart />
            </View>
          </ScrollView>

          <View style={styles.pageDots}>
            {[0, 1].map((i) => (
              <View key={i} style={[styles.dot, activePagerPage === i && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* Log Weight card (smartwatch-style) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Log Weight ({preferences.unit})</Text>
          </View>
          <View style={styles.sectionBody}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={weightInput}
                onChangeText={(val) => { setWeightInput(val); setSavedMessage(null); }}
                keyboardType="decimal-pad"
                placeholder={`e.g. ${preferences.unit === 'lbs' ? '175.5' : '80.0'}`}
                placeholderTextColor={colors.textSecondary}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {savedMessage && (
          <Text style={styles.savedMessage}>{savedMessage}</Text>
        )}

        {/* Insights — always visible below input card */}
        <WeightInsights />
      </Animated.ScrollView>

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
                themeVariant={resolvedScheme}
              />
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}
