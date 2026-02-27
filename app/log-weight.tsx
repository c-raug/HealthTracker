import { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Colors, Spacing, Typography, Radius } from '../constants/theme';
import { getToday, formatDisplayDate, addDays } from '../utils/dateUtils';
import { WeightEntry } from '../types';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function LogWeightScreen() {
  const router = useRouter();
  const { entries, preferences, dispatch } = useApp();

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [weightInput, setWeightInput] = useState('');

  const today = getToday();
  const existingEntry = entries.find((e) => e.date === selectedDate);

  const goBack = () => setSelectedDate(addDays(selectedDate, -1));
  const goForward = () => {
    const next = addDays(selectedDate, 1);
    if (next <= today) setSelectedDate(next);
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
      id: generateId(),
      date: selectedDate,
      weight: parsed,
      unit: preferences.unit,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'UPSERT_ENTRY', entry });
    router.back();
  };

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
        {/* Date selector */}
        <Text style={styles.sectionLabel}>Date</Text>
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={goBack} style={styles.arrowBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
          <TouchableOpacity
            onPress={goForward}
            style={styles.arrowBtn}
            disabled={selectedDate >= today}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={selectedDate >= today ? Colors.border : Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {existingEntry && (
          <Text style={styles.existingNote}>
            Existing entry: {existingEntry.weight} {existingEntry.unit} — saving will replace it.
          </Text>
        )}

        {/* Weight input */}
        <Text style={styles.sectionLabel}>Weight ({preferences.unit})</Text>
        <TextInput
          style={styles.input}
          value={weightInput}
          onChangeText={setWeightInput}
          keyboardType="decimal-pad"
          placeholder={`e.g. ${preferences.unit === 'lbs' ? '175.5' : '80.0'}`}
          placeholderTextColor={Colors.textSecondary}
          autoFocus
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

        {/* Cancel button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingTop: Spacing.lg },
  sectionLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  arrowBtn: {
    padding: Spacing.sm,
  },
  dateText: {
    flex: 1,
    textAlign: 'center',
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  existingNote: {
    ...Typography.small,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 32,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    ...Typography.h3,
    color: Colors.white,
  },
  cancelButton: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
