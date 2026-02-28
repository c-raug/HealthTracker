import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
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
import { WeightEntry } from '../../types';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    ...Typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: colors.white,
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

  // Weight input
  sectionLabel: {
    ...Typography.small,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 32,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },

  // Save button
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    ...Typography.h3,
    color: colors.white,
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
  iosPicker: {
    height: 200,
  },
});

export default function WeightScreen() {
  const { entries, preferences, dispatch, isLoading } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);

  const [activeSection, setActiveSection] = useState<'log' | 'history'>('log');
  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  const [weightInput, setWeightInput] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

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
    Alert.alert('Saved', `Weight logged for ${formatDisplayDate(selectedDate)}.`);
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
        {/* Section toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              activeSection === 'log' && styles.toggleBtnActive,
            ]}
            onPress={() => setActiveSection('log')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                activeSection === 'log' && styles.toggleTextActive,
              ]}
            >
              Log
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              activeSection === 'history' && styles.toggleBtnActive,
            ]}
            onPress={() => setActiveSection('history')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                activeSection === 'history' && styles.toggleTextActive,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>

        {activeSection === 'log' ? (
          <>
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
            </View>

            {existingEntry && (
              <Text style={styles.existingNote}>
                Existing entry: {existingEntry.weight} {existingEntry.unit} — saving will replace it.
              </Text>
            )}

            {/* Weight input */}
            <Text style={styles.sectionLabel}>
              Weight ({preferences.unit})
            </Text>
            <TextInput
              style={styles.input}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder={`e.g. ${preferences.unit === 'lbs' ? '175.5' : '80.0'}`}
              placeholderTextColor={colors.textSecondary}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            {/* Save button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Save Entry</Text>
            </TouchableOpacity>
          </>
        ) : (
          <WeightChart />
        )}
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
              />
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}
