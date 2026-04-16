import { useState, useEffect } from 'react';
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
  Modal,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { getToday, formatDisplayDate, addDays } from '../../utils/dateUtils';
import { convertWeight } from '../../utils/unitConversion';
import WeightChart from '../../components/WeightChart';
import WeightInsights from '../../components/WeightInsights';
import DigitalScale from '../../components/weight/DigitalScale';
import { WeightEntry } from '../../types';
import { generateId } from '../../utils/generateId';


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
    backgroundColor: colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: Spacing.sm,
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
  existingNote: {
    ...Typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },

  // Weight input row (side-by-side)
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
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
  const systemScheme = useColorScheme();
  const resolvedScheme: 'light' | 'dark' = preferences.appearanceMode === 'light' ? 'light' : preferences.appearanceMode === 'dark' ? 'dark' : (systemScheme ?? 'light');

  const [weightInput, setWeightInput] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const today = getToday();
  const existingEntry = entries.find((e) => e.date === selectedDate);
  const isForwardDisabled = selectedDate >= today;

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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date navigation bar */}
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

        {existingEntry && (
          <Text style={styles.existingNote}>
            Existing entry: {existingEntry.weight} {existingEntry.unit} — saving will replace it.
          </Text>
        )}

        {/* Digital scale graphic */}
        <DigitalScale weight={weightInput} unit={preferences.unit} />

        {/* Weight input + Save side-by-side */}
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

        {savedMessage && (
          <Text style={styles.savedMessage}>{savedMessage}</Text>
        )}

        {/* History & Insights — always visible below entry */}
        <WeightChart />
        <WeightInsights />
      </ScrollView>

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
