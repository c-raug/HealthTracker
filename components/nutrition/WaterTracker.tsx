import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';

const DEFAULT_PRESETS_OZ: [number, number, number] = [8, 16, 32];
const DEFAULT_PRESETS_ML: [number, number, number] = [250, 500, 750];

const WATER_BLUE = '#2196F3';
const WATER_BLUE_LIGHT = '#E3F2FD';

type GroupedEntry = {
  amount: number;
  count: number;
  ids: string[];
  latestLoggedAt?: string;
  allLoggedAt: string[];
};

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
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.card,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    headerTitle: {
      ...Typography.h3,
      color: colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    actionBtn: {
      padding: Spacing.xs,
    },
    quickAddBtn: {
      backgroundColor: WATER_BLUE,
      borderRadius: Radius.md,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
    },
    quickAddBtnText: {
      ...Typography.small,
      color: colors.white,
      fontWeight: '700',
    },
    body: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
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
      backgroundColor: WATER_BLUE,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    presetBtnDefault: {
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    presetBtnText: {
      ...Typography.small,
      color: colors.white,
      fontWeight: '600',
    },
    quickAddLabel: {
      fontSize: 9,
      color: '#FFFFFF',
      fontWeight: '500',
      marginTop: 2,
      opacity: 0.85,
    },
    editHint: {
      ...Typography.small,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    presetEditInput: {
      width: '100%',
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: WATER_BLUE,
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
      backgroundColor: WATER_BLUE,
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
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    entryInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    entryAmount: {
      ...Typography.body,
      color: colors.text,
    },
    entryBadge: {
      backgroundColor: WATER_BLUE,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      marginLeft: Spacing.sm,
    },
    entryBadgeText: {
      ...Typography.small,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    entryActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    removeOneBtn: {
      padding: Spacing.xs,
    },
    clearAllBtn: {
      padding: Spacing.xs,
    },
    clearAllText: {
      ...Typography.small,
      color: colors.danger,
      fontWeight: '600',
    },
  });

interface Props {
  date: string;
  expandKey?: number;
  onFocusInput?: () => void;
}

export default function WaterTracker({ date, expandKey, onFocusInput }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { preferences, waterLog, dispatch } = useApp();

  const [collapsed, setCollapsed] = useState(true);
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

  // Presets
  const defaultPresets = isImperial ? DEFAULT_PRESETS_OZ : DEFAULT_PRESETS_ML;
  const presets: [number, number, number] = preferences.waterPresets ?? defaultPresets;

  // Get today's water entries
  const dayWater = waterLog?.find((d) => d.date === date);
  const entriesWater = dayWater?.entries ?? [];

  // Group entries by amount (display-only; underlying state stays individual)
  const groupedEntries: GroupedEntry[] = entriesWater.reduce<GroupedEntry[]>((groups, entry) => {
    const existing = groups.find((g) => g.amount === entry.amount);
    if (existing) {
      existing.ids.push(entry.id);
      existing.count++;
      if (entry.loggedAt && (!existing.latestLoggedAt || entry.loggedAt > existing.latestLoggedAt)) {
        existing.latestLoggedAt = entry.loggedAt;
      }
      if (entry.loggedAt) {
        existing.allLoggedAt.push(entry.loggedAt);
      }
    } else {
      groups.push({
        amount: entry.amount,
        count: 1,
        ids: [entry.id],
        latestLoggedAt: entry.loggedAt,
        allLoggedAt: entry.loggedAt ? [entry.loggedAt] : [],
      });
    }
    return groups;
  }, []);

  const handlePresetAdd = (amount: number) => {
    dispatch({
      type: 'ADD_WATER_ENTRY',
      date,
      entry: { id: generateId(), amount, loggedAt: new Date().toISOString() },
    });
  };

  const handleQuickAdd = () => {
    dispatch({
      type: 'ADD_WATER_ENTRY',
      date,
      entry: { id: generateId(), amount: presets[1], loggedAt: new Date().toISOString() },
    });
  };

  const handleCustomAdd = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) return;
    dispatch({
      type: 'ADD_WATER_ENTRY',
      date,
      entry: { id: generateId(), amount: Math.round(amount), loggedAt: new Date().toISOString() },
    });
    setCustomAmount('');
  };

  const handleRemoveOne = (group: GroupedEntry) => {
    // Delete the most recently logged entry in the group
    const sortedIds = [...group.ids].sort((a, b) => {
      const eA = entriesWater.find((e) => e.id === a);
      const eB = entriesWater.find((e) => e.id === b);
      return (eB?.loggedAt ?? '').localeCompare(eA?.loggedAt ?? '');
    });
    dispatch({ type: 'DELETE_WATER_ENTRY', date, entryId: sortedIds[0] });
  };

  const handleClearAll = (group: GroupedEntry) => {
    Alert.alert(
      'Remove all entries?',
      `Remove all ${group.count} entr${group.count === 1 ? 'y' : 'ies'} of ${group.amount} ${unit}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () => {
            group.ids.forEach((id) => {
              dispatch({ type: 'DELETE_WATER_ENTRY', date, entryId: id });
            });
          },
        },
      ],
    );
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
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => setCollapsed((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <Ionicons
              name={collapsed ? 'chevron-forward' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.headerTitle}>Water</Text>
          </View>
          <View style={styles.headerActions}>
            {collapsed && (
              <TouchableOpacity style={styles.quickAddBtn} onPress={handleQuickAdd} activeOpacity={0.8}>
                <Text style={styles.quickAddBtnText}>+{presets[1]} {unit}</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        {!collapsed && (
          <>
            <View style={styles.body}>
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
                      <>
                        <TouchableOpacity
                          style={[styles.presetBtn, idx === 1 && styles.presetBtnDefault]}
                          onPress={() => handlePresetAdd(presets[idx])}
                          onLongPress={() => startEditPreset(idx)}
                          activeOpacity={0.8}
                          delayLongPress={500}
                        >
                          <Text style={styles.presetBtnText}>+{presets[idx]} {unit}</Text>
                        </TouchableOpacity>
                        {idx === 1 && (
                          <Text style={styles.quickAddLabel}>Quick Add</Text>
                        )}
                      </>
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
                  onFocus={onFocusInput}
                />
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={handleCustomAdd}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Entry list */}
            {groupedEntries.length > 0 && (
              <View style={styles.entryList}>
                {groupedEntries.map((group) => (
                  <View key={group.amount.toString()} style={styles.entryRow}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryAmount}>{group.amount} {unit}</Text>
                      {group.count > 1 && (
                        <View style={styles.entryBadge}>
                          <Text style={styles.entryBadgeText}>{group.count}x</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.entryActions}>
                      <TouchableOpacity
                        style={styles.removeOneBtn}
                        onPress={() => handleRemoveOne(group)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={22} color={colors.danger} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.clearAllBtn}
                        onPress={() => handleClearAll(group)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.clearAllText}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>

    </>
  );
}
