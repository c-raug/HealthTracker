import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import { calculateWaterGoal } from '../../utils/waterCalculation';
import { ageFromDob } from '../../utils/tdeeCalculation';

const DEFAULT_PRESETS_OZ: [number, number, number] = [8, 16, 32];
const DEFAULT_PRESETS_ML: [number, number, number] = [250, 500, 750];

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      marginBottom: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      flex: 1,
    },
    headerTitle: {
      ...Typography.small,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '600',
    },
    body: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      gap: Spacing.sm,
    },
    barContainer: {
      flex: 1,
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: '#3B82F6',
    },
    progressLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      width: 100,
      textAlign: 'right',
      flexShrink: 0,
    },
    presetsRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    presetWrapper: {
      flex: 1,
      alignItems: 'center',
    },
    presetBtn: {
      width: '100%',
      backgroundColor: colors.primaryLight,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    presetBtnText: {
      ...Typography.small,
      color: colors.primary,
      fontWeight: '600',
    },
    editHint: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
    },
    presetEditInput: {
      width: '100%',
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      ...Typography.small,
      color: colors.text,
      textAlign: 'center',
    },
    customRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      alignItems: 'center',
    },
    customInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.body,
      color: colors.text,
    },
    addBtn: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },
    addBtnText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    entryList: {
      marginTop: Spacing.sm,
      gap: Spacing.xs,
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },
    entryAmount: {
      ...Typography.small,
      color: colors.text,
      flex: 1,
    },
    deleteBtn: {
      padding: Spacing.xs,
    },
  });

interface Props {
  date: string;
  expandKey?: number;
}

export default function WaterTracker({ date, expandKey }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { preferences, entries, waterLog, dispatch } = useApp();

  const [collapsed, setCollapsed] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [editingPreset, setEditingPreset] = useState<0 | 1 | 2 | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<TextInput>(null);

  // Expand when expandKey changes (triggered from WaterBottleVisual tap)
  useEffect(() => {
    if (expandKey && expandKey > 0) setCollapsed(false);
  }, [expandKey]);

  const isImperial = preferences.unit === 'lbs';
  const unit = isImperial ? 'oz' : 'mL';

  // Backward-compat: if no waterGoalMode set but override exists, default to manual
  const waterGoalMode =
    preferences.waterGoalMode ??
    (preferences.waterGoalOverride !== undefined ? 'manual' : 'auto');

  // Presets
  const defaultPresets = isImperial ? DEFAULT_PRESETS_OZ : DEFAULT_PRESETS_ML;
  const presets: [number, number, number] = preferences.waterPresets ?? defaultPresets;

  // Get today's water entries
  const dayWater = waterLog?.find((d) => d.date === date);
  const entries_water = dayWater?.entries ?? [];
  const totalConsumed = entries_water.reduce((sum, e) => sum + e.amount, 0);

  // Calculate goal
  const profile = preferences.profile;
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedEntries[0];

  let waterGoal = 64; // fallback: 64 oz
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

  const pct = waterGoal > 0 ? Math.min(totalConsumed / waterGoal, 1) * 100 : 0;

  const handlePresetAdd = (amount: number) => {
    dispatch({
      type: 'ADD_WATER_ENTRY',
      date,
      entry: { id: generateId(), amount },
    });
  };

  const handleCustomAdd = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) return;
    dispatch({
      type: 'ADD_WATER_ENTRY',
      date,
      entry: { id: generateId(), amount: Math.round(amount) },
    });
    setCustomAmount('');
  };

  const handleDelete = (entryId: string) => {
    dispatch({ type: 'DELETE_WATER_ENTRY', date, entryId });
  };

  const startEditPreset = (idx: 0 | 1 | 2) => {
    setEditValue(presets[idx].toString());
    setEditingPreset(idx);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const savePreset = (idx: 0 | 1 | 2) => {
    const val = parseInt(editValue, 10);
    const newPresets: [number, number, number] = [...presets] as [number, number, number];
    if (!editValue.trim() || isNaN(val) || val <= 0) {
      newPresets[idx] = defaultPresets[idx];
    } else {
      newPresets[idx] = val;
    }
    dispatch({ type: 'SET_WATER_PRESETS', presets: newPresets });
    setEditingPreset(null);
    setEditValue('');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name={collapsed ? 'chevron-forward' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.headerTitle}>Water</Text>
        </View>
        <Text style={{ ...Typography.small, color: colors.textSecondary }}>
          {Math.round(totalConsumed)} / {waterGoal} {unit}
        </Text>
      </TouchableOpacity>

      {!collapsed && (
        <View style={styles.body}>
          {/* Progress bar */}
          <View style={styles.progressRow}>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.progressLabel} numberOfLines={1}>
              {Math.round(totalConsumed)}{unit} / {waterGoal}{unit}
            </Text>
          </View>

          {/* 3 Preset buttons */}
          <View style={styles.presetsRow}>
            {([0, 1, 2] as const).map((idx) => (
              <View key={idx} style={styles.presetWrapper}>
                {editingPreset === idx ? (
                  <TextInput
                    ref={editingPreset === idx ? editInputRef : undefined}
                    style={styles.presetEditInput}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    onSubmitEditing={() => savePreset(idx)}
                    onBlur={() => savePreset(idx)}
                    selectTextOnFocus
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.presetBtn}
                    onPress={() => handlePresetAdd(presets[idx])}
                    onLongPress={() => startEditPreset(idx)}
                    activeOpacity={0.8}
                    delayLongPress={500}
                  >
                    <Text style={styles.presetBtnText}>+{presets[idx]} {unit}</Text>
                  </TouchableOpacity>
                )}
                {editingPreset !== idx && (
                  <Text style={styles.editHint}>hold to edit</Text>
                )}
              </View>
            ))}
          </View>

          {/* Custom amount */}
          <View style={styles.customRow}>
            <TextInput
              style={styles.customInput}
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder={`Custom amount (${unit})`}
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleCustomAdd}
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleCustomAdd}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Entry list */}
          {entries_water.length > 0 && (
            <View style={styles.entryList}>
              {entries_water.map((entry) => (
                <View key={entry.id} style={styles.entryRow}>
                  <Text style={styles.entryAmount}>{entry.amount} {unit}</Text>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(entry.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
