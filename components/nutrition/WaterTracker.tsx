import { useState } from 'react';
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
    summaryText: {
      ...Typography.small,
      color: colors.textSecondary,
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
    quickAddRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    quickAddBtn: {
      flex: 1,
      backgroundColor: colors.primaryLight,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    quickAddText: {
      ...Typography.small,
      color: colors.primary,
      fontWeight: '600',
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
}

export default function WaterTracker({ date }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { preferences, entries, waterLog, dispatch } = useApp();

  const [collapsed, setCollapsed] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const isImperial = preferences.unit === 'lbs';
  const unit = isImperial ? 'oz' : 'mL';
  const quickAmount = isImperial ? 8 : 250;

  // Get today's water entries
  const dayWater = waterLog.find((d) => d.date === date);
  const entries_water = dayWater?.entries ?? [];
  const totalConsumed = entries_water.reduce((sum, e) => sum + e.amount, 0);

  // Calculate goal
  const profile = preferences.profile;
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedEntries[0];

  let waterGoal = 64; // fallback: 64 oz
  if (profile && latestWeight) {
    const resolvedAge = profile.dob ? ageFromDob(profile.dob) : (profile.age ?? null);
    if (resolvedAge !== null) {
      waterGoal = calculateWaterGoal(latestWeight.weight, latestWeight.unit, profile.activityLevel);
    }
  }
  if (preferences.waterGoalOverride !== undefined) {
    waterGoal = preferences.waterGoalOverride;
  }

  const pct = waterGoal > 0 ? Math.min(totalConsumed / waterGoal, 1) * 100 : 0;

  const handleQuickAdd = () => {
    dispatch({
      type: 'ADD_WATER_ENTRY',
      date,
      entry: { id: generateId(), amount: quickAmount },
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
        <Text style={styles.summaryText}>
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

          {/* Quick add */}
          <View style={styles.quickAddRow}>
            <TouchableOpacity style={styles.quickAddBtn} onPress={handleQuickAdd} activeOpacity={0.8}>
              <Text style={styles.quickAddText}>+{quickAmount} {unit}</Text>
            </TouchableOpacity>
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
