import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import {
  XP_FOOD,
  XP_FOOD_CAP,
  XP_CALORIE_GOAL,
  XP_WATER_GOAL,
  XP_WEIGHT,
  XP_ACTIVITY,
  XP_STREAK_7,
  XP_STREAK_30,
} from '../../utils/xpCalculation';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    iconRow: {
      marginBottom: Spacing.lg,
    },
    title: {
      ...Typography.h1,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    lastRow: {
      borderBottomWidth: 0,
    },
    rowLabel: {
      ...Typography.body,
      color: colors.text,
      flex: 1,
    },
    rowValue: {
      ...Typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    sectionHeader: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: Spacing.md,
      marginBottom: Spacing.xs,
    },
  });

export default function TutorialXpPage() {
  const colors = useColors();
  const styles = makeStyles(colors);

  const dailyActions = [
    { label: 'Log food', value: `+${XP_FOOD}/entry (max ${XP_FOOD_CAP}/day)` },
    { label: 'Hit calorie goal', value: `+${XP_CALORIE_GOAL}/day` },
    { label: 'Hit water goal', value: `+${XP_WATER_GOAL}/day` },
    { label: 'Log weight', value: `+${XP_WEIGHT}/day` },
    { label: 'Log activity', value: `+${XP_ACTIVITY}/day` },
  ];

  const bonuses = [
    { label: '7-day streak', value: `+${XP_STREAK_7} (one-time)` },
    { label: '30-day streak', value: `+${XP_STREAK_30} (one-time)` },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Ionicons name="star-outline" size={52} color={colors.primary} />
      </View>
      <Text style={styles.title}>How to Earn XP</Text>

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>DAILY ACTIONS</Text>
        {dailyActions.map((item, index) => (
          <View
            key={item.label}
            style={[styles.row, index === dailyActions.length - 1 && styles.lastRow]}
          >
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.value}</Text>
          </View>
        ))}

        <Text style={styles.sectionHeader}>STREAK BONUSES</Text>
        {bonuses.map((item, index) => (
          <View
            key={item.label}
            style={[styles.row, index === bonuses.length - 1 && styles.lastRow]}
          >
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
